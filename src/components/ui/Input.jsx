import React, { useRef } from 'react'
import { cn } from '../../lib/utils'
import { useSelectionToolbar, SelectionToolbar } from './SelectionToolbar'

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

// Feature — plain by default, "rich" the moment you select something. The
// textarea itself never changes; selecting text just reveals a small
// bold/italic/underline/copy/paste bubble right above the selection, and it
// goes away again as soon as you click elsewhere. No permanent toolbar row.
export const Textarea = React.forwardRef(function Textarea({ className, value, onChange, ...props }, ref) {
  const innerRef = useRef(null)
  const setRef = (node) => {
    innerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref && typeof ref === 'object') ref.current = node
  }
  const { position, wrap, copy, paste } = useSelectionToolbar({
    elementRef: innerRef,
    value: value || '',
    onChange: onChange || (() => {}),
    multiline: true,
  })

  return (
    <div className="relative">
      <SelectionToolbar position={position} wrap={wrap} copy={copy} paste={paste} />
      <textarea
        ref={setRef}
        value={value}
        onChange={onChange}
        className={cn(
          'flex w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900',
          'placeholder:text-ink-400 focus-visible:focus-ring transition-shadow resize-y',
          'dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-500',
          className
        )}
        {...props}
      />
    </div>
  )
})

export function Label({ className, children, ...props }) {
  return (
    <label className={cn('block text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400 mb-1.5', className)} {...props}>
      {children}
    </label>
  )
}
