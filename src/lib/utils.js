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
 * Returns a Map keyed by questionId -> { number, optionLabel }
 */
export function buildNumbering(paper) {
  const map = new Map()
  let counter = 1
  for (const section of paper.sections || []) {
    for (const group of section.questionGroups || []) {
      if (group.mode === 'or') {
        const num = counter++
        group.questions.forEach((question, i) => {
          map.set(question.id, { number: num, optionLabel: String.fromCharCode(65 + i) })
        })
      } else {
        group.questions.forEach((question) => {
          map.set(question.id, { number: counter++, optionLabel: null })
        })
      }
    }
  }
  return map
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
