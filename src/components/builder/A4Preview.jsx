import React, { useMemo, useRef, useState, useLayoutEffect } from 'react'
import { EyeOff, AlignLeft, AlignCenter, AlignRight, RotateCw, Crop } from 'lucide-react'
import { sectionLetter, formatDate, formatDuration, computeSectionMarks, computeGroupMarks, buildNumbering, formatMarks, questionEffectiveMarks, orderedQuestionsForSet, seedForSet, classSectionLabel, resolveSubject } from '../../lib/utils'
import { RichText } from '../../lib/richText'
import { GROUP_MODES, PAPER_SIZES, MARGIN_PRESET_PX, FONT_SIZE_SCALE, CUSTOM_FONT_SIZE_BASE_PX, DEFAULT_CUSTOM_FONT_SIZE_PX, LINE_HEIGHT_VALUE, SPACING_PRESET_PX, SPACING_CUSTOM_DEFAULT, BORDER_WIDTH_PX, PAGE_BG_COLOR, WATERMARK_OPACITY_VALUE, nextAlign } from '../../data/mockData'
import { EditableLine } from './EditableLine'
import { ImageCropDialog } from './ImageCropDialog'
import { useAppStore } from '../../store/useAppStore'
import { useSubscriptionStore } from '../../store/subscriptionStore'
import { useUiStore } from '../../store/uiStore'
import { useTranslate } from '../../i18n'

/**
 * Edit-from-preview — clicking (or selecting text in) a question's line in
 * the live preview opens its usual Bold/Italic/Underline popup toolbar
 * (see EditableLine), with one more icon in it: a pencil that jumps
 * straight to that exact question in the existing question editor — same
 * editor, same state, no second editing surface, and no separate visible
 * "Edit" label cluttering the question. See SectionEditor/
 * QuestionGroupEditor for the receiving end.
 *
 * Double-clicking/double-tapping a line is a *different* action — it edits
 * that line's text right there in the preview (see EditableLine), for any
 * line in the paper, not just questions. It intentionally does NOT jump to
 * the Edit tab, so it never fights with the pencil icon above.
 */
function OrRowWrapper({ sectionId, groupId, questionId, t, children }) {
  return (
    <li
      className="group/q relative flex gap-2 text-[13.5px] leading-relaxed text-ink-800"
      style={{ marginBottom: '8px' }}
    >
      {children}
    </li>
  )
}

const FONT_CLASS = { sans: 'font-sans', serif: 'font-serif', display: 'font-display' }

// SRS 17.1/17.2 — lightweight visual template presets (header rule + accent).
const TEMPLATE_CLASS = {
  classic: { headerRule: 'border-b-2 border-ink-800', accent: 'text-gold-600 border-gold-500' },
  modern: { headerRule: 'border-b-4 border-ink-900 rounded-t-sm', accent: 'text-sky-600 border-sky-500' },
  minimal: { headerRule: 'border-b border-ink-300', accent: 'text-ink-500 border-ink-400' },
  school: { headerRule: 'border-b-2 border-double border-ink-800', accent: 'text-emerald-600 border-emerald-500' },
}

function modeInstruction(group) {
  const modeInfo = GROUP_MODES.find((m) => m.value === group.mode)
  let base
  if (group.mode === 'attempt_any') {
    base = `Attempt any ${group.attemptCount} out of ${group.questionCount} questions. (${group.marksPerQuestion} marks each)`
  } else if (group.mode === 'or') {
    base = `Attempt any ONE option. (${group.marksPerQuestion} marks)`
  } else {
    base = group.instruction || `${modeInfo?.label ?? ''}`
  }
  if (group.negativeMarks) {
    base = `${base ? base + ' ' : ''}(+${group.marksPerQuestion} correct, −${group.negativeMarks} incorrect)`
  }
  return base
}

/**
 * Click any marks figure in the live preview to hide it; while hidden, a
 * small faint "eye-off" mark takes its place so it can be clicked again to
 * bring the marks back. The faint placeholder never prints/exports
 * (no-print) — only the marks text itself does, and only while visible.
 */
function MarksBadge({ value, position, visible, onToggle, t }) {
  if (!onToggle) {
    return <span className="shrink-0 font-mono text-xs text-ink-400">{formatMarks(position, value)}</span>
  }
  const activate = (e) => { e.stopPropagation(); onToggle() }
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e) }
  }
  if (visible) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={activate}
        onKeyDown={onKeyDown}
        title={t('preview_clickHideMarks')}
        className="shrink-0 cursor-pointer rounded px-0.5 font-mono text-xs text-ink-400 transition-colors hover:bg-gold-100/60 print:pointer-events-none dark:hover:bg-gold-400/10"
      >
        {formatMarks(position, value)}
      </span>
    )
  }
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={activate}
      onKeyDown={onKeyDown}
      title={t('preview_clickShowMarks')}
      className="no-print flex shrink-0 cursor-pointer items-center rounded border border-dashed border-ink-300 p-0.5 text-ink-300 hover:border-ink-400 hover:text-ink-500 dark:border-ink-700 dark:text-ink-600"
    >
      <EyeOff className="h-3 w-3" />
    </span>
  )
}

function AnswerSpaceBlock({ space }) {
  if (!space || space.type === 'none') return null
  if (space.type === 'drawing') {
    return (
      <div
        className="mt-1.5 flex items-center justify-center rounded border border-dashed border-ink-300 text-[10px] italic text-ink-300 dark:border-ink-700"
        style={{ height: `${space.heightMm ?? 55}mm` }}
      >
        Drawing Space
      </div>
    )
  }
  if (space.type === 'half' || space.type === 'full' || space.type === 'custom') {
    const height = space.type === 'half' ? '55mm' : space.type === 'full' ? '110mm' : `${space.heightMm ?? 40}mm`
    return <div className="mt-1.5 rounded border border-dashed border-ink-200 dark:border-ink-700" style={{ height }} />
  }
  const lines = Number(space.type) || Number(space.lines) || 2
  return (
    <div className="mt-1.5 space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="border-b border-dashed border-ink-300 dark:border-ink-700" />
      ))}
    </div>
  )
}

// Corner + side handles so the image can be stretched from any edge, per the
// standard "resize box" pattern. Handles are no-print — only the resulting
// image size is reflected in the export. Position classes use translate-based
// centering (works with any hit-box size) instead of hardcoded pixel offsets.
const RESIZE_HANDLES = [
  { key: 'nw', cls: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize' },
  { key: 'n', cls: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize' },
  { key: 'ne', cls: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize' },
  { key: 'e', cls: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize' },
  { key: 'se', cls: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize' },
  { key: 's', cls: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize' },
  { key: 'sw', cls: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize' },
  { key: 'w', cls: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize' },
]

const IMG_ALIGN_ICON = { left: AlignLeft, center: AlignCenter, right: AlignRight }

function QuestionImage({ image, onResize, t }) {
  const wrapRef = useRef(null)
  // Local override while actively dragging a handle — updating the store
  // (which deep-clones the whole paper + pushes an undo snapshot) on every
  // single mousemove event was the reason the handles "showed but didn't
  // work": dozens of heavy store writes per second made the drag effectively
  // freeze. Now we track the live size purely in local state and only
  // commit one store update on mouseup.
  const [dragSize, setDragSize] = useState(null) // { width, height } | null
  const [toolbar, setToolbar] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)

  React.useEffect(() => {
    if (!toolbar) return
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setToolbar(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [toolbar])

  if (!image?.url) return null

  const align = image.align || 'left'
  const marginStyle =
    align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } :
    align === 'right' ? { marginLeft: 'auto', marginRight: 0 } :
    { marginLeft: 0, marginRight: 'auto' }

  const startDrag = (handle) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Pointer Events (not mouse-only events) so this works with a mouse AND
    // with a finger on a touchscreen — mobile browsers don't reliably fire
    // continuous mousemove during a touch-drag, which is why resizing looked
    // completely dead on phones even though the handles were visible.
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* unsupported, ignore */ }
    const parentWidth = wrapRef.current?.parentElement?.clientWidth || 400
    const imgEl = wrapRef.current?.querySelector('img')
    const startWidthPx = ((image.width ?? 50) / 100) * parentWidth
    const startHeightPx = image.height || imgEl?.clientHeight || 140
    const startX = e.clientX
    const startY = e.clientY
    let latest = null

    const onMove = (ev) => {
      ev.preventDefault()
      let widthPx = startWidthPx
      let heightPx = startHeightPx
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (handle.includes('e')) widthPx = startWidthPx + dx
      if (handle.includes('w')) widthPx = startWidthPx - dx
      if (handle.includes('s')) heightPx = startHeightPx + dy
      if (handle.includes('n')) heightPx = startHeightPx - dy
      widthPx = Math.max(40, Math.min(parentWidth, widthPx))
      heightPx = Math.max(30, Math.min(600, heightPx))
      const widthPct = Math.max(10, Math.min(100, Math.round((widthPx / parentWidth) * 100)))
      latest = { width: widthPct, height: Math.round(heightPx) }
      setDragSize(latest)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      if (latest) onResize(latest)
      setDragSize(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const effectiveWidth = dragSize?.width ?? image.width ?? 50
  const effectiveHeight = dragSize ? dragSize.height : image.height

  // Feature (matches text lines) — tap/click the image itself to open a
  // small "Move" toolbar that cycles left/center/right, same as EditableLine.
  const openAlignToolbar = (e) => {
    if (e.target.closest?.('[data-resize-handle]')) return
    setToolbar((v) => !v)
  }

  const AlignIcon = IMG_ALIGN_ICON[align] || AlignLeft
  const rotate = image.rotate || 0

  return (
    <div ref={wrapRef} className="group/qimg relative my-1.5" style={{ width: `${effectiveWidth}%`, ...marginStyle }}>
      <img
        src={image.url}
        alt={image.caption || 'question figure'}
        onClick={onResize ? openAlignToolbar : undefined}
        className={`w-full rounded border border-ink-200 dark:border-ink-700 ${onResize ? 'cursor-pointer' : ''}`}
        style={{
          height: effectiveHeight ? `${effectiveHeight}px` : 'auto',
          objectFit: effectiveHeight ? 'fill' : 'contain',
          transform: rotate ? `rotate(${rotate}deg)` : undefined,
        }}
      />
      {image.caption && <p className="mt-0.5 text-center text-[10px] italic text-ink-400">{image.caption}</p>}
      {onResize && toolbar && (
        <div
          className="no-print absolute left-0 top-full z-20 mt-1 flex items-center gap-0.5 rounded-lg border border-ink-200 bg-white p-1 shadow-lg dark:border-ink-700 dark:bg-ink-800"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={() => { onResize({ align: nextAlign(align) }); setToolbar(false) }}
            title={t ? t('common_moveText') : 'Move image'}
            className="rounded p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"
          ><AlignIcon className="h-3.5 w-3.5" /></button>
          <span className="mx-0.5 h-4 w-px bg-ink-200 dark:bg-ink-700" />
          <button
            type="button"
            onClick={() => { onResize({ rotate: (rotate + 90) % 360 }); setToolbar(false) }}
            title="Rotate image 90°"
            className="rounded p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"
          ><RotateCw className="h-3.5 w-3.5" /></button>
          <button
            type="button"
            onClick={() => { setCropOpen(true); setToolbar(false) }}
            title="Crop image"
            className="rounded p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"
          ><Crop className="h-3.5 w-3.5" /></button>
        </div>
      )}
      {onResize && (
        <ImageCropDialog
          open={cropOpen}
          onClose={() => setCropOpen(false)}
          imageUrl={image.originalUrl || image.url}
          onApply={(croppedUrl) => onResize({ url: croppedUrl, originalUrl: image.originalUrl || image.url })}
        />
      )}
      {onResize && (
        <div
          className={`no-print pointer-events-none absolute inset-0 transition-opacity ${toolbar ? 'opacity-100' : 'opacity-0 group-hover/qimg:opacity-100 group-active/qimg:opacity-100'}`}
          title={t ? t('preview_dragResize') : undefined}
        >
          {RESIZE_HANDLES.map(({ key, cls }) => (
            <span
              key={key}
              data-resize-handle
              onPointerDown={startDrag(key)}
              className={`pointer-events-auto touch-none absolute flex h-6 w-6 items-center justify-center select-none ${cls}`}
            >
              <span className="h-2.5 w-2.5 rounded-sm border border-white bg-gold-500 shadow" />
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function OptionsBlock({ options, layout, correctOptionId, showAnswerKey }) {
  if (!options || options.length === 0) return null
  const LETTERS = 'ABCDEFGH'
  return (
    <div className={`mt-1.5 ${layout === 'grid' ? 'grid grid-cols-2 gap-x-4 gap-y-1' : 'space-y-1'}`}>
      {options.map((opt, i) => {
        const isCorrect = showAnswerKey && correctOptionId === opt.id
        return (
          <div key={opt.id} className={`flex items-start gap-1.5 text-[13px] ${isCorrect ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-ink-800'}`}>
            <span className="font-semibold shrink-0">{LETTERS[i] || i + 1}.{isCorrect ? ' \u2713' : ''}</span>
            {opt.imageUrl ? (
              <img src={opt.imageUrl} alt={opt.text || 'option'} className="h-16 w-16 rounded border border-ink-200 object-cover dark:border-ink-700" />
            ) : (
              <span className={opt.text ? '' : 'italic text-ink-300'}>{opt.text ? <RichText text={opt.text} /> : 'Option…'}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MatchTable({ question }) {
  const heads = question.matchColumnHeads || ['Column I', 'Column II']
  const pairs = question.matchPairs || []
  return (
    <table className="mt-1.5 w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="border border-ink-300 bg-ink-50 px-2 py-1 text-left font-semibold dark:border-ink-700 dark:bg-ink-800">{heads[0]}</th>
          <th className="border border-ink-300 bg-ink-50 px-2 py-1 text-left font-semibold dark:border-ink-700 dark:bg-ink-800">{heads[1]}</th>
        </tr>
      </thead>
      <tbody>
        {pairs.map((p) => (
          <tr key={p.id}>
            <td className="border border-ink-200 px-2 py-1 dark:border-ink-700">{p.left || '—'}</td>
            <td className="border border-ink-200 px-2 py-1 dark:border-ink-700">{p.right || '—'}</td>
          </tr>
        ))}
        {pairs.length === 0 && (
          <tr><td colSpan={2} className="border border-ink-200 px-2 py-1 text-center italic text-ink-300 dark:border-ink-700">No rows added yet.</td></tr>
        )}
      </tbody>
    </table>
  )
}

function TableGridBlock({ tableGrid }) {
  if (!tableGrid) return null
  return (
    <table className="mt-1.5 border-collapse text-[13px]">
      <tbody>
        {tableGrid.cells.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td key={c} className="border border-ink-300 px-2.5 py-1 dark:border-ink-700">{cell || '\u00A0'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SubQuestionsBlock({ subQuestions, marksPosition }) {
  if (!subQuestions || subQuestions.length === 0) return null
  return (
    <div className="mt-1.5 space-y-1.5 pl-1">
      {subQuestions.map((sq) => (
        <div key={sq.id}>
          {sq.orWith && <p className="mb-1 text-[11px] font-semibold italic text-gold-600">— OR —</p>}
          <div className="flex gap-1.5 text-[13px] text-ink-800">
            <span className="font-semibold shrink-0">({sq.label})</span>
            <span className={`flex-1 ${sq.text ? '' : 'italic text-ink-300'}`}>{sq.text ? <RichText text={sq.text} /> : 'Sub-part…'}</span>
            <span className="shrink-0 font-mono text-xs text-ink-400">{formatMarks(marksPosition, sq.marks)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function QuestionBody({ question, group, marksPosition, showAnswerKey, onJumpToQuestion, onTextChange, onAlignChange, onStyleChange, onImageResize, onAssertionChange, onAssertionAlign, onAssertionStyleChange, onReasonChange, onReasonAlign, onReasonStyleChange, t }) {
  const type = group.questionType
  if (type === 'Assertion-Reason') {
    return (
      <div className="flex-1 space-y-1">
        <EditableLine
          as="p"
          text={question.assertion}
          align={question.assertionAlign || 'left'}
          onAlign={onAssertionAlign}
          onText={onAssertionChange}
          style={question.assertionStyle}
          onStyle={onAssertionStyleChange}
          onJumpToQuestion={onJumpToQuestion}
          className="text-[13.5px] text-ink-800"
          placeholder="Assertion (A): …"
        />
        <EditableLine
          as="p"
          text={question.reason}
          align={question.reasonAlign || 'left'}
          onAlign={onReasonAlign}
          onText={onReasonChange}
          style={question.reasonStyle}
          onStyle={onReasonStyleChange}
          className="text-[13.5px] text-ink-800"
          placeholder="Reason (R): …"
        />
        <QuestionImage image={question.image} onResize={onImageResize} t={t} />
        <OptionsBlock options={question.options} layout={group.optionsLayout} correctOptionId={question.correctOptionId} showAnswerKey={showAnswerKey} />
      </div>
    )
  }
  if (type === 'Match the Following') {
    return (
      <div className="flex-1">
        <MatchTable question={question} />
      </div>
    )
  }
  if (type === 'Table/Grid') {
    return (
      <div className="flex-1">
        <p className={`text-[13.5px] leading-relaxed text-ink-800 ${question.text ? '' : 'italic text-ink-300'}`}>{question.text ? <RichText text={question.text} /> : 'Untitled question…'}</p>
        <TableGridBlock tableGrid={question.tableGrid} />
      </div>
    )
  }
  return (
    <div className="flex-1" dir={question.dir === 'rtl' ? 'rtl' : 'ltr'}>
      <EditableLine
        as="p"
        text={question.text}
        align={question.dir === 'rtl' ? (question.align === 'left' ? 'right' : question.align) : (question.align || 'left')}
        onAlign={onAlignChange}
        onText={onTextChange}
        style={question.style}
        onStyle={onStyleChange}
        onJumpToQuestion={onJumpToQuestion}
        // The "gap below" value in question.style.marginBottom is still shown/edited
        // in this line's own popup as normal, but it's applied at the <li> level in
        // A4Preview (see the per-question <li> style below) so it actually controls
        // the space to the next question. Applying it here too would double it up
        // inside this flex item, on top of the li's own marginBottom.
        applyMarginBottom={false}
        className="text-[13.5px] leading-relaxed text-ink-800"
        placeholder="Untitled question…"
        dir={question.dir === 'rtl' ? 'rtl' : 'ltr'}
      />
      <QuestionImage image={question.image} onResize={onImageResize} t={t} />
      <OptionsBlock options={question.options} layout={group.optionsLayout} correctOptionId={question.correctOptionId} showAnswerKey={showAnswerKey} />
      <SubQuestionsBlock subQuestions={question.subQuestions} marksPosition={marksPosition} />
      <AnswerSpaceBlock space={question.answerSpace} />
    </div>
  )
}

export function A4Preview({ paper, pageRef, activeSet = '', showAnswerKey = false }) {
  const t = useTranslate()
  const updateSection = useAppStore((s) => s.updateSection)
  const updateQuestionGroup = useAppStore((s) => s.updateQuestionGroup)
  const updateQuestion = useAppStore((s) => s.updateQuestion)
  const subscriptionActive = useSubscriptionStore((s) => s.subscriptionActive)
  const numbering = useMemo(() => buildNumbering(paper, activeSet), [paper, activeSet])
  const examTitle = paper.examType === 'Custom' ? paper.customExamName : paper.examType
  const settings = paper.settings || {}
  const marksPosition = settings.marksPosition || 'bracket'
  const fontClass = FONT_CLASS[settings.fontFamily] || ''
  const tpl = TEMPLATE_CLASS[settings.template] || TEMPLATE_CLASS.classic
  const sizeInfo = PAPER_SIZES.find((p) => p.value === settings.paperSize) || PAPER_SIZES[0]
  const seed = seedForSet(activeSet || 'A')

  // Bug fix (Smart Fix / custom font size): `typographyStyle` below shrinks
  // the whole exam-content block with a CSS `transform: scale()` — this is
  // paint-only, so the block's own LAYOUT height (its contribution to
  // #print-root's scrollHeight, which is exactly what measurePageCount() in
  // smartFix.js reads, and what html2canvas uses to size the exported
  // canvas) stayed at the pre-shrink size no matter how small fontScale got.
  // Two visible symptoms followed: Smart Fix's font-size steps barely moved
  // the measured page count (so a big target like 5→2 pages looked
  // "impossible" even though the visual shrink was real), and the exported
  // PDF/print carried the untouched, now-empty leftover space as literal
  // blank page area at the bottom.
  // Fix: measure the block's own true (pre-transform) height, then give its
  // wrapper an explicit height of that value × fontScale — its real,
  // visually-scaled size — so #print-root's own layout height (and every
  // downstream page-count/export calculation built on it) matches exactly
  // what's actually on screen. Re-measures on every content/size change via
  // ResizeObserver, so any later edit keeps this in sync automatically.
  const typoContentRef = useRef(null)
  const [typoScaledHeight, setTypoScaledHeight] = useState(null)
  const border = settings.border || 'none'
  const instructions = (settings.instructions || []).filter((x) => x && x.trim())

  // Page Settings — Page/Paper category (gear icon in Preview's "More
  // options" row). Every field defaults to the paper's original look, so a
  // paper nobody has touched renders pixel-identical to before this feature.
  const orientation = settings.orientation === 'landscape' ? 'landscape' : 'portrait'
  const pageAspect = orientation === 'landscape' ? 1 / sizeInfo.aspect : sizeInfo.aspect
  const columns = settings.columns === 2 ? 2 : 1
  const marginPreset = settings.marginPreset || 'normal'
  // 'normal' intentionally leaves marginStyle empty — the existing
  // px-8/py-9/sm:px-12/sm:py-12 classes below keep handling that case.
  const marginStyle = marginPreset === 'normal' ? {} : (() => {
    const px = marginPreset === 'custom'
      ? {
          top: settings.marginCustom?.top ?? 32,
          right: settings.marginCustom?.right ?? 32,
          bottom: settings.marginCustom?.bottom ?? 32,
          left: settings.marginCustom?.left ?? 32,
        }
      : MARGIN_PRESET_PX[marginPreset]
    return {
      paddingTop: `${px.top}px`,
      paddingRight: `${px.right}px`,
      paddingBottom: `${px.bottom}px`,
      paddingLeft: `${px.left}px`,
    }
  })()

  // Feature 9 — border can wrap the whole paper, just the header, both, or nothing.
  const paperBorderClass = border === 'paper' || border === 'both' ? 'border-2 border-ink-800 dark:border-ink-200' : 'border border-ink-200/70 dark:border-ink-800'
  const headerBorderClass = border === 'header' || border === 'both' ? 'border-2 border-ink-800 p-3 dark:border-ink-200' : ''

  // Page Settings — Typography category. fontSize scales via a transform
  // (children use fixed px sizes, not em/rem, so a plain font-size override
  // wouldn't cascade); lineHeight is unitless so it inherits cleanly on its
  // own. 'normal'/'normal' is a true no-op — no transform, no inline style.
  const fontSizePreset = settings.fontSizePreset || 'custom'
  const fontScale = fontSizePreset === 'custom'
    ? (settings.fontSizeCustomPx || DEFAULT_CUSTOM_FONT_SIZE_PX) / CUSTOM_FONT_SIZE_BASE_PX
    : (FONT_SIZE_SCALE[fontSizePreset] || 1)
  const lineHeightPreset = settings.lineHeightPreset || 'normal'
  const lineHeightValue = lineHeightPreset === 'custom'
    ? (settings.lineHeightCustom || 1.5)
    : LINE_HEIGHT_VALUE[lineHeightPreset]
  const typographyStyle = {
    ...(fontScale !== 1 ? { transform: `scale(${fontScale})`, transformOrigin: 'top left', width: `${100 / fontScale}%` } : {}),
    ...(lineHeightValue ? { lineHeight: lineHeightValue } : {}),
  }

  // Page Settings — Spacing category. 'normal' keeps the original
  // mt-6/space-y-7/space-y-4 Tailwind classes untouched; any other preset
  // switches those gaps to inline margins computed from SPACING_PRESET_PX.
  // (Hoisted above the height-sync effect below — that effect's dependency
  // array needs these primitive values too, see the comment there.)
  const spacingPreset = settings.spacingPreset || 'normal'
  const spacingPx = spacingPreset === 'custom'
    ? { ...SPACING_CUSTOM_DEFAULT, ...(settings.spacingCustom || {}) }
    : SPACING_PRESET_PX[spacingPreset]
  const sectionGapStyle = (idx) => (spacingPx && idx > 0 ? { marginTop: `${spacingPx.section}px` } : undefined)
  const questionGapStyle = (idx) => (spacingPx && idx > 0 ? { marginTop: `${spacingPx.question}px` } : undefined)

  // Bug fix (Smart Fix race condition): this effect used to depend on
  // `[fontScale]` only. That's synchronous and safe for font-size changes
  // (fontScale itself changes every time, so React re-runs this layout
  // effect and commits the new wrapper height before the next paint).
  // But once fontScale is already != 1 (transform already active — either
  // the teacher had set a custom font size before opening Smart Fix, or
  // Smart Fix's own font-size rungs already ran), a LATER Smart Fix rung
  // that only tightens spacing/line-height does NOT change fontScale, so
  // this effect wouldn't re-run at all — the wrapper's explicit height
  // would silently fall back to being driven by the `ResizeObserver`
  // instead, which reacts to the resulting size change one extra,
  // non-deterministic tick later (its callback timing isn't guaranteed to
  // land inside the same commit/paint cycle the way a layout-effect
  // re-run is). Smart Fix's settle() only waits a fixed ~110ms between
  // rungs, so on a slower device or a long paper that ResizeObserver tick
  // can still be in flight when the next measurement is taken —
  // measurePageCount() then reads a stale (pre-update) height, and Smart
  // Fix under-corrects, stalls early, or reports the wrong "still doesn't
  // fit" result even though the visual change already landed.
  // Fix: list every knob that changes this block's *unscaled* height
  // (spacing gaps + line height) as explicit dependencies too, so any of
  // them forces this same synchronous layout-effect measure-and-set path
  // — not just fontScale. The ResizeObserver stays in place purely as a
  // fallback for organic content changes (typing, adding an image) that
  // Smart Fix never triggers, so it no longer needs to be Smart Fix's only
  // path for settings-driven changes.
  useLayoutEffect(() => {
    const el = typoContentRef.current
    if (!el || fontScale === 1) { setTypoScaledHeight(null); return undefined }
    const measure = () => setTypoScaledHeight(el.scrollHeight * fontScale)
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fontScale, spacingPx?.header, spacingPx?.section, spacingPx?.question, lineHeightValue])

  // Page Settings — Border & Frame category (extends the plain border
  // dropdown above). Only applies when a border is actually switched on;
  // 'solid'/'medium'/'sharp' are the original look, so no overrides fire.
  const borderStylePreset = settings.borderStyle || 'solid'
  const borderWidthPreset = settings.borderWidth || 'medium'
  const cornerRadiusPreset = settings.cornerRadius || 'sharp'
  const borderLookStyle = (borderStylePreset !== 'solid' || borderWidthPreset !== 'medium')
    ? { borderStyle: borderStylePreset, borderWidth: `${BORDER_WIDTH_PX[borderWidthPreset]}px` }
    : {}
  const cornerRadiusStyle = cornerRadiusPreset === 'rounded' ? { borderRadius: '14px' } : {}

  // Page Settings — Background & Watermark category.
  const pageBgPreset = settings.pageBg || 'default'
  const pageBgStyle = PAGE_BG_COLOR[pageBgPreset] ? { backgroundColor: PAGE_BG_COLOR[pageBgPreset] } : {}
  const watermarkOpacity = WATERMARK_OPACITY_VALUE[settings.watermarkOpacity] ?? WATERMARK_OPACITY_VALUE.light
  const watermarkAngle = settings.watermarkAngle ?? -30

  // Page Settings — Numbering & Footer category.
  const footerAlign = settings.footerAlign || 'center'
  const footerAlignClass = footerAlign === 'left' ? 'text-left' : footerAlign === 'right' ? 'text-right' : 'text-center'
  const pageNumberPosition = settings.pageNumberPosition || 'inline'
  const pageNumberFormat = settings.pageNumberFormat || 'default'
  const pageNumberLabel = pageNumberFormat === 'number' ? '1' : pageNumberFormat === 'ofTotal' ? '1 / 1' : t('a4_page')
  // The footer block (border + "End of Paper" line) is opt-in: it only
  // renders once a teacher actually types Footer Text. Page numbering is a
  // separate, still-on-by-default toggle — when there's no footer to sit
  // inline inside, it falls back to a corner badge instead of disappearing.
  const hasFooterText = !!settings.footerText
  const showPageNumber = settings.showPageNumber !== false
  const numberInFooter = showPageNumber && hasFooterText && pageNumberPosition === 'inline'
  const numberAsCorner = showPageNumber && !numberInFooter

  // SRS 48/49 — deterministic per-set reorder, preview-only (does not mutate the paper).
  // Only shuffles when a Set has actually been picked; numbering (above) uses
  // the exact same order so the printed numbers always match what's shown.
  const orderedQuestions = (group) => orderedQuestionsForSet(group, activeSet, seed)

  return (
    <div
      ref={pageRef}
      id="print-root"
      className={`a4-page relative mx-auto w-full rounded-sm bg-paper-50 px-8 py-9 shadow-page sm:px-12 sm:py-12 ${fontClass} ${paperBorderClass}`}
      style={{ maxWidth: `${sizeInfo.widthPx}px`, aspectRatio: `${pageAspect}`, ...marginStyle, ...(border === 'paper' || border === 'both' ? borderLookStyle : {}), ...cornerRadiusStyle, ...pageBgStyle }}
    >
      {settings.watermarkText && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span
            className="select-none whitespace-nowrap text-6xl font-bold text-ink-900 dark:text-white"
            style={{ transform: `rotate(${watermarkAngle}deg)`, opacity: watermarkOpacity }}
          >
            {settings.watermarkText}
          </span>
        </div>
      )}

      {showAnswerKey && (
        <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          {t('preview_answerKeyBanner')}
        </div>
      )}

      <div style={typoScaledHeight != null ? { height: `${typoScaledHeight}px` } : undefined}>
      <div ref={typoContentRef} style={typographyStyle}>
      {/* Header */}
      <div className={`pb-4 font-display ${tpl.headerRule} ${headerBorderClass}`} style={border === 'header' || border === 'both' ? borderLookStyle : undefined}>
        {settings.headerLayout === 'split' || settings.headerLayout === 'split-both' ? (
          <div className="flex items-center gap-3">
            {settings.headerLogoUrl && <img src={settings.headerLogoUrl} alt="School logo" className="h-12 w-12 shrink-0 rounded-full object-contain" />}
            <div className="flex-1 text-center">
              <p className="text-lg font-bold uppercase tracking-wide text-ink-900">
                {paper.schoolName || t('a4_schoolPlaceholder')}
                {settings.showAddress && settings.address && (
                  <span className="block text-xs font-normal normal-case tracking-normal text-ink-500">({settings.address})</span>
                )}
              </p>
              <p className="mt-1 text-base font-semibold uppercase text-ink-700">{examTitle || t('a4_examPlaceholder')}</p>
            </div>
            {settings.headerLayout === 'split-both' && settings.headerLogoUrl && (
              <img src={settings.headerLogoUrl} alt="School logo" className="h-12 w-12 shrink-0 rounded-full object-contain" />
            )}
          </div>
        ) : (
          <div className="text-center">
            {settings.headerLogoUrl && <img src={settings.headerLogoUrl} alt="School logo" className="mx-auto mb-1.5 h-12 w-12 rounded-full object-contain" />}
            <p className="text-lg font-bold uppercase tracking-wide text-ink-900">
              {paper.schoolName || t('a4_schoolPlaceholder')}
              {settings.showAddress && settings.address && (
                <span className="block text-xs font-normal normal-case tracking-normal text-ink-500">({settings.address})</span>
              )}
            </p>
            <p className="mt-1 text-base font-semibold uppercase text-ink-700">{examTitle || t('a4_examPlaceholder')}</p>
          </div>
        )}
        <div className="mt-3 flex flex-wrap justify-between gap-y-1 text-left text-[13px] font-sans text-ink-700">
          {classSectionLabel(paper) && <span>{t('a4_class')}: <strong>{classSectionLabel(paper)}</strong></span>}
          {resolveSubject(paper) && <span>{t('a4_subject')}: <strong>{resolveSubject(paper)}</strong></span>}
          <span>{t('a4_date')}: <strong>{formatDate(paper.examDate) || '—'}</strong></span>
        </div>
        <div className="mt-1 flex flex-wrap justify-between gap-y-1 text-left text-[13px] font-sans text-ink-700">
          <span>{t('a4_timeAllowed')}: <strong>{formatDuration(paper.duration) || '—'}</strong></span>
          <span>{t('a4_maxMarks')}: <strong>{paper.totalMarks || '—'}</strong></span>
          {/* Feature 8 — nothing is printed here unless a Set was actually picked. */}
          {activeSet && <span>{t('a4_set')}: <strong>{activeSet}</strong></span>}
        </div>

        {/* Feature 1 — optional header instructions list; fully absent when empty. */}
        {instructions.length > 0 && (
          <div className="mt-3 text-left text-[12.5px] text-ink-700">
            <p className="font-bold">{t('headerInstructions_title')}:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {instructions.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Sections */}
      <div
        className={spacingPx ? '' : 'mt-6 space-y-7'}
        style={{
          ...(spacingPx ? { marginTop: `${spacingPx.header}px` } : {}),
          ...(columns === 2 ? { columnCount: 2, columnGap: '2rem' } : {}),
        }}
      >
        {paper.sections.length === 0 && (
          <p className="text-center text-sm italic text-ink-400">{t('preview_noSections')}</p>
        )}
        {paper.sections.map((section, sIdx) => {
          const { obtainableMarks } = computeSectionMarks(section)
          const noticeBox = section.noticeBox
          const sectionShowMarks = section.showMarks !== false
          return (
            <div key={section.id} style={{ ...sectionGapStyle(sIdx), ...(columns === 2 ? { breakInside: 'avoid-column' } : {}) }}>
              {/* Title + marks row is skipped entirely (not just visually
                  hidden) when the section title is off — so a teacher who
                  doesn't want visible sections gets zero extra space and no
                  stray marks badge, not just an invisible title. */}
              {section.showTitle === true && (
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex-1">
                    <EditableLine
                      as="h3"
                      text={section.title}
                      align={section.align || 'left'}
                      onAlign={(align) => updateSection(paper.id, section.id, { align })}
                      onText={(title) => updateSection(paper.id, section.id, { title })}
                      style={section.titleStyle}
                      onStyle={(titleStyle) => updateSection(paper.id, section.id, { titleStyle })}
                      className="font-display text-[15px] font-semibold uppercase tracking-wide text-ink-900"
                      placeholder={`Section ${sectionLetter(sIdx)}`}
                    />
                  </div>
                  <span className="ml-auto flex shrink-0 items-center">
                    <MarksBadge
                      value={obtainableMarks}
                      position={marksPosition}
                      visible={sectionShowMarks}
                      onToggle={() => updateSection(paper.id, section.id, { showMarks: !sectionShowMarks })}
                      t={t}
                    />
                  </span>
                </div>
              )}
              {section.instruction && (
                <div className="mb-3">
                  <EditableLine
                    as="p"
                    text={section.instruction}
                    align={section.instructionAlign || 'left'}
                    onAlign={(align) => updateSection(paper.id, section.id, { instructionAlign: align })}
                    onText={(instruction) => updateSection(paper.id, section.id, { instruction })}
                    style={section.instructionStyle}
                    onStyle={(instructionStyle) => updateSection(paper.id, section.id, { instructionStyle })}
                    className="text-[12.5px] italic text-ink-500"
                  />
                </div>
              )}
              {noticeBox?.enabled && noticeBox.text && (
                <div className="mb-3 rounded border border-ink-300 bg-ink-50/70 px-3 py-2 text-[12px] font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-800/50 dark:text-ink-200">
                  <EditableLine
                    as="p"
                    text={noticeBox.text}
                    align={noticeBox.align || 'left'}
                    onAlign={(align) => updateSection(paper.id, section.id, { noticeBox: { ...noticeBox, align } })}
                    onText={(text) => updateSection(paper.id, section.id, { noticeBox: { ...noticeBox, text } })}
                    style={noticeBox.style}
                    onStyle={(style) => updateSection(paper.id, section.id, { noticeBox: { ...noticeBox, style } })}
                    className="text-[12px] font-medium text-ink-700 dark:text-ink-200"
                  />
                </div>
              )}

              <div className={spacingPx ? '' : 'space-y-3'}>
                {section.questionGroups.map((group, gIdx) => (
                  <div key={group.id} style={questionGapStyle(gIdx)}>
                    {group.pageBreakBefore && (
                      <div className="my-3 flex items-center gap-2 text-[10px] uppercase tracking-wide text-ink-300" style={{ breakBefore: 'page' }}>
                        <span className="h-px flex-1 border-t border-dashed border-ink-300" />
                        Page Break
                        <span className="h-px flex-1 border-t border-dashed border-ink-300" />
                      </div>
                    )}
                    {/* Feature 10 — custom type label shown instead of the picked type, when set.
                        Feature 8 — question-type total marks, same hide/show toggle as a Section's total. */}
                    {(() => {
                      const groupShowMarks = group.showMarks !== false
                      return (
                        <div className="mb-0.5 flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <EditableLine
                              as="p"
                              text={group.customTypeName}
                              align={group.customTypeNameAlign || 'left'}
                              onAlign={(align) => updateQuestionGroup(paper.id, section.id, group.id, { customTypeNameAlign: align })}
                              onText={(customTypeName) => updateQuestionGroup(paper.id, section.id, group.id, { customTypeName })}
                              style={group.customTypeNameStyle}
                              onStyle={(customTypeNameStyle) => updateQuestionGroup(paper.id, section.id, group.id, { customTypeNameStyle })}
                              className="text-[11px] font-semibold italic leading-tight text-ink-400"
                              placeholder={group.questionType}
                            />
                          </div>
                          <MarksBadge
                            value={computeGroupMarks(group).obtainableMarks}
                            position={marksPosition}
                            visible={groupShowMarks}
                            onToggle={() => updateQuestionGroup(paper.id, section.id, group.id, { showMarks: !groupShowMarks })}
                            t={t}
                          />
                        </div>
                      )
                    })()}
                    {group.mode === 'normal' && !group.negativeMarks ? (
                      <div className={group.instruction ? 'mb-1.5' : ''}>
                        <EditableLine
                          as="p"
                          text={group.instruction}
                          align={group.instructionAlign || 'left'}
                          onAlign={(align) => updateQuestionGroup(paper.id, section.id, group.id, { instructionAlign: align })}
                          onText={(instruction) => updateQuestionGroup(paper.id, section.id, group.id, { instruction })}
                          style={group.instructionStyle}
                          onStyle={(instructionStyle) => updateQuestionGroup(paper.id, section.id, group.id, { instructionStyle })}
                          className="text-[12px] italic text-ink-500"
                        />
                      </div>
                    ) : (
                      (group.instruction || group.mode !== 'normal' || group.negativeMarks) && (
                        <p className="mb-1.5 text-[12px] italic text-ink-500">{modeInstruction(group)}</p>
                      )
                    )}
                    {group.questionType === 'Case Study' && group.passage && (
                      <div className="mb-2 rounded border border-ink-200 bg-ink-50/60 p-2.5 dark:border-ink-700 dark:bg-ink-800/40">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gold-600">Case Study</p>
                        <EditableLine
                          as="p"
                          text={group.passage}
                          align={group.passageAlign || 'left'}
                          onAlign={(align) => updateQuestionGroup(paper.id, section.id, group.id, { passageAlign: align })}
                          onText={(passage) => updateQuestionGroup(paper.id, section.id, group.id, { passage })}
                          style={group.passageStyle}
                          onStyle={(passageStyle) => updateQuestionGroup(paper.id, section.id, group.id, { passageStyle })}
                          className="text-[12.5px] italic text-ink-600 dark:text-ink-300"
                        />
                      </div>
                    )}
                    {group.questionType !== 'Case Study' && (group.hasPassage || group.passage) && group.passage && (
                      <div className="mb-2 rounded border border-ink-200 bg-ink-50/60 p-2.5 dark:border-ink-700 dark:bg-ink-800/40">
                        <EditableLine
                          as="p"
                          text={group.passage}
                          align={group.passageAlign || 'left'}
                          onAlign={(align) => updateQuestionGroup(paper.id, section.id, group.id, { passageAlign: align })}
                          onText={(passage) => updateQuestionGroup(paper.id, section.id, group.id, { passage })}
                          style={group.passageStyle}
                          onStyle={(passageStyle) => updateQuestionGroup(paper.id, section.id, group.id, { passageStyle })}
                          className="text-[12.5px] italic text-ink-600 dark:text-ink-300"
                        />
                      </div>
                    )}
                    <ol>
                      {group.mode === 'or' ? (() => {
                        const orShowMarks = group.showMarks !== false
                        const orFirstId = group.questions[0]?.id
                        return (
                        <OrRowWrapper sectionId={section.id} groupId={group.id} questionId={orFirstId} t={t}>
                          <span className="font-semibold shrink-0">{numbering.get(orFirstId)?.display}</span>
                          <div className="flex-1 space-y-1.5">
                            {group.questions.map((question, i) => {
                              const jumpToQuestion = () => useUiStore.getState().requestFocusQuestion(section.id, group.id, question.id)
                              return (
                              <div key={question.id} data-question-el={question.id} data-section-id={section.id} data-group-id={group.id} data-keep-together={question.keepTogether ? 'true' : 'false'} className="flex gap-1.5" style={question.keepTogether ? { breakInside: 'avoid' } : undefined}>
                                <span className="font-semibold shrink-0">({String.fromCharCode(65 + i)})</span>
                                <QuestionBody
                                  question={question} group={group} marksPosition={marksPosition} showAnswerKey={showAnswerKey} t={t}
                                  onJumpToQuestion={jumpToQuestion}
                                  onTextChange={(text) => updateQuestion(paper.id, section.id, group.id, question.id, { text })}
                                  onAlignChange={(align) => updateQuestion(paper.id, section.id, group.id, question.id, { align })}
                                  onStyleChange={(style) => updateQuestion(paper.id, section.id, group.id, question.id, { style })}
                                  onImageResize={(patch) => updateQuestion(paper.id, section.id, group.id, question.id, { image: { ...(question.image || {}), ...patch } })}
                                  onAssertionChange={(assertion) => updateQuestion(paper.id, section.id, group.id, question.id, { assertion })}
                                  onAssertionAlign={(assertionAlign) => updateQuestion(paper.id, section.id, group.id, question.id, { assertionAlign })}
                                  onAssertionStyleChange={(assertionStyle) => updateQuestion(paper.id, section.id, group.id, question.id, { assertionStyle })}
                                  onReasonChange={(reason) => updateQuestion(paper.id, section.id, group.id, question.id, { reason })}
                                  onReasonAlign={(reasonAlign) => updateQuestion(paper.id, section.id, group.id, question.id, { reasonAlign })}
                                  onReasonStyleChange={(reasonStyle) => updateQuestion(paper.id, section.id, group.id, question.id, { reasonStyle })}
                                />
                                {i < group.questions.length - 1 && (
                                  <span className="ml-1 shrink-0 font-display italic text-gold-600">OR</span>
                                )}
                              </div>
                              )
                            })}
                          </div>
                          <MarksBadge
                            value={group.marksPerQuestion}
                            position={marksPosition}
                            visible={orShowMarks}
                            onToggle={() => updateQuestionGroup(paper.id, section.id, group.id, { showMarks: !orShowMarks })}
                            t={t}
                          />
                        </OrRowWrapper>
                        )
                      })() : (
                        orderedQuestions(group).map((question) => {
                          const qShowMarks = question.showMarks !== false
                          const jumpToQuestion = () => useUiStore.getState().requestFocusQuestion(section.id, group.id, question.id)
                          return (
                          <li
                            key={question.id}
                            data-question-el={question.id}
                            data-section-id={section.id}
                            data-group-id={group.id}
                            data-keep-together={question.keepTogether ? 'true' : 'false'}
                            className="group/q relative flex gap-2 text-[13.5px] leading-relaxed text-ink-800"
                            style={{
                              ...(question.keepTogether ? { breakInside: 'avoid' } : {}),
                              // The gap below this question is driven entirely by this
                              // question's own "gap below" line style (default 8px, same
                              // as the old fixed space-y-2 gap). Previously the ol used a
                              // fixed Tailwind space-y-2, so a line's own marginBottom
                              // (applied deep inside the flex item) only ever added on top
                              // of that fixed 8px floor and could never shrink below it.
                              marginBottom: `${question.style?.marginBottom ?? 8}px`,
                            }}
                          >
                            <span className="font-semibold shrink-0">{numbering.get(question.id)?.display}</span>
                            <QuestionBody
                              question={question} group={group} marksPosition={marksPosition} showAnswerKey={showAnswerKey} t={t}
                              onJumpToQuestion={jumpToQuestion}
                              onTextChange={(text) => updateQuestion(paper.id, section.id, group.id, question.id, { text })}
                              onAlignChange={(align) => updateQuestion(paper.id, section.id, group.id, question.id, { align })}
                              onStyleChange={(style) => updateQuestion(paper.id, section.id, group.id, question.id, { style })}
                              onImageResize={(patch) => updateQuestion(paper.id, section.id, group.id, question.id, { image: { ...(question.image || {}), ...patch } })}
                              onAssertionChange={(assertion) => updateQuestion(paper.id, section.id, group.id, question.id, { assertion })}
                              onAssertionAlign={(assertionAlign) => updateQuestion(paper.id, section.id, group.id, question.id, { assertionAlign })}
                              onAssertionStyleChange={(assertionStyle) => updateQuestion(paper.id, section.id, group.id, question.id, { assertionStyle })}
                              onReasonChange={(reason) => updateQuestion(paper.id, section.id, group.id, question.id, { reason })}
                              onReasonAlign={(reasonAlign) => updateQuestion(paper.id, section.id, group.id, question.id, { reasonAlign })}
                              onReasonStyleChange={(reasonStyle) => updateQuestion(paper.id, section.id, group.id, question.id, { reasonStyle })}
                            />
                            <MarksBadge
                              value={questionEffectiveMarks(question)}
                              position={marksPosition}
                              visible={qShowMarks}
                              onToggle={() => updateQuestion(paper.id, section.id, group.id, question.id, { showMarks: !qShowMarks })}
                              t={t}
                            />
                          </li>
                          )
                        })
                      )}
                    </ol>
                  </div>
                ))}
                {section.questionGroups.length === 0 && (
                  <p className="text-xs italic text-ink-300">{t('preview_noQuestions')}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
      </div>
      </div>

      {/* No footer shows by default — the "End of Paper" line and its divider
          only appear once a teacher actually adds Footer Text in Page
          Settings. Page numbering (a separate opt-out toggle, on by default)
          still works even with no footer text: it just falls back to a
          corner badge instead of sitting inline in a footer that isn't there. */}
      {hasFooterText && (
        <div className={`mt-10 border-t border-dashed border-ink-200 pt-2 text-[10px] text-ink-300 ${footerAlignClass}`}>
          <p>{settings.footerText}</p>
          <p>{t('a4_endOfPaper')}{numberInFooter ? ` · ${pageNumberLabel}` : ''}</p>
        </div>
      )}
      {numberAsCorner && (
        <span className={`absolute right-2 text-[10px] text-ink-300 ${pageNumberPosition === 'top-right' ? 'top-2' : 'bottom-2'}`}>
          {pageNumberLabel}
        </span>
      )}

      {/* Sections 3/18 — the Free plan carries a small PaperCraft credit line,
          shown in the live preview and in the printed/exported PDF so what the
          teacher sees is what they get. Paid plans get a clean page.
          NOTE (section 42): this is branding, not a security control. Whether an
          export is actually allowed is decided by the backend, not here. */}
      {!subscriptionActive && (
        <p className="mt-1 text-center text-[8px] uppercase tracking-[0.18em] text-ink-300">
          Created with PaperCraft
        </p>
      )}
    </div>
  )
}
