import React from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-ink-100 bg-white shadow-card',
        'dark:border-ink-800 dark:bg-ink-900',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('px-5 pt-5', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-display text-lg font-semibold text-ink-900 dark:text-ink-50', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('px-5 pb-5', className)} {...props} />
}
