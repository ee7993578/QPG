import { create } from 'zustand'

export const PLAN = {
  FREE: 'FREE',
  TEACHER_PRO: 'TEACHER_PRO',
  SCHOOL_PRO: 'SCHOOL_PRO',
}

export const PLAN_PRICE = {
  [PLAN.TEACHER_PRO]: { amount: 99, label: '₹99 / year', accountType: 'teacher' },
  [PLAN.SCHOOL_PRO]: { amount: 499, label: '₹499 / year', accountType: 'school' },
}

/**
 * subscriptionStore — section 3/4/18/19/21/41: plan/quota state and UI-only
 * paywall/checkout dialog state.
 *
 * Wired to the real Spring Boot backend now (see services/subscriptionApi.js):
 *   planType / subscriptionActive / subscriptionExpiry / freeDownloadsUsed /
 *   freeDownloadsLimit are populated from GET /api/subscription and kept in
 *   sync after every order/verify call and after every paper download
 *   (paperApi.downloadPaper -> POST /api/papers/{id}/download consumes the
 *   quota server-side; that endpoint is the actual security boundary, not
 *   anything in this store).
 */
export const useSubscriptionStore = create((set, get) => ({
  planType: PLAN.FREE,
  freeDownloadsUsed: 0,
  freeDownloadsLimit: 3,
  subscriptionActive: false,
  subscriptionExpiry: null,
  // True when GET /api/subscription returned the SCHOOL's plan because this
  // user is a teacher added by a School Admin — see SubscriptionService.
  managedBySchool: false,
  loaded: false,

  // ---- Paywall modal (download-locked upsell, sections 18/19) ----
  downloadLockOpen: false,
  openDownloadLock: () => set({ downloadLockOpen: true }),
  closeDownloadLock: () => set({ downloadLockOpen: false }),

  // ---- Payment dialog state machine (section 21) ----
  // 'idle' | 'creating' | 'initiated' | 'processing' | 'success' | 'failed' | 'cancelled'
  paymentState: 'idle',
  paymentDialogOpen: false,
  pendingPlan: null,
  currentOrderId: null,
  // Gateway-side details returned by POST /api/subscription/order, needed to
  // open the real Razorpay Checkout widget - see subscriptionApi.openCheckout().
  gatewayOrderId: null,
  gatewayKeyId: null,
  currency: 'INR',

  remainingFreeDownloads: () => {
    const { freeDownloadsUsed, freeDownloadsLimit } = get()
    return Math.max(0, freeDownloadsLimit - freeDownloadsUsed)
  },

  canDownload: () => {
    const s = get()
    return s.subscriptionActive || s.freeDownloadsUsed < s.freeDownloadsLimit
  },

  cancelPayment: () => set({ paymentState: 'cancelled', paymentDialogOpen: false, pendingPlan: null, currentOrderId: null, gatewayOrderId: null, gatewayKeyId: null }),
  closePaymentDialog: () => set({ paymentDialogOpen: false, paymentState: 'idle', pendingPlan: null, currentOrderId: null, gatewayOrderId: null, gatewayKeyId: null }),
}))
