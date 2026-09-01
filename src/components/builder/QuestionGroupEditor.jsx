import React, { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronDown as Chevron, ListChecks, ScissorsLineDashed, GripVertical, Library, SlidersHorizontal, Eye, EyeOff } from 'lucide-react'
import { Select } from '../ui/Select'
import { Input, Label, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { InfoHint } from '../ui/InfoHint'
import { QuestionInput } from './QuestionInput'
import { QuestionBankDialog } from './QuestionBankDialog'
import { useAppStore } from '../../store/useAppStore'
import { computeGroupMarks } from '../../lib/utils'
import { QUESTION_TYPES, GROUP_MODES, OPTION_BASED_TYPES, OPTIONS_LAYOUTS } from '../../data/mockData'
import { useTranslate } from '../../i18n'

// Point 7 — plain number inputs bound directly to a store value fight the
// user: clearing all the digits makes the value snap straight back (e.g. to
// a forced minimum of 1), so it's impossible to select-all and retype. This
// keeps its own local text so the box can go fully blank while typing, and
// only commits a number upstream — blank commits as 0, same as a typed 0.
function NumberField({ value, onCommit, className, min, max, step }) {
  const [text, setText] = useState(value === undefined || value === null ? '' : String(value))

  useEffect(() => {
    const parsedLocal = text === '' ? 0 : Number(text)
    if (Number.isNaN(parsedLocal) || parsedLocal !== (value ?? 0)) {
      setText(value === undefined || value === null ? '' : String(value))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      className={className}
      value={text}
      onChange={(e) => {
        const raw = e.target.value
        setText(raw)
        const num = raw === '' ? 0 : Number(raw)
        if (Number.isNaN(num)) return
        onCommit(num)
      }}
    />
  )
}

export function QuestionGroupEditor({ paperId, sectionId, group, index, total, numbering }) {
  const t = useTranslate()
  const [collapsed, setCollapsed] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const updateQuestionGroup = useAppStore((s) => s.updateQuestionGroup)
  const deleteQuestionGroup = useAppStore((s) => s.deleteQuestionGroup)
  const moveQuestionGroup = useAppStore((s) => s.moveQuestionGroup)
  const reorderQuestionGroups = useAppStore((s) => s.reorderQuestionGroups)
  const reorderQuestions = useAppStore((s) => s.reorderQuestions)
  const addQuestion = useAppStore((s) => s.addQuestion)

  const { providedMarks, obtainableMarks } = computeGroupMarks(group)
  const set = (patch) => updateQuestionGroup(paperId, sectionId, group.id, patch)
  const modeLabel = GROUP_MODES.find((m) => m.value === group.mode)?.label
  // Feature 8 — this question type's total marks can be hidden from the
  // preview, same toggle pattern as a Section's total.
  const showMarks = group.showMarks !== false

  return (
    <div className="rounded-lg border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900/60">
      <div
        className="flex items-center gap-2 border-b border-ink-100 px-3 py-2 dark:border-ink-800"
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/group-id', group.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const draggedId = e.dataTransfer.getData('text/group-id')
          if (draggedId) reorderQuestionGroups(paperId, sectionId, draggedId, group.id)
        }}
      >
        <GripVertical className="h-3.5 w-3.5 cursor-grab text-ink-200 dark:text-ink-700" />
        <button onClick={() => setCollapsed((c) => !c)} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200">
          <Chevron className={`h-4 w-4 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </button>
        <ListChecks className="h-3.5 w-3.5 text-ink-300" />
        <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">{group.customTypeName || group.questionType}</span>
        <Badge variant="gold" className="ml-1">{modeLabel}</Badge>
        <button
          onClick={() => set({ showMarks: !showMarks })}
          title={showMarks ? t('group_hideMarks') : t('group_showMarks')}
          className="ml-auto flex items-center gap-1 rounded p-1 text-xs font-mono text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
        >
          {showMarks ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {obtainableMarks}{providedMarks !== obtainableMarks ? ` / ${providedMarks}` : ''} {t('section_marks')}
        </button>
        <div className="ml-1 flex items-center gap-0.5">
          <button disabled={index === 0} onClick={() => moveQuestionGroup(paperId, sectionId, group.id, -1)} className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800"><ChevronUp className="h-3.5 w-3.5" /></button>
          <button disabled={index === total - 1} onClick={() => moveQuestionGroup(paperId, sectionId, group.id, 1)} className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800"><ChevronDown className="h-3.5 w-3.5" /></button>
          <button onClick={() => deleteQuestionGroup(paperId, sectionId, group.id)} className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-pen-red dark:hover:bg-red-900/20"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div>
              <Label>{t('group_questionType')}</Label>
              <Select
                value={group.questionType}
                onChange={(e) => set({ questionType: e.target.value, customTypeName: e.target.value })}
              >
                {QUESTION_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
              </Select>
            </div>
            <div>
              <Label>{t('group_mode')} <InfoHint text={t('group_mode_info')} /></Label>
              <Select value={group.mode} onChange={(e) => set({ mode: e.target.value })}>
                {GROUP_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>{group.mode === 'or' ? t('group_options') : t('group_questions')}</Label>
              <NumberField
                min="0"
                value={group.questionCount}
                onCommit={(num) => set({ questionCount: Math.max(0, num) })}
              />
            </div>
            {group.mode === 'attempt_any' ? (
              <div>
                <Label>{t('group_attempt')}</Label>
                <NumberField
                  min="0" max={group.questionCount}
                  value={group.attemptCount}
                  onCommit={(num) => set({ attemptCount: Math.max(0, num) })}
                />
              </div>
            ) : (
              <div>
                <Label>{t('group_marksPerQuestion')}</Label>
                <NumberField
                  min="0" step="0.5"
                  value={group.marksPerQuestion}
                  onCommit={(num) => set({ marksPerQuestion: num })}
                />
              </div>
            )}
          </div>
          {group.mode === 'attempt_any' && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div>
                <Label>{t('group_marksPerQuestion')}</Label>
                <NumberField
                  min="0" step="0.5"
                  value={group.marksPerQuestion}
                  onCommit={(num) => set({ marksPerQuestion: num })}
                />
              </div>
            </div>
          )}

          <div>
            <Label>{t('group_questionTypeName')} ({t('common_optional')})</Label>
            <Input
              placeholder={group.questionType}
              value={group.customTypeName || ''}
              onChange={(e) => set({ customTypeName: e.target.value })}
              title={t('group_typeName')}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-700 dark:hover:text-gold-300"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> {showMore ? t('common_lessOptions') : t('common_moreOptions')}
          </button>

          {showMore && (
            <div className="space-y-3 rounded-lg bg-ink-50/60 p-3 dark:bg-ink-800/30">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div>
                  <Label>{t('group_negativeMarks')} <InfoHint text={t('group_negativeMarks_info')} /></Label>
                  <NumberField
                    min="0" step="0.25"
                    value={group.negativeMarks ?? 0}
                    onCommit={(num) => set({ negativeMarks: num })}
                  />
                </div>
                {OPTION_BASED_TYPES.includes(group.questionType) && (
                  <div>
                    <Label>{t('group_optionsLayout')}</Label>
                    <Select value={group.optionsLayout || 'vertical'} onChange={(e) => set({ optionsLayout: e.target.value })}>
                      {OPTIONS_LAYOUTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  </div>
                )}
                <div className="col-span-2 flex flex-wrap items-end gap-x-4 gap-y-2 pb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-ink-600 dark:text-ink-300">
                    <input type="checkbox" checked={!!group.hasPassage} onChange={(e) => set({ hasPassage: e.target.checked })} />
                    {t('group_commonPassage')}
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-ink-600 dark:text-ink-300">
                    <input type="checkbox" checked={!!group.pageBreakBefore} onChange={(e) => set({ pageBreakBefore: e.target.checked })} />
                    <ScissorsLineDashed className="h-3.5 w-3.5" /> {t('group_pageBreak')}
                  </label>
                  {/* Feature 3 — restart numbering inside this question type, same as Section, auto-selected by default. */}
                  <label className="flex items-center gap-1.5 text-xs font-medium text-ink-600 dark:text-ink-300">
                    <input type="checkbox" checked={group.restartNumbering !== false} onChange={(e) => set({ restartNumbering: e.target.checked })} />
                    {t('group_restartNumbering')}
                    <InfoHint text={t('section_restartNumbering_info')} />
                  </label>
                </div>
              </div>

              {(group.hasPassage || group.passage) && (
                <div>
                  <Label>{t('group_passageLabel')}</Label>
                  <Textarea
                    rows={3}
                    placeholder={t('group_passagePlaceholder')}
                    value={group.passage || ''}
                    onChange={(e) => set({ passage: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-0.5 border-t border-dashed border-ink-100 pt-2 dark:border-ink-800">
            {group.questions.map((question, qIdx) => {
              const num = numbering.get(question.id)
              const label = group.mode === 'or'
                ? (qIdx === 0 ? `${num?.number}.` : `(${num?.optionLabel})`)
                : `${num?.number}.`
              return (
                <div
                  key={question.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/question-id', question.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const draggedId = e.dataTransfer.getData('text/question-id')
                    if (draggedId) reorderQuestions(paperId, sectionId, group.id, draggedId, question.id)
                  }}
                >
                  <QuestionInput
                    paperId={paperId}
                    sectionId={sectionId}
                    groupId={group.id}
                    group={group}
                    question={question}
                    index={qIdx}
                    total={group.questions.length}
                    label={label}
                  />
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => addQuestion(paperId, sectionId, group.id)}>
              <Plus className="h-3.5 w-3.5" /> {group.mode === 'or' ? t('group_addOption') : t('group_addQuestion')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setBankOpen(true)}>
              <Library className="h-3.5 w-3.5" /> {t('group_insertFromBank')}
            </Button>
          </div>
          <QuestionBankDialog
            open={bankOpen}
            onClose={() => setBankOpen(false)}
            paperId={paperId}
            sectionId={sectionId}
            groupId={group.id}
          />
        </div>
      )}
    </div>
  )
}
