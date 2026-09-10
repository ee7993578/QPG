import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { classSectionLabel, resolveSubject } from './utils'

/**
 * Download Preview → PDF / Word.
 *
 * Both exports read the SAME live DOM node the teacher is already looking at
 * (#print-root, the exact element the app already prints from). Nothing is
 * re-derived, recomputed, or re-styled from scratch — whatever is on screen
 * in the preview is exactly what goes into the file:
 *  - PDF:  a full-fidelity screenshot of that node, sliced across pages.
 *  - Word: the same node's markup, with every element's on-screen computed
 *          style copied inline, so Word/Google Docs renders it identically
 *          and the text stays fully editable.
 * `.no-print` elements (edit-only affordances like the eye-toggle, resize
 * handles, crop buttons) are stripped in both paths, matching the existing
 * @media print rule so downloads never include on-screen-only controls.
 */

// mm dimensions per paper size, matching data/mockData.js PAPER_SIZES
const PAPER_SIZE_MM = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
}

export function getVisiblePrintRoot() {
  const nodes = document.querySelectorAll('#print-root')
  for (const el of nodes) {
    if (el.offsetParent !== null || el.getClientRects().length > 0) return el
  }
  return nodes[0] || null
}

function paperBaseName(paper) {
  const examTitle = paper.examType === 'Custom' ? paper.customExamName : paper.examType
  const parts = [examTitle, resolveSubject(paper), classSectionLabel(paper)].filter(Boolean)
  const raw = (parts.join('-') || 'Question-Paper').trim()
  const safe = raw.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return safe || 'Question-Paper'
}

function pageSizeMm(paper) {
  const settings = paper.settings || {}
  const base = PAPER_SIZE_MM[settings.paperSize] || PAPER_SIZE_MM.A4
  const landscape = settings.orientation === 'landscape'
  return landscape ? { width: base.height, height: base.width } : { width: base.width, height: base.height }
}

/** Reads the page's own background color, so "blank" is judged against
 * whatever the teacher actually set (white, a tinted background, etc.),
 * not a hardcoded assumption of white.
 *
 * Bug fix: sampling the literal corner pixel (1,1) frequently lands ON the
 * page's own border/frame stroke (Border & Frame setting) rather than its
 * interior fill — the border color and the interior background color can
 * differ a lot, so every later comparison against that wrong reference
 * fails and genuinely blank trailing pages stop being detected as blank
 * (they slip into the downloaded PDF instead of being skipped). Sampling a
 * handful of points well inside the page's own padding — clear of any
 * border stroke, watermark, or corner-radius clipping — and taking the
 * most common color among them is robust to that, and to any accidental
 * overlap with real content on an unlucky sample point. */
function readBackgroundColor(canvas) {
  const ctx = canvas.getContext('2d')
  const inset = 40 // canvas px — comfortably inside the smallest real page padding, past any border stroke
  const samplePoints = [
    [inset, inset],
    [canvas.width - inset, inset],
    [inset, canvas.height - inset],
    [canvas.width - inset, canvas.height - inset],
    [Math.floor(canvas.width / 2), inset],
  ].filter(([x, y]) => x >= 0 && y >= 0 && x < canvas.width && y < canvas.height)

  const counts = new Map()
  for (const [x, y] of samplePoints) {
    const { data } = ctx.getImageData(x, y, 1, 1)
    const key = `${data[0]},${data[1]},${data[2]}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  let best = null
  let bestCount = 0
  for (const [key, count] of counts) {
    if (count > bestCount) { best = key; bestCount = count }
  }
  const [r, g, b] = (best || '255,255,255').split(',').map(Number)
  return { r, g, b }
}

/** Whether a candidate page-slice has no real content — i.e. it's just
 * background color, the kind of trailing/leftover page a tighter Smart Fix
 * layout can leave behind. Downsamples first so checking a full-resolution
 * page (screenshotted at 2-3x pixel density) stays fast. */
function isSliceBlank(sliceCanvas, bg, threshold = 12) {
  const sampleW = Math.min(100, sliceCanvas.width)
  const sampleH = Math.min(140, sliceCanvas.height)
  const off = document.createElement('canvas')
  off.width = sampleW
  off.height = sampleH
  const octx = off.getContext('2d')
  octx.drawImage(sliceCanvas, 0, 0, sliceCanvas.width, sliceCanvas.height, 0, 0, sampleW, sampleH)
  const { data } = octx.getImageData(0, 0, sampleW, sampleH)
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha < 5) continue
    if (
      Math.abs(data[i] - bg.r) > threshold ||
      Math.abs(data[i + 1] - bg.g) > threshold ||
      Math.abs(data[i + 2] - bg.b) > threshold
    ) {
      return false
    }
  }
  return true
}

/** Download the current preview as a pixel-faithful PDF. */
export async function downloadPaperAsPdf(paper) {
  const node = getVisiblePrintRoot()
  if (!node) throw new Error('Preview not found on screen — open the Preview tab and try again.')

  const canvas = await html2canvas(node, {
    scale: Math.max(2, Math.min(3, (window.devicePixelRatio || 1) * 2)),
    useCORS: true,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll('.no-print').forEach((el) => { el.style.display = 'none' })
    },
  })

  const { width: pageWidthMm, height: pageHeightMm } = pageSizeMm(paper)
  const pdf = new jsPDF({
    unit: 'mm',
    format: [pageWidthMm, pageHeightMm],
    orientation: pageWidthMm > pageHeightMm ? 'landscape' : 'portrait',
  })

  const imgWidthMm = pageWidthMm
  const pxPerMm = canvas.width / imgWidthMm
  const pageHeightPx = Math.floor(pageHeightMm * pxPerMm)

  if (canvas.height <= pageHeightPx) {
    const imgHeightMm = canvas.height / pxPerMm
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgWidthMm, imgHeightMm)
  } else {
    // A tighter Smart Fix layout (or just a paper that happens to end
    // exactly on a page boundary) can leave the screenshotted node a
    // hair taller than its real content — e.g. leftover space from the
    // page's own minimum-height. Slicing by height alone would turn that
    // into extra, entirely blank pages in the download. Every candidate
    // page is checked for actual content before it's added, so a blank
    // page — wherever it falls — never makes it into the PDF, while at
    // least one page always ships even if that check somehow flags all
    // of them (e.g. a genuinely empty paper).
    const bg = readBackgroundColor(canvas)
    let renderedPx = 0
    let addedPages = 0
    while (renderedPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeightPx
      const ctx = sliceCanvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)

      const isLastSlice = renderedPx + sliceHeightPx >= canvas.height
      const blank = isSliceBlank(sliceCanvas, bg)
      const mustKeepForNonEmptyPdf = blank && addedPages === 0 && isLastSlice

      if (!blank || mustKeepForNonEmptyPdf) {
        if (addedPages > 0) pdf.addPage([pageWidthMm, pageHeightMm], pageWidthMm > pageHeightMm ? 'landscape' : 'portrait')
        const sliceHeightMm = sliceHeightPx / pxPerMm
        pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgWidthMm, sliceHeightMm)
        addedPages += 1
      }

      renderedPx += sliceHeightPx
    }
  }

  pdf.save(`${paperBaseName(paper)}.pdf`)
}

// Computed-style properties worth freezing inline so Word/Google Docs
// reproduces the same look without any Tailwind stylesheet available.
const STYLE_PROPS = [
  'display', 'position', 'boxSizing',
  'width', 'height', 'minHeight', 'maxWidth',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'borderRadius',
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing',
  'textAlign', 'textDecoration', 'textTransform', 'whiteSpace', 'verticalAlign',
  'color', 'backgroundColor',
  'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap',
]

function inlineComputedStyles(liveRoot, cloneRoot) {
  const liveWalker = [liveRoot]
  const cloneWalker = [cloneRoot]
  while (liveWalker.length) {
    const liveEl = liveWalker.shift()
    const cloneEl = cloneWalker.shift()
    if (!(liveEl instanceof Element) || !(cloneEl instanceof Element)) continue
    const computed = window.getComputedStyle(liveEl)
    let styleText = ''
    STYLE_PROPS.forEach((prop) => {
      const value = computed[prop]
      if (value) styleText += `${prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${value};`
    })
    cloneEl.setAttribute('style', styleText)
    cloneEl.removeAttribute('class')
    Array.from(liveEl.children).forEach((child) => liveWalker.push(child))
    Array.from(cloneEl.children).forEach((child) => cloneWalker.push(child))
  }
}

/** Download the current preview as an editable Word (.doc) file that opens cleanly in Google Docs. */
export function downloadPaperAsDoc(paper) {
  const node = getVisiblePrintRoot()
  if (!node) throw new Error('Preview not found on screen — open the Preview tab and try again.')

  const clone = node.cloneNode(true)
  // Freeze every element's current on-screen appearance as inline CSS,
  // since Word/Google Docs can't see the app's Tailwind stylesheet.
  inlineComputedStyles(node, clone)
  // Strip edit-only affordances (eye-toggle placeholder, resize handles,
  // crop/format popovers) — same elements the print stylesheet hides.
  clone.querySelectorAll('.no-print').forEach((el) => el.remove())
  // Convert any interactive-looking buttons that remain (none expected
  // after the no-print pass, but be defensive) into plain spans.
  clone.querySelectorAll('button').forEach((btn) => {
    const span = document.createElement('span')
    span.innerHTML = btn.innerHTML
    span.setAttribute('style', btn.getAttribute('style') || '')
    btn.replaceWith(span)
  })

  const { width: pageWidthMm, height: pageHeightMm } = pageSizeMm(paper)
  const examTitle = paper.examType === 'Custom' ? paper.customExamName : paper.examType

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${examTitle || 'Question Paper'}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page { size: ${pageWidthMm}mm ${pageHeightMm}mm; margin: 0; }
  body { margin: 0; }
  table { border-collapse: collapse; }
</style>
</head>
<body>
${clone.outerHTML}
</body>
</html>`

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${paperBaseName(paper)}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
