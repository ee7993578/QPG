import React, { useState, useRef, useEffect } from 'react'
import { Sigma, ArrowUpRight, ArrowDownRight, Radical } from 'lucide-react'
import { SYMBOL_GROUPS } from '../../data/mockData'
import { toSuperscript, toSubscript, isFullySuperscriptable, isFullySubscriptable } from '../../lib/textSymbols'

/**
 * SRS 12 / 51 — special symbol / character palette so teachers don't have
 * to hunt for Ω, √, θ, H₂O, etc. Inserts the symbol at the current cursor
 * position of the given field via `onInsert(symbol)`.
 *
 * On top of the fixed symbol grid this also has a small "build your own"
 * section: type ANY exponent/index (e.g. "238" for 2^238, or "n+1") and it
 * converts it to Unicode superscript/subscript live, plus a root builder
 * with an adjustable index — so nothing is limited to the pre-made buttons.
 */
export function SymbolPalette({ onInsert, className = '' }) {
  const [open, setOpen] = useState(false)
  const [supText, setSupText] = useState('')
  const [subText, setSubText] = useState('')
  const [rootIndex, setRootIndex] = useState('')
  const [rootValue, setRootValue] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const insertSuper = () => {
    if (!supText) return
    onInsert(toSuperscript(supText))
    setSupText('')
  }
  const insertSub = () => {
    if (!subText) return
    onInsert(toSubscript(subText))
    setSubText('')
  }
  const insertRoot = () => {
    if (!rootValue) return
    const indexPart = rootIndex && rootIndex !== '2' ? toSuperscript(rootIndex) : ''
    onInsert(`${indexPart}\u221a(${rootValue})`)
    setRootIndex('')
    setRootValue('')
  }

  const inputCls = 'h-7 flex-1 min-w-0 rounded border border-ink-200 bg-white px-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus-visible:focus-ring dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-500'
  const miniBtnCls = 'flex h-7 shrink-0 items-center justify-center rounded bg-gold-400 px-2 text-[11px] font-semibold text-ink-950 hover:bg-gold-300'

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        title="Insert symbol / build equation"
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-700 dark:hover:text-ink-100"
      >
        <Sigma className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 max-h-[70vh] w-72 overflow-y-auto rounded-lg border border-ink-200 bg-white p-2.5 shadow-page dark:border-ink-700 dark:bg-ink-900">
          {/* ---- Build your own: any exponent/index, any root ---- */}
          <div className="mb-2 space-y-1.5 rounded-md bg-ink-50/70 p-1.5 dark:bg-ink-800/40">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Type anything — power / index</p>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 shrink-0 text-ink-400" />
              <input
                value={supText}
                onChange={(e) => setSupText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && insertSuper()}
                placeholder="e.g. 238  →  2²³⁸"
                className={inputCls}
              />
              <button type="button" onClick={insertSuper} className={miniBtnCls}>Power</button>
            </div>
            {supText && !isFullySuperscriptable(supText) && (
              <p className="pl-4 text-[10px] text-ink-400">Some characters have no small form and will show at normal size.</p>
            )}
            <div className="flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 shrink-0 text-ink-400" />
              <input
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && insertSub()}
                placeholder="e.g. max  →  ₘₐₓ"
                className={inputCls}
              />
              <button type="button" onClick={insertSub} className={miniBtnCls}>Index</button>
            </div>
            {subText && !isFullySubscriptable(subText) && (
              <p className="pl-4 text-[10px] text-ink-400">Some characters have no small form and will show at normal size.</p>
            )}
            <div className="flex items-center gap-1">
              <Radical className="h-3 w-3 shrink-0 text-ink-400" />
              <input
                value={rootIndex}
                onChange={(e) => setRootIndex(e.target.value)}
                placeholder="2"
                className={`${inputCls} flex-none w-10 text-center`}
                title="Root index (2 = square root, 3 = cube root, ...)"
              />
              <input
                value={rootValue}
                onChange={(e) => setRootValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && insertRoot()}
                placeholder="value, e.g. 2x+5"
                className={inputCls}
              />
              <button type="button" onClick={insertRoot} className={miniBtnCls}>Root</button>
            </div>
          </div>

          {/* ---- Fixed groups for the commonly used symbols ---- */}
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
