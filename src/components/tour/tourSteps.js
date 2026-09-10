// Each step points at a real, on-screen element via a `data-tour="..."`
// attribute (added directly on the actual button/panel — never a fake
// mockup), so the spotlight always highlights the exact thing the teacher
// would tap next.
//
// One tour per bottom-nav tab (Dashboard / Edit / Preview / My Paper) —
// each auto-starts the first time a teacher opens that tab, independently
// of the others (see tourStore: `seen` tracks each tab separately).
//
// `titleKey`/`bodyKey` are i18n keys (see i18n/index.js) — TourOverlay
// resolves them through the app's own t() so the tour always follows
// whichever language (English/Hindi) is currently selected in Settings.

export const DASHBOARD_TOUR_STEPS = [
  {
    target: '[data-tour="qa-create"]',
    titleKey: 'tour_dashboard_create_title',
    bodyKey: 'tour_dashboard_create_body',
    placement: 'bottom',
  },
  {
    target: '[data-tour="qa-my-papers"]',
    titleKey: 'tour_dashboard_myPapers_title',
    bodyKey: 'tour_dashboard_myPapers_body',
    placement: 'bottom',
  },
  {
    target: '[data-tour="qa-question-bank"]',
    titleKey: 'tour_dashboard_questionBank_title',
    bodyKey: 'tour_dashboard_questionBank_body',
    placement: 'bottom',
  },
  {
    target: '[data-tour="qa-templates"]',
    titleKey: 'tour_dashboard_templates_title',
    bodyKey: 'tour_dashboard_templates_body',
    placement: 'bottom',
  },
]

// Edit tab — building the paper: sections, undo/redo, save, download.
export const EDIT_TOUR_STEPS = [
  {
    target: '[data-tour="builder-add-section"]',
    titleKey: 'tour_edit_addSection_title',
    bodyKey: 'tour_edit_addSection_body',
    placement: 'top',
  },
  {
    target: '[data-tour="builder-undo-redo"]',
    titleKey: 'tour_edit_undoRedo_title',
    bodyKey: 'tour_edit_undoRedo_body',
    placement: 'bottom',
  },
  {
    target: '[data-tour="builder-save"]',
    titleKey: 'tour_edit_save_title',
    bodyKey: 'tour_edit_save_body',
    placement: 'bottom',
  },
  {
    target: '[data-tour="builder-download"]',
    titleKey: 'tour_edit_download_title',
    bodyKey: 'tour_edit_download_body',
    placement: 'bottom',
  },
]

// Preview tab — live preview + page settings (paper size, font, spacing,
// border, background, page numbering).
export const PREVIEW_TOUR_STEPS = [
  {
    target: '[data-tour="builder-preview"]',
    titleKey: 'tour_preview_live_title',
    bodyKey: 'tour_preview_live_body',
    placement: 'top',
  },
  {
    target: '[data-tour="preview-more-options"]',
    titleKey: 'tour_preview_options_title',
    bodyKey: 'tour_preview_options_body',
    placement: 'bottom',
  },
]

// My Paper tab — the saved-papers list: search, filter, and the per-paper
// actions (preview, edit, download, more options).
export const MYPAPERS_TOUR_STEPS = [
  {
    target: '[data-tour="mypapers-search"]',
    titleKey: 'tour_myPapers_search_title',
    bodyKey: 'tour_myPapers_search_body',
    placement: 'bottom',
  },
  {
    target: '[data-tour="mypapers-filters"]',
    titleKey: 'tour_myPapers_filters_title',
    bodyKey: 'tour_myPapers_filters_body',
    placement: 'bottom',
  },
  {
    target: '[data-tour="mypapers-preview"]',
    titleKey: 'tour_myPapers_preview_title',
    bodyKey: 'tour_myPapers_preview_body',
    placement: 'top',
  },
  {
    target: '[data-tour="mypapers-edit"]',
    titleKey: 'tour_myPapers_edit_title',
    bodyKey: 'tour_myPapers_edit_body',
    placement: 'top',
  },
  {
    target: '[data-tour="mypapers-download"]',
    titleKey: 'tour_myPapers_download_title',
    bodyKey: 'tour_myPapers_download_body',
    placement: 'top',
  },
  {
    target: '[data-tour="mypapers-more"]',
    titleKey: 'tour_myPapers_more_title',
    bodyKey: 'tour_myPapers_more_body',
    placement: 'top',
  },
]

export const TOURS = {
  dashboard: DASHBOARD_TOUR_STEPS,
  edit: EDIT_TOUR_STEPS,
  preview: PREVIEW_TOUR_STEPS,
  myPaper: MYPAPERS_TOUR_STEPS,
}
