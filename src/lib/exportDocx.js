import {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, TabStopType, HeadingLevel,
  Header, Footer, PageNumber, ShadingType, VerticalAlign, PageOrientation,
} from 'docx'
import {
  sectionLetter, formatDate, formatDuration, computeSectionMarks, computeGroupMarks,
  buildNumbering, formatMarks, questionEffectiveMarks, orderedQuestionsForSet, seedForSet,
  classSectionLabel, resolveSubject,
} from './utils'
import { FONT_SIZE_SCALE, CUSTOM_FONT_SIZE_BASE_PX, DEFAULT_CUSTOM_FONT_SIZE_PX, LINE_HEIGHT_VALUE, SPACING_PRESET_PX, SPACING_CUSTOM_DEFAULT } from '../data/mockData'

/**
 * Native .docx export — built directly from the paper's data (not a DOM
 * screenshot, and not the HTML-in-disguise .doc trick used by the "Google
 * Doc" download). This produces a real OOXML file using actual Word
 * paragraphs, tables, and styles, so it opens correctly and looks right
 * every time in Microsoft Word — not just Google Docs.
 *
 * It deliberately reuses the exact same helpers the live preview
 * (A4Preview.jsx) uses for numbering, marks, and set-shuffling, so what
 * gets exported matches what the teacher was looking at.
 */

// --- unit helpers -----------------------------------------------------
const PX_TO_TWIP = 15 // 96 CSS px/in, 1440 twip/in -> 1px = 15 twip
const MM_TO_TWIP = 56.6929
const PX_TO_PT = 0.75
const px2twip = (px) => Math.round((Number(px) || 0) * PX_TO_TWIP)
const pt2halfpt = (pt) => Math.max(2, Math.round(pt * 2))
const px2halfpt = (px) => pt2halfpt(px * PX_TO_PT)

const FONT_FAMILY_MAP = { sans: 'Calibri', serif: 'Times New Roman', display: 'Cambria' }
const PAPER_SIZE_MM = { A4: { width: 210, height: 297 }, A5: { width: 148, height: 210 }, Letter: { width: 215.9, height: 279.4 }, Legal: { width: 215.9, height: 355.6 } }

// Base sizes in CSS px, matching the classes A4Preview.jsx actually uses
// (text-lg=18, text-base=16, text-[15px], text-[13.5px] etc.) — scaled by
// the page's font-size preset exactly like the live preview does.
const BASE_PX = {
  schoolName: 18, examTitle: 16, headerMeta: 13, sectionTitle: 15,
  instruction: 12.5, typeLabel: 11, question: 13.5, marks: 11, footer: 10,
  passage: 12.5, option: 13,
}

// --- rich text (the app's own **bold** / __underline__ / ~~strike~~ / *italic* markers) ---
const MARK_PATTERN = /(\*\*.+?\*\*|__.+?__|~~.+?~~|\*.+?\*)/g
function richRuns(text, base = {}) {
  const value = text || ''
  if (!value) return [new TextRun({ text: '', ...base })]
  const parts = value.split(MARK_PATTERN).filter((p) => p !== '')
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) return new TextRun({ text: part.slice(2, -2), bold: true, ...base })
    if (part.startsWith('__') && part.endsWith('__')) return new TextRun({ text: part.slice(2, -2), underline: {}, ...base })
    if (part.startsWith('~~') && part.endsWith('~~')) return new TextRun({ text: part.slice(2, -2), strike: true, ...base })
    if (part.startsWith('*') && part.endsWith('*')) return new TextRun({ text: part.slice(1, -1), italics: true, ...base })
    return new TextRun({ text: part, ...base })
  })
}

const ALIGN_MAP = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED }

// --- image handling -----------------------------------------------------
function imageTypeFromSrc(src) {
  const m = /^data:image\/(png|jpe?g|gif|bmp)/i.exec(src || '')
  if (m) return m[1].toLowerCase().startsWith('jp') ? 'jpg' : m[1].toLowerCase()
  if (/\.png(\?|$)/i.test(src)) return 'png'
  if (/\.gif(\?|$)/i.test(src)) return 'gif'
  if (/\.bmp(\?|$)/i.test(src)) return 'bmp'
  return 'jpg'
}

function loadImageMeta(src) {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve({ width: img.naturalWidth || 300, height: img.naturalHeight || 200 })
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function loadImageBytes(src) {
  try {
    if (src.startsWith('data:')) {
      const base64 = src.split(',')[1] || ''
      const binary = window.atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      return bytes
    }
    const res = await fetch(src)
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    return new Uint8Array(buf)
  } catch {
    return null
  }
}

/** Builds an ImageRun paragraph, or a plain-text fallback line if the image can't be embedded. */
async function buildImageParagraph(image, contentWidthPx) {
  if (!image?.url) return null
  const [meta, bytes] = await Promise.all([loadImageMeta(image.url), loadImageBytes(image.url)])
  const widthPx = Math.round(((image.width ?? 50) / 100) * contentWidthPx)
  let heightPx = image.height || 140
  if (meta && meta.width && meta.height) {
    const ratio = meta.height / meta.width
    heightPx = image.height || Math.round(widthPx * ratio)
  }
  const align = ALIGN_MAP[image.align || 'left'] || AlignmentType.LEFT
  if (!bytes) {
    return new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: '[Image could not be embedded — see original in the app]', italics: true, size: px2halfpt(BASE_PX.marks) })] })
  }
  return new Paragraph({
    alignment: align,
    spacing: { before: 60, after: 60 },
    children: [new ImageRun({ type: imageTypeFromSrc(image.url), data: bytes, transformation: { width: Math.max(20, widthPx), height: Math.max(20, heightPx) } })],
  })
}

// --- table / grid helpers -----------------------------------------------
const CELL_BORDER = { style: BorderStyle.SINGLE, size: 4, color: '9C9284' }
const ALL_CELL_BORDERS = { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER }

function textCell(text, { bold = false, shaded = false, width } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    borders: ALL_CELL_BORDERS,
    shading: shaded ? { type: ShadingType.CLEAR, fill: 'F3F1EC' } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: richRuns(text || '\u00A0', { bold, size: px2halfpt(BASE_PX.option) }) })],
  })
}

function matchTable(question) {
  const heads = question.matchColumnHeads || ['Column I', 'Column II']
  const pairs = question.matchPairs || []
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [textCell(heads[0], { bold: true, shaded: true, width: 50 }), textCell(heads[1], { bold: true, shaded: true, width: 50 })] }),
      ...(pairs.length > 0
        ? pairs.map((p) => new TableRow({ children: [textCell(p.left || '\u2014', { width: 50 }), textCell(p.right || '\u2014', { width: 50 })] }))
        : [new TableRow({ children: [textCell('\u2014', { width: 50 }), textCell('\u2014', { width: 50 })] })]),
    ],
  })
}

function gridTable(tableGrid) {
  if (!tableGrid?.cells?.length) return null
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableGrid.cells.map((row) => new TableRow({ children: row.map((cell) => textCell(cell || '\u00A0', {})) })),
  })
}

// --- answer-space helper --------------------------------------------------
function answerSpaceParagraphs(space) {
  if (!space || space.type === 'none') return []
  const lineBorder = { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'B9B2A6' } }
  if (space.type === 'drawing' || space.type === 'half' || space.type === 'full' || space.type === 'custom') {
    const mm = space.type === 'half' ? 55 : space.type === 'full' ? 110 : (space.heightMm ?? 40)
    const linesNeeded = Math.max(1, Math.round(mm / 8))
    return Array.from({ length: linesNeeded }).map(() => new Paragraph({ spacing: { before: 0, after: 140 }, border: lineBorder, children: [new TextRun({ text: '' })] }))
  }
  const lines = Number(space.type) || Number(space.lines) || 2
  return Array.from({ length: lines }).map(() => new Paragraph({ spacing: { before: 0, after: 140 }, border: lineBorder, children: [new TextRun({ text: '' })] }))
}

// --- main export ----------------------------------------------------------
export async function downloadPaperAsDocx(paper) {
  const settings = paper.settings || {}
  const examTitle = paper.examType === 'Custom' ? paper.customExamName : paper.examType
  const marksPosition = settings.marksPosition || 'bracket'
  const fontFamily = FONT_FAMILY_MAP[settings.fontFamily] || 'Calibri'

  const fontSizePreset = settings.fontSizePreset || 'custom'
  const fontScale = fontSizePreset === 'custom'
    ? (settings.fontSizeCustomPx || DEFAULT_CUSTOM_FONT_SIZE_PX) / CUSTOM_FONT_SIZE_BASE_PX
    : (FONT_SIZE_SCALE[fontSizePreset] || 1)
  const lineHeightPreset = settings.lineHeightPreset || 'normal'
  const lineHeightValue = lineHeightPreset === 'custom' ? (settings.lineHeightCustom || 1.5) : (LINE_HEIGHT_VALUE[lineHeightPreset] || 1.4)

  const spacingPreset = settings.spacingPreset || 'normal'
  const spacingPx = spacingPreset === 'custom'
    ? { ...SPACING_CUSTOM_DEFAULT, ...(settings.spacingCustom || {}) }
    : (SPACING_PRESET_PX[spacingPreset] || { header: 24, section: 24, question: 12 })

  const sizePx = (key) => Math.max(6, Math.round(BASE_PX[key] * fontScale))
  const lineSpec = { line: Math.round(lineHeightValue * 240), lineRule: 'auto' }

  // Line-level style override (from the "Aa" per-line panel) → px numbers.
  const withLineStyle = (baseSizePx, lineStyle) => {
    const size = lineStyle?.fontSize ? lineStyle.fontSize : baseSizePx
    const spacing = lineStyle?.lineHeight ? { line: Math.round(lineStyle.lineHeight * 240), lineRule: 'auto' } : lineSpec
    const after = lineStyle?.marginBottom !== undefined ? px2twip(lineStyle.marginBottom) : undefined
    return { size: px2halfpt(size), spacing, after }
  }

  // Page geometry
  const paperKey = settings.paperSize && PAPER_SIZE_MM[settings.paperSize] ? settings.paperSize : 'A4'
  const baseMm = PAPER_SIZE_MM[paperKey]
  const landscape = settings.orientation === 'landscape'
  const pageMm = landscape ? { width: baseMm.height, height: baseMm.width } : baseMm
  const pageWidthTwip = Math.round(pageMm.width * MM_TO_TWIP)
  const pageHeightTwip = Math.round(pageMm.height * MM_TO_TWIP)

  const marginPreset = settings.marginPreset || 'normal'
  const marginPx = marginPreset === 'custom'
    ? { top: settings.marginCustom?.top ?? 32, right: settings.marginCustom?.right ?? 32, bottom: settings.marginCustom?.bottom ?? 32, left: settings.marginCustom?.left ?? 32 }
    : marginPreset === 'narrow' ? { top: 20, right: 20, bottom: 20, left: 20 }
    : marginPreset === 'wide' ? { top: 56, right: 56, bottom: 56, left: 56 }
    : { top: 48, right: 48, bottom: 48, left: 48 }
  const marginTwip = { top: px2twip(marginPx.top), right: px2twip(marginPx.right), bottom: px2twip(marginPx.bottom), left: px2twip(marginPx.left) }
  const contentWidthTwip = pageWidthTwip - marginTwip.left - marginTwip.right
  const contentWidthPx = Math.round(contentWidthTwip / PX_TO_TWIP)
  const rightTab = { type: TabStopType.RIGHT, position: contentWidthTwip }

  const numbering = buildNumbering(paper, '')

  // ---- Header ----
  const headerChildren = []
  headerChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 20 },
    children: [new TextRun({ text: (paper.schoolName || 'School Name').toUpperCase(), bold: true, size: px2halfpt(sizePx('schoolName')), font: fontFamily })],
  }))
  if (settings.showAddress && settings.address) {
    headerChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: `(${settings.address})`, size: px2halfpt(sizePx('headerMeta') - 2), font: fontFamily })] }))
  }
  headerChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: (examTitle || 'Examination').toUpperCase(), bold: true, size: px2halfpt(sizePx('examTitle')), font: fontFamily })],
  }))

  const metaRow = (pairs) => new Paragraph({
    tabStops: [rightTab],
    spacing: { after: 40 },
    children: pairs.flatMap(([label, value], i) => {
      const runs = [new TextRun({ text: `${label}: `, font: fontFamily, size: px2halfpt(sizePx('headerMeta')) }), new TextRun({ text: value || '\u2014', bold: true, font: fontFamily, size: px2halfpt(sizePx('headerMeta')) })]
      if (i < pairs.length - 1) runs.push(new TextRun({ text: '\t', font: fontFamily }))
      return runs
    }),
  })

  const classLabel = classSectionLabel(paper)
  const subject = resolveSubject(paper)
  const metaLine1 = []
  if (classLabel) metaLine1.push(['Class', classLabel])
  if (subject) metaLine1.push(['Subject', subject])
  metaLine1.push(['Date', formatDate(paper.examDate) || '\u2014'])
  headerChildren.push(metaRow(metaLine1))
  headerChildren.push(metaRow([['Time Allowed', formatDuration(paper.duration) || '\u2014'], ['Maximum Marks', paper.totalMarks ? String(paper.totalMarks) : '\u2014']]))

  const instructions = (settings.instructions || []).filter((x) => x && x.trim())
  if (instructions.length > 0) {
    headerChildren.push(new Paragraph({ spacing: { before: 100, after: 20 }, children: [new TextRun({ text: 'General Instructions:', bold: true, font: fontFamily, size: px2halfpt(sizePx('headerMeta')) })] }))
    instructions.forEach((line) => {
      headerChildren.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 20 }, children: [new TextRun({ text: line, font: fontFamily, size: px2halfpt(sizePx('headerMeta')) })] }))
    })
  }

  // ---- Body: sections / question groups / questions ----
  const body = []

  for (let sIdx = 0; sIdx < paper.sections.length; sIdx++) {
    const section = paper.sections[sIdx]
    const { obtainableMarks } = computeSectionMarks(section)
    const sectionShowMarks = section.showMarks !== false

    if (sIdx > 0) {
      body.push(new Paragraph({ spacing: { before: px2twip(spacingPx.section) }, children: [] }))
    }

    if (section.showTitle === true) {
      body.push(new Paragraph({
        tabStops: [rightTab],
        alignment: ALIGN_MAP[section.align || 'left'] || AlignmentType.LEFT,
        spacing: { after: 60 },
        children: [
          ...richRuns(section.title || `Section ${sectionLetter(sIdx)}`, { bold: true, font: fontFamily, size: px2halfpt(sizePx('sectionTitle')) }),
          ...(sectionShowMarks ? [new TextRun({ text: '\t' }), new TextRun({ text: formatMarks(marksPosition, obtainableMarks), font: fontFamily, size: px2halfpt(sizePx('marks')) })] : []),
        ],
      }))
    }
    if (section.instruction) {
      body.push(new Paragraph({
        alignment: ALIGN_MAP[section.instructionAlign || 'left'] || AlignmentType.LEFT,
        spacing: { after: 80 },
        children: richRuns(section.instruction, { italics: true, font: fontFamily, size: px2halfpt(sizePx('instruction')) }),
      }))
    }
    if (section.noticeBox?.enabled && section.noticeBox.text) {
      body.push(new Paragraph({
        alignment: ALIGN_MAP[section.noticeBox.align || 'left'] || AlignmentType.LEFT,
        shading: { type: ShadingType.CLEAR, fill: 'F3F1EC' },
        border: { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER },
        spacing: { after: 100 },
        children: richRuns(section.noticeBox.text, { font: fontFamily, size: px2halfpt(sizePx('instruction')) }),
      }))
    }

    for (let gIdx = 0; gIdx < (section.questionGroups || []).length; gIdx++) {
      const group = section.questionGroups[gIdx]
      const groupShowMarks = group.showMarks !== false
      if (gIdx > 0) body.push(new Paragraph({ spacing: { before: px2twip(spacingPx.question) }, children: [] }))

      const typeLabel = group.customTypeName || group.questionType
      body.push(new Paragraph({
        tabStops: [rightTab],
        spacing: { after: 40 },
        children: [
          ...richRuns(typeLabel, { italics: true, bold: true, font: fontFamily, size: px2halfpt(sizePx('typeLabel')), color: '6B6255' }),
          ...(groupShowMarks ? [new TextRun({ text: '\t' }), new TextRun({ text: formatMarks(marksPosition, computeGroupMarks(group).obtainableMarks), font: fontFamily, size: px2halfpt(sizePx('marks')) })] : []),
        ],
      }))

      let modeText = group.instruction
      if (group.mode === 'attempt_any') modeText = `Attempt any ${group.attemptCount} out of ${group.questionCount} questions. (${group.marksPerQuestion} marks each)`
      else if (group.mode === 'or') modeText = `Attempt any ONE option. (${group.marksPerQuestion} marks)`
      if (group.negativeMarks) modeText = `${modeText ? modeText + ' ' : ''}(+${group.marksPerQuestion} correct, \u2212${group.negativeMarks} incorrect)`
      if (modeText) {
        body.push(new Paragraph({ spacing: { after: 60 }, children: richRuns(modeText, { italics: true, font: fontFamily, size: px2halfpt(sizePx('instruction')) }) }))
      }

      if (group.passage) {
        if (group.questionType === 'Case Study') {
          body.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: 'CASE STUDY', bold: true, font: fontFamily, size: px2halfpt(sizePx('marks')), color: 'B08900' })] }))
        }
        body.push(new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: 'F3F1EC' },
          border: { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER },
          spacing: { after: 100 },
          children: richRuns(group.passage, { italics: true, font: fontFamily, size: px2halfpt(sizePx('passage')) }),
        }))
      }

      if (group.mode === 'or') {
        const orShowMarks = group.showMarks !== false
        const num = numbering.get(group.questions[0]?.id)?.display || ''
        for (let i = 0; i < group.questions.length; i++) {
          const question = group.questions[i]
          const prefix = i === 0 ? `${num} ` : ''
          const optionLabel = `(${String.fromCharCode(65 + i)}) `
          // eslint-disable-next-line no-await-in-loop
          const qParas = await questionParagraphs(question, group, {
            marksPosition, fontFamily, sizePx, rightTab, contentWidthPx,
            leadIn: prefix + optionLabel,
            showMarks: i === group.questions.length - 1 ? orShowMarks : false,
            marksValue: group.marksPerQuestion,
          })
          body.push(...qParas)
          if (i < group.questions.length - 1) {
            body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: '— OR —', italics: true, bold: true, font: fontFamily, size: px2halfpt(sizePx('marks')), color: 'B08900' })] }))
          }
        }
      } else {
        const ordered = orderedQuestionsForSet(group, '', seedForSet('A'))
        for (const question of ordered) {
          const display = numbering.get(question.id)?.display || ''
          const qShowMarks = question.showMarks !== false
          // eslint-disable-next-line no-await-in-loop
          const qParas = await questionParagraphs(question, group, {
            marksPosition, fontFamily, sizePx, rightTab, contentWidthPx,
            leadIn: `${display} `,
            showMarks: qShowMarks,
            marksValue: questionEffectiveMarks(question),
          })
          body.push(...qParas)
        }
      }
    }
  }

  // ---- Footer ----
  // No footer by default, matching the live preview: the "— End of Paper —"
  // line only appears once a teacher actually adds Footer Text. Page
  // numbering is a separate, still-on-by-default toggle, so it still shows
  // on its own (just without the "End of Paper" branding line) when there's
  // no footer text to sit alongside.
  const footerChildren = []
  if (settings.footerText) {
    footerChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: settings.footerText, size: px2halfpt(sizePx('footer')), font: fontFamily })] }))
    const footerRuns = [new TextRun({ text: '— End of Paper —', size: px2halfpt(sizePx('footer')), font: fontFamily })]
    if (settings.showPageNumber !== false) {
      footerRuns.push(new TextRun({ text: '   \u00B7   Page ', size: px2halfpt(sizePx('footer')), font: fontFamily }))
      footerRuns.push(new TextRun({ children: [PageNumber.CURRENT], size: px2halfpt(sizePx('footer')), font: fontFamily }))
    }
    footerChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: footerRuns }))
  } else if (settings.showPageNumber !== false) {
    footerChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Page ', size: px2halfpt(sizePx('footer')), font: fontFamily }),
        new TextRun({ children: [PageNumber.CURRENT], size: px2halfpt(sizePx('footer')), font: fontFamily }),
      ],
    }))
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: pageWidthTwip, height: pageHeightTwip, orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
          margin: marginTwip,
        },
      },
      headers: { default: new Header({ children: headerChildren }) },
      footers: { default: new Footer({ children: footerChildren }) },
      children: body,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${paperBaseName(paper)}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

function paperBaseName(paper) {
  const examTitle = paper.examType === 'Custom' ? paper.customExamName : paper.examType
  const parts = [examTitle, resolveSubject(paper), classSectionLabel(paper)].filter(Boolean)
  const raw = (parts.join('-') || 'Question-Paper').trim()
  const safe = raw.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return safe || 'Question-Paper'
}

/** One question's paragraphs (text/assertion-reason/match/grid + options + sub-questions + answer space), matching QuestionBody in A4Preview.jsx. */
async function questionParagraphs(question, group, ctx) {
  const { marksPosition, fontFamily, sizePx, rightTab, contentWidthPx, leadIn, showMarks, marksValue } = ctx
  const type = group.questionType
  const marksRun = showMarks ? [new TextRun({ text: '\t' }), new TextRun({ text: formatMarks(marksPosition, marksValue), font: fontFamily, size: px2halfpt(sizePx('marks')) })] : []
  const qSize = px2halfpt(question.style?.fontSize || sizePx('question'))
  const out = []

  if (type === 'Assertion-Reason') {
    out.push(new Paragraph({
      tabStops: [rightTab], spacing: { after: 40 },
      children: [new TextRun({ text: leadIn, bold: true, font: fontFamily, size: qSize }), ...richRuns(question.assertion || 'Assertion (A): \u2026', { font: fontFamily, size: px2halfpt(question.assertionStyle?.fontSize || sizePx('question')) }), ...marksRun],
    }))
    out.push(new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: '      ', font: fontFamily }), ...richRuns(question.reason || 'Reason (R): \u2026', { font: fontFamily, size: px2halfpt(question.reasonStyle?.fontSize || sizePx('question')) })],
    }))
  } else if (type === 'Match the Following') {
    out.push(new Paragraph({ tabStops: [rightTab], spacing: { after: 40 }, children: [new TextRun({ text: leadIn, bold: true, font: fontFamily, size: qSize }), ...marksRun] }))
    out.push(matchTable(question))
    out.push(new Paragraph({ spacing: { after: 80 }, children: [] }))
  } else if (type === 'Table/Grid') {
    out.push(new Paragraph({ tabStops: [rightTab], spacing: { after: 40 }, children: [new TextRun({ text: leadIn, bold: true, font: fontFamily, size: qSize }), ...richRuns(question.text || 'Untitled question\u2026', { font: fontFamily, size: qSize }), ...marksRun] }))
    const grid = gridTable(question.tableGrid)
    if (grid) { out.push(grid); out.push(new Paragraph({ spacing: { after: 80 }, children: [] })) }
  } else {
    out.push(new Paragraph({
      tabStops: [rightTab],
      spacing: { after: 40, line: question.style?.lineHeight ? Math.round(question.style.lineHeight * 240) : undefined, lineRule: question.style?.lineHeight ? 'auto' : undefined },
      children: [new TextRun({ text: leadIn, bold: true, font: fontFamily, size: qSize }), ...richRuns(question.text || 'Untitled question\u2026', { font: fontFamily, size: qSize }), ...marksRun],
    }))
  }

  if (question.image?.url) {
    const imgPara = await buildImageParagraph(question.image, contentWidthPx)
    if (imgPara) out.push(imgPara)
  }

  if (question.options?.length) {
    const LETTERS = 'ABCDEFGH'
    question.options.forEach((opt, i) => {
      const isCorrect = opt.id === question.correctOptionId
      out.push(new Paragraph({
        indent: { left: 260 },
        spacing: { after: 20 },
        children: [
          new TextRun({ text: `${LETTERS[i] || i + 1}. `, bold: true, font: fontFamily, size: px2halfpt(sizePx('option')) }),
          ...richRuns(opt.text || 'Option\u2026', { font: fontFamily, size: px2halfpt(sizePx('option')), bold: isCorrect }),
        ],
      }))
    })
  }

  if (question.subQuestions?.length) {
    question.subQuestions.forEach((sq) => {
      if (sq.orWith) out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: '\u2014 OR \u2014', italics: true, bold: true, font: fontFamily, size: px2halfpt(sizePx('marks')) })] }))
      out.push(new Paragraph({
        indent: { left: 260 }, tabStops: [rightTab], spacing: { after: 20 },
        children: [new TextRun({ text: `(${sq.label}) `, bold: true, font: fontFamily, size: px2halfpt(sizePx('option')) }), ...richRuns(sq.text || 'Sub-part\u2026', { font: fontFamily, size: px2halfpt(sizePx('option')) }), new TextRun({ text: '\t' }), new TextRun({ text: formatMarks(marksPosition, sq.marks), font: fontFamily, size: px2halfpt(sizePx('marks')) })],
      }))
    })
  }

  out.push(...answerSpaceParagraphs(question.answerSpace))
  return out
}
