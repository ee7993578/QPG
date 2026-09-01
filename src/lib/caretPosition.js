// Lightweight caret-position helpers. These exist purely so the floating
// format toolbar (bold/italic/underline/copy/paste) can appear right above
// whatever text the user just selected, instead of being pinned to a fixed
// spot — the same feel as selecting text on a normal web page.

const MIRROR_STYLE_PROPS = [
  'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
  'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent',
  'letterSpacing', 'wordSpacing', 'tabSize', 'whiteSpace', 'wordWrap', 'wordBreak',
]

/** Caret coordinates (relative to the element's own top-left) inside a multi-line <textarea>. */
export function getTextareaCaretPosition(el, position) {
  const div = document.createElement('div')
  const style = window.getComputedStyle(el)
  MIRROR_STYLE_PROPS.forEach((prop) => { div.style[prop] = style[prop] })
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.whiteSpace = 'pre-wrap'
  div.style.wordWrap = 'break-word'
  div.style.top = '0'
  div.style.left = '-9999px'
  div.style.width = `${el.clientWidth}px`

  const before = document.createTextNode(el.value.substring(0, position))
  const span = document.createElement('span')
  span.textContent = el.value.substring(position) || '.'
  div.appendChild(before)
  div.appendChild(span)
  document.body.appendChild(div)

  const top = span.offsetTop
  const left = span.offsetLeft
  document.body.removeChild(div)

  return {
    top: top - el.scrollTop,
    left: left - el.scrollLeft,
    lineHeight: parseInt(style.lineHeight, 10) || parseInt(style.fontSize, 10) * 1.2 || 20,
  }
}

/** Caret coordinates inside a single-line <input> (no wrapping to worry about). */
export function getInputCaretPosition(el, position) {
  const style = window.getComputedStyle(el)
  if (!getInputCaretPosition._canvas) getInputCaretPosition._canvas = document.createElement('canvas')
  const ctx = getInputCaretPosition._canvas.getContext('2d')
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const textWidth = ctx.measureText(el.value.substring(0, position)).width
  const paddingLeft = parseFloat(style.paddingLeft) || 0
  return {
    top: 0,
    left: paddingLeft + textWidth - el.scrollLeft,
    lineHeight: el.clientHeight,
  }
}
