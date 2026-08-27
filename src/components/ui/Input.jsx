import React from 'react'
import { cn } from '../../lib/utils'

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900',
        'placeholder:text-ink-400 focus-visible:focus-ring transition-shadow',
        'dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-500',
        className
      )}
      {...props}
    />
  )
})

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900',
        'placeholder:text-ink-400 focus-visible:focus-ring transition-shadow resize-y',
        'dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-500',
        className
      )}
      {...props}
    />
  )
})

export function Label({ className, children, ...props }) {
  return (
    <label className={cn('block text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400 mb-1.5', className)} {...props}>
      {children}
    </label>
  )
}
