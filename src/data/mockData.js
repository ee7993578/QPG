import { uid } from '../lib/utils'

export const EXAM_TYPES = [
  'Unit Test',
  'Monthly Test',
  'Half Yearly',
  'Annual',
  'Pre-Board',
  'Terminal Examination',
  'Custom',
]

export const DURATIONS = [
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
  { label: '90 minutes', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '2 hours 30 minutes', value: 150 },
  { label: '3 hours', value: 180 },
  { label: 'Custom', value: 'custom' },
]

export const QUESTION_TYPES = [
  'MCQ',
  'Multiple Choice',
  'Assertion-Reason',
  'Short Answer',
  'Very Short Answer',
  'Detailed Answer',
  'Long Answer',
  'Word Meaning',
  'Fill in the Blanks',
  'True/False',
  'One Word Answer',
  'Match the Following',
  'Table/Grid',
  'Case Study',
  'Custom',
]

// Question types that use a discrete options list (SRS 18/19).
export const OPTION_BASED_TYPES = ['MCQ', 'Multiple Choice', 'Assertion-Reason']

export const GROUP_MODES = [
  { value: 'normal', label: 'Normal / All Questions' },
  { value: 'attempt_any', label: 'Attempt Any' },
  { value: 'or', label: 'Optional / OR' },
]

// SRS 6 — answer space is a layout property, independent of marks.
export const ANSWER_SPACE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '1', label: '1 Line' },
  { value: '2', label: '2 Lines' },
  { value: '4', label: '4 Lines' },
  { value: '6', label: '6 Lines' },
  { value: 'half', label: 'Half Page' },
  { value: 'full', label: 'Full Page' },
  { value: 'custom', label: 'Custom Height' },
  { value: 'drawing', label: 'Drawing Space' },
]

// SRS 21/23 — section numbering style.
export const NUMBERING_STYLES = [
  { value: 'numeric', label: '1. 2. 3.' },
  { value: 'q-numeric', label: 'Q1. Q2. Q3.' },
  { value: 'numeric-paren', label: '1) 2) 3)' },
  { value: 'alpha-paren', label: '(a) (b) (c)' },
  { value: 'roman-paren', label: '(i) (ii) (iii)' },
]

// SRS 26 — marks positioning.
export const MARKS_POSITIONS = [
  { value: 'bracket', label: '[2]' },
  { value: 'paren', label: '(2)' },
  { value: 'plain', label: '2' },
]

export const OPTIONS_LAYOUTS = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'grid', label: 'Two Columns' },
]

export const HEADER_LAYOUTS = [
  { value: 'center', label: 'Logo Centered / Above' },
  { value: 'split', label: 'Logo Left, Text Right' },
  { value: 'split-both', label: 'Logo Both Sides' },
]

export const PAPER_TEMPLATES = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'school', label: 'School Standard' },
]

export const PAPER_SIZES = [
  { value: 'A4', label: 'A4 (210 × 297 mm)', widthPx: 720, aspect: 210 / 297 },
  { value: 'A5', label: 'A5 (148 × 210 mm)', widthPx: 520, aspect: 148 / 210 },
  { value: 'Letter', label: 'Letter (8.5 × 11 in)', widthPx: 720, aspect: 8.5 / 11 },
  { value: 'Legal', label: 'Legal (8.5 × 14 in)', widthPx: 720, aspect: 8.5 / 14 },
]

export const PAPER_SETS = ['A', 'B', 'C']

// Feature 9 — border can be drawn around the whole paper, only the header, both, or none.
export const BORDER_OPTIONS = [
  { value: 'none', labelKey: 'border_none' },
  { value: 'paper', labelKey: 'border_paper' },
  { value: 'header', labelKey: 'border_header' },
  { value: 'both', labelKey: 'border_both' },
]

// Page Settings — Page/Paper category. Kept separate from BORDER_OPTIONS
// etc. so each Page Settings section can loop over just its own list.
export const PAGE_ORIENTATIONS = [
  { value: 'portrait', labelKey: 'pageSettings_orientation_portrait' },
  { value: 'landscape', labelKey: 'pageSettings_orientation_landscape' },
]

export const COLUMN_LAYOUTS = [
  { value: 1, labelKey: 'pageSettings_columns_one' },
  { value: 2, labelKey: 'pageSettings_columns_two' },
]

export const MARGIN_PRESETS = [
  { value: 'normal', labelKey: 'pageSettings_margin_normal' },
  { value: 'narrow', labelKey: 'pageSettings_margin_narrow' },
  { value: 'wide', labelKey: 'pageSettings_margin_wide' },
  { value: 'custom', labelKey: 'pageSettings_margin_custom' },
]

// Page padding in px for each preset. 'normal' is intentionally NOT listed
// here — when marginPreset is 'normal' (the default), A4Preview keeps its
// original hardcoded Tailwind padding classes untouched instead of using
// this table, so a paper nobody has customized renders exactly as before.
export const MARGIN_PRESET_PX = {
  narrow: { top: 20, right: 20, bottom: 20, left: 20 },
  wide: { top: 56, right: 56, bottom: 56, left: 56 },
}

// Page Settings — Typography category. 'normal' for both is the no-op
// default (A4Preview applies zero inline overrides so the paper renders
// exactly as it always has).
export const FONT_SIZE_PRESETS = [
  { value: 'small', labelKey: 'pageSettings_fontSize_small' },
  { value: 'normal', labelKey: 'pageSettings_fontSize_normal' },
  { value: 'large', labelKey: 'pageSettings_fontSize_large' },
  { value: 'xlarge', labelKey: 'pageSettings_fontSize_xlarge' },
  { value: 'custom', labelKey: 'pageSettings_custom' },
]
export const FONT_SIZE_SCALE = { small: 0.92, normal: 1, large: 1.08, xlarge: 1.16 }
// The question text baseline is a hardcoded 13.5px (text-[13.5px] in
// A4Preview). Custom font size is entered as that same "px" unit so
// picking e.g. 12 or 16 behaves the way a teacher expects, and gets turned
// into the same scale-transform the presets already use.
export const CUSTOM_FONT_SIZE_BASE_PX = 13.5
export const CUSTOM_FONT_SIZE_MIN = 8
export const CUSTOM_FONT_SIZE_MAX = 28
// Default font size (px) used when a paper has no explicit fontSize setting yet.
export const DEFAULT_CUSTOM_FONT_SIZE_PX = 8

export const LINE_HEIGHT_PRESETS = [
  { value: 'tight', labelKey: 'pageSettings_lineHeight_tight' },
  { value: 'normal', labelKey: 'pageSettings_lineHeight_normal' },
  { value: 'relaxed', labelKey: 'pageSettings_lineHeight_relaxed' },
  { value: 'custom', labelKey: 'pageSettings_custom' },
]
export const LINE_HEIGHT_VALUE = { tight: 1.25, relaxed: 1.75 } // 'normal' omitted on purpose — no override
export const CUSTOM_LINE_HEIGHT_MIN = 1
export const CUSTOM_LINE_HEIGHT_MAX = 3

// Page Settings — Spacing category. One preset controls header/section/
// question gaps together, matching the original px values so 'normal'
// renders identically to before.
export const SPACING_PRESETS = [
  { value: 'compact', labelKey: 'pageSettings_spacing_compact' },
  { value: 'normal', labelKey: 'pageSettings_spacing_normal' },
  { value: 'relaxed', labelKey: 'pageSettings_spacing_relaxed' },
  { value: 'custom', labelKey: 'pageSettings_custom' },
]
export const SPACING_PRESET_PX = {
  compact: { header: 16, section: 16, question: 8 },
  relaxed: { header: 32, section: 40, question: 24 },
}
export const SPACING_CUSTOM_DEFAULT = { header: 24, section: 24, question: 12 }

// Per-line formatting (Feature: click a line → Aa panel). Applied directly
// as inline style on that one line, on top of whatever the Page Settings
// (above) already set — so a teacher can nudge just one heading or question
// without touching the rest of the paper.
export const LINE_FONT_SIZE_MIN = 8
export const LINE_FONT_SIZE_MAX = 36
export const LINE_HEIGHT_MIN = 1
export const LINE_HEIGHT_MAX = 3
export const LINE_GAP_MIN = 0
export const LINE_GAP_MAX = 80

// Page Settings — Border & Frame category (extends the existing BORDER_OPTIONS).
export const BORDER_STYLE_OPTIONS = [
  { value: 'solid', labelKey: 'pageSettings_borderStyle_solid' },
  { value: 'dashed', labelKey: 'pageSettings_borderStyle_dashed' },
  { value: 'double', labelKey: 'pageSettings_borderStyle_double' },
]
export const BORDER_WIDTH_OPTIONS = [
  { value: 'thin', labelKey: 'pageSettings_borderWidth_thin' },
  { value: 'medium', labelKey: 'pageSettings_borderWidth_medium' },
  { value: 'thick', labelKey: 'pageSettings_borderWidth_thick' },
]
export const BORDER_WIDTH_PX = { thin: 1, medium: 2, thick: 4 }
export const CORNER_RADIUS_OPTIONS = [
  { value: 'sharp', labelKey: 'pageSettings_cornerRadius_sharp' },
  { value: 'rounded', labelKey: 'pageSettings_cornerRadius_rounded' },
]

// Page Settings — Background & Watermark category.
export const PAGE_BG_OPTIONS = [
  { value: 'default', labelKey: 'pageSettings_pageBg_default' },
  { value: 'white', labelKey: 'pageSettings_pageBg_white' },
  { value: 'cream', labelKey: 'pageSettings_pageBg_cream' },
]
export const PAGE_BG_COLOR = { white: '#ffffff', cream: '#fdf8ec' }
export const WATERMARK_OPACITY_OPTIONS = [
  { value: 'light', labelKey: 'pageSettings_watermarkOpacity_light' },
  { value: 'medium', labelKey: 'pageSettings_watermarkOpacity_medium' },
  { value: 'dark', labelKey: 'pageSettings_watermarkOpacity_dark' },
]
export const WATERMARK_OPACITY_VALUE = { light: 0.05, medium: 0.1, dark: 0.18 }
export const WATERMARK_ANGLE_OPTIONS = [
  { value: -30, labelKey: 'pageSettings_watermarkAngle_diagonal' },
  { value: 30, labelKey: 'pageSettings_watermarkAngle_diagonalRight' },
  { value: 0, labelKey: 'pageSettings_watermarkAngle_horizontal' },
  { value: -45, labelKey: 'pageSettings_watermarkAngle_steep' },
]

// Page Settings — Numbering & Footer category.
export const PAGE_NUMBER_FORMAT_OPTIONS = [
  { value: 'default', labelKey: 'pageSettings_pageNumberFormat_default' },
  { value: 'number', labelKey: 'pageSettings_pageNumberFormat_number' },
  { value: 'ofTotal', labelKey: 'pageSettings_pageNumberFormat_ofTotal' },
]
export const PAGE_NUMBER_POSITION_OPTIONS = [
  { value: 'inline', labelKey: 'pageSettings_pageNumberPosition_inline' },
  { value: 'bottom-right', labelKey: 'pageSettings_pageNumberPosition_bottomRight' },
  { value: 'top-right', labelKey: 'pageSettings_pageNumberPosition_topRight' },
]
export const FOOTER_ALIGN_OPTIONS = [
  { value: 'left', labelKey: 'pageSettings_footerAlign_left' },
  { value: 'center', labelKey: 'pageSettings_footerAlign_center' },
  { value: 'right', labelKey: 'pageSettings_footerAlign_right' },
]

// Feature 2 / 7 — simple left/center/right horizontal alignment, cycled by one click.
export const ALIGN_CYCLE = ['left', 'center', 'right']
export function nextAlign(current) {
  const idx = ALIGN_CYCLE.indexOf(current || 'left')
  return ALIGN_CYCLE[(idx + 1) % ALIGN_CYCLE.length]
}

export const FONT_FAMILIES = [
  { value: 'sans', label: 'Default (Sans)' },
  { value: 'serif', label: 'Serif (Times-like)' },
  { value: 'display', label: 'Display / Headings Font' },
]

// SRS 51 — special symbol palette, grouped by subject.
export const SYMBOL_GROUPS = [
  { label: 'Math', symbols: ['√', '∛', '∜', '±', '×', '÷', '∑', '∏', '∫', '∮', '∞', '≤', '≥', '≠', '≈', '≡', '∝', 'π', '°', '∆', '∂', '∇', '%', '‰'] },
  { label: 'Sets & Logic', symbols: ['∈', '∉', '⊂', '⊆', '⊄', '∪', '∩', '∅', '∀', '∃', '¬', '∧', '∨', '⇒', '⇔', '∴', '∵'] },
  { label: 'Greek (lower)', symbols: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'φ', 'χ', 'ψ', 'ω'] },
  { label: 'Greek (upper)', symbols: ['Γ', 'Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω'] },
  { label: 'Physics', symbols: ['Ω', 'θ', 'λ', 'μ', 'Δ', '→', '←', '↔', '⇌', 'α', 'β', 'γ', '∝', '⊥', '∥', 'ħ', 'ε₀', 'μ₀', '°C', '°F', 'Å'] },
  { label: 'Chemistry — reactions', symbols: ['→', '⇌', '⇋', '⇄', '↔', 'Δ', '↑', '↓', '·', '(s)', '(l)', '(g)', '(aq)', '(cat.)'] },
  { label: 'Chemistry — formulas', symbols: ['H₂O', 'CO₂', 'O₂', 'H₂', 'N₂', 'NH₃', 'CH₄', 'H₂SO₄', 'NaOH', 'CaCO₃', '⁺', '⁻', '²⁺', '²⁻'] },
  { label: 'Ready-made super/sub', symbols: ['x²', 'x³', 'xⁿ', 'x₁', 'x₂', 'aⁿ', 'H₂O'] },
]

export const CLASS_OPTIONS = [
  'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
]

export const SECTION_OPTIONS = ['A', 'B', 'C', 'D']

export const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Science',
  'Physics', 'Chemistry', 'Biology', 'Computer Science',
]

// Feature — Class / Section / Subject pickers also offer "Custom" (type your
// own) and "None" (omit the field from the paper entirely), same pattern as
// the existing Exam Type "Custom" option.
export const CLASS_PICKER_OPTIONS = [...CLASS_OPTIONS, 'Custom', 'None']
export const SECTION_PICKER_OPTIONS = [...SECTION_OPTIONS, 'Custom', 'None']
export const SUBJECT_PICKER_OPTIONS = [...SUBJECTS, 'Custom', 'None']

// Quick-start templates — Easy-to-use flow: a non-technical teacher can pick
// a ready-made pattern instead of starting from a totally blank paper.
// `sections[].questionGroups[]` overrides feed straight into the store's
// addSection/addQuestionGroup, same shape their `initial` param expects.
export const QUICK_START_TEMPLATES = [
  {
    id: 'blank',
    title: 'Blank Paper',
    description: 'Start from scratch — add your own sections and questions.',
    icon: 'FileText',
  },
  {
    id: 'class-test',
    title: 'Quick Class Test',
    description: '1 section · 10 MCQs (1 mark each) — a fast objective-only test.',
    icon: 'Zap',
    sections: [
      { questionGroups: [{ questionType: 'MCQ', mode: 'normal', questionCount: 10, marksPerQuestion: 1 }] },
    ],
  },
  {
    id: 'mixed',
    title: 'Objective + Subjective Mix',
    description: 'Section A: 10 MCQs (1 mark) · Section B: 5 Short Answer (3 marks) · Section C: 2 Long Answer (5 marks)',
    icon: 'Layers',
    sections: [
      { questionGroups: [{ questionType: 'MCQ', mode: 'normal', questionCount: 10, marksPerQuestion: 1 }] },
      { questionGroups: [{ questionType: 'Short Answer', mode: 'normal', questionCount: 5, marksPerQuestion: 3 }] },
      { questionGroups: [{ questionType: 'Long Answer', mode: 'normal', questionCount: 2, marksPerQuestion: 5 }] },
    ],
  },
  {
    id: 'full-term',
    title: 'Full Term Exam Pattern',
    description: 'Section A: 20 MCQs (1) · Section B: 6 Short Answer (2) · Section C: 6 Short Answer (3) · Section D: 4 Long Answer (5)',
    icon: 'GraduationCap',
    sections: [
      { questionGroups: [{ questionType: 'MCQ', mode: 'normal', questionCount: 20, marksPerQuestion: 1 }] },
      { questionGroups: [{ questionType: 'Short Answer', mode: 'normal', questionCount: 6, marksPerQuestion: 2 }] },
      { questionGroups: [{ questionType: 'Short Answer', mode: 'normal', questionCount: 6, marksPerQuestion: 3 }] },
      { questionGroups: [{ questionType: 'Long Answer', mode: 'normal', questionCount: 4, marksPerQuestion: 5 }] },
    ],
  },
]

