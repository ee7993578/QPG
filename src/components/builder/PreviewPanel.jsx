import React, { useState } from 'react'
import { KeyRound, Shuffle, RectangleHorizontal, SlidersHorizontal } from 'lucide-react'
import { A4Preview } from './A4Preview'
import { Select } from '../ui/Select'
import { PAPER_SETS, BORDER_OPTIONS } from '../../data/mockData'
import { useAppStore } from '../../store/useAppStore'
import { useTranslate } from '../../i18n'

/** SRS 48/49 (multiple paper sets, preview-only reorder), 50 (answer key toggle), and Feature 9 (border). */
export function PreviewPanel({ paper }) {
  const t = useTranslate()
  const updatePaperSettings = useAppStore((s) => s.updatePaperSettings)
  // Feature 8 — no Set is chosen by default, so nothing prints on the paper
  // until the teacher deliberately picks one.
  const [activeSet, setActiveSet] = useState('')
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  // Preview options stay tucked away by default — one click reveals them.
  const [showOptions, setShowOptions] = useState(false)
  const border = paper.settings?.border || 'none'

  return (
    <div className="scroll-thin h-full overflow-y-auto bg-ink-100/60 p-4 dark:bg-ink-950 sm:p-8">
      <div className="mx-auto mb-4 w-full max-w-[720px]">
        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-500 shadow-sm hover:text-ink-800 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> {showOptions ? t('common_lessOptions') : t('common_moreOptions')}
        </button>

        {showOptions && (
          <div className="mt-2 flex w-full flex-wrap items-center gap-3 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs dark:border-ink-800 dark:bg-ink-900">
            <span className="flex items-center gap-1.5 font-medium text-ink-600 dark:text-ink-300">
              <Shuffle className="h-3.5 w-3.5" /> {t('preview_set')}
            </span>
            <Select value={activeSet} onChange={(e) => setActiveSet(e.target.value)} className="h-7 w-24 text-xs">
              <option value="">{t('preview_setNone')}</option>
              {PAPER_SETS.map((s) => <option key={s} value={s}>Set {s}</option>)}
            </Select>

            <span className="mx-1 hidden h-5 w-px bg-ink-200 dark:bg-ink-700 sm:block" />

            <span className="flex items-center gap-1.5 font-medium text-ink-600 dark:text-ink-300">
              <RectangleHorizontal className="h-3.5 w-3.5" /> {t('border_label')}
            </span>
            <Select
              value={border}
              onChange={(e) => updatePaperSettings(paper.id, { border: e.target.value })}
              className="h-7 w-40 text-xs"
            >
              {BORDER_OPTIONS.map((b) => <option key={b.value} value={b.value}>{t(b.labelKey)}</option>)}
            </Select>

            <span className="hidden text-ink-400 md:inline">{t('preview_setHint')}</span>
            <label className="ml-auto flex shrink-0 items-center gap-1.5 font-medium text-ink-600 dark:text-ink-300">
              <input type="checkbox" checked={showAnswerKey} onChange={(e) => setShowAnswerKey(e.target.checked)} />
              <KeyRound className="h-3.5 w-3.5" /> {t('preview_answerKey')}
            </label>
          </div>
        )}
      </div>
      <p className="mx-auto mb-3 w-full max-w-[720px] text-center text-[11px] text-ink-400">{t('preview_tapToFormat')}</p>
      <A4Preview paper={paper} activeSet={activeSet} showAnswerKey={showAnswerKey} />
    </div>
  )
}
