import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const PLAN = {
  FREE: 'FREE',
  TEACHER_PRO: 'TEACHER_PRO',
  SCHOOL_PRO: 'SCHOOL_PRO',
}

export const PLAN_PRICE = {
  [PLAN.TEACHER_PRO]: { amount: 99, label: '₹99 / year', accountType: 'teacher' },
  [PLAN.SCHOOL_PRO]: { amount: 499, label: '₹499 / year', accountType: 'school' },
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000

/**
 * subscriptionStore — section 3/4/18/19/21/41: the free-download counter,
 * the paywall gate, and the (frontend-only, mock) payment state machine.
 *
 * IMPORTANT (section 42): this only controls what the UI shows/hides. Real
 * download permission must be enforced server-side once the Spring Boot
 * backend exists — nothing here is a security boundary.
 *
 * Backend contract this stands in for (see services/subscriptionApi.js):
 *   subscriptionApi.getCurrentPlan() / createOrder() / verifyPayment()
 */
export const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      planType: PLAN.FREE,
      freeDownloadsUsed: 0,
      freeDownloadsLimit: 3,
      subscriptionActive: false,
      subscriptionExpiry: null,

      // ---- Paywall modal (download-locked upsell, sections 18/19) ----
      downloadLockOpen: false,
      openDownloadLock: () => set({ downloadLockOpen: true }),
      closeDownloadLock: () => set({ downloadLockOpen: false }),

      // ---- Payment dialog state machine (section 21) ----
      // 'idle' | 'initiated' | 'processing' | 'success' | 'failed' | 'cancelled'
      paymentState: 'idle',
      paymentDialogOpen: false,
      pendingPlan: null,

      remainingFreeDownloads: () => {
        const { freeDownloadsUsed, freeDownloadsLimit } = get()
        return Math.max(0, freeDownloadsLimit - freeDownloadsUsed)
      },

      canDownload: () => {
        const s = get()
        return s.subscriptionActive || s.freeDownloadsUsed < s.freeDownloadsLimit
      },

      // Call this right before actually producing the PDF. Returns true if
      // the download should proceed (and records it against the free quota
      // when not subscribed); returns false and opens the upgrade modal if
      // the free quota is exhausted.
      attemptDownload: () => {
        const s = get()
        if (s.subscriptionActive) return true
        if (s.freeDownloadsUsed < s.freeDownloadsLimit) {
          set({ freeDownloadsUsed: s.freeDownloadsUsed + 1 })
          return true
        }
        set({ downloadLockOpen: true })
        return false
      },

      // ---- Upgrade / checkout flow ----
      startCheckout: (planType) => {
        set({ pendingPlan: planType, paymentState: 'initiated', paymentDialogOpen: true, downloadLockOpen: false })
      },

      // Simulates calling subscriptionApi.createOrder() + a payment gateway.
      // Resolves to 'success' or 'failed' after a short delay so the UI can
      // show the processing state described in section 21.
      processPayment: () => {
        set({ paymentState: 'processing' })
        return new Promise((resolve) => {
          setTimeout(() => {
            const plan = get().pendingPlan
            // Mock gateway: succeeds unless the plan somehow isn't recognized.
            const ok = !!PLAN_PRICE[plan]
            if (ok) {
              set({
                planType: plan,
                subscriptionActive: true,
                subscriptionExpiry: new Date(Date.now() + YEAR_MS).toISOString(),
                paymentState: 'success',
              })
            } else {
              set({ paymentState: 'failed' })
            }
            resolve(ok ? 'success' : 'failed')
          }, 1600)
        })
      },

      cancelPayment: () => set({ paymentState: 'cancelled', paymentDialogOpen: false, pendingPlan: null }),
      closePaymentDialog: () => set({ paymentDialogOpen: false, paymentState: 'idle', pendingPlan: null }),

      // Dev/demo helper so the paywall can actually be exercised without
      // waiting for three real downloads — not part of the spec, just useful
      // while the backend doesn't exist yet.
      _resetForDemo: () => set({ freeDownloadsUsed: 0, subscriptionActive: false, planType: PLAN.FREE, subscriptionExpiry: null }),
    }),
    { name: 'papercraft-subscription' }
  )
)
