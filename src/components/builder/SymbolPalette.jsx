import React, { useState, useRef, useEffect } from 'react'
import { Sigma } from 'lucide-react'
import { SYMBOL_GROUPS } from '../../data/mockData'

/**
 * SRS 12 / 51 — special symbol / character palette so teachers don't have
 * to hunt for Ω, √, θ, H₂O, etc. Inserts the symbol at the current cursor
 * position of the given field (identified by `targetRef`, a ref to an
 * <input>/<textarea>) via `onInsert(symbol)`.
 */
export function SymbolPalette({ onInsert, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        title="Insert symbol"
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-700 dark:hover:text-ink-100"
      >
        <Sigma className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-64 rounded-lg border border-ink-200 bg-white p-2.5 shadow-page dark:border-ink-700 dark:bg-ink-900">
          {SYMBOL_GROUPS.map((g) => (
            <div key={g.label} className="mb-1.5 last:mb-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400">{g.label}</p>
              <div className="flex flex-wrap gap-1">
                {g.symbols.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => { onInsert(sym); }}
                    className="rounded border border-ink-100 px-1.5 py-0.5 text-xs font-medium text-ink-700 hover:border-gold-400 hover:bg-gold-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
