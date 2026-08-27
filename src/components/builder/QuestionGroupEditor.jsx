import React, { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronDown as Chevron, ListChecks } from 'lucide-react'
import { Select } from '../ui/Select'
import { Input, Label } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { QuestionInput } from './QuestionInput'
import { useAppStore } from '../../store/useAppStore'
import { computeGroupMarks, sectionLetter } from '../../lib/utils'
import { QUESTION_TYPES, GROUP_MODES } from '../../data/mockData'

export function QuestionGroupEditor({ paperId, sectionId, group, index, total, numbering }) {
  const [collapsed, setCollapsed] = useState(false)
  const updateQuestionGroup = useAppStore((s) => s.updateQuestionGroup)
  const deleteQuestionGroup = useAppStore((s) => s.deleteQuestionGroup)
  const moveQuestionGroup = useAppStore((s) => s.moveQuestionGroup)
  const addQuestion = useAppStore((s) => s.addQuestion)

  const { providedMarks, obtainableMarks } = computeGroupMarks(group)
  const set = (patch) => updateQuestionGroup(paperId, sectionId, group.id, patch)

  return (
    <div className="rounded-lg border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900/60">
      <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2 dark:border-ink-800">
        <button onClick={() => setCollapsed((c) => !c)} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200">
          <Chevron className={`h-4 w-4 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </button>
        <ListChecks className="h-3.5 w-3.5 text-ink-300" />
        <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">{group.questionType}</span>
        <Badge variant="gold" className="ml-1">{GROUP_MODES.find((m) => m.value === group.mode)?.label}</Badge>
        <span className="ml-auto text-xs font-mono text-ink-400">
          {obtainableMarks}{providedMarks !== obtainableMarks ? ` / ${providedMarks}` : ''} marks
        </span>
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
              <Label>Question Type</Label>
              <Select value={group.questionType} onChange={(e) => set({ questionType: e.target.value })}>
                {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={group.mode} onChange={(e) => set({ mode: e.target.value })}>
                {GROUP_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>{group.mode === 'or' ? 'Options' : 'Questions'}</Label>
              <Input
                type="number" min="1"
                value={group.questionCount}
                onChange={(e) => set({ questionCount: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
            {group.mode === 'attempt_any' ? (
              <div>
                <Label>Attempt</Label>
                <Input
                  type="number" min="1" max={group.questionCount}
                  value={group.attemptCount}
                  onChange={(e) => set({ attemptCount: Math.min(group.questionCount, Math.max(1, Number(e.target.value) || 1)) })}
                />
              </div>
            ) : (
              <div>
                <Label>Marks / Question</Label>
                <Input
                  type="number" min="0" step="0.5"
                  value={group.marksPerQuestion}
                  onChange={(e) => set({ marksPerQuestion: Number(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>
          {group.mode === 'attempt_any' && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div>
                <Label>Marks / Question</Label>
                <Input
                  type="number" min="0" step="0.5"
                  value={group.marksPerQuestion}
                  onChange={(e) => set({ marksPerQuestion: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}

          <div>
            <Label>Instruction (optional)</Label>
            <Input
              placeholder="e.g. Attempt all questions."
              value={group.instruction}
              onChange={(e) => set({ instruction: e.target.value })}
            />
          </div>

          <div className="space-y-0.5 border-t border-dashed border-ink-100 pt-2 dark:border-ink-800">
            {group.questions.map((question, qIdx) => {
              const num = numbering.get(question.id)
              const label = group.mode === 'or'
                ? (qIdx === 0 ? `${num?.number}.` : `(${num?.optionLabel})`)
                : `${num?.number}.`
              return (
                <QuestionInput
                  key={question.id}
                  paperId={paperId}
                  sectionId={sectionId}
                  groupId={group.id}
                  question={question}
                  index={qIdx}
                  total={group.questions.length}
                  label={label}
                />
              )
            })}
          </div>

          <Button size="sm" variant="outline" onClick={() => addQuestion(paperId, sectionId, group.id)}>
            <Plus className="h-3.5 w-3.5" /> Add {group.mode === 'or' ? 'Option' : 'Question'}
          </Button>
        </div>
      )}
    </div>
  )
}
