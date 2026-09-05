import { create } from 'zustand'

/**
 * uiStore — cross-cutting, non-persisted UI state (section 34/35).
 * Right now that's the global toast queue. Anything that needs to say
 * "Paper saved successfully." from anywhere in the app pushes here instead
 * of owning its own local banner state.
 */
let toastSeq = 0

export const useUiStore = create((set, get) => ({
  toasts: [], // { id, message, variant }

  /** variant: 'success' | 'error' | 'info' */
  pushToast: (message, variant = 'success', duration = 3200) => {
    const id = `toast_${++toastSeq}`
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }))
    if (duration > 0) {
      setTimeout(() => get().dismissToast(id), duration)
    }
    return id
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}))

/**
 * Imperative helper so non-React code (services, stores) can raise a toast
 * without a hook. Same store underneath.
 */
export const toast = {
  success: (message) => useUiStore.getState().pushToast(message, 'success'),
  error: (message) => useUiStore.getState().pushToast(message, 'error'),
  info: (message) => useUiStore.getState().pushToast(message, 'info'),
}
