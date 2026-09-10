import React, { useEffect } from 'react'
import { Loader2, PartyPopper, XCircle, CreditCard } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useSubscriptionStore, PLAN_PRICE } from '../../store/subscriptionStore'
import { subscriptionApi } from '../../services/subscriptionApi'
import { PLANS } from '../../data/plans'
import { toast } from '../../store/uiStore'
import { formatDate } from '../../lib/utils'

export function PaymentDialog() {
  const open = useSubscriptionStore((s) => s.paymentDialogOpen)
  const paymentState = useSubscriptionStore((s) => s.paymentState)
  const pendingPlan = useSubscriptionStore((s) => s.pendingPlan)
  const planType = useSubscriptionStore((s) => s.planType)
  const subscriptionExpiry = useSubscriptionStore((s) => s.subscriptionExpiry)
  const cancelPayment = useSubscriptionStore((s) => s.cancelPayment)
  const closePaymentDialog = useSubscriptionStore((s) => s.closePaymentDialog)

  const plan = PLAN_PRICE[pendingPlan]
  // Friendly name ("Teacher Pro") rather than the raw enum ("TEACHER_PRO").
  const activePlanName = PLANS.find((p) => p.id === planType)?.name || 'Pro'

  // Section 38/44 — everything the UI does goes through the service layer;
  // this just opens the real Razorpay Checkout widget for the order the
  // backend already created. The widget's own success handler is what
  // calls subscriptionApi.verifyPayment() with the real signature.
  const runPayment = () => subscriptionApi.openCheckout()

  // 'creating' = order request in flight (no orderId yet); once the backend
  // hands back a real order the state flips to 'initiated' and *that's*
  // when it's safe to open the checkout widget.
  useEffect(() => {
    if (open && paymentState === 'initiated') {
      runPayment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paymentState])

  if (!open) return null

  const finish = () => {
    closePaymentDialog()
    toast.success('Subscription activated. Downloads are unlimited now.')
  }

  return (
    <Dialog
      open={open}
      onClose={paymentState === 'processing' || paymentState === 'creating' ? undefined : closePaymentDialog}
      title={paymentState === 'success' ? 'Payment Successful 🎉' : paymentState === 'failed' ? 'Payment Failed' : 'Upgrade PaperCraft'}
      footer={
        paymentState === 'success' ? (
          <Button onClick={finish} className="w-full">Continue to PaperCraft</Button>
        ) : paymentState === 'failed' ? (
          <>
            <Button variant="ghost" onClick={closePaymentDialog}>Cancel</Button>
            <Button onClick={runPayment}>Try Again</Button>
          </>
        ) : paymentState === 'processing' || paymentState === 'creating' ? null : (
          <Button variant="ghost" onClick={cancelPayment}>Cancel</Button>
        )
      }
    >
      {paymentState === 'creating' && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-ink-500" />
          <p>Setting up your order for <strong>{plan?.label}</strong>…</p>
        </div>
      )}

      {paymentState === 'processing' && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-ink-500" />
          <p>Confirming your payment of <strong>{plan?.label}</strong>…</p>
          <p className="text-xs text-ink-400">Test mode — use Razorpay's test card/UPI details, no real money is charged.</p>
        </div>
      )}

      {paymentState === 'success' && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <PartyPopper className="h-8 w-8 text-emerald-600" />
          <p>Your PaperCraft <strong>{activePlanName}</strong> plan is active.</p>
          <div className="mt-2 w-full space-y-1 rounded-lg bg-ink-50 p-3 text-left text-xs dark:bg-ink-800">
            <p><span className="text-ink-400">Plan:</span> {activePlanName}</p>
            <p><span className="text-ink-400">Start date:</span> {formatDate(new Date().toISOString())}</p>
            <p><span className="text-ink-400">Expiry date:</span> {subscriptionExpiry ? formatDate(subscriptionExpiry) : '—'}</p>
          </div>
        </div>
      )}

      {paymentState === 'failed' && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <XCircle className="h-8 w-8 text-pen-red" />
          <p>Something went wrong processing your payment. No amount was charged.</p>
        </div>
      )}

      {paymentState === 'initiated' && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CreditCard className="h-8 w-8 text-ink-400" />
          <p>Starting checkout for <strong>{plan?.label}</strong>…</p>
        </div>
      )}
    </Dialog>
  )
}
