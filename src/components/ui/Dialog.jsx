import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Dialog({ open, onClose, title, children, footer, className }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-xl2 bg-white p-6 shadow-page dark:bg-ink-900',
          className
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-sm text-ink-600 dark:text-ink-300">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
