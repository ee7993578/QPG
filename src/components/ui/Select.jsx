import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full appearance-none rounded-lg border border-ink-200 bg-white pl-3 pr-9 text-sm text-ink-900',
          'focus-visible:focus-ring transition-shadow',
          'dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
    </div>
  )
})
