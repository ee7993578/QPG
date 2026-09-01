import React, { useState } from 'react'
import { Info } from 'lucide-react'

/**
 * Easy-to-use flow — plain-language explainer for technical-sounding fields
 * (e.g. "Restart Numbering", "Marks Position"). Deliberately click/tap
 * to toggle rather than hover-only, since hover tooltips don't work on
 * touchscreens where most teachers will actually use this app.
 */
export function InfoHint({ text }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="What does this mean?"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-ink-300 hover:text-ink-600 dark:text-ink-600 dark:hover:text-ink-300"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          onClick={() => setOpen(false)}
          className="absolute left-1/2 top-5 z-20 w-52 -translate-x-1/2 rounded-lg border border-ink-200 bg-white p-2 text-[11px] font-normal leading-snug text-ink-600 shadow-lg dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300"
        >
          {text}
        </span>
      )}
    </span>
  )
}
