import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Check, RotateCcw, FlagTriangleRight, FolderOpen } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { CreatePaperButton } from '../../components/papers/PapersBrowser'
import { AdSlot } from '../../components/ads/AdSlot'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Textarea, Label } from '../../components/ui/Input'
import { EmptyState, ListSkeleton } from '../../components/ui/States'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../store/uiStore'
import { useTranslate } from '../../i18n'
import {
  computePaperMarks, formatDate, formatDuration, classSectionLabel, resolveSubject,
} from '../../lib/utils'
import {
  normalizeStatus, schoolPaperStatusLabelKey, schoolPaperStatusBadgeVariant,
} from '../../lib/schoolPaperStatus'

/**
 * Sections 11/46 — the School Admin's Papers page: status filter tabs
 * (All / Draft / Submitted / Needs Changes / Approved / Final) plus, per
 * row, whichever review action is valid for that paper's current status
 * (Approve / Request Changes on Submitted; Finalize on Approved).
 *
 * Per requirement 17, this never opens a second review/preview screen —
 * "Open Preview" just navigates into the exact same builder preview route
 * (`/paper/{id}?view=preview`) individual teachers already use. Every
 * approve/request-changes/finalize call goes straight to the dedicated
 * backend endpoint, which re-validates the transition itself — nothing
 * here is a second security boundary.
 */

const TABS = [
  { value: 'all', labelKey: 'schoolPaper_filterAll' },
  { value: 'DRAFT', labelKey: 'schoolPaper_statusDraft' },
  { value: 'SUBMITTED', labelKey: 'schoolPaper_statusSubmitted' },
  { value: 'NEEDS_CHANGES', labelKey: 'schoolPaper_statusNeedsChanges' },
  { value: 'APPROVED', labelKey: 'schoolPaper_statusApproved' },
  { value: 'FINAL', labelKey: 'schoolPaper_statusFinal' },
]

function examName(p) {
  return (p.examType === 'Custom' ? p.customExamName : p.examType) || 'Untitled paper'
}

export default function SchoolPapers() {
  const navigate = useNavigate()
  const t = useTranslate()
  const school = useAuthStore((s) => s.school)
  const papers = useAppStore((s) => s.papers)
  const approveSchoolPaper = useAppStore((s) => s.approveSchoolPaper)
  const requestSchoolPaperChanges = useAppStore((s) => s.requestSchoolPaperChanges)
  const finalizeSchoolPaper = useAppStore((s) => s.finalizeSchoolPaper)

  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [reasonDraft, setReasonDraft] = useState(null) // { paper, reason }

  const load = (status) => {
    setLoading(true)
    useAppStore.getState().loadPapers(status === 'all' ? undefined : status)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(tab) }, [tab])

  const handleApprove = async (paper) => {
    setBusyId(paper.id)
    try {
      await approveSchoolPaper(paper.id)
      toast.success(t('schoolPaper_approveSuccess'))
    } catch (err) {
      toast.error(err?.message || t('schoolPaper_actionFailed'))
    } finally {
      setBusyId(null)
    }
  }

  const handleFinalize = async (paper) => {
    setBusyId(paper.id)
    try {
      await finalizeSchoolPaper(paper.id)
      toast.success(t('schoolPaper_finalizeSuccess'))
    } catch (err) {
      toast.error(err?.message || t('schoolPaper_actionFailed'))
    } finally {
      setBusyId(null)
    }
  }

  const openRequestChanges = (paper) => setReasonDraft({ paper, reason: '' })

  const confirmRequestChanges = async () => {
    if (!reasonDraft || !reasonDraft.reason.trim()) return
    setBusyId(reasonDraft.paper.id)
    try {
      await requestSchoolPaperChanges(reasonDraft.paper.id, reasonDraft.reason.trim())
      toast.success(t('schoolPaper_requestChangesSuccess'))
      setReasonDraft(null)
    } catch (err) {
      toast.error(err?.message || t('schoolPaper_actionFailed'))
    } finally {
      setBusyId(null)
    }
  }

  const openPreview = (paper) => navigate(`/paper/${paper.id}?view=preview`)

  return (
    <AppShell
      title="Papers"
      subtitle={school?.schoolName ? `Question papers in ${school.schoolName}` : 'Question papers in your school'}
      mobileTitle="Papers"
      right={<CreatePaperButton />}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap gap-1.5 border-b border-ink-100 pb-3 dark:border-ink-800">
          {TABS.map((tabDef) => (
            <button
              key={tabDef.value}
              onClick={() => setTab(tabDef.value)}
              className={
                tab === tabDef.value
                  ? 'rounded-full bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white dark:bg-gold-400 dark:text-ink-950'
                  : 'rounded-full bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700'
              }
            >
              {t(tabDef.labelKey)}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {loading ? (
            <ListSkeleton rows={4} />
          ) : papers.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No papers here"
              message="No papers in the school workspace yet. Create one, or invite your teachers so they can start."
              actionLabel="Create New Paper"
              onAction={() => navigate('/exam/new')}
            />
          ) : (
            <div className="space-y-3">
              {papers.map((paper) => {
                const { obtainableMarks } = computePaperMarks(paper)
                const normalizedStatus = normalizeStatus(paper.status)
                const isBusy = busyId === paper.id
                return (
                  <Card key={paper.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display font-semibold text-ink-900 dark:text-ink-50">{examName(paper)}</p>
                          <Badge variant={schoolPaperStatusBadgeVariant(paper.status)}>
                            {t(schoolPaperStatusLabelKey(paper.status))}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-ink-400">
                          {t('schoolPaper_ownerLabel')}: {paper.ownerName || '—'} · {resolveSubject(paper)}
                          {classSectionLabel(paper) ? ` · Class ${classSectionLabel(paper)}` : ''} · {formatDate(paper.examDate)} · {formatDuration(paper.duration)} · {obtainableMarks}/{paper.totalMarks} marks
                        </p>
                        {normalizedStatus === 'NEEDS_CHANGES' && paper.reviewComment && (
                          <p className="mt-1.5 rounded-md bg-red-50 px-2 py-1 text-xs text-pen-red dark:bg-red-900/20 dark:text-red-300">
                            {paper.reviewComment}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openPreview(paper)} title={t('schoolPaper_openPreview')}>
                          <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('schoolPaper_openPreview')}</span>
                        </Button>
                        {normalizedStatus === 'SUBMITTED' && (
                          <>
                            <Button size="sm" variant="secondary" disabled={isBusy} onClick={() => handleApprove(paper)} title={t('schoolPaper_approve')}>
                              <Check className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('schoolPaper_approve')}</span>
                            </Button>
                            <Button size="sm" variant="outline" disabled={isBusy} onClick={() => openRequestChanges(paper)} title={t('schoolPaper_requestChanges')}>
                              <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('schoolPaper_requestChanges')}</span>
                            </Button>
                          </>
                        )}
                        {normalizedStatus === 'APPROVED' && (
                          <Button size="sm" variant="secondary" disabled={isBusy} onClick={() => handleFinalize(paper)} title={t('schoolPaper_finalize')}>
                            <FlagTriangleRight className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('schoolPaper_finalize')}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <AdSlot slot="school-papers" format="banner" className="mt-6" />
      </div>

      <Dialog
        open={!!reasonDraft}
        onClose={() => setReasonDraft(null)}
        title={t('schoolPaper_needsChangesReasonTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReasonDraft(null)}>{t('common_cancel')}</Button>
            <Button
              variant="danger"
              onClick={confirmRequestChanges}
              disabled={!reasonDraft?.reason.trim() || busyId === reasonDraft?.paper.id}
            >
              {t('schoolPaper_requestChanges')}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="request-changes-reason">{t('schoolPaper_needsChangesReasonLabel')}</Label>
          <Textarea
            id="request-changes-reason"
            rows={4}
            value={reasonDraft?.reason || ''}
            onChange={(e) => setReasonDraft((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder={t('schoolPaper_needsChangesReasonPlaceholder')}
          />
          {reasonDraft && !reasonDraft.reason.trim() && (
            <p className="text-xs text-ink-400">{t('schoolPaper_needsChangesReasonRequired')}</p>
          )}
        </div>
      </Dialog>
    </AppShell>
  )
}
