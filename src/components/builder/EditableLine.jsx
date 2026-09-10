import React, { useRef, useState, useEffect } from 'react'
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Type, RotateCcw, PenLine } from 'lucide-react'
import { RichText } from '../../lib/richText'
import { toggleLineMark, toggleSnippetMark } from '../../lib/utils'
import { nextAlign, LINE_FONT_SIZE_MIN, LINE_FONT_SIZE_MAX, LINE_HEIGHT_MIN, LINE_HEIGHT_MAX, LINE_GAP_MIN, LINE_GAP_MAX } from '../../data/mockData'
import { useTranslate } from '../../i18n'

const ALIGN_ICON = { left: AlignLeft, center: AlignCenter, right: AlignRight }

/**
 * Feature 7 — click any line in the live preview to move it (left/center/
 * right), make it bold/italic/underline, or (Aa) tune just that one line's
 * font size / line spacing / gap-below without touching the rest of the
 * paper. Highlighting part of the line first narrows the Bold/Italic/
 * Underline buttons to just that selection — whole-line-only options (Move,
 * Aa) hide once a partial selection is detected.
 *
 * Double-tap/double-click any line to edit its text right there in the
 * preview — this swaps the line for a plain textarea (same raw text,
 * markers and all, same as the Edit tab's own text box) until the teacher
 * taps away or presses Enter/Escape. This works for every line that has an
 * `onText` handler (question text, passage, section title/instruction,
 * notice box, sub-question labels, etc.) since they all render through
 * this one component. Jumping into the full question editor is a separate,
 * explicit action — the pencil icon in this same popup toolbar — so a
 * double-tap never redirects the teacher away from the preview.
 */
export function EditableLine({ as: Tag = 'div', text, align = 'left', onAlign, onText, style, onStyle, className = '', placeholder, dir, applyMarginBottom = true, onJumpToQuestion }) {
  const t = useTranslate()
  const ref = useRef(null)
  const editRef = useRef(null)
  const lastTapRef = useRef(0)
  const [toolbar, setToolbar] = useState(null) // { mode: 'line' | 'selection', snippet }
  const [showStyle, setShowStyle] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text || '')
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!toolbar && !showStyle) return
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setToolbar(null)
        setShowStyle(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [toolbar, showStyle])

  const startEditing = () => {
    if (!onText) return
    setToolbar(null)
    setShowStyle(false)
    setDraft(text || '')
    setEditing(true)
  }

  // Real double-tap detection — a native `dblclick` is unreliable on
  // phones: with no `touch-action` restriction, two quick taps are just as
  // likely to be swallowed by the browser's own double-tap-to-zoom gesture
  // as to fire a `dblclick` event, so double-click worked with a mouse but
  // silently did nothing with a finger. Tracking the taps ourselves (and
  // setting `touch-action: manipulation` below so the browser doesn't wait
  // to see if it's a zoom) makes it work the same way on both.
  const DOUBLE_TAP_MS = 400
  const handleTapForEdit = () => {
    if (!onText) return
    const now = Date.now()
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0
      startEditing()
    } else {
      lastTapRef.current = now
    }
  }

  const commitEdit = () => {
    setEditing(false)
    if (draft !== (text || '')) onText(draft)
  }

  const cancelEdit = () => {
    setEditing(false)
    setDraft(text || '')
  }

  // Auto-grow the textarea to fit its content, and focus it (with the
  // cursor at the end) the moment editing starts — on a phone this is what
  // actually pops the keyboard open.
  useEffect(() => {
    if (!editing || !editRef.current) return
    const el = editRef.current
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    el.focus()
    const len = el.value.length
    el.setSelectionRange(len, len)
  }, [editing, draft])

  const openToolbar = () => {
    const sel = window.getSelection()
    const snippet = sel && sel.toString()
    if (snippet && ref.current && ref.current.contains(sel.anchorNode)) {
      setToolbar({ mode: 'selection', snippet })
    } else {
      setToolbar({ mode: 'line' })
    }
    setShowStyle(false)
  }

  const applyMark = (mark) => {
    if (!onText) return
    if (toolbar?.mode === 'selection' && toolbar.snippet) {
      onText(toggleSnippetMark(text, toolbar.snippet, mark))
    } else {
      onText(toggleLineMark(text, mark))
    }
    setToolbar(null)
    window.getSelection()?.removeAllRanges()
  }

  const setStyleField = (field, value) => {
    if (!onStyle) return
    const next = { ...(style || {}) }
    if (value === '' || value === null || Number.isNaN(value)) {
      delete next[field]
    } else {
      next[field] = value
    }
    onStyle(next)
  }

  const clearStyle = () => {
    onStyle?.({})
    setShowStyle(false)
    setToolbar(null)
  }

  const AlignIcon = ALIGN_ICON[align] || AlignLeft
  const hasCustomStyle = !!(style && (style.fontSize || style.lineHeight || style.marginBottom))

  return (
    <span ref={wrapRef} className="relative inline-block w-full print:pointer-events-none">
      {editing ? (
        <textarea
          ref={editRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
          }}
          placeholder={placeholder}
          dir={dir}
          rows={1}
          className={`${className} no-print block w-full resize-none overflow-hidden rounded border-none bg-transparent p-0 outline-none ring-2 ring-gold-300 dark:ring-gold-500/60`}
          style={{
            textAlign: align,
            ...(style?.fontSize ? { fontSize: `${style.fontSize}px` } : {}),
            ...(style?.lineHeight ? { lineHeight: style.lineHeight } : {}),
            ...(applyMarginBottom && style?.marginBottom ? { marginBottom: `${style.marginBottom}px` } : {}),
          }}
        />
      ) : (
        <Tag
          ref={ref}
          onMouseUp={openToolbar}
          onClick={handleTapForEdit}
          onDoubleClick={startEditing}
          className={`${className} cursor-text rounded transition-colors hover:bg-gold-100/50 dark:hover:bg-gold-400/10`}
          style={{
            textAlign: align,
            display: 'block',
            touchAction: 'manipulation',
            ...(style?.fontSize ? { fontSize: `${style.fontSize}px` } : {}),
            ...(style?.lineHeight ? { lineHeight: style.lineHeight } : {}),
            ...(applyMarginBottom && style?.marginBottom ? { marginBottom: `${style.marginBottom}px` } : {}),
          }}
          dir={dir}
        >
          {text ? <RichText text={text} /> : <span className="italic text-ink-300">{placeholder}</span>}
        </Tag>
      )}

      {toolbar && (
        <div className="no-print absolute left-0 top-full z-20 mt-1 flex items-center gap-0.5 rounded-lg border border-ink-200 bg-white p-1 shadow-lg dark:border-ink-700 dark:bg-ink-800">
          {toolbar.mode === 'line' && onAlign && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onAlign(nextAlign(align)); setToolbar(null) }}
              title={t('common_moveText')}
              className="rounded p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"
            ><AlignIcon className="h-3.5 w-3.5" /></button>
          )}
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyMark('bold')} title={t('common_bold')} className="rounded p-1.5 font-bold text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"><Bold className="h-3.5 w-3.5" /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyMark('italic')} title={t('common_italic')} className="rounded p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"><Italic className="h-3.5 w-3.5" /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyMark('underline')} title={t('common_underline')} className="rounded p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"><Underline className="h-3.5 w-3.5" /></button>
          {onJumpToQuestion && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setToolbar(null); window.getSelection()?.removeAllRanges(); onJumpToQuestion() }}
              title={t('preview_editQuestion')}
              className="rounded p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"
            ><PenLine className="h-3.5 w-3.5" /></button>
          )}
          {toolbar.mode === 'line' && onStyle && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowStyle((v) => !v)}
              title={t('common_lineStyle')}
              className={`rounded p-1.5 text-[11px] font-bold ${hasCustomStyle ? 'bg-gold-100 text-gold-700 dark:bg-gold-400/20 dark:text-gold-300' : 'text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700'}`}
            ><Type className="h-3.5 w-3.5" /></button>
          )}
        </div>
      )}

      {showStyle && onStyle && (
        <div
          className="no-print absolute left-0 top-full z-20 mt-11 flex w-56 flex-col gap-2 rounded-lg border border-ink-200 bg-white p-2.5 text-[11px] shadow-lg dark:border-ink-700 dark:bg-ink-800"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink-600 dark:text-ink-300">{t('common_lineStyle')}</span>
            {hasCustomStyle && (
              <button type="button" onClick={clearStyle} className="flex items-center gap-0.5 text-ink-400 hover:text-ink-700 dark:hover:text-ink-100">
                <RotateCcw className="h-3 w-3" /> {t('common_reset')}
              </button>
            )}
          </div>
          <label className="flex items-center justify-between gap-2">
            <span className="text-ink-500 dark:text-ink-400">{t('common_fontSize')}</span>
            <input
              type="number"
              min={LINE_FONT_SIZE_MIN}
              max={LINE_FONT_SIZE_MAX}
              placeholder={t('common_default')}
              value={style?.fontSize ?? ''}
              onChange={(e) => setStyleField('fontSize', e.target.value === '' ? '' : Number(e.target.value))}
              className="h-7 w-20 rounded border border-ink-200 bg-white px-2 text-xs text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-ink-500 dark:text-ink-400">{t('common_lineSpacing')}</span>
            <input
              type="number"
              step="0.05"
              min={LINE_HEIGHT_MIN}
              max={LINE_HEIGHT_MAX}
              placeholder={t('common_default')}
              value={style?.lineHeight ?? ''}
              onChange={(e) => setStyleField('lineHeight', e.target.value === '' ? '' : Number(e.target.value))}
              className="h-7 w-20 rounded border border-ink-200 bg-white px-2 text-xs text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-ink-500 dark:text-ink-400">{t('common_gapBelow')}</span>
            <input
              type="number"
              min={LINE_GAP_MIN}
              max={LINE_GAP_MAX}
              placeholder={t('common_default')}
              value={style?.marginBottom ?? ''}
              onChange={(e) => setStyleField('marginBottom', e.target.value === '' ? '' : Number(e.target.value))}
              className="h-7 w-20 rounded border border-ink-200 bg-white px-2 text-xs text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
            />
          </label>
        </div>
      )}
    </span>
  )
}
