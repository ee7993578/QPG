import React, { useRef, useState, useEffect } from 'react'
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react'
import { RichText } from '../../lib/richText'
import { toggleLineMark, toggleSnippetMark } from '../../lib/utils'
import { nextAlign } from '../../data/mockData'
import { useTranslate } from '../../i18n'

const ALIGN_ICON = { left: AlignLeft, center: AlignCenter, right: AlignRight }

/**
 * Feature 7 — click any line in the live preview to move it (left/center/
 * right) or make it bold/italic/underline. Highlighting part of the line
 * first narrows the Bold/Italic/Underline buttons to just that selection —
 * the whole-line Move option only makes sense for the whole line, so it's
 * hidden once a partial selection is detected.
 */
export function EditableLine({ as: Tag = 'div', text, align = 'left', onAlign, onText, className = '', placeholder, dir }) {
  const t = useTranslate()
  const ref = useRef(null)
  const [toolbar, setToolbar] = useState(null) // { mode: 'line' | 'selection', snippet }
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!toolbar) return
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setToolbar(null)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [toolbar])

  const openToolbar = () => {
    const sel = window.getSelection()
    const snippet = sel && sel.toString()
    if (snippet && ref.current && ref.current.contains(sel.anchorNode)) {
      setToolbar({ mode: 'selection', snippet })
    } else {
      setToolbar({ mode: 'line' })
    }
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

  const AlignIcon = ALIGN_ICON[align] || AlignLeft

  return (
    <span ref={wrapRef} className="relative inline-block w-full print:pointer-events-none">
      <Tag
        ref={ref}
        onMouseUp={openToolbar}
        className={`${className} cursor-text rounded transition-colors hover:bg-gold-100/50 dark:hover:bg-gold-400/10`}
        style={{ textAlign: align, display: 'block' }}
        dir={dir}
      >
        {text ? <RichText text={text} /> : <span className="italic text-ink-300">{placeholder}</span>}
      </Tag>

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
        </div>
      )}
    </span>
  )
}
