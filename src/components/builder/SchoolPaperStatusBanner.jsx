import React, { useState } from 'react'
import { Send, Check, RotateCcw, FlagTriangleRight, Lock } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Dialog } from '../ui/Dialog'
import { Textarea, Label } from '../ui/Input'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../store/uiStore'
import { useTranslate } from '../../i18n'
import {
  normalizeStatus, schoolPaperStatusLabelKey, schoolPaperStatusBadgeVariant,
} from '../../lib/schoolPaperStatus'

/**
 * Shown just below the PaperBuilder header, before the split Edit/Preview
 * workspace. Only ever renders anything for a school-connected teacher's
 * paper (`paper.schoolId` set) — for an individual teacher's paper this
 * returns null and the builder is completely unaffected, exactly as
 * today. Every action here calls the dedicated review-lifecycle endpoint;
 * the backend re-validates the transition itself, so nothing here is a
 * second security boundary.
 */
export function SchoolPaperStatusBanner({ paper }) {
  const t = useTranslate()
  const accountType = useAuthStore((s) => s.accountType)
  const teacher = useAuthStore((s) => s.teacher)
  const submitPaperForReview = useAppStore((s) => s.submitPaperForReview)
  const approveSchoolPaper = useAppStore((s) => s.approveSchoolPaper)
  const requestSchoolPaperChanges = useAppStore((s) => s.requestSchoolPaperChanges)
  const finalizeSchoolPaper = useAppStore((s) => s.finalizeSchoolPaper)

  const [busy, setBusy] = useState(false)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [reason, setReason] = useState('')

  if (!paper?.schoolId) return null

  const status = normalizeStatus(paper.status)
  // A teacher can only ever load their own paper here (the backend enforces
  // that), so accountType alone is enough to tell the two views apart —
  // paper.ownerUserId === teacher.id is available too, but is redundant.
  const isAdmin = accountType === 'school'
  const isTeacher = accountType === 'teacher'

  const run = async (fn, successKey) => {
    setBusy(true)
    try {
      await fn()
      toast.success(t(successKey))
    } catch (err) {
      toast.error(err?.message || t('schoolPaper_actionFailed'))
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = () => run(
    () => submitPaperForReview(paper.id),
    status === 'NEEDS_CHANGES' ? 'schoolPaper_resubmitSuccess' : 'schoolPaper_submitSuccess'
  )
  const handleApprove = () => run(() => approveSchoolPaper(paper.id), 'schoolPaper_approveSuccess')
  const handleFinalize = () => run(() => finalizeSchoolPaper(paper.id), 'schoolPaper_finalizeSuccess')

  const confirmRequestChanges = async () => {
    if (!reason.trim()) return
    setBusy(true)
    try {
      await requestSchoolPaperChanges(paper.id, reason.trim())
      toast.success(t('schoolPaper_requestChangesSuccess'))
      setReasonOpen(false)
      setReason('')
    } catch (err) {
      toast.error(err?.message || t('schoolPaper_actionFailed'))
    } finally {
      setBusy(false)
    }
  }

  const teacherBannerKey = {
    DRAFT: 'schoolPaper_bannerTeacherDraft',
    SUBMITTED: 'schoolPaper_bannerTeacherSubmitted',
    NEEDS_CHANGES: 'schoolPaper_bannerTeacherNeedsChanges',
    APPROVED: 'schoolPaper_bannerTeacherApproved',
    FINAL: 'schoolPaper_bannerTeacherFinal',
  }[status]

  const adminBannerKey = {
    DRAFT: 'schoolPaper_bannerAdminDraft',
    SUBMITTED: 'schoolPaper_bannerAdminSubmitted',
    NEEDS_CHANGES: 'schoolPaper_bannerAdminNeedsChanges',
    APPROVED: 'schoolPaper_bannerAdminApproved',
    FINAL: 'schoolPaper_bannerAdminFinal',
  }[status]

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-ink-50 px-4 py-2.5 dark:border-ink-800 dark:bg-ink-900/60 md:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant={schoolPaperStatusBadgeVariant(paper.status)}>
          {t(schoolPaperStatusLabelKey(paper.status))}
        </Badge>
        {isAdmin && paper.ownerName && (
          <span className="text-xs text-ink-500 dark:text-ink-400">{t('schoolPaper_ownerLabel')}: {paper.ownerName}</span>
        )}
        <span className="text-xs text-ink-500 dark:text-ink-400">
          {isAdmin ? t(adminBannerKey) : t(teacherBannerKey)}
        </span>
        {status === 'NEEDS_CHANGES' && paper.reviewComment && (
          <span className="rounded-md bg-red-50 px-2 py-1 text-xs text-pen-red dark:bg-red-900/20 dark:text-red-300">
            {paper.reviewComment}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {isTeacher && (status === 'DRAFT' || status === 'NEEDS_CHANGES') && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={handleSubmit}>
            <Send className="h-3.5 w-3.5" /> {status === 'NEEDS_CHANGES' ? t('schoolPaper_resubmit') : t('schoolPaper_submitForReview')}
          </Button>
        )}
        {isTeacher && (status === 'SUBMITTED' || status === 'APPROVED' || status === 'FINAL') && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-400">
            <Lock className="h-3.5 w-3.5" /> {t('schoolPaper_lockedReadOnly')}
          </span>
        )}
        {isAdmin && status === 'SUBMITTED' && (
          <>
            <Button size="sm" variant="secondary" disabled={busy} onClick={handleApprove}>
              <Check className="h-3.5 w-3.5" /> {t('schoolPaper_approve')}
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setReasonOpen(true)}>
              <RotateCcw className="h-3.5 w-3.5" /> {t('schoolPaper_requestChanges')}
            </Button>
          </>
        )}
        {isAdmin && status === 'APPROVED' && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={handleFinalize}>
            <FlagTriangleRight className="h-3.5 w-3.5" /> {t('schoolPaper_finalize')}
          </Button>
        )}
      </div>

      <Dialog
        open={reasonOpen}
        onClose={() => setReasonOpen(false)}
        title={t('schoolPaper_needsChangesReasonTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReasonOpen(false)}>{t('common_cancel')}</Button>
            <Button variant="danger" onClick={confirmRequestChanges} disabled={!reason.trim() || busy}>
              {t('schoolPaper_requestChanges')}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="builder-request-changes-reason">{t('schoolPaper_needsChangesReasonLabel')}</Label>
          <Textarea
            id="builder-request-changes-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('schoolPaper_needsChangesReasonPlaceholder')}
          />
          {!reason.trim() && (
            <p className="text-xs text-ink-400">{t('schoolPaper_needsChangesReasonRequired')}</p>
          )}
        </div>
      </Dialog>
    </div>
  )
}

/** True when the editor should be locked read-only for the current viewer. */
export function isPaperLockedForViewer(paper, accountType) {
  if (!paper?.schoolId) return false
  if (accountType === 'school') return true // admins never get free-form edit access
  const status = normalizeStatus(paper.status)
  return status !== 'DRAFT' && status !== 'NEEDS_CHANGES'
}
