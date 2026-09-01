import React, { useRef } from 'react'
import { Bold, Italic, Underline, Scissors, Copy, ClipboardPaste, Check } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { toggleMarkInRange } from '../../lib/utils'

const MARKS = [
  { key: 'bold', Icon: Bold, title: 'Bold' },
  { key: 'italic', Icon: Italic, title: 'Italic' },
  { key: 'underline', Icon: Underline, title: 'Underline' },
]

/**
 * Feature 6 — a small expand icon on the question textarea opens this
 * fullscreen editor: the whole question is visible at once, formatting
 * (bold/italic/underline) and cut/copy/paste sit in a toolbar right on top
 * instead of a popup that only appears on selection, and "Done" closes it.
 */
export function FullscreenTextEditor({ open, onClose, value, onChange, placeholder, dir }) {
  const taRef = useRef(null)

  const withSelection = (fn) => {
    const el = taRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    fn(el, start, end)
  }

  const applyMark = (mark) => {
    withSelection((el, start, end) => {
      if (start === end) return // nothing selected — nothing to wrap
      const result = toggleMarkInRange(value || '', start, end, mark)
      onChange(result.text)
      requestAnimationFrame(() => {
        el.focus()
        el.selectionStart = result.start
        el.selectionEnd = result.end
      })
    })
  }

  const cut = () => {
    withSelection(async (el, start, end) => {
      if (start === end) return
      const selected = (value || '').slice(start, end)
      try { await navigator.clipboard.writeText(selected) } catch { /* clipboard unavailable */ }
      const next = `${(value || '').slice(0, start)}${(value || '').slice(end)}`
      onChange(next)
      requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start })
    })
  }

  const copy = () => {
    withSelection(async (el, start, end) => {
      if (start === end) return
      try { await navigator.clipboard.writeText((value || '').slice(start, end)) } catch { /* ignore */ }
    })
  }

  const paste = () => {
    withSelection(async (el, start, end) => {
      try {
        const clip = await navigator.clipboard.readText()
        if (!clip) return
        const next = `${(value || '').slice(0, start)}${clip}${(value || '').slice(end)}`
        onChange(next)
        requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + clip.length })
      } catch { /* clipboard unavailable */ }
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Edit question" className="max-w-2xl">
      <div className="mb-2 flex flex-wrap items-center gap-0.5 rounded-lg border border-ink-200 bg-ink-50/70 p-1 dark:border-ink-700 dark:bg-ink-800/40">
        {MARKS.map(({ key, Icon, title }) => (
          <button
            key={key}
            type="button"
            title={title}
            onClick={() => applyMark(key)}
            className="flex h-8 w-8 items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
          ><Icon className="h-4 w-4" /></button>
        ))}
        <span className="mx-1 h-5 w-px bg-ink-200 dark:bg-ink-700" />
        <button type="button" title="Cut" onClick={cut} className="flex h-8 w-8 items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"><Scissors className="h-4 w-4" /></button>
        <button type="button" title="Copy" onClick={copy} className="flex h-8 w-8 items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"><Copy className="h-4 w-4" /></button>
        <button type="button" title="Paste" onClick={paste} className="flex h-8 w-8 items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"><ClipboardPaste className="h-4 w-4" /></button>
      </div>

      <textarea
        ref={taRef}
        autoFocus
        dir={dir === 'rtl' ? 'rtl' : 'ltr'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-[50vh] w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm leading-relaxed text-ink-900 placeholder:text-ink-400 focus-visible:focus-ring dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-500 ${dir === 'rtl' ? 'text-right' : ''}`}
      />

      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={onClose}><Check className="h-4 w-4" /> Done</Button>
      </div>
    </Dialog>
  )
}
