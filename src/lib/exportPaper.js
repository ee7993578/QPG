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

function getVisiblePrintRoot() {
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
    let renderedPx = 0
    let firstPage = true
    while (renderedPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeightPx
      const ctx = sliceCanvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)

      if (!firstPage) pdf.addPage([pageWidthMm, pageHeightMm], pageWidthMm > pageHeightMm ? 'landscape' : 'portrait')
      const sliceHeightMm = sliceHeightPx / pxPerMm
      pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgWidthMm, sliceHeightMm)

      renderedPx += sliceHeightPx
      firstPage = false
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
