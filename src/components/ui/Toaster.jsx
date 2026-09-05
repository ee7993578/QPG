import React from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useUiStore } from '../../store/uiStore'

const VARIANT = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200 dark:border-emerald-800', tint: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: AlertCircle, ring: 'border-red-200 dark:border-red-900', tint: 'text-pen-red' },
  info: { icon: Info, ring: 'border-ink-200 dark:border-ink-700', tint: 'text-ink-500 dark:text-ink-300' },
}

/**
 * Section 34 — one consistent toast surface, mounted once in App.jsx.
 * Bottom-centre on mobile (clear of the bottom nav), bottom-right on desktop.
 */
export function Toaster() {
  const toasts = useUiStore((s) => s.toasts)
  const dismissToast = useUiStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-6 md:right-6 md:items-end md:px-0"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map(({ id, message, variant }) => {
        const v = VARIANT[variant] || VARIANT.info
        const Icon = v.icon
        return (
          <div
            key={id}
            role="status"
            aria-live="polite"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border bg-white px-3.5 py-3 shadow-page dark:bg-ink-900',
              v.ring
            )}
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', v.tint)} />
            <p className="flex-1 text-sm text-ink-700 dark:text-ink-200">{message}</p>
            <button
              type="button"
              onClick={() => dismissToast(id)}
              aria-label="Dismiss notification"
              className="-mr-1 -mt-1 rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
