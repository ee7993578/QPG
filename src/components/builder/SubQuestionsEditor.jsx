import React from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Textarea, Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'

/**
 * SRS 16 (sub-questions a/b/c with own marks) and 17 (OR choice nested
 * inside a sub-question).
 */
export function SubQuestionsEditor({ paperId, sectionId, groupId, questionId, subQuestions }) {
  const addSubQuestion = useAppStore((s) => s.addSubQuestion)
  const updateSubQuestion = useAppStore((s) => s.updateSubQuestion)
  const deleteSubQuestion = useAppStore((s) => s.deleteSubQuestion)
  const moveSubQuestion = useAppStore((s) => s.moveSubQuestion)

  const list = subQuestions || []

  return (
    <div className="ml-2 space-y-1.5 border-l-2 border-dashed border-ink-100 pl-3 dark:border-ink-800">
      {list.map((sq, i) => (
        <div key={sq.id} className="space-y-1">
          {sq.orWith && (
            <p className="text-[10px] font-semibold italic text-gold-600">— OR —</p>
          )}
          <div className="flex items-start gap-1.5">
            <span className="mt-2 w-5 shrink-0 text-xs font-mono font-semibold text-ink-400">({sq.label})</span>
            <Textarea
              rows={1}
              placeholder={`Sub-part (${sq.label})…`}
              value={sq.text}
              onChange={(e) => updateSubQuestion(paperId, sectionId, groupId, questionId, sq.id, { text: e.target.value })}
              className="flex-1 text-xs"
            />
            <Input
              type="number" min="0" step="0.5"
              value={sq.marks}
              onChange={(e) => updateSubQuestion(paperId, sectionId, groupId, questionId, sq.id, { marks: Number(e.target.value) || 0 })}
              className="mt-0.5 h-8 w-14 text-xs"
              title="Marks"
            />
            <div className="mt-0.5 flex shrink-0 items-center gap-0.5">
              <button
                disabled={i === 0}
                onClick={() => moveSubQuestion(paperId, sectionId, groupId, questionId, sq.id, -1)}
                className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-700"
              ><ChevronUp className="h-3 w-3" /></button>
              <button
                disabled={i === list.length - 1}
                onClick={() => moveSubQuestion(paperId, sectionId, groupId, questionId, sq.id, 1)}
                className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-700"
              ><ChevronDown className="h-3 w-3" /></button>
              <button
                onClick={() => deleteSubQuestion(paperId, sectionId, groupId, questionId, sq.id)}
                className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-pen-red dark:hover:bg-red-900/20"
              ><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
          {i > 0 && (
            <label className="ml-6 flex items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-400">
              <input
                type="checkbox"
                checked={!!sq.orWith}
                onChange={(e) => updateSubQuestion(paperId, sectionId, groupId, questionId, sq.id, { orWith: e.target.checked })}
              />
              This part is an OR alternative to the previous part
            </label>
          )}
        </div>
      ))}
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => addSubQuestion(paperId, sectionId, groupId, questionId)}>
        <Plus className="h-3 w-3" /> Add Sub-part
      </Button>
    </div>
  )
}
