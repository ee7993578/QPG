import React, { useEffect, useRef, useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, RotateCcw } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Label } from '../ui/Input'
import { A4Preview } from './A4Preview'
import { useAppStore } from '../../store/useAppStore'
import { toast } from '../../store/uiStore'
import {
  measurePageCount, suggestedTargetPages, runSmartFix, runForceFit, undoSmartFix,
  buildChangeSummary, getRememberedTarget, rememberTarget, pageAspectFor,
} from '../../lib/smartFix'
import { useTranslate } from '../../i18n'

/**
 * Smart Fix — "fit my paper into N pages", entirely teacher-facing. All the
 * real work (measuring the live preview, trying gentler layout tweaks in
 * order, protecting readability, snapshotting for Undo) lives in
 * lib/smartFix.js; this component is just the dialog + a small state
 * machine: idle → measuring → ready → optimizing → done.
 *
 * IMPORTANT: this dialog is only ever opened from inside the Preview panel,
 * so #print-root is guaranteed to already be mounted and visible — Smart
 * Fix always measures the same live page the teacher is looking at.
 */
export function SmartFixDialog({ open, onClose, paper }) {
  const t = useTranslate()
  const updatePaperSettings = useAppStore((s) => s.updatePaperSettings)
  const updateQuestionGroup = useAppStore((s) => s.updateQuestionGroup)
  const updateQuestion = useAppStore((s) => s.updateQuestion)

  const [phase, setPhase] = useState('measuring') // measuring | ready | optimizing | done | unavailable
  const [currentPages, setCurrentPages] = useState(null)
  const [target, setTarget] = useState(null)
  const [result, setResult] = useState(null) // { finalPages, reachedTarget, before, appliedSettings, widowsProtected, forced? }
  const [canUndo, setCanUndo] = useState(false)
  const [livePages, setLivePages] = useState(null)

  // Whether any store mutation has happened yet in the run currently in
  // flight — the FIRST mutation of a run should land on the app's normal
  // undo/redo stack (so Ctrl+Z reverts the whole run in one step); every
  // mutation after that is marked silent so an 8-rung Smart Fix run doesn't
  // bury the teacher's real edit history under 8 near-identical steps.
  // Reset at the start of every handleFix/handleForceFit call.
  const hasHistoryEntryRef = useRef(false)
  const nextOpts = (opts) => {
    if (!hasHistoryEntryRef.current) {
      hasHistoryEntryRef.current = true
      return opts // forward whatever the engine itself decided for the very first call
    }
    return { ...opts, silent: true }
  }

  // Re-measure fresh every time the dialog opens, so the page count shown
  // always matches whatever the teacher last did in the editor.
  useEffect(() => {
    if (!open) return
    setResult(null)
    setCanUndo(false)
    setLivePages(null)
    setPhase('measuring')
    const id = setTimeout(() => {
      const pages = measurePageCount(paper)
      if (pages == null) {
        setPhase('unavailable')
        return
      }
      const rounded = Math.ceil(pages)
      setCurrentPages(pages)
      const options = suggestedTargetPages(pages)
      const remembered = getRememberedTarget(paper.id)
      const prefill = remembered != null && options.includes(remembered) ? remembered : (options[0] ?? Math.max(1, rounded - 1))
      setTarget(prefill)
      setPhase('ready')
    }, 60)
    return () => clearTimeout(id)
  }, [open, paper])

  const applySettings = (patch, opts) => updatePaperSettings(paper.id, patch, nextOpts(opts))
  const clearPageBreaks = (pairs) => {
    pairs.forEach(({ sectionId, groupId }) => updateQuestionGroup(paper.id, sectionId, groupId, { pageBreakBefore: false }, nextOpts()))
  }
  const restorePageBreaks = (pairs) => {
    pairs.forEach(({ sectionId, groupId }) => updateQuestionGroup(paper.id, sectionId, groupId, { pageBreakBefore: true }, nextOpts()))
  }
  const markKeepTogether = (triples) => {
    triples.forEach(({ sectionId, groupId, questionId }) => updateQuestion(paper.id, sectionId, groupId, questionId, { keepTogether: true }, nextOpts()))
  }
  const clearWidowFixes = (triples) => {
    triples.forEach(({ sectionId, groupId, questionId }) => updateQuestion(paper.id, sectionId, groupId, questionId, { keepTogether: false }, nextOpts()))
  }

  const handleFix = async () => {
    hasHistoryEntryRef.current = false
    setLivePages(currentPages)
    setPhase('optimizing')
    rememberTarget(paper.id, target)
    try {
      const outcome = await runSmartFix({
        paper,
        targetPages: target,
        applySettings,
        clearPageBreaks,
        markKeepTogether,
        onProgress: () => {},
        onLiveUpdate: ({ pages }) => setLivePages(pages),
      })
      setResult(outcome)
      setCanUndo(outcome.appliedAny)
      setPhase('done')
    } catch (err) {
      setPhase('unavailable')
    }
  }

  // Only reachable after the comfortable pass already fell short and warned
  // the teacher — never runs on its own. Picks up from wherever the paper
  // stands right now and pushes the same knobs to their hard, still-
  // printable floors. "Undo Fix" still restores the paper exactly as it was
  // before Smart Fix ever touched it, since `result.before` is never
  // overwritten here.
  const handleForceFit = async () => {
    hasHistoryEntryRef.current = !!result?.appliedAny // if the comfortable pass already made a (non-silent) history entry, force-fit's own steps all stay silent too
    setPhase('optimizing')
    try {
      const outcome = await runForceFit({
        paper,
        targetPages: target,
        applySettings,
        markKeepTogether,
        onProgress: () => {},
        onLiveUpdate: ({ pages }) => setLivePages(pages),
      })
      setResult((prev) => ({
        ...prev,
        finalPages: outcome.finalPages,
        reachedTarget: outcome.reachedTarget,
        appliedSettings: outcome.appliedSettings,
        widowsProtected: outcome.widowsProtected,
        forced: true,
      }))
      setCanUndo(true)
    } finally {
      setPhase('done')
    }
  }

  const handleUndo = () => {
    if (!result) return
    hasHistoryEntryRef.current = false // the reversion itself is a fresh single undo/redo-stack entry
    undoSmartFix({ before: result.before, applySettings, restorePageBreaks, clearWidowFixes })
    setCanUndo(false)
    toast.info(t('smartFix_undone'))
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  const options = currentPages != null ? suggestedTargetPages(currentPages) : []
  const isSpreadOption = (n) => currentPages != null && n === Math.ceil(currentPages) && Math.ceil(currentPages) - currentPages > 0.05
  const targetIsSpread = target != null && isSpreadOption(target)

  const changeSummary = result ? buildChangeSummary(result.before?.settings, result.appliedSettings) : []
  const widowCount = result?.widowsProtected?.length || 0

  const aspect = paper ? pageAspectFor(paper) : 1 / Math.SQRT2

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold-500" /> {t('smartFix_title')}
        </span>
      }
      footer={
        phase === 'ready' ? (
          <>
            <Button variant="ghost" onClick={handleClose}>{t('common_cancel')}</Button>
            <Button onClick={handleFix}>{t('smartFix_fixButton')}</Button>
          </>
        ) : phase === 'done' ? (
          <>
            {canUndo && (
              <Button variant="outline" onClick={handleUndo}>
                <RotateCcw className="h-3.5 w-3.5" /> {t('smartFix_undoFix')}
              </Button>
            )}
            {result && !result.reachedTarget && !result.forced && (
              <Button variant="outline" onClick={handleForceFit}>
                <Sparkles className="h-3.5 w-3.5" /> {t('smartFix_forceFitButton')}
              </Button>
            )}
            <Button onClick={handleClose}>{t('common_done')}</Button>
          </>
        ) : phase === 'unavailable' ? (
          <Button onClick={handleClose}>{t('common_close')}</Button>
        ) : null
      }
    >
      {phase === 'measuring' && (
        <div className="flex items-center gap-2 py-4 text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('smartFix_measuring')}
        </div>
      )}

      {phase === 'ready' && (
        <div className="space-y-4">
          <p>
            {t('smartFix_currentIntro')}{' '}
            <strong>{Math.ceil(currentPages)} {Math.ceil(currentPages) === 1 ? t('smartFix_page') : t('smartFix_pages')}</strong>.
          </p>
          <div>
            <Label>{t('smartFix_fitInto')}</Label>
            <Select value={target ?? ''} onChange={(e) => setTarget(Number(e.target.value))}>
              {options.map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? t('smartFix_page') : t('smartFix_pages')}
                  {isSpreadOption(n) ? ` ${t('smartFix_spreadFillSuffix')}` : ''}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-ink-400">
            {targetIsSpread ? t('smartFix_spreadIntro') : t('smartFix_readabilityNote')}
          </p>
        </div>
      )}

      {phase === 'optimizing' && (
        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2 text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('smartFix_optimizing')}
          </div>
          {/* Live mini-preview — reuses the exact A4Preview component, which
              reads live from the store, so it re-renders on every settings
              change for free. Kept small, non-interactive, and clipped so it
              never disturbs the dialog's own layout. Because the main
              <A4Preview> in PreviewPanel.jsx is mounted ahead of this dialog
              in the DOM, getVisiblePrintRoot() (which picks the FIRST
              #print-root) keeps measuring the real page, never this copy. */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{t('smartFix_liveLabel')}</span>
            <div
              className="relative overflow-hidden rounded-md border border-ink-200 bg-ink-50 shadow-inner dark:border-ink-700 dark:bg-ink-900"
              style={{ width: 120, height: 120 * aspect, pointerEvents: 'none' }}
            >
              <div style={{ transform: 'scale(0.17)', transformOrigin: 'top left', width: `${100 / 0.17}%` }}>
                <A4Preview paper={paper} />
              </div>
            </div>
            {livePages != null && (
              <span className="text-xs text-ink-500">
                {Math.ceil(livePages)} {Math.ceil(livePages) === 1 ? t('smartFix_page') : t('smartFix_pages')}
              </span>
            )}
          </div>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="space-y-2">
          {result.reachedTarget ? (
            <p className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {result.forced
                ? t('smartFix_forcedSuccessPrefix')
                : result.direction === 'spread' ? t('smartFix_spreadSuccessPrefix') : t('smartFix_successPrefix')}{' '}
              {Math.ceil(result.finalPages)} {Math.ceil(result.finalPages) === 1 ? t('smartFix_page') : t('smartFix_pages')}.
            </p>
          ) : (
            <>
              <p className="font-medium text-ink-800 dark:text-ink-100">
                {result.forced ? t('smartFix_forcedStillCant') : t('smartFix_cantComfortablyFit').replace('{target}', target)}
              </p>
              <p>{t('smartFix_bestResultPrefix')} <strong>{result.finalPages.toFixed(1)} {t('smartFix_pages')}</strong>.</p>
              {!result.forced && <p className="text-xs text-ink-400">{t('smartFix_forceFitHint')}</p>}
            </>
          )}

          {changeSummary.length > 0 && (
            <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-2.5 dark:border-ink-800 dark:bg-ink-900/40">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{t('smartFix_whatChanged')}</p>
              <ul className="space-y-0.5 text-xs text-ink-600 dark:text-ink-300">
                {changeSummary.map((item) => (
                  <li key={item.key}>
                    {t(item.labelKey)} {item.before} → {item.after}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {widowCount > 0 && (
            <p className="text-xs text-ink-500">
              {widowCount === 1 ? t('smartFix_widowsProtectedNote_one') : t('smartFix_widowsProtectedNote_other').replace('{n}', widowCount)}
            </p>
          )}

          {result.forced && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{t('smartFix_printSafetyNote')}</p>
          )}

          <p className="text-xs text-ink-400">{t('smartFix_undoHint')}</p>
        </div>
      )}

      {phase === 'unavailable' && (
        <p>{t('smartFix_unavailable')}</p>
      )}
    </Dialog>
  )
}
