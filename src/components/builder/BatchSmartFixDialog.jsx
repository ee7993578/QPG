import React, { useMemo, useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Label } from '../ui/Input'
import { A4Preview } from './A4Preview'
import { useAppStore } from '../../store/useAppStore'
import { resolveSubject, classSectionLabel } from '../../lib/utils'
import { runSmartFix } from '../../lib/smartFix'
import { useTranslate } from '../../i18n'

const TARGET_OPTIONS = [1, 2, 3, 4, 5, 6]

function examName(p) {
  return (p.examType === 'Custom' ? p.customExamName : p.examType) || 'Untitled paper'
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Give the off-screen A4Preview one full render + layout pass before Smart
// Fix tries to measure it — same idea as smartFix.js's own settle(), just
// local to this file since that helper isn't exported.
async function waitForLayout() {
  await new Promise((r) => requestAnimationFrame(r))
  await new Promise((r) => requestAnimationFrame(r))
  await wait(60)
}

/**
 * Batch Smart Fix — fit several papers into the same target page count in
 * one go (e.g. a school admin lining up 10 subject papers before a print
 * run). Papers are processed ONE AT A TIME: only one DOM node can be "the
 * visible print-root" Smart Fix measures against at any moment, so each
 * paper's own <A4Preview> is mounted off-screen, measured/optimized, then
 * unmounted before moving to the next one.
 *
 * Reuses the exact same lib/smartFix.js engine the single-paper Smart Fix
 * dialog uses — same priority order, same floors, same widow protection —
 * just driven across a list instead of the one paper currently open in the
 * builder.
 */
export function BatchSmartFixDialog({ open, onClose }) {
  const t = useTranslate()
  const papers = useAppStore((s) => s.papers)
  const updatePaperSettings = useAppStore((s) => s.updatePaperSettings)
  const updateQuestionGroup = useAppStore((s) => s.updateQuestionGroup)
  const updateQuestion = useAppStore((s) => s.updateQuestion)

  const [selected, setSelected] = useState({}) // { [paperId]: true }
  const [target, setTarget] = useState(2)
  const [running, setRunning] = useState(false)
  const [mountedPaperId, setMountedPaperId] = useState(null)
  // { [paperId]: 'pending' | 'processing' | 'reached' | 'not-reached' | 'failed' }
  const [statuses, setStatuses] = useState({})
  const [error, setError] = useState('')

  const selectedPapers = useMemo(() => papers.filter((p) => selected[p.id]), [papers, selected])
  const mountedPaper = useMemo(() => papers.find((p) => p.id === mountedPaperId) || null, [papers, mountedPaperId])

  const toggle = (id) => {
    if (running) return
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const reset = () => {
    setSelected({})
    setStatuses({})
    setRunning(false)
    setMountedPaperId(null)
    setError('')
  }

  const handleClose = () => {
    if (running) return // a run in flight shouldn't be walked away from mid-paper
    reset()
    onClose()
  }

  const processOnePaper = async (paperId) => {
    setStatuses((prev) => ({ ...prev, [paperId]: 'processing' }))
    setMountedPaperId(paperId)
    await waitForLayout()
    try {
      // Fresh from the store right now — not a stale closure — since some
      // batches will be run right after the teacher was editing elsewhere.
      const freshPaper = useAppStore.getState().papers.find((p) => p.id === paperId)
      if (!freshPaper) {
        setStatuses((prev) => ({ ...prev, [paperId]: 'failed' }))
        return
      }
      const outcome = await runSmartFix({
        paper: freshPaper,
        targetPages: target,
        applySettings: (patch, opts) => updatePaperSettings(paperId, patch, { ...opts, silent: true }),
        clearPageBreaks: (pairs) => pairs.forEach(({ sectionId, groupId }) =>
          updateQuestionGroup(paperId, sectionId, groupId, { pageBreakBefore: false }, { silent: true })),
        markKeepTogether: (triples) => triples.forEach(({ sectionId, groupId, questionId }) =>
          updateQuestion(paperId, sectionId, groupId, questionId, { keepTogether: true }, { silent: true })),
        onProgress: () => {},
      })
      setStatuses((prev) => ({ ...prev, [paperId]: outcome.reachedTarget ? 'reached' : 'not-reached' }))
    } catch (err) {
      setStatuses((prev) => ({ ...prev, [paperId]: 'failed' }))
    } finally {
      setMountedPaperId(null)
    }
  }

  const handleStart = async () => {
    if (selectedPapers.length === 0) {
      setError(t('batchSmartFix_noneSelected'))
      return
    }
    setError('')
    setRunning(true)
    const initial = {}
    selectedPapers.forEach((p) => { initial[p.id] = 'pending' })
    setStatuses(initial)

    for (const p of selectedPapers) {
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential, see file-level note
      await processOnePaper(p.id)
    }
    setRunning(false)
  }

  const allDone = running === false && Object.keys(statuses).length > 0 && selectedPapers.every((p) => statuses[p.id] && statuses[p.id] !== 'pending' && statuses[p.id] !== 'processing')

  const statusIcon = (status) => {
    if (status === 'processing') return <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-500" />
    if (status === 'reached') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    if (status === 'not-reached' || status === 'failed') return <XCircle className="h-3.5 w-3.5 text-amber-500" />
    return <Circle className="h-3.5 w-3.5 text-ink-300" />
  }

  const statusLabel = (status) => {
    if (status === 'processing') return t('batchSmartFix_processing')
    if (status === 'reached') return t('batchSmartFix_reached')
    if (status === 'not-reached' || status === 'failed') return t('batchSmartFix_notReached')
    return ''
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className="max-w-lg"
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold-500" /> {t('batchSmartFix_title')}
        </span>
      }
      footer={
        allDone ? (
          <Button onClick={handleClose}>{t('batchSmartFix_close')}</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose} disabled={running}>{t('common_cancel')}</Button>
            <Button onClick={handleStart} disabled={running}>
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {t('batchSmartFix_start')}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-ink-400">{t('batchSmartFix_intro')}</p>

        <div>
          <Label>{t('batchSmartFix_fitInto')}</Label>
          <Select value={target} onChange={(e) => setTarget(Number(e.target.value))} disabled={running}>
            {TARGET_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? t('smartFix_page') : t('smartFix_pages')}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label>{t('batchSmartFix_selectPapers')}</Label>
          <div className="scroll-thin max-h-64 space-y-1 overflow-y-auto rounded-lg border border-ink-200 p-2 dark:border-ink-800">
            {papers.length === 0 && (
              <p className="p-2 text-xs text-ink-400">—</p>
            )}
            {papers.map((p) => {
              const status = statuses[p.id]
              return (
                <label
                  key={p.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-ink-50 dark:hover:bg-ink-800"
                >
                  <input
                    type="checkbox"
                    checked={!!selected[p.id]}
                    onChange={() => toggle(p.id)}
                    disabled={running}
                  />
                  <span className="flex-1 truncate text-ink-700 dark:text-ink-200">
                    {examName(p)}
                    {resolveSubject(p) ? ` — ${resolveSubject(p)}` : ''}
                    {classSectionLabel(p) ? ` (${classSectionLabel(p)})` : ''}
                  </span>
                  {status && (
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-ink-500">
                      {statusIcon(status)} {statusLabel(status)}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </div>

        {error && <p className="text-xs text-pen-red">{error}</p>}

        {allDone && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> {t('batchSmartFix_done')}
          </p>
        )}

        {/* Off-screen mount for whichever paper is currently being processed
            — fixed and pushed well outside the viewport (NOT display:none,
            since getVisiblePrintRoot() needs it to actually be laid out and
            have real client rects). Only one paper is ever mounted at a
            time, so there's never any ambiguity about which #print-root
            Smart Fix is measuring. This page also never shows its own
            regular preview, so there's no ordering concern with any other
            #print-root on screen. */}
        {mountedPaper && (
          <div style={{ position: 'fixed', top: 0, left: -9999, pointerEvents: 'none' }} aria-hidden="true">
            <A4Preview paper={mountedPaper} />
          </div>
        )}
      </div>
    </Dialog>
  )
}
