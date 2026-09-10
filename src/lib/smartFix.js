import { getVisiblePrintRoot } from './exportPaper'
import {
  PAPER_SIZES,
  MARGIN_PRESET_PX,
  SPACING_PRESET_PX,
  SPACING_CUSTOM_DEFAULT,
  LINE_HEIGHT_VALUE,
  FONT_SIZE_SCALE,
  CUSTOM_FONT_SIZE_BASE_PX,
  DEFAULT_CUSTOM_FONT_SIZE_PX,
  CUSTOM_FONT_SIZE_MIN,
  CUSTOM_FONT_SIZE_MAX,
} from '../data/mockData'

/**
 * Smart Fix — "fit my paper into N pages", done by nudging the same Page
 * Settings a teacher could already change by hand (spacing, margins, line
 * height, font size), never by touching question content.
 *
 * Design notes (see product brief for the full priority list):
 *  - Measures the REAL on-screen preview (#print-root), the exact node the
 *    PDF export screenshots — so what Smart Fix reports always matches what
 *    actually gets downloaded. No separate/fake page counter.
 *  - Every change goes through `paper.settings`, the same object A4Preview,
 *    the DOCX export, and the PDF export already read. No parallel layout
 *    engine, no parallel question model.
 *  - Tightens things in gentle notches, cheapest/least-visible first
 *    (whitespace and spacing) and font size dead last, never below the
 *    app's own existing minimum comfortable size (CUSTOM_FONT_SIZE_MIN).
 *  - Every rung is reversible: the exact "before" values for every setting
 *    Smart Fix might touch are snapshotted up front and handed back so the
 *    caller can restore them verbatim with one click ("Undo Fix").
 */

// The only paper.settings keys Smart Fix is allowed to touch. Anything else
// on the paper (questions, marks, images, tables, ordering…) is never read
// or written by this file.
const SETTINGS_KEYS = [
  'spacingPreset', 'spacingCustom',
  'marginPreset', 'marginCustom',
  'lineHeightPreset', 'lineHeightCustom',
  'fontSizePreset', 'fontSizeCustomPx',
]

const MARGIN_FLOOR_PX = 16 // still a real, printable margin — never goes tighter than this
const LINE_HEIGHT_FLOOR = 1.15
const FONT_SIZE_STEP_PX = 0.5

export const SMART_FIX_MIN_READABLE_PX = CUSTOM_FONT_SIZE_MIN

// Hard floors used ONLY when a teacher explicitly confirms "Force Fit" after
// being warned the comfortable pass couldn't reach their target page count.
// Still real, still printable — Smart Fix never goes to literal zero — but
// noticeably tighter than the normal, always-comfortable floors above.
const MARGIN_HARD_FLOOR_PX = 4
const LINE_HEIGHT_HARD_FLOOR = 1.0
const FONT_SIZE_HARD_FLOOR_PX = 6
const SPACING_HARD_FLOOR = { header: 2, section: 2, question: 0 }

export const SMART_FIX_HARD_MIN_PX = FONT_SIZE_HARD_FLOOR_PX

// ---------------------------------------------------------------------
// "Spread out" direction — the reverse job: a paper sitting at, say, 1.5
// pages doesn't look great with half a blank page at the end. Rather than
// shrinking, Smart Fix can gently open up the SAME knobs (still spacing →
// margins → line height → font size, still nothing about content) so the
// existing questions breathe across the full target page count instead of
// leaving obvious dead space. Capped well short of anything that would
// look stretched or hurt readability the other way.
// ---------------------------------------------------------------------
const SPACING_SPREAD_CAP = { header: 48, section: 56, question: 32 }
const MARGIN_SPREAD_CAP_PX = 64
const LINE_HEIGHT_SPREAD_CAP = 2.0
const FONT_SIZE_SPREAD_CAP_PX = Math.min(CUSTOM_FONT_SIZE_MAX, 20)

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function settle() {
  // Give React one full render + the browser one layout pass before we
  // measure again, same as waiting for a real re-render after a settings
  // change made by hand in Page Settings.
  await new Promise((r) => requestAnimationFrame(r))
  await new Promise((r) => requestAnimationFrame(r))
  await wait(40)
}

// Most settings changes land synchronously within the settle() window
// above (see the A4Preview height-sync effect for why). But belt-and-
// braces: a couple of layout-affecting knobs (e.g. margins, which resize
// #print-root itself rather than the typography block) can still finish
// their reflow via a ResizeObserver tick that isn't guaranteed to land in
// the same frame. Rather than special-case which knob needs the longer
// wait, take two measurements a beat apart and only trust the result once
// they agree — this makes Smart Fix's per-rung measurement robust to any
// one-tick-late reflow, wherever it comes from, without slowing down the
// common case (matching measurements resolve immediately).
async function measureStable(paper) {
  let previous = measurePageCount(paper)
  for (let i = 0; i < 4; i++) {
    await wait(50)
    const next = measurePageCount(paper)
    if (next == null) return previous
    if (previous != null && Math.abs(next - previous) < 0.01) return next
    previous = next
  }
  return previous
}

// Exported so UI (the live mini-preview thumbnail) can size its box to
// match the paper's own orientation without duplicating this lookup.
export function pageAspectFor(paper) {
  const settings = paper.settings || {}
  const sizeInfo = PAPER_SIZES.find((p) => p.value === settings.paperSize) || PAPER_SIZES[0]
  const orientation = settings.orientation === 'landscape' ? 'landscape' : 'portrait'
  return orientation === 'landscape' ? 1 / sizeInfo.aspect : sizeInfo.aspect
}

/**
 * How many physical pages the paper currently takes, measured straight off
 * the live preview DOM — the same width/height math the PDF export uses to
 * slice pages (see exportPaper.js), so this number and the downloaded PDF
 * never disagree. Returns null if the preview isn't on screen right now.
 */
export function measurePageCount(paper) {
  const node = getVisiblePrintRoot()
  if (!node) return null
  // offsetWidth (not getBoundingClientRect().width) on purpose: it's the
  // node's own layout width, in the same untransformed coordinate space as
  // scrollHeight below. getBoundingClientRect() reports the visual,
  // post-transform box instead — mixing that with scrollHeight (always
  // pre-transform) would silently corrupt this ratio for any paper using a
  // transform anywhere in its own box (e.g. a rotated page, or a future
  // responsive zoom-to-fit wrapper), well before font-size is even involved.
  const width = node.offsetWidth
  if (!width) return null
  const onePageHeightPx = width / pageAspectFor(paper)
  if (!onePageHeightPx) return null
  return node.scrollHeight / onePageHeightPx
}

/** Sensible target-page-count choices to offer a teacher, given where the
 * paper stands today. Mostly "tighten down to N pages" options (down to 1),
 * but when the current page count isn't a clean whole number (e.g. 1.4
 * pages — a paper that trails off with an almost-empty last page), the
 * next whole number up is offered too, labelled as a "spread out" choice
 * by the caller — filling that page neatly instead of leaving it mostly
 * blank. Never suggests going up from an already-exact whole-page paper,
 * since there's nothing to spread into. */
export function suggestedTargetPages(currentPages) {
  const ceilCurrent = Math.max(1, Math.ceil(currentPages))
  const isTrailing = ceilCurrent - currentPages > 0.05
  const options = []
  if (isTrailing) options.push(ceilCurrent) // "spread to fill" choice, same page count, no more trimming needed
  for (let n = ceilCurrent - 1; n >= 1; n--) options.push(n)
  if (options.length === 0) options.push(ceilCurrent)
  return options
}

function snapshotBeforeState(paper) {
  const settings = paper.settings || {}
  const settingsSnapshot = {}
  for (const key of SETTINGS_KEYS) settingsSnapshot[key] = settings[key]

  const pageBreaks = []
  for (const section of paper.sections || []) {
    for (const group of section.questionGroups || []) {
      if (group.pageBreakBefore) pageBreaks.push({ sectionId: section.id, groupId: group.id })
    }
  }
  // widowFixes starts empty and is filled in only if this run ends up
  // turning ON keepTogether for a question that was split across a page
  // boundary — see protectWidows() below. Undo only ever needs to turn
  // those specific ones back off.
  return { settings: settingsSnapshot, pageBreaks, widowFixes: [] }
}

// ---------------------------------------------------------------------
// Human-readable "what changed" summary — teacher-facing transparency so
// Smart Fix never feels like a black box. Reads the same effective numbers
// buildRungs/buildSpreadRungs compute from, just for display, not for
// further calculation.
// ---------------------------------------------------------------------
function effectiveValues(settings) {
  const s = settings || {}
  const spacingPreset = s.spacingPreset || 'normal'
  const spacing = spacingPreset === 'custom'
    ? { ...SPACING_CUSTOM_DEFAULT, ...(s.spacingCustom || {}) }
    : (SPACING_PRESET_PX[spacingPreset] || SPACING_CUSTOM_DEFAULT)
  const marginPreset = s.marginPreset || 'normal'
  const margin = marginPreset === 'custom'
    ? { top: 32, right: 32, bottom: 32, left: 32, ...(s.marginCustom || {}) }
    : (MARGIN_PRESET_PX[marginPreset] || { top: 32, right: 32, bottom: 32, left: 32 })
  const lineHeightPreset = s.lineHeightPreset || 'normal'
  const lineHeight = lineHeightPreset === 'custom'
    ? (s.lineHeightCustom || 1.5)
    : (LINE_HEIGHT_VALUE[lineHeightPreset] ?? 1.4)
  const fontSizePreset = s.fontSizePreset || 'custom'
  const fontPx = fontSizePreset === 'custom'
    ? (s.fontSizeCustomPx || DEFAULT_CUSTOM_FONT_SIZE_PX)
    : (FONT_SIZE_SCALE[fontSizePreset] || 1) * CUSTOM_FONT_SIZE_BASE_PX
  return {
    spacingQuestion: spacing.question ?? 12,
    marginPx: Math.min(margin.top, margin.right, margin.bottom, margin.left),
    lineHeight,
    fontPx,
  }
}

/** Diff two `paper.settings`-shaped objects into a short list of
 * teacher-facing "before → after" lines, skipping anything that didn't
 * actually change. Used to show e.g. "Spacing 24px → 14px, Font 13.5px →
 * 12px" after a run, so the teacher knows exactly what Smart Fix touched. */
export function buildChangeSummary(beforeSettings, afterSettings) {
  const b = effectiveValues(beforeSettings)
  const a = effectiveValues(afterSettings)
  const items = []
  if (Math.round(b.spacingQuestion) !== Math.round(a.spacingQuestion)) {
    items.push({ key: 'spacing', labelKey: 'smartFix_changed_spacing', before: `${Math.round(b.spacingQuestion)}px`, after: `${Math.round(a.spacingQuestion)}px` })
  }
  if (Math.round(b.marginPx) !== Math.round(a.marginPx)) {
    items.push({ key: 'margins', labelKey: 'smartFix_changed_margins', before: `${Math.round(b.marginPx)}px`, after: `${Math.round(a.marginPx)}px` })
  }
  if (Math.abs(b.lineHeight - a.lineHeight) > 0.005) {
    items.push({ key: 'lineHeight', labelKey: 'smartFix_changed_lineHeight', before: b.lineHeight.toFixed(2), after: a.lineHeight.toFixed(2) })
  }
  if (Math.abs(b.fontPx - a.fontPx) > 0.05) {
    items.push({ key: 'fontSize', labelKey: 'smartFix_changed_fontSize', before: `${b.fontPx.toFixed(1)}px`, after: `${a.fontPx.toFixed(1)}px` })
  }
  return items
}

// ---------------------------------------------------------------------
// Per-paper memory — "the last target this teacher chose for this paper",
// so a teacher who makes a 2-page test every week doesn't have to reselect
// it each time. Purely a UI convenience (prefills the dropdown); never
// changes what Smart Fix actually does. Kept in localStorage, not paper
// settings, since it isn't part of the paper itself and shouldn't sync,
// version-bump, or show up in "what changed".
// ---------------------------------------------------------------------
const TARGET_MEMORY_PREFIX = 'papercraft:smartFix:lastTarget:'

export function getRememberedTarget(paperId) {
  try {
    const raw = window.localStorage.getItem(TARGET_MEMORY_PREFIX + paperId)
    const n = raw != null ? Number(raw) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

export function rememberTarget(paperId, targetPages) {
  try {
    window.localStorage.setItem(TARGET_MEMORY_PREFIX + paperId, String(targetPages))
  } catch {
    // Private-browsing / storage-disabled — memory is a nicety, not required.
  }
}

// ---------------------------------------------------------------------
// Widow/orphan protection — after Smart Fix settles on a page count, a
// question can still end up straddling the page boundary (half its lines
// on one page, half on the next). This scans the SAME live #print-root
// node (visual, post-scale coordinates throughout, so it stays correct
// whatever the current font-size transform is) for any question element
// crossing a page-break line, and flags it so the caller can turn on that
// specific question's existing "keep together" flag (the same one a
// teacher can already set by hand) — never touching its text, marks, or
// position.
// ---------------------------------------------------------------------
export function findSplitQuestions(paper) {
  const node = getVisiblePrintRoot()
  if (!node) return []
  const width = node.offsetWidth
  if (!width) return []
  const onePageHeightPx = width / pageAspectFor(paper)
  const totalHeight = node.scrollHeight
  if (!onePageHeightPx || !totalHeight) return []
  const pageCount = Math.ceil(totalHeight / onePageHeightPx)
  if (pageCount <= 1) return [] // nothing to straddle on a single page

  const rootRect = node.getBoundingClientRect()
  const boundaries = []
  for (let i = 1; i < pageCount; i++) boundaries.push(i * onePageHeightPx)

  const EPS = 2 // px slack so a question that merely touches the line isn't flagged
  const found = []
  node.querySelectorAll('[data-question-el]').forEach((el) => {
    if (el.dataset.keepTogether === 'true') return // already protected
    const r = el.getBoundingClientRect()
    const top = r.top - rootRect.top
    const bottom = r.bottom - rootRect.top
    const crosses = boundaries.some((b) => top < b - EPS && bottom > b + EPS)
    if (crosses) {
      found.push({
        sectionId: el.getAttribute('data-section-id'),
        groupId: el.getAttribute('data-group-id'),
        questionId: el.getAttribute('data-question-el'),
      })
    }
  })
  return found
}

/** Runs findSplitQuestions and, for anything found, calls `markKeepTogether`
 * (should set that one question's `keepTogether: true`, e.g. via the app's
 * updateQuestion). Returns the list actually touched, so the caller can
 * remember them for Undo. Safe to call with no matches — does nothing. */
async function protectWidows(paper, markKeepTogether) {
  if (!markKeepTogether) return []
  const split = findSplitQuestions(paper)
  if (split.length === 0) return []
  markKeepTogether(split)
  // Re-settle: turning on keep-together can itself push a question (and
  // everything after it) slightly further down, so give layout one more
  // beat before anything downstream trusts the page count again.
  await settle()
  return split
}

// ---------------------------------------------------------------------
// Priority-ordered rungs. Each one tightens exactly ONE knob by one notch
// tighter than its current value. Built fresh from whatever the paper's
// settings look like right now, so Smart Fix always starts from wherever
// the teacher already left things (never resets something they'd already
// customized back to a default).
// ---------------------------------------------------------------------
function buildRungs(settings) {
  const rungs = []

  // 1–2 (brief items 2–5): tighten the gaps between questions/sections/
  // header — this is almost always the biggest, least-visible win before
  // anything else is touched.
  const spacingPreset = settings.spacingPreset || 'normal'
  const spacingPx = spacingPreset === 'custom'
    ? { ...SPACING_CUSTOM_DEFAULT, ...(settings.spacingCustom || {}) }
    : (SPACING_PRESET_PX[spacingPreset] || SPACING_CUSTOM_DEFAULT)

  if (spacingPreset !== 'compact' && spacingPreset !== 'custom') {
    rungs.push({ patch: { spacingPreset: 'compact' } })
  }
  rungs.push({
    patch: {
      spacingPreset: 'custom',
      spacingCustom: {
        header: Math.max(10, Math.round((spacingPx.header ?? 24) * 0.6)),
        section: Math.max(10, Math.round((spacingPx.section ?? 24) * 0.55)),
        question: Math.max(4, Math.round((spacingPx.question ?? 12) * 0.5)),
      },
    },
  })

  // 3 (brief item 10): margins, in two gentle notches, never below a real
  // printable floor.
  const marginPreset = settings.marginPreset || 'normal'
  const marginPx = marginPreset === 'custom'
    ? { top: 32, right: 32, bottom: 32, left: 32, ...(settings.marginCustom || {}) }
    : (MARGIN_PRESET_PX[marginPreset] || { top: 32, right: 32, bottom: 32, left: 32 })

  if (marginPreset !== 'narrow' && marginPreset !== 'custom') {
    rungs.push({ patch: { marginPreset: 'narrow' } })
  }
  const smallestMargin = Math.min(marginPx.top, marginPx.right, marginPx.bottom, marginPx.left)
  if (smallestMargin > MARGIN_FLOOR_PX) {
    rungs.push({
      patch: {
        marginPreset: 'custom',
        marginCustom: {
          top: Math.max(MARGIN_FLOOR_PX, Math.round(marginPx.top * 0.75)),
          right: Math.max(MARGIN_FLOOR_PX, Math.round(marginPx.right * 0.75)),
          bottom: Math.max(MARGIN_FLOOR_PX, Math.round(marginPx.bottom * 0.75)),
          left: Math.max(MARGIN_FLOOR_PX, Math.round(marginPx.left * 0.75)),
        },
      },
    })
  }

  // 4 (brief item 5): a touch tighter line spacing, still well within a
  // comfortable reading range.
  const lineHeightPreset = settings.lineHeightPreset || 'normal'
  const currentLineHeight = lineHeightPreset === 'custom'
    ? (settings.lineHeightCustom || 1.5)
    : (LINE_HEIGHT_VALUE[lineHeightPreset] ?? 1.4)
  if (currentLineHeight > LINE_HEIGHT_FLOOR) {
    rungs.push({
      patch: {
        lineHeightPreset: 'custom',
        lineHeightCustom: Math.max(LINE_HEIGHT_FLOOR, +(currentLineHeight - 0.15).toFixed(2)),
      },
    })
  }

  // 5 (brief item 11): font size, dead last, gradual 0.5px steps, floor at
  // the app's own existing minimum comfortable size.
  const fontSizePreset = settings.fontSizePreset || 'custom'
  const currentFontPx = fontSizePreset === 'custom'
    ? (settings.fontSizeCustomPx || DEFAULT_CUSTOM_FONT_SIZE_PX)
    : (FONT_SIZE_SCALE[fontSizePreset] || 1) * CUSTOM_FONT_SIZE_BASE_PX
  let px = currentFontPx
  while (px - FONT_SIZE_STEP_PX >= CUSTOM_FONT_SIZE_MIN) {
    px = +(px - FONT_SIZE_STEP_PX).toFixed(1)
    rungs.push({ patch: { fontSizePreset: 'custom', fontSizeCustomPx: px } })
  }

  return rungs
}

// ---------------------------------------------------------------------
// "Spread out" rungs — the mirror image of buildRungs above. Widens the
// same knobs, same priority order, in gentle notches capped well short of
// looking stretched, so a paper with an almost-empty trailing page fills
// the target page count neatly instead.
// ---------------------------------------------------------------------
function buildSpreadRungs(settings) {
  const rungs = []

  let spacing = settings.spacingPreset === 'custom'
    ? { ...SPACING_CUSTOM_DEFAULT, ...(settings.spacingCustom || {}) }
    : (SPACING_PRESET_PX[settings.spacingPreset || 'normal'] || SPACING_CUSTOM_DEFAULT)
  for (let i = 0; i < 3; i++) {
    const next = {
      header: Math.min(SPACING_SPREAD_CAP.header, Math.round((spacing.header ?? 24) * 1.25)),
      section: Math.min(SPACING_SPREAD_CAP.section, Math.round((spacing.section ?? 24) * 1.3)),
      question: Math.min(SPACING_SPREAD_CAP.question, Math.round((spacing.question ?? 12) * 1.4)),
    }
    if (next.header === spacing.header && next.section === spacing.section && next.question === spacing.question) break
    rungs.push({ patch: { spacingPreset: 'custom', spacingCustom: next } })
    spacing = next
  }

  let margin = settings.marginPreset === 'custom'
    ? { top: 32, right: 32, bottom: 32, left: 32, ...(settings.marginCustom || {}) }
    : (MARGIN_PRESET_PX[settings.marginPreset || 'normal'] || { top: 32, right: 32, bottom: 32, left: 32 })
  for (let i = 0; i < 2; i++) {
    const smallest = Math.min(margin.top, margin.right, margin.bottom, margin.left)
    if (smallest >= MARGIN_SPREAD_CAP_PX) break
    const next = {
      top: Math.min(MARGIN_SPREAD_CAP_PX, Math.round(margin.top * 1.3)),
      right: Math.min(MARGIN_SPREAD_CAP_PX, Math.round(margin.right * 1.3)),
      bottom: Math.min(MARGIN_SPREAD_CAP_PX, Math.round(margin.bottom * 1.3)),
      left: Math.min(MARGIN_SPREAD_CAP_PX, Math.round(margin.left * 1.3)),
    }
    rungs.push({ patch: { marginPreset: 'custom', marginCustom: next } })
    margin = next
  }

  let lineHeight = settings.lineHeightPreset === 'custom'
    ? (settings.lineHeightCustom || 1.5)
    : (LINE_HEIGHT_VALUE[settings.lineHeightPreset || 'normal'] ?? 1.4)
  while (lineHeight < LINE_HEIGHT_SPREAD_CAP - 0.01) {
    lineHeight = Math.min(LINE_HEIGHT_SPREAD_CAP, +(lineHeight + 0.1).toFixed(2))
    rungs.push({ patch: { lineHeightPreset: 'custom', lineHeightCustom: lineHeight } })
  }

  let fontPx = settings.fontSizePreset === 'custom'
    ? (settings.fontSizeCustomPx || DEFAULT_CUSTOM_FONT_SIZE_PX)
    : (FONT_SIZE_SCALE[settings.fontSizePreset] || 1) * CUSTOM_FONT_SIZE_BASE_PX
  while (fontPx + FONT_SIZE_STEP_PX <= FONT_SIZE_SPREAD_CAP_PX) {
    fontPx = +(fontPx + FONT_SIZE_STEP_PX).toFixed(1)
    rungs.push({ patch: { fontSizePreset: 'custom', fontSizeCustomPx: fontPx } })
  }

  return rungs
}

// ---------------------------------------------------------------------
// Force-fit rungs — only ever built and applied after the teacher has been
// warned the comfortable pass fell short AND has explicitly chosen to
// continue anyway. Pushes the SAME knobs (never touches content) straight
// to the hard floors above, in a few decisive steps rather than gentle
// notches, since the teacher already knows this trades away readability.
// ---------------------------------------------------------------------
function buildForceRungs(settings) {
  const rungs = []

  const spacingPreset = settings.spacingPreset || 'normal'
  const spacingPx = spacingPreset === 'custom'
    ? { ...SPACING_CUSTOM_DEFAULT, ...(settings.spacingCustom || {}) }
    : (SPACING_PRESET_PX[spacingPreset] || SPACING_CUSTOM_DEFAULT)
  if (
    (spacingPx.header ?? 0) > SPACING_HARD_FLOOR.header ||
    (spacingPx.section ?? 0) > SPACING_HARD_FLOOR.section ||
    (spacingPx.question ?? 0) > SPACING_HARD_FLOOR.question
  ) {
    rungs.push({ patch: { spacingPreset: 'custom', spacingCustom: { ...SPACING_HARD_FLOOR } } })
  }

  const marginPreset = settings.marginPreset || 'normal'
  const marginPx = marginPreset === 'custom'
    ? { top: 32, right: 32, bottom: 32, left: 32, ...(settings.marginCustom || {}) }
    : (MARGIN_PRESET_PX[marginPreset] || { top: 32, right: 32, bottom: 32, left: 32 })
  if (Math.min(marginPx.top, marginPx.right, marginPx.bottom, marginPx.left) > MARGIN_HARD_FLOOR_PX) {
    rungs.push({
      patch: {
        marginPreset: 'custom',
        marginCustom: {
          top: MARGIN_HARD_FLOOR_PX, right: MARGIN_HARD_FLOOR_PX,
          bottom: MARGIN_HARD_FLOOR_PX, left: MARGIN_HARD_FLOOR_PX,
        },
      },
    })
  }

  const lineHeightPreset = settings.lineHeightPreset || 'normal'
  const currentLineHeight = lineHeightPreset === 'custom'
    ? (settings.lineHeightCustom || 1.5)
    : (LINE_HEIGHT_VALUE[lineHeightPreset] ?? 1.4)
  if (currentLineHeight > LINE_HEIGHT_HARD_FLOOR) {
    rungs.push({ patch: { lineHeightPreset: 'custom', lineHeightCustom: LINE_HEIGHT_HARD_FLOOR } })
  }

  const fontSizePreset = settings.fontSizePreset || 'custom'
  const currentFontPx = fontSizePreset === 'custom'
    ? (settings.fontSizeCustomPx || DEFAULT_CUSTOM_FONT_SIZE_PX)
    : (FONT_SIZE_SCALE[fontSizePreset] || 1) * CUSTOM_FONT_SIZE_BASE_PX
  let px = currentFontPx
  while (px - FONT_SIZE_STEP_PX >= FONT_SIZE_HARD_FLOOR_PX) {
    px = +(px - FONT_SIZE_STEP_PX).toFixed(1)
    rungs.push({ patch: { fontSizePreset: 'custom', fontSizeCustomPx: px } })
  }

  return rungs
}

/**
 * Last-resort "make it fit, whatever it takes" pass — only ever called
 * after `runSmartFix` fell short AND the teacher was warned and explicitly
 * chose to continue instead of undoing. Picks up from wherever the normal
 * pass left the paper (never resets it) and pushes the same settings-only
 * knobs to their hard floors, as small as they can go while staying a real,
 * printable paper. Still never touches question content, marks, images,
 * tables, or ordering.
 */
export async function runForceFit({ paper, targetPages, applySettings, markKeepTogether, onProgress, onLiveUpdate }) {
  onProgress?.('optimizing')
  let pages = measurePageCount(paper)
  const rungs = buildForceRungs(paper.settings || {})
  let appliedAny = false
  let appliedSettings = { ...(paper.settings || {}) }

  for (const rung of rungs) {
    if (pages != null && pages <= targetPages + 0.02) break
    applySettings(rung.patch, { silent: appliedAny })
    appliedSettings = { ...appliedSettings, ...rung.patch }
    appliedAny = true
    await settle()
    const measured = await measureStable(paper)
    if (measured != null) pages = measured
    onLiveUpdate?.({ pages, appliedSettings })
  }

  const widowsProtected = await protectWidows(paper, markKeepTogether)

  return {
    finalPages: pages,
    reachedTarget: pages != null && pages <= targetPages + 0.02,
    appliedAny,
    appliedSettings,
    widowsProtected,
  }
}

/**
 * Runs Smart Fix end-to-end against the live preview.
 *
 * @param paper           the paper as it stands right now (for paper size /
 *                         orientation / current settings / sections)
 * @param targetPages      the page count the teacher asked for
 * @param applySettings    (patch, opts) => void — should call the app's own
 *                         updatePaperSettings(paperId, patch, opts).
 *                         `opts.silent` (when passed through) keeps every
 *                         rung after the first one out of the undo history,
 *                         so a multi-step Smart Fix run collapses into a
 *                         single undoable step, not a dozen.
 * @param clearPageBreaks  (pairs) => void — should turn off pageBreakBefore
 *                         for the given [{sectionId, groupId}] pairs, via
 *                         the app's own updateQuestionGroup
 * @param markKeepTogether (pairs) => void — should turn ON keepTogether for
 *                         the given [{sectionId, groupId, questionId}]
 *                         questions, via the app's own updateQuestion. Used
 *                         only for widow/orphan protection at the very end.
 * @param onProgress       (phase) => void — 'measuring' | 'optimizing'
 * @param onLiveUpdate      ({ pages, appliedSettings }) => void — fired after
 *                         every rung settles, for a live mini-preview /
 *                         running page-count readout while Smart Fix works.
 *
 * Never touches question content, marks, images, tables, or ordering.
 * Throws only if the live preview genuinely isn't on screen to measure —
 * the paper is left completely untouched in that case.
 */
export async function runSmartFix({ paper, targetPages, applySettings, clearPageBreaks, markKeepTogether, onProgress, onLiveUpdate }) {
  onProgress?.('measuring')
  const startPages = measurePageCount(paper)
  if (startPages == null) {
    throw new Error('PREVIEW_NOT_VISIBLE')
  }

  const before = snapshotBeforeState(paper)

  // Direction: most of the time a teacher is trying to tighten a paper
  // that runs long. But if the target is a whole page ABOVE where the
  // paper currently sits (see suggestedTargetPages's "spread" option),
  // the honest, useful thing to do is spread the existing content out to
  // fill that page neatly, not silently do nothing.
  if (startPages < targetPages - 0.05) {
    return runSmartSpreadInternal({ paper, targetPages, applySettings, markKeepTogether, onProgress, onLiveUpdate, startPages, before })
  }

  if (startPages <= targetPages + 0.02) {
    // Already fits — nothing to do, nothing to touch.
    return { startPages, finalPages: startPages, reachedTarget: true, appliedAny: false, before, appliedSettings: before.settings, direction: 'none' }
  }

  const rungs = buildRungs(paper.settings || {})
  let pages = startPages
  let appliedAny = false
  let appliedSettings = { ...before.settings }

  for (const rung of rungs) {
    if (pages <= targetPages + 0.02) break
    onProgress?.('optimizing')
    applySettings(rung.patch, { silent: appliedAny })
    appliedSettings = { ...appliedSettings, ...rung.patch }
    appliedAny = true
    await settle()
    const measured = await measureStable(paper)
    if (measured != null) pages = measured
    onLiveUpdate?.({ pages, appliedSettings })
  }

  // Last resort: a forced page break the teacher set earlier may now be
  // creating an unnecessary extra page once everything else is tighter.
  if (pages > targetPages + 0.02 && before.pageBreaks.length > 0 && clearPageBreaks) {
    onProgress?.('optimizing')
    clearPageBreaks(before.pageBreaks)
    appliedAny = true
    await settle()
    const measured = await measureStable(paper)
    if (measured != null) pages = measured
    onLiveUpdate?.({ pages, appliedSettings })
  }

  const reachedTarget = pages <= targetPages + 0.02
  // Only worth checking for straddled questions once the paper has
  // actually landed on the target — no point flagging widows on a layout
  // that's about to be tightened further, or force-fit right after.
  const widowsProtected = reachedTarget ? await protectWidows(paper, markKeepTogether) : []
  before.widowFixes = widowsProtected

  return {
    startPages,
    finalPages: pages,
    reachedTarget,
    appliedAny,
    before,
    appliedSettings,
    widowsProtected,
    direction: 'shrink',
  }
}

/** Internal: the "spread out" pass, reached automatically from runSmartFix
 * when the target is a page ABOVE where the paper already sits. Widens
 * spacing → margins → line height → font size (same priority order,
 * opposite direction) until the content fills the target page count,
 * capped so it never spills meaningfully past it. */
async function runSmartSpreadInternal({ paper, targetPages, applySettings, markKeepTogether, onProgress, onLiveUpdate, startPages, before }) {
  const rungs = buildSpreadRungs(paper.settings || {})
  let pages = startPages
  let appliedAny = false
  let appliedSettings = { ...before.settings }

  for (const rung of rungs) {
    if (pages >= targetPages - 0.03) break
    onProgress?.('optimizing')
    applySettings(rung.patch, { silent: appliedAny })
    appliedSettings = { ...appliedSettings, ...rung.patch }
    appliedAny = true
    await settle()
    const measured = await measureStable(paper)
    if (measured != null) pages = measured
    onLiveUpdate?.({ pages, appliedSettings })
    if (pages > targetPages + 0.4) break // comfortably filled — stop before it visibly overshoots
  }

  const reachedTarget = pages >= targetPages - 0.05 && pages <= targetPages + 0.4
  const widowsProtected = reachedTarget ? await protectWidows(paper, markKeepTogether) : []
  before.widowFixes = widowsProtected

  return {
    startPages,
    finalPages: pages,
    reachedTarget,
    appliedAny,
    before,
    appliedSettings,
    widowsProtected,
    direction: 'spread',
  }
}

/** Restores exactly what Smart Fix touched — settings, any page breaks it
 * cleared, and any widow/orphan "keep together" flags it turned on —
 * leaving everything else on the paper untouched. */
export function undoSmartFix({ before, applySettings, restorePageBreaks, clearWidowFixes }) {
  applySettings(before.settings)
  if (before.pageBreaks.length > 0 && restorePageBreaks) {
    restorePageBreaks(before.pageBreaks)
  }
  if (before.widowFixes?.length > 0 && clearWidowFixes) {
    clearWidowFixes(before.widowFixes)
  }
}
