// Frontend mirror of backend entity/enums/SchoolPaperStatus.java — kept in
// one place so PapersBrowser / SchoolPapers / the PaperBuilder status
// banner all agree on labels, badge colors, and which actions are valid
// for a given status. This is UI/UX only: the backend re-validates every
// transition itself, so nothing here is a second security boundary.
//
// A paper only carries this lifecycle at all when it's a school-connected
// teacher's paper — i.e. `paper.schoolId` is set (see isSchoolWorkflowPaper
// in PaperService.java). Individual-teacher papers (`schoolId` falsy)
// should never be passed through these helpers; callers should branch on
// `paper.schoolId` first and leave those papers exactly as before.

export const SCHOOL_PAPER_STATUSES = ['DRAFT', 'SUBMITTED', 'NEEDS_CHANGES', 'APPROVED', 'FINAL']

/**
 * Case-insensitive normalize, matching SchoolPaperStatus.normalize()
 * server-side — legacy free-text values ("draft"/"saved"/null) all fall
 * through to DRAFT, same as the backend.
 */
export function normalizeStatus(status) {
  if (!status) return 'DRAFT'
  const upper = String(status).trim().toUpperCase()
  switch (upper) {
    case 'SUBMITTED':
    case 'NEEDS_CHANGES':
    case 'APPROVED':
    case 'FINAL':
      return upper
    default:
      return 'DRAFT'
  }
}

export function isEditableByTeacher(status) {
  const s = normalizeStatus(status)
  return s === 'DRAFT' || s === 'NEEDS_CHANGES'
}

const LABEL_KEYS = {
  DRAFT: 'schoolPaper_statusDraft',
  SUBMITTED: 'schoolPaper_statusSubmitted',
  NEEDS_CHANGES: 'schoolPaper_statusNeedsChanges',
  APPROVED: 'schoolPaper_statusApproved',
  FINAL: 'schoolPaper_statusFinal',
}

/** i18n key for a given status's display label — pass through t() to render. */
export function schoolPaperStatusLabelKey(status) {
  return LABEL_KEYS[normalizeStatus(status)]
}

const BADGE_VARIANTS = {
  DRAFT: 'neutral',
  SUBMITTED: 'gold',
  NEEDS_CHANGES: 'danger',
  APPROVED: 'success',
  FINAL: 'success',
}

/** Badge `variant` prop for a given status. */
export function schoolPaperStatusBadgeVariant(status) {
  return BADGE_VARIANTS[normalizeStatus(status)] || 'neutral'
}
