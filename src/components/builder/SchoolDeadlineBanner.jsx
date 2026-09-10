import React, { useEffect } from 'react'
import { Clock, AlarmClock, Lock, CalendarClock } from 'lucide-react'
import { useSchoolStore } from '../../store/schoolStore'
import { useAuthStore } from '../../store/authStore'
import { deadlineApi } from '../../services/deadlineApi'
import { useTranslate } from '../../i18n'
import {
  deadlineStatusBadgeVariant, formatDeadlineDateTime, isSchoolConnectedTeacher, shouldShowDeadlineBanner,
} from '../../lib/schoolDeadline'
import { Badge } from '../ui/Badge'

const ICONS = {
  UPCOMING: CalendarClock,
  OPEN: Clock,
  APPROACHING: AlarmClock,
  LAST_DAY: AlarmClock,
  CLOSED: Lock,
}

const STYLES = {
  UPCOMING: 'border-ink-100 bg-ink-50 text-ink-600 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-300',
  OPEN: 'border-ink-100 bg-ink-50 text-ink-600 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-300',
  APPROACHING: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-400',
  LAST_DAY: 'border-red-200 bg-red-50 text-pen-red dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300',
  CLOSED: 'border-red-200 bg-red-50 text-pen-red dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300',
}

const MESSAGE_KEYS = {
  UPCOMING: 'schoolDeadline_bannerUpcoming',
  OPEN: 'schoolDeadline_bannerOpen',
  APPROACHING: 'schoolDeadline_bannerApproaching',
  LAST_DAY: 'schoolDeadline_bannerLastDay',
  CLOSED: 'schoolDeadline_bannerClosed',
}

/**
 * Shown to a school-connected teacher only (never an individual teacher,
 * never a School Admin — the admin manages this from Submission Deadline
 * settings instead). Reads the server-computed `status`/`teacherActionAllowed`
 * from GET /api/school/deadline — never computes this from the browser
 * clock. Renders nothing while NOT_CONFIGURED, exactly as if the feature
 * didn't exist, and nothing at all for anyone who isn't a school-connected
 * teacher.
 *
 * This is UI/UX only. The backend (PaperService -> SchoolDeadlineService
 * .assertTeacherActionAllowed) re-validates every create/edit/submit call
 * itself, so a stale banner here is bad UX, never a security hole.
 */
export function SchoolDeadlineBanner({ className = 'border-b px-4 py-2.5 md:px-6' }) {
  const t = useTranslate()
  const accountType = useAuthStore((s) => s.accountType)
  const teacher = useAuthStore((s) => s.teacher)
  const deadline = useSchoolStore((s) => s.schoolDeadline)
  const loaded = useSchoolStore((s) => s.schoolDeadlineLoaded)

  const applies = isSchoolConnectedTeacher(accountType, teacher)

  useEffect(() => {
    if (!applies) return
    deadlineApi.getDeadline().catch(() => {
      // Silent — a failed fetch just means no banner shows this load; the
      // backend remains the real gate on every create/edit/submit attempt.
    })
  }, [applies])

  if (!applies || !loaded || !shouldShowDeadlineBanner(deadline)) return null

  const status = deadline.status
  const Icon = ICONS[status] || Clock

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs font-medium ${className} ${STYLES[status] || STYLES.OPEN}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{t(MESSAGE_KEYS[status] || MESSAGE_KEYS.OPEN)}</span>
      {deadline.examName && (
        <Badge variant={deadlineStatusBadgeVariant(status)}>{deadline.examName}</Badge>
      )}
      {(status === 'OPEN' || status === 'APPROACHING' || status === 'LAST_DAY') && deadline.deadlineAt && (
        <span className="text-[11px] opacity-80">
          {t('schoolDeadline_dueLabel')}: {formatDeadlineDateTime(deadline.deadlineAt)}
        </span>
      )}
      {status === 'UPCOMING' && deadline.startAt && (
        <span className="text-[11px] opacity-80">
          {t('schoolDeadline_opensLabel')}: {formatDeadlineDateTime(deadline.startAt)}
        </span>
      )}
    </div>
  )
}
