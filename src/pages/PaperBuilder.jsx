import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Save, WifiOff, FileText, FileType, FileCode2 } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { MobileHeader } from '../components/layout/MobileHeader'
import { BottomNav } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import { DropdownMenu, MenuItem } from '../components/ui/DropdownMenu'
import { EditorPanel } from '../components/builder/EditorPanel'
import { PreviewPanel } from '../components/builder/PreviewPanel'
import { SchoolPaperStatusBanner, isPaperLockedForViewer } from '../components/builder/SchoolPaperStatusBanner'
import { SchoolDeadlineBanner } from '../components/builder/SchoolDeadlineBanner'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/authStore'
import { useTourStore } from '../store/tourStore'
import { paperApi } from '../services/paperApi'
import { toast, useUiStore } from '../store/uiStore'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { useTranslate } from '../i18n'
import { classSectionLabel, resolveSubject } from '../lib/utils'

export default function PaperBuilder() {
  const { paperId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const view = searchParams.get('view') === 'preview' ? 'preview' : 'edit'
  const isOnline = useOnlineStatus()
  const isDesktop = useIsDesktop()
  const t = useTranslate()
  const [downloading, setDownloading] = useState(false)

  const paper = useAppStore((s) => s.getPaper(paperId))
  const accountType = useAuthStore((s) => s.accountType)
  const setActivePaper = useAppStore((s) => s.setActivePaper)
  const markPaperSaved = useAppStore((s) => s.markPaperSaved)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (paper) setActivePaper(paper.id)
  }, [paper, setActivePaper])

  // Edit-from-preview (mobile) — the preview and editor panels aren't both
  // on screen on a phone, so when a teacher taps the pencil icon on a
  // question in Preview we hop the tab back to Edit; the Editor panel
  // itself (mounted fresh on this switch, see the `isDesktop` branch below
  // — mobile only ever mounts ONE of Edit/Preview, never both, so there's
  // no other stale listener to eat the signal first) picks up the same
  // focusQuestion signal to scroll to and highlight the exact question. On
  // desktop both panels are already visible together, so this is a no-op
  // there.
  const focusQuestion = useUiStore((s) => s.focusQuestion)
  useEffect(() => {
    if (focusQuestion && view !== 'edit') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('view', 'edit')
        return next
      }, { replace: true })
    }
  }, [focusQuestion?.nonce])

  // First time a teacher opens the Edit tab, spotlight the core edit
  // actions (add section, undo/redo, save, download); first time they open
  // the Preview tab, spotlight the live preview + page settings — each tab
  // gets its own tour, independent of the other (see tourStore). Never
  // auto-shows again after the first time; replayable from Settings.
  const startTourIfUnseen = useTourStore((s) => s.startIfUnseen)
  useEffect(() => {
    if (!paper) return
    const id = setTimeout(() => startTourIfUnseen(view === 'preview' ? 'preview' : 'edit'), 500)
    return () => clearTimeout(id)
  }, [paper, view, startTourIfUnseen])

  // The papers list only carries lightweight summary rows (no sections) —
  // fetch the full nested structure from GET /api/papers/{id} the first
  // time this builder opens a paper that hasn't been loaded yet.
  useEffect(() => {
    if (paper && !paper._structureLoaded) {
      useAppStore.getState().loadPaper(paperId).catch((err) => setLoadError(err?.message || 'Could not load this paper.'))
    }
  }, [paper, paperId])

  // Direct navigation / page reload — the paper may not be in the local
  // list at all yet (e.g. the summary list hasn't been fetched this
  // session). Try loading it straight from the backend before giving up.
  useEffect(() => {
    if (!paper && paperId) {
      useAppStore.getState().loadPaper(paperId).catch((err) => setLoadError(err?.message || 'This paper could not be found.'))
    }
  }, [paper, paperId])

  // SRS 43 — Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) undo/redo shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  // `?download=pdf|doc` — the paper list hands the export over to this page so
  // it always runs against a mounted preview. The param is consumed once and
  // dropped from the URL, so a refresh doesn't download the paper again.
  const requestedDownload = searchParams.get('download')
  const downloadHandedOff = useRef(false)
  useEffect(() => {
    if (!requestedDownload || !paper || downloadHandedOff.current) return
    downloadHandedOff.current = true
    const next = new URLSearchParams(searchParams)
    next.delete('download')
    setSearchParams(next, { replace: true })
    // One frame so the preview is painted before the exporter reads its DOM.
    requestAnimationFrame(() => handleDownload(requestedDownload === 'doc' ? 'doc' : requestedDownload === 'docx' ? 'docx' : 'pdf'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedDownload, paper])

  if (!paper) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-center">
          <p className="mb-3 text-sm text-ink-500">{loadError || 'Loading paper…'}</p>
          <Button onClick={() => navigate('/papers')}>Go to My Paper</Button>
        </div>
      </div>
    )
  }

  const examTitle = paper.examType === 'Custom' ? paper.customExamName : paper.examType

  const handleSave = () => {
    markPaperSaved(paper.id)
    toast.success('Paper saved successfully.')
  }

  // Both downloads read the live #print-root DOM, so whatever is on screen
  // in the preview right now is exactly what ends up in the file — the PDF
  // is a faithful capture of it, and the Doc keeps the same look via inline
  // styles while staying fully editable.
  const handleDownload = async (format) => {
    if (downloading) return
    setDownloading(true)
    // On mobile, only one panel is mounted at a time. If the teacher is on
    // the Edit tab, hop over to Preview just long enough to capture it, so
    // the download always matches what Preview shows — same as on desktop,
    // where both panels are already visible together.
    const isMobile = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 767px)').matches
    const needsPreviewSwitch = isMobile && view !== 'preview'
    try {
      if (needsPreviewSwitch) {
        setSearchParams({ view: 'preview' }, { replace: true })
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      }
      // Section 4/18/42 — paper creation/editing/preview stay unlimited; only
      // the actual download is gated, and that gate is enforced server-side
      // (POST /api/papers/{id}/download) before the file is produced here.
      const result = await paperApi.downloadPaper(paper, format)
      if (result.success) {
        toast.success(format === 'pdf' ? 'PDF downloaded.' : format === 'docx' ? 'Word (.docx) file downloaded.' : 'Word file downloaded.')
      } else if (result.reason !== 'quota') {
        toast.error(t('builder_downloadFailed'))
      }
      // reason === 'quota': paperApi.downloadPaper already opened the paywall.
    } catch (err) {
      console.error(err)
      toast.error(t('builder_downloadFailed'))
    } finally {
      if (needsPreviewSwitch) setSearchParams({ view: 'edit' }, { replace: true })
      setDownloading(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-50 dark:bg-ink-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop header */}
        <header className="hidden items-center justify-between border-b border-ink-100 bg-white px-6 py-3.5 dark:border-ink-800 dark:bg-ink-900 md:flex">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/papers')} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-semibold text-ink-900 dark:text-ink-50">
                {examTitle}{resolveSubject(paper) ? ` · ${resolveSubject(paper)}` : ''}
              </h1>
              <p className="truncate text-xs text-ink-400">{classSectionLabel(paper) ? `Class ${classSectionLabel(paper)} · ` : ''}{paper.schoolName}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!isOnline && (
              <span className="flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <WifiOff className="h-3.5 w-3.5" /> {t('builder_offline')}
              </span>
            )}
            <DropdownMenu
              trigger={
                <Button data-tour="builder-download" variant="outline" disabled={downloading}>
                  <Download className="h-4 w-4" /> {downloading ? t('builder_preparingDownload') : t('builder_downloading')}
                </Button>
              }
              menuClassName="min-w-[15rem]"
            >
              <MenuItem icon={FileText} onClick={() => handleDownload('pdf')}>
                {t('builder_downloadPdf')}
              </MenuItem>
              <MenuItem icon={FileCode2} onClick={() => handleDownload('docx')}>
                {t('builder_downloadDocx')}
              </MenuItem>
              <p className="px-3 pb-1.5 pt-1 text-[10.5px] leading-snug text-ink-400">{t('builder_downloadDocxHint')}</p>
              <MenuItem icon={FileType} onClick={() => handleDownload('doc')}>
                {t('builder_downloadDoc')}
              </MenuItem>
              <p className="px-3 pb-1.5 pt-1 text-[10.5px] leading-snug text-ink-400">{t('builder_downloadDocHint')}</p>
            </DropdownMenu>
            <Button data-tour="builder-save" onClick={handleSave}>
              <Save className="h-4 w-4" /> {t('builder_save')}
            </Button>
          </div>
        </header>

        {/* Mobile header */}
        <MobileHeader
          title={`${examTitle} · ${view === 'edit' ? t('nav_edit') : t('nav_preview')}`}
          rightAction={
            <DropdownMenu
              trigger={
                <button
                  type="button"
                  data-tour="builder-download"
                  disabled={downloading}
                  className="rounded-md p-1.5 text-ink-700 disabled:opacity-50 dark:text-ink-200"
                  aria-label={t('builder_downloading')}
                >
                  <Download className="h-5 w-5" />
                </button>
              }
              menuClassName="min-w-[14rem]"
            >
              <MenuItem icon={FileText} onClick={() => handleDownload('pdf')}>
                {t('builder_downloadPdf')}
              </MenuItem>
              <MenuItem icon={FileCode2} onClick={() => handleDownload('docx')}>
                {t('builder_downloadDocx')}
              </MenuItem>
              <p className="px-3 pb-1.5 pt-1 text-[10.5px] leading-snug text-ink-400">{t('builder_downloadDocxHint')}</p>
              <MenuItem icon={FileType} onClick={() => handleDownload('doc')}>
                {t('builder_downloadDoc')}
              </MenuItem>
              <p className="px-3 pb-1.5 pt-1 text-[10.5px] leading-snug text-ink-400">{t('builder_downloadDocHint')}</p>
            </DropdownMenu>
          }
        />

        {/* Desktop split workspace (SRS 4.1 - 4.5) vs. mobile single-panel
            workspace (SRS 4.6 / 13.7) — this is a real JS-level branch
            (`isDesktop`, from `useIsDesktop`), not just a `hidden md:grid` /
            `md:hidden` CSS pair. Both panels used to be mounted at every
            screen width (the desktop pair merely `display:none`d on
            mobile), so a CSS-hidden Editor panel on mobile was still a live
            mounted component — its own "jump to this question" listener
            would fire and consume/clear the signal before the actual
            visible mobile Editor panel had even mounted, so on mobile the
            tab switched to Edit but never scrolled to/highlighted the
            question. Only ever mounting the one panel that's actually on
            screen fixes that race. */}
        <SchoolDeadlineBanner />
        <SchoolPaperStatusBanner paper={paper} />

        {isDesktop ? (
          <div className="min-h-0 flex-1 md:grid" style={{ gridTemplateColumns: '42% 58%' }}>
            <div className="min-h-0 border-r border-ink-100 dark:border-ink-800">
              <LockableEditor paper={paper} accountType={accountType} t={t} />
            </div>
            <div className="min-h-0">
              <PreviewPanel paper={paper} />
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 pb-16">
            {view === 'edit' ? <LockableEditor paper={paper} accountType={accountType} t={t} /> : <PreviewPanel paper={paper} />}
          </div>
        )}

        <BottomNav />
      </div>
    </div>
  )
}

// Wraps EditorPanel with a visual read-only lock for the school paper
// review lifecycle — never a second security boundary, just so a teacher
// (or admin, who never gets free-form edit access at all) doesn't sit
// there typing into a form that silently fails to save server-side. The
// backend is the real enforcement (403 on any write attempt). Individual
// teacher papers (paper.schoolId falsy) are always unaffected: this
// renders the plain, fully-interactive EditorPanel with no overlay.
function LockableEditor({ paper, accountType, t }) {
  const locked = isPaperLockedForViewer(paper, accountType)
  if (!locked) return <EditorPanel paper={paper} />
  return (
    <div className="relative h-full min-h-0">
      <div className="pointer-events-none h-full min-h-0 opacity-60">
        <EditorPanel paper={paper} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-3">
        <span className="rounded-full bg-ink-900/90 px-3 py-1 text-xs font-medium text-white shadow-card dark:bg-ink-100/90 dark:text-ink-900">
          {t('schoolPaper_lockedReadOnly')} — {t('schoolPaper_lockedReadOnlyHint')}
        </span>
      </div>
    </div>
  )
}
