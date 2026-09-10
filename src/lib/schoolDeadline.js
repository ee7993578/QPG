import { useAuthStore } from '../store/authStore'
import { useSchoolStore } from '../store/schoolStore'

// Frontend mirror of backend entity/enums/DeadlineStatus.java — kept in one
// place so SchoolDeadlineBanner / SchoolDeadlineSettings / PapersBrowser all
// agree on labels, badge colors, and whether an action is currently
// allowed. This is UI/UX only: SchoolDeadlineService.assertTeacherActionAllowed
// on the backend is the real enforcement gate — nothing here is a second
// security boundary, and none of this ever computes against the browser
// clock. `teacherActionAllowed` and `status` always come straight from the
// server's SchoolDeadlineResponse.

export const DEADLINE_STATUSES = ['NOT_CONFIGURED', 'UPCOMING', 'OPEN', 'APPROACHING', 'LAST_DAY', 'CLOSED']

const LABEL_KEYS = {
  NOT_CONFIGURED: 'schoolDeadline_statusNotConfigured',
  UPCOMING: 'schoolDeadline_statusUpcoming',
  OPEN: 'schoolDeadline_statusOpen',
  APPROACHING: 'schoolDeadline_statusApproaching',
  LAST_DAY: 'schoolDeadline_statusLastDay',
  CLOSED: 'schoolDeadline_statusClosed',
}

/** i18n key for a given status's display label — pass through t() to render. */
export function deadlineStatusLabelKey(status) {
  return LABEL_KEYS[status] || LABEL_KEYS.NOT_CONFIGURED
}

const BADGE_VARIANTS = {
  NOT_CONFIGURED: 'neutral',
  UPCOMING: 'neutral',
  OPEN: 'success',
  APPROACHING: 'gold',
  LAST_DAY: 'danger',
  CLOSED: 'danger',
}

/** Badge `variant` prop for a given status. */
export function deadlineStatusBadgeVariant(status) {
  return BADGE_VARIANTS[status] || 'neutral'
}

/**
 * Whether the teacher-facing banner should render anything at all. Nothing
 * to show when there's no deadline configured — that's the "as if this
 * feature didn't exist" state.
 */
export function shouldShowDeadlineBanner(deadlineRes) {
  return !!deadlineRes && deadlineRes.status !== 'NOT_CONFIGURED'
}

/** True only for User(role=TEACHER) at a school — mirrors isSchoolConnectedTeacher server-side. */
export function isSchoolConnectedTeacher(accountType, teacher) {
  return accountType === 'teacher' && !!teacher?.schoolId
}

/** Locale-formatted date/time for display — deadlineAt/startAt/reopenedUntil are plain local strings in the school's own timezone. */
export function formatDeadlineDateTime(isoLocal) {
  if (!isoLocal) return ''
  const d = new Date(isoLocal)
  if (Number.isNaN(d.getTime())) return isoLocal
  return d.toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/** <input type="datetime-local"> expects "YYYY-MM-DDTHH:mm" — trims any seconds the backend sends back. */
export function toDateTimeLocalInput(isoLocal) {
  if (!isoLocal) return ''
  return isoLocal.slice(0, 16)
}

/**
 * Client-side gating helper for Create/Edit/Submit affordances — used by
 * PapersBrowser/CreateExam so a school-connected teacher isn't shown an
 * action the server will reject once SchoolDeadlineBanner has already
 * fetched the deadline for the current page. Always returns
 * `allowed: true` for anyone the deadline doesn't apply to (individual
 * teacher, School Admin) and — safe-by-default — before the fetch has
 * completed, since the backend is the real gate either way; this only
 * ever hides an action a moment sooner, never blocks one the server would
 * actually allow.
 */
export function useDeadlineGate() {
  const accountType = useAuthStore((s) => s.accountType)
  const teacher = useAuthStore((s) => s.teacher)
  const deadline = useSchoolStore((s) => s.schoolDeadline)
  const loaded = useSchoolStore((s) => s.schoolDeadlineLoaded)

  const applies = isSchoolConnectedTeacher(accountType, teacher)
  if (!applies || !loaded || !deadline) {
    return { applies: false, allowed: true, status: null }
  }
  return { applies: true, allowed: !!deadline.teacherActionAllowed, status: deadline.status }
}
