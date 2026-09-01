import React, { useRef, useState } from 'react'
import {
  Copy, Trash2, ChevronUp, ChevronDown, GripVertical, Image as ImageIcon,
  PenSquare, ListPlus, Pin, PinOff, Languages, Maximize2,
} from 'lucide-react'
import { Textarea, Input, Label } from '../ui/Input'
import { ImageUploadField } from '../ui/ImageUploadField'
import { useAppStore } from '../../store/useAppStore'
import { SymbolPalette } from './SymbolPalette'
import { AnswerSpaceEditor } from './AnswerSpaceEditor'
import { SubQuestionsEditor } from './SubQuestionsEditor'
import { OptionsEditor } from './OptionsEditor'
import { MatchPairsEditor } from './MatchPairsEditor'
import { TableGridEditor } from './TableGridEditor'
import { FullscreenTextEditor } from './FullscreenTextEditor'
import { OPTION_BASED_TYPES } from '../../data/mockData'
import { useTranslate } from '../../i18n'

export function QuestionInput({ paperId, sectionId, groupId, group, question, index, total, label }) {
  const t = useTranslate()
  const updateQuestion = useAppStore((s) => s.updateQuestion)
  const deleteQuestion = useAppStore((s) => s.deleteQuestion)
  const duplicateQuestion = useAppStore((s) => s.duplicateQuestion)
  const moveQuestion = useAppStore((s) => s.moveQuestion)

  const textRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [showImage, setShowImage] = useState(!!question.image?.url)
  const [showAnswerSpace, setShowAnswerSpace] = useState((question.answerSpace?.type || 'none') !== 'none')
  const [showSubParts, setShowSubParts] = useState((question.subQuestions || []).length > 0)

  const questionType = group?.questionType || 'Custom'
  const set = (patch) => updateQuestion(paperId, sectionId, groupId, question.id, patch)

  const insertSymbolIntoText = (sym) => {
    const el = textRef.current
    if (!el) { set({ text: `${question.text || ''}${sym}` }); return }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const next = `${question.text.slice(0, start)}${sym}${question.text.slice(end)}`
    set({ text: next })
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + sym.length })
  }

  // SRS 37 — strip Word/HTML formatting on paste, keep plain text only.
  const handlePaste = (e) => {
    e.preventDefault()
    const plain = e.clipboardData.getData('text/plain')
    const el = textRef.current
    const start = el?.selectionStart ?? (question.text || '').length
    const end = el?.selectionEnd ?? (question.text || '').length
    const next = `${(question.text || '').slice(0, start)}${plain}${(question.text || '').slice(end)}`
    set({ text: next })
  }

  const isAssertionReason = questionType === 'Assertion-Reason'
  const isMatch = questionType === 'Match the Following'
  const isTable = questionType === 'Table/Grid'
  const hasOptions = OPTION_BASED_TYPES.includes(questionType) && !isAssertionReason

  return (
    <div className="group/q flex items-start gap-2 rounded-lg border border-transparent px-1 py-1.5 hover:border-ink-100 hover:bg-ink-50/60 dark:hover:border-ink-800 dark:hover:bg-ink-800/40">
      <GripVertical className="mt-2.5 h-4 w-4 shrink-0 cursor-grab text-ink-200 dark:text-ink-700" />
      <span className="mt-2.5 w-8 shrink-0 text-xs font-mono font-semibold text-ink-400">{label}</span>

      <div className="flex-1 space-y-1.5">
        {/* ---- Main content, branching by question type ---- */}
        {isAssertionReason && (
          <div className="space-y-1.5">
            <Textarea rows={1} placeholder="Assertion (A): …" value={question.assertion || ''} onChange={(e) => set({ assertion: e.target.value })} className="text-xs" />
            <Textarea rows={1} placeholder="Reason (R): …" value={question.reason || ''} onChange={(e) => set({ reason: e.target.value })} className="text-xs" />
          </div>
        )}

        {isMatch && (
          <MatchPairsEditor
            paperId={paperId} sectionId={sectionId} groupId={groupId} questionId={question.id}
            matchPairs={question.matchPairs} matchColumnHeads={question.matchColumnHeads}
          />
        )}

        {isTable && (
          <>
            <Textarea rows={1} placeholder="Instruction, e.g. Complete the table:" value={question.text} onChange={(e) => set({ text: e.target.value })} className="text-xs" />
            <TableGridEditor paperId={paperId} sectionId={sectionId} groupId={groupId} questionId={question.id} tableGrid={question.tableGrid} />
          </>
        )}

        {!isAssertionReason && !isMatch && !isTable && (
          <div className="relative space-y-1">
            <Textarea
              ref={textRef}
              rows={2}
              dir={question.dir === 'rtl' ? 'rtl' : 'ltr'}
              placeholder={t('q_typeHere')}
              value={question.text}
              onChange={(e) => set({ text: e.target.value })}
              onPaste={handlePaste}
              className={`pr-8 ${question.dir === 'rtl' ? 'text-right' : ''}`}
            />
            <button
              type="button"
              onClick={() => setExpanded(true)}
              title="Expand — edit full question with formatting tools"
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded text-ink-300 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-700 dark:hover:text-ink-200"
            ><Maximize2 className="h-3.5 w-3.5" /></button>
            <FullscreenTextEditor
              open={expanded}
              onClose={() => setExpanded(false)}
              value={question.text}
              onChange={(text) => set({ text })}
              placeholder={t('q_typeHere')}
              dir={question.dir}
            />
          </div>
        )}

        {hasOptions && (
          <OptionsEditor
            paperId={paperId} sectionId={sectionId} groupId={groupId} questionId={question.id}
            options={question.options} correctOptionId={question.correctOptionId}
          />
        )}

        {/* ---- Optional content blocks: image / answer space / sub-parts ---- */}
        {showImage && (
          <div className="flex flex-wrap items-end gap-2 rounded-md bg-ink-50/70 p-2 dark:bg-ink-800/40">
            <ImageUploadField
              label="Image (upload or URL)"
              value={question.image?.url || ''}
              onChange={(url) => set({ image: { ...(question.image || { width: 50, caption: '' }), url } })}
            />
            <div>
              <Label>Width %</Label>
              <Input
                type="number" min="10" max="100" className="h-8 w-16 text-xs"
                value={question.image?.width ?? 50}
                onChange={(e) => set({ image: { ...(question.image || { url: '', caption: '' }), width: Number(e.target.value) || 50 } })}
              />
            </div>
            <div className="flex-1 min-w-[10rem]">
              <Label>Caption (optional)</Label>
              <Input
                placeholder="Fig. 1: …"
                value={question.image?.caption || ''}
                onChange={(e) => set({ image: { ...(question.image || { url: '', width: 50 }), caption: e.target.value } })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}

        {showAnswerSpace && (
          <AnswerSpaceEditor value={question.answerSpace} onChange={(v) => set({ answerSpace: v })} />
        )}

        {showSubParts && (
          <SubQuestionsEditor
            paperId={paperId} sectionId={sectionId} groupId={groupId} questionId={question.id}
            subQuestions={question.subQuestions}
          />
        )}

        {/* ---- Toggle row for the optional blocks above ---- */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] text-ink-400">
          <button type="button" onClick={() => setShowImage((v) => !v)} className="flex items-center gap-1 hover:text-ink-700 dark:hover:text-ink-200">
            <ImageIcon className="h-3 w-3" /> {showImage ? t('q_removeImage') : t('q_addImage')}
          </button>
          {!isMatch && !isTable && (
            <button type="button" onClick={() => setShowAnswerSpace((v) => !v)} className="flex items-center gap-1 hover:text-ink-700 dark:hover:text-ink-200">
              <PenSquare className="h-3 w-3" /> {showAnswerSpace ? t('q_removeAnswerSpace') : t('q_addAnswerSpace')}
            </button>
          )}
          {!isMatch && !isTable && !isAssertionReason && (
            <button type="button" onClick={() => setShowSubParts((v) => !v)} className="flex items-center gap-1 hover:text-ink-700 dark:hover:text-ink-200">
              <ListPlus className="h-3 w-3" /> {showSubParts ? t('q_removeSubParts') : t('q_addSubParts')}
            </button>
          )}
        </div>
      </div>

      <div className="mt-1 flex shrink-0 flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover/q:opacity-100 sm:flex-row sm:flex-wrap sm:justify-end sm:max-w-[7.5rem]">
        <SymbolPalette onInsert={insertSymbolIntoText} />
        <button
          onClick={() => set({ dir: question.dir === 'rtl' ? 'ltr' : 'rtl' })}
          className={`rounded p-1 hover:bg-ink-100 dark:hover:bg-ink-700 ${question.dir === 'rtl' ? 'text-gold-600' : 'text-ink-400'}`}
          title={t('q_rtl')}
        ><Languages className="h-3.5 w-3.5" /></button>
        <button
          onClick={() => set({ keepTogether: !question.keepTogether })}
          className={`rounded p-1 hover:bg-ink-100 dark:hover:bg-ink-700 ${question.keepTogether ? 'text-gold-600' : 'text-ink-400'}`}
          title={t('q_keepTogether')}
        >{question.keepTogether ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}</button>
        <button
          disabled={index === 0}
          onClick={() => moveQuestion(paperId, sectionId, groupId, question.id, -1)}
          className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-700"
          title={t('common_moveUp') || 'Move up'}
        ><ChevronUp className="h-3.5 w-3.5" /></button>
        <button
          disabled={index === total - 1}
          onClick={() => moveQuestion(paperId, sectionId, groupId, question.id, 1)}
          className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-700"
          title={t('common_moveDown') || 'Move down'}
        ><ChevronDown className="h-3.5 w-3.5" /></button>
        <button
          onClick={() => duplicateQuestion(paperId, sectionId, groupId, question.id)}
          className="rounded p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700"
          title={t('common_duplicate')}
        ><Copy className="h-3.5 w-3.5" /></button>
        <button
          onClick={() => deleteQuestion(paperId, sectionId, groupId, question.id)}
          className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-pen-red dark:hover:bg-red-900/20"
          title={t('common_delete')}
        ><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  )
}
