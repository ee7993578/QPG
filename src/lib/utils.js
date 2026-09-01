import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

export function sectionLetter(index) {
  // 0 -> A, 1 -> B, ...
  return String.fromCharCode(65 + (index % 26))
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h} hr ${m} min`
  if (h) return `${h} hr`
  return `${m} min`
}

/**
 * Compute provided marks and obtainable marks for a single question group,
 * per SRS section 12 (Marks Calculation & Validation).
 */
export function computeGroupMarks(group) {
  const perQ = Number(group.marksPerQuestion) || 0
  const qCount = Number(group.questionCount) || 0
  const attemptCount = Number(group.attemptCount) || qCount

  if (group.mode === 'normal') {
    const marks = qCount * perQ
    return { providedMarks: marks, obtainableMarks: marks }
  }
  if (group.mode === 'attempt_any') {
    const provided = qCount * perQ
    const obtainable = (attemptCount || qCount) * perQ
    return { providedMarks: provided, obtainableMarks: obtainable }
  }
  if (group.mode === 'or') {
    // Choice group: multiple alternative questions, only ONE counts toward obtainable marks.
    const provided = qCount * perQ
    const obtainable = perQ // one option's marks count once
    return { providedMarks: provided, obtainableMarks: obtainable }
  }
  return { providedMarks: 0, obtainableMarks: 0 }
}

export function computeSectionMarks(section) {
  return (section.questionGroups || []).reduce(
    (acc, g) => {
      const { providedMarks, obtainableMarks } = computeGroupMarks(g)
      acc.providedMarks += providedMarks
      acc.obtainableMarks += obtainableMarks
      return acc
    },
    { providedMarks: 0, obtainableMarks: 0 }
  )
}

/**
 * Builds continuous automatic numbering across the whole paper (SRS 11.6).
 * Questions inside an "OR" choice group share one question number with
 * lettered options (A)/(B) — since only one option counts (10.3).
 *
 * `activeSet` (SRS 48/49) is optional — when a paper Set (A/B/C) is being
 * previewed, questions inside a group are shown in a deterministic shuffled
 * order (see `orderedQuestionsForSet` below). Numbering MUST be built from
 * that same shuffled order, or the printed numbers end up out of sequence
 * (e.g. 1, 3, 2) relative to what's actually displayed. When no Set is
 * active, questions keep their normal stored order.
 *
 * Returns a Map keyed by questionId -> { number, optionLabel, display }
 */
export function buildNumbering(paper, activeSet = '') {
  const map = new Map()
  let counter = 1
  const seed = seedForSet(activeSet || 'A')
  for (const section of paper.sections || []) {
    if (section.restartNumbering) counter = 1
    const style = section.numberingStyle || 'numeric'
    for (const group of section.questionGroups || []) {
      // Feature 3 — Question Groups can restart numbering too, same as Sections.
      if (group.restartNumbering) counter = 1
      if (group.mode === 'or') {
        const num = counter++
        group.questions.forEach((question, i) => {
          map.set(question.id, { number: num, optionLabel: String.fromCharCode(65 + i), display: formatQuestionNumber(style, num) })
        })
      } else {
        const ordered = activeSet ? seededShuffle(group.questions, seed + group.id.length) : group.questions
        ordered.forEach((question) => {
          const num = counter++
          map.set(question.id, { number: num, optionLabel: null, display: formatQuestionNumber(style, num) })
        })
      }
    }
  }
  return map
}

/** Mirrors the ordering `buildNumbering` uses above, for rendering the questions themselves. */
export function orderedQuestionsForSet(group, activeSet, seed) {
  if (group.mode === 'or' || !activeSet) return group.questions
  return seededShuffle(group.questions, seed + group.id.length)
}

/** SRS 21/23 — numbering style per section + optional restart-per-section. */
export function formatQuestionNumber(style, n) {
  switch (style) {
    case 'q-numeric': return `Q${n}.`
    case 'numeric-paren': return `${n})`
    case 'roman-paren': return `(${toRoman(n).toLowerCase()})`
    case 'alpha-paren': return `(${String.fromCharCode(96 + n)})`
    case 'numeric':
    default: return `${n}.`
  }
}

function toRoman(num) {
  const map = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]
  let n = num, out = ''
  for (const [v, s] of map) { while (n >= v) { out += s; n -= v } }
  return out || String(num)
}

/** SRS 26 — configurable marks positioning. */
export function formatMarks(position, value) {
  switch (position) {
    case 'plain': return `${value}`
    case 'paren': return `(${value})`
    case 'bracket':
    default: return `[${value}]`
  }
}

/** SRS 16 — a question's displayed marks is the sum of its sub-question marks, if any. */
export function questionEffectiveMarks(question) {
  if (question.subQuestions && question.subQuestions.length > 0) {
    return question.subQuestions.reduce((sum, sq) => sum + (Number(sq.marks) || 0), 0)
  }
  return Number(question.marks) || 0
}

/** SRS 48/49 — deterministic seeded shuffle used to preview alternate paper Sets (A/B/C). */
export function seededShuffle(array, seed) {
  const arr = [...array]
  let s = seed
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function seedForSet(setLabel) {
  return { A: 1, B: 17, C: 42, D: 91 }[setLabel] ?? 1
}

// Feature 7 — preview click-to-format. Text is stored with lightweight
// markdown markers (**bold**, *italic*, __underline__) which <RichText>
// already knows how to render, so "formatting" a line/selection just means
// wrapping (or unwrapping) the raw string with those markers.
const MARKERS = { bold: '**', italic: '*', underline: '__' }

function isFullyWrapped(str, marker) {
  const s = (str || '').trim()
  return s.length >= marker.length * 2 && s.startsWith(marker) && s.endsWith(marker)
}

/** Toggle a mark across the WHOLE line. */
export function toggleLineMark(text, mark) {
  const marker = MARKERS[mark]
  const raw = text || ''
  const trimmed = raw.trim()
  if (isFullyWrapped(trimmed, marker)) {
    return trimmed.slice(marker.length, trimmed.length - marker.length)
  }
  return `${marker}${raw}${marker}`
}

/**
 * Toggle a mark on just the first occurrence of `snippet` inside `text`.
 * Used when the teacher highlights part of a line in the preview instead of
 * the whole thing.
 */
export function toggleSnippetMark(text, snippet, mark) {
  const marker = MARKERS[mark]
  const raw = text || ''
  if (!snippet) return raw
  const idx = raw.indexOf(snippet)
  if (idx === -1) return raw
  const before = raw.slice(0, idx)
  const after = raw.slice(idx + snippet.length)
  const already = isFullyWrapped(snippet, marker)
  const nextSnippet = already ? snippet.trim().slice(marker.length, snippet.trim().length - marker.length) : `${marker}${snippet}${marker}`
  return `${before}${nextSnippet}${after}`
}

/**
 * Feature (editor selection toolbar) — same bold/italic/underline markers as
 * toggleSnippetMark above, but operating on exact [start, end) indices
 * instead of searching for the first matching substring. Used by the
 * floating format toolbar that appears when text is selected inside a
 * plain <textarea>/<input>, where we always know the precise selection
 * range (so an index-based toggle is more reliable than a text search).
 */
export function toggleMarkInRange(text, start, end, mark) {
  const marker = MARKERS[mark]
  const raw = text || ''
  if (start == null || end == null || start === end) return { text: raw, start, end }
  const selected = raw.slice(start, end)
  const already = isFullyWrapped(selected, marker)
  if (already) {
    const trimmedSel = selected.trim()
    const inner = trimmedSel.slice(marker.length, trimmedSel.length - marker.length)
    const next = `${raw.slice(0, start)}${inner}${raw.slice(end)}`
    return { text: next, start, end: start + inner.length }
  }
  const next = `${raw.slice(0, start)}${marker}${selected}${marker}${raw.slice(end)}`
  return { text: next, start, end: start + marker.length * 2 + selected.length }
}

// Feature — Class / Section / Subject support "Custom" (use the typed value)
// and "None" (omit the field entirely), same idea as the Exam Type "Custom".
export function resolveExamField(value, customValue) {
  if (!value || value === 'None') return ''
  if (value === 'Custom') return (customValue || '').trim()
  return value
}

export function resolveClass(paper) {
  return resolveExamField(paper.className, paper.customClassName)
}

export function resolveSection(paper) {
  return resolveExamField(paper.section, paper.customSection)
}

export function resolveSubject(paper) {
  return resolveExamField(paper.subject, paper.customSubject)
}

/** Combined "X-A" style label, gracefully collapsing when either half is empty. */
export function classSectionLabel(paper) {
  const cls = resolveClass(paper)
  const sec = resolveSection(paper)
  if (cls && sec) return `${cls}-${sec}`
  return cls || sec || ''
}

export function computePaperMarks(paper) {
  return (paper.sections || []).reduce(
    (acc, s) => {
      const { providedMarks, obtainableMarks } = computeSectionMarks(s)
      acc.providedMarks += providedMarks
      acc.obtainableMarks += obtainableMarks
      return acc
    },
    { providedMarks: 0, obtainableMarks: 0 }
  )
}
