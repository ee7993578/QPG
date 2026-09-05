// subscriptionApi — mirrors the future Spring Boot + payment-gateway
// contract. Backend is the eventual source of truth for plan/download
// state (section 42); this just wraps subscriptionStore for now.
import { useSubscriptionStore } from '../store/subscriptionStore'

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

export const subscriptionApi = {
  // GET /api/subscription/me
  async getCurrentPlan() {
    await delay()
    const { planType, subscriptionActive, subscriptionExpiry, freeDownloadsUsed, freeDownloadsLimit } =
      useSubscriptionStore.getState()
    return { planType, subscriptionActive, subscriptionExpiry, freeDownloadsUsed, freeDownloadsLimit }
  },

  // POST /api/subscription/order  { planType } -> { orderId }
  async createOrder(planType) {
    // The checkout dialog opens immediately so the click feels instant; the
    // delay stands in for the round-trip that will create the real order.
    useSubscriptionStore.getState().startCheckout(planType)
    await delay()
    return { orderId: `mock_order_${Date.now()}` }
  },

  // POST /api/subscription/verify  { orderId } -> { success, plan }
  async verifyPayment() {
    const result = await useSubscriptionStore.getState().processPayment()
    return { success: result === 'success' }
  },
}
