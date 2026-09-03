import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Generic "3-dot" kebab menu used to tuck away secondary actions (move,
 * duplicate, delete, toggles, ...) so a card/row shows just one small icon
 * instead of a row of buttons. Click the trigger to open; click anywhere
 * outside, press Escape, or pick an item to close it.
 */
export function DropdownMenu({ trigger, children, align = 'end', menuClassName }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative inline-block shrink-0" ref={ref}>
      {React.cloneElement(trigger, { onClick: () => setOpen((v) => !v), 'aria-expanded': open })}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-30 mt-1 min-w-[13rem] overflow-hidden rounded-lg border border-ink-200 bg-white py-1 shadow-page dark:border-ink-700 dark:bg-ink-900',
            align === 'end' ? 'right-0' : 'left-0',
            menuClassName
          )}
          onClick={(e) => {
            // Let individual items close the menu after they act, but never
            // when the click landed on a disabled (non-interactive) item.
            if (e.target.closest('button:not(:disabled)')) setOpen(false)
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

/** Default trigger button — a plain, always-visible 3-dot icon. */
export function DropdownMenuButton({ className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-700 dark:hover:text-ink-100',
        className
      )}
      {...props}
    >
      <MoreVertical className="h-4 w-4" />
    </button>
  )
}

export function MenuItem({ icon: Icon, children, onClick, danger, disabled, checked }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs font-medium',
        disabled
          ? 'cursor-not-allowed text-ink-300 dark:text-ink-700'
          : danger
            ? 'text-pen-red hover:bg-red-50 dark:hover:bg-red-900/20'
            : 'text-ink-600 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800'
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span className="flex-1">{children}</span>
      {checked && <Check className="h-3.5 w-3.5 shrink-0 text-gold-500" />}
    </button>
  )
}

export function MenuLabel({ children }) {
  return <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">{children}</div>
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-ink-100 dark:bg-ink-800" />
}
