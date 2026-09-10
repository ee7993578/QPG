// subscriptionApi — wired to the real Spring Boot backend + Razorpay (test
// mode). GET /api/subscription is the source of truth for plan/quota state;
// POST /api/subscription/order creates a real Razorpay order, openCheckout()
// launches the Razorpay Checkout widget, and its success handler calls
// POST /api/subscription/verify with the real gatewayPaymentId/gatewaySignature
// Razorpay hands back — the backend cryptographically verifies that
// signature (RazorpayGatewayService) before ever activating a subscription.
// The actual quota decrement happens server-side inside
// POST /api/papers/{id}/download (see paperApi.downloadPaper), not here.
import { useSubscriptionStore } from '../store/subscriptionStore'
import { useAuthStore } from '../store/authStore'
import { apiClient, ApiError } from '../lib/apiClient'

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

// index.html already loads the Razorpay script, but guard against it being
// blocked/slow (e.g. an ad-blocker, or a flaky connection) by lazily
// injecting it if window.Razorpay isn't there yet when we need it.
function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_SRC
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
}

function applySubscription(res) {
  useSubscriptionStore.setState({
    planType: res.planType,
    subscriptionActive: res.subscriptionActive,
    subscriptionExpiry: res.subscriptionExpiry,
    freeDownloadsUsed: res.freeDownloadsUsed,
    freeDownloadsLimit: res.freeDownloadsLimit,
    managedBySchool: !!res.managedBySchool,
    loaded: true,
  })
}

export const subscriptionApi = {
  // GET /api/subscription
  async getCurrentPlan() {
    const res = await apiClient.get('/api/subscription')
    applySubscription(res)
    return res
  },

  // POST /api/subscription/order { planType } -> { orderId, gatewayOrderId,
  // gatewayKeyId, amount, currency, planType, status }. Opens the checkout
  // dialog immediately (so the click feels instant) with paymentState
  // 'creating', then flips to 'initiated' once a real Razorpay order exists
  // — that's what PaymentDialog waits for before it calls openCheckout().
  async createOrder(planType) {
    useSubscriptionStore.setState({
      pendingPlan: planType,
      paymentState: 'creating',
      paymentDialogOpen: true,
      downloadLockOpen: false,
      currentOrderId: null,
      gatewayOrderId: null,
      gatewayKeyId: null,
    })
    try {
      const order = await apiClient.post('/api/subscription/order', { planType })
      useSubscriptionStore.setState({
        currentOrderId: order.orderId,
        gatewayOrderId: order.gatewayOrderId,
        gatewayKeyId: order.gatewayKeyId,
        currency: order.currency || 'INR',
        paymentState: 'initiated',
      })
      return order
    } catch (err) {
      useSubscriptionStore.setState({ paymentState: 'failed' })
      throw err
    }
  },

  // Launches the real Razorpay Checkout widget (test mode) for the order
  // created by createOrder(). On a successful payment, Razorpay's own
  // handler callback hands back razorpay_payment_id/razorpay_signature,
  // which get sent straight to POST /api/subscription/verify — the backend
  // (RazorpayGatewayService) cryptographically checks that signature before
  // ever marking the subscription active, so nothing here can fake success.
  async openCheckout() {
    const { currentOrderId, gatewayOrderId, gatewayKeyId, amount, currency, pendingPlan } = useSubscriptionStore.getState()
    if (!currentOrderId || !gatewayOrderId || !gatewayKeyId) {
      useSubscriptionStore.setState({ paymentState: 'failed' })
      return
    }

    const ready = await loadRazorpayScript()
    if (!ready || !window.Razorpay) {
      useSubscriptionStore.setState({ paymentState: 'failed' })
      toastCheckoutLoadFailed()
      return
    }

    const { teacher, school } = useAuthStore.getState()
    const profile = teacher || school
    const planLabel = pendingPlan === 'SCHOOL_PRO' ? 'School Pro' : 'Teacher Pro'

    const razorpay = new window.Razorpay({
      key: gatewayKeyId,
      amount: Math.round((amount || 0) * 100), // paise
      currency: currency || 'INR',
      name: 'PaperCraft',
      description: `${planLabel} subscription`,
      order_id: gatewayOrderId,
      prefill: {
        name: profile?.name || profile?.adminName || '',
        email: profile?.email || '',
        contact: profile?.mobile || '',
      },
      theme: { color: '#18181b' },
      handler: (response) => {
        subscriptionApi.verifyPayment({
          gatewayPaymentId: response.razorpay_payment_id,
          gatewaySignature: response.razorpay_signature,
        })
      },
      modal: {
        // User closed the widget without paying — back to the dialog's
        // 'initiated' screen (not 'failed') so "Try Again" reopens checkout
        // cleanly rather than implying something errored.
        ondismiss: () => {
          const state = useSubscriptionStore.getState()
          if (state.paymentState === 'processing' || state.paymentState === 'success') return
          useSubscriptionStore.setState({ paymentState: 'initiated' })
        },
      },
    })

    razorpay.on('payment.failed', () => {
      useSubscriptionStore.setState({ paymentState: 'failed' })
    })

    razorpay.open()
  },

  // POST /api/subscription/verify { orderId, gatewayPaymentId, gatewaySignature }
  // -> SubscriptionResponse. Called by openCheckout()'s handler once
  // Razorpay confirms the payment client-side; the backend re-verifies it
  // server-side before activating anything.
  async verifyPayment({ gatewayPaymentId, gatewaySignature }) {
    const { currentOrderId } = useSubscriptionStore.getState()
    if (!currentOrderId) {
      useSubscriptionStore.setState({ paymentState: 'failed' })
      return { success: false }
    }
    useSubscriptionStore.setState({ paymentState: 'processing' })
    try {
      const res = await apiClient.post('/api/subscription/verify', { orderId: currentOrderId, gatewayPaymentId, gatewaySignature })
      applySubscription(res)
      useSubscriptionStore.setState({ paymentState: 'success' })
      return { success: true }
    } catch (err) {
      useSubscriptionStore.setState({ paymentState: 'failed' })
      return { success: false, error: err instanceof ApiError ? err.message : 'Payment could not be verified.' }
    }
  },
}

function toastCheckoutLoadFailed() {
  // Lazy import to avoid a circular import at module-load time (uiStore
  // doesn't depend on this file, so this is only a style choice here).
  import('../store/uiStore').then(({ toast }) => {
    toast.error('Could not load the payment checkout. Check your connection and try again.')
  })
}
