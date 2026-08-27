import React from 'react'
import { Copy, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import { Textarea } from '../ui/Input'
import { useAppStore } from '../../store/useAppStore'

export function QuestionInput({ paperId, sectionId, groupId, question, index, total, label }) {
  const updateQuestion = useAppStore((s) => s.updateQuestion)
  const deleteQuestion = useAppStore((s) => s.deleteQuestion)
  const duplicateQuestion = useAppStore((s) => s.duplicateQuestion)
  const moveQuestion = useAppStore((s) => s.moveQuestion)

  return (
    <div className="group flex items-start gap-2 rounded-lg border border-transparent px-1 py-1.5 hover:border-ink-100 hover:bg-ink-50/60 dark:hover:border-ink-800 dark:hover:bg-ink-800/40">
      <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-ink-200 dark:text-ink-700" />
      <span className="mt-2.5 w-8 shrink-0 text-xs font-mono font-semibold text-ink-400">{label}</span>
      <Textarea
        rows={2}
        placeholder="Type the question here…"
        value={question.text}
        onChange={(e) => updateQuestion(paperId, sectionId, groupId, question.id, { text: e.target.value })}
        className="flex-1"
      />
      <div className="mt-1 flex shrink-0 flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 sm:flex-row">
        <button
          disabled={index === 0}
          onClick={() => moveQuestion(paperId, sectionId, groupId, question.id, -1)}
          className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-700"
          title="Move up"
        ><ChevronUp className="h-3.5 w-3.5" /></button>
        <button
          disabled={index === total - 1}
          onClick={() => moveQuestion(paperId, sectionId, groupId, question.id, 1)}
          className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-700"
          title="Move down"
        ><ChevronDown className="h-3.5 w-3.5" /></button>
        <button
          onClick={() => duplicateQuestion(paperId, sectionId, groupId, question.id)}
          className="rounded p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700"
          title="Duplicate"
        ><Copy className="h-3.5 w-3.5" /></button>
        <button
          onClick={() => deleteQuestion(paperId, sectionId, groupId, question.id)}
          className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-pen-red dark:hover:bg-red-900/20"
          title="Delete"
        ><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  )
}
