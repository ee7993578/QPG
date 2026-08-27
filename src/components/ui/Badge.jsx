import React from 'react'
import { cn } from '../../lib/utils'

const variants = {
  neutral: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300',
  gold: 'bg-gold-100 text-gold-700 dark:bg-gold-700/30 dark:text-gold-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  danger: 'bg-red-100 text-pen-red dark:bg-red-900/30 dark:text-red-300',
}

export function Badge({ className, variant = 'neutral', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
