import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * tourStore — drives the guided spotlight tour (TourOverlay).
 *
 * Only two things are persisted: whether each named tour has already been
 * seen (auto-shown once, then never again unless replayed from Settings).
 * `activeTour`/`stepIndex` are session-only — a hard refresh always starts
 * from a clean, non-active state rather than resuming mid-step.
 */
export const useTourStore = create(
  persist(
    (set, get) => ({
      seen: {
        dashboard: false,
        edit: false,
        preview: false,
        myPaper: false,
      },
      activeTour: null, // 'dashboard' | 'edit' | 'preview' | 'myPaper' | null
      stepIndex: 0,

      // Auto-triggered once per tour, first time only. No-ops if already
      // seen or if a tour is already running.
      startIfUnseen: (tour) => {
        const { seen, activeTour } = get()
        if (activeTour || seen[tour]) return
        set({ activeTour: tour, stepIndex: 0 })
      },

      // Explicit replay (e.g. "Watch tour again" in Settings) — always
      // starts from step 0 regardless of the seen flag.
      restartTour: (tour) => set({ activeTour: tour, stepIndex: 0 }),

      next: (totalSteps) => {
        const { stepIndex, activeTour } = get()
        if (!activeTour) return
        if (stepIndex + 1 >= totalSteps) {
          get().finish()
        } else {
          set({ stepIndex: stepIndex + 1 })
        }
      },

      // Skip button OR the ✕ — the whole tour goes away, not just the
      // current step, and it's marked seen so it won't auto-start again.
      // (Clicking the dimmed backdrop no longer skips — see TourOverlay,
      // that now just advances to the next step like the Next button.)
      skip: () => {
        const { activeTour } = get()
        if (!activeTour) return
        set((s) => ({ activeTour: null, stepIndex: 0, seen: { ...s.seen, [activeTour]: true } }))
      },

      finish: () => {
        const { activeTour } = get()
        if (!activeTour) return
        set((s) => ({ activeTour: null, stepIndex: 0, seen: { ...s.seen, [activeTour]: true } }))
      },
    }),
    {
      name: 'papercraft-tour',
      partialize: (state) => ({ seen: state.seen }),
    }
  )
)
