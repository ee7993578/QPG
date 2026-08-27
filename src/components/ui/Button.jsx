import React from 'react'
import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-ink-700 text-white hover:bg-ink-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300',
  secondary: 'bg-ink-100 text-ink-800 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-100 dark:hover:bg-ink-700',
  outline: 'border border-ink-200 text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800',
  ghost: 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800',
  danger: 'bg-pen-red text-white hover:bg-pen-red/90',
  gold: 'bg-gold-400 text-ink-950 hover:bg-gold-300',
}

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-9 w-9 p-0',
}

export const Button = React.forwardRef(function Button(
  { className, variant = 'primary', size = 'md', asChild, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:focus-ring disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
})
