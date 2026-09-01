import React, { useCallback, useEffect, useState } from 'react'
import { Bold, Italic, Underline, Copy, ClipboardPaste } from 'lucide-react'
import { toggleMarkInRange } from '../../lib/utils'
import { getTextareaCaretPosition, getInputCaretPosition } from '../../lib/caretPosition'

const MARKS = [
  { key: 'bold', Icon: Bold, title: 'Bold' },
  { key: 'italic', Icon: Italic, title: 'Italic' },
  { key: 'underline', Icon: Underline, title: 'Underline' },
]

/**
 * Feature — select any text inside a plain field and a small toolbar pops up
 * right above it with Bold / Italic / Underline / Copy / Paste. The field
 * itself stays a completely plain, uncluttered textbox the rest of the
 * time — nothing shows until text is actually selected.
 */
export function useSelectionToolbar({ elementRef, value, onChange, multiline }) {
  const [position, setPosition] = useState(null)

  const updatePosition = useCallback(() => {
    const el = elementRef.current
    if (!el) { setPosition(null); return }
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start == null || end == null || start === end) { setPosition(null); return }
    const coords = multiline ? getTextareaCaretPosition(el, start) : getInputCaretPosition(el, start)
    setPosition(coords)
  }, [elementRef, multiline])

  useEffect(() => {
    const el = elementRef.current
    if (!el) return undefined
    const onUp = () => updatePosition()
    const onKeyUp = (e) => { if (e.shiftKey || e.key.startsWith('Arrow')) updatePosition() }
    const onBlur = () => setPosition(null)
    el.addEventListener('mouseup', onUp)
    el.addEventListener('keyup', onKeyUp)
    el.addEventListener('blur', onBlur)
    return () => {
      el.removeEventListener('mouseup', onUp)
      el.removeEventListener('keyup', onKeyUp)
      el.removeEventListener('blur', onBlur)
    }
  }, [elementRef, updatePosition])

  const wrap = (mark) => {
    const el = elementRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start === end) return
    const result = toggleMarkInRange(value, start, end, mark)
    onChange({ target: { value: result.text } })
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = result.start
      el.selectionEnd = result.end
    })
  }

  const copy = async () => {
    const el = elementRef.current
    if (!el) return
    const selected = value.slice(el.selectionStart, el.selectionEnd)
    if (!selected) return
    try { await navigator.clipboard.writeText(selected) } catch { /* clipboard unavailable, ignore */ }
  }

  const paste = async () => {
    const el = elementRef.current
    if (!el) return
    try {
      const clip = await navigator.clipboard.readText()
      if (!clip) return
      const start = el.selectionStart
      const end = el.selectionEnd
      const next = `${value.slice(0, start)}${clip}${value.slice(end)}`
      onChange({ target: { value: next } })
      requestAnimationFrame(() => {
        el.focus()
        el.selectionStart = el.selectionEnd = start + clip.length
      })
    } catch { /* clipboard unavailable, ignore */ }
    setPosition(null)
  }

  return { position, wrap, copy, paste }
}

export function SelectionToolbar({ position, wrap, copy, paste }) {
  if (!position) return null
  return (
    <div
      className="pointer-events-auto absolute z-30 flex items-center gap-0.5 rounded-lg border border-ink-200 bg-white px-1 py-1 shadow-lg dark:border-ink-700 dark:bg-ink-800"
      style={{ top: Math.max(position.top - 36, 0), left: Math.max(position.left - 8, 0) }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {MARKS.map(({ key, Icon, title }) => (
        <button
          key={key}
          type="button"
          title={title}
          onClick={() => wrap(key)}
          className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
        ><Icon className="h-3 w-3" /></button>
      ))}
      <span className="mx-0.5 h-4 w-px bg-ink-200 dark:bg-ink-700" />
      <button
        type="button" title="Copy" onClick={copy}
        className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
      ><Copy className="h-3 w-3" /></button>
      <button
        type="button" title="Paste" onClick={paste}
        className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
      ><ClipboardPaste className="h-3 w-3" /></button>
    </div>
  )
}
