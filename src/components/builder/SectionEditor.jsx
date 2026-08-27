import React from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Input, Label } from '../ui/Input'
import { Button } from '../ui/Button'
import { QuestionGroupEditor } from './QuestionGroupEditor'
import { useAppStore } from '../../store/useAppStore'
import { sectionLetter, computeSectionMarks } from '../../lib/utils'

export function SectionEditor({ paperId, section, index, total, numbering }) {
  const updateSection = useAppStore((s) => s.updateSection)
  const deleteSection = useAppStore((s) => s.deleteSection)
  const moveSection = useAppStore((s) => s.moveSection)
  const addQuestionGroup = useAppStore((s) => s.addQuestionGroup)

  const { obtainableMarks } = computeSectionMarks(section)

  return (
    <div className="rounded-xl2 border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 dark:border-ink-800">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-700 font-display text-sm font-bold text-white dark:bg-gold-400 dark:text-ink-950">
          {sectionLetter(index)}
        </span>
        <Input
          value={section.title}
          onChange={(e) => updateSection(paperId, section.id, { title: e.target.value })}
          className="h-9 flex-1 font-semibold"
          placeholder="Section title"
        />
        <span className="hidden shrink-0 font-mono text-xs text-ink-400 sm:inline">{obtainableMarks} marks</span>
        <div className="flex shrink-0 items-center gap-0.5">
          <button disabled={index === 0} onClick={() => moveSection(paperId, section.id, -1)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800"><ChevronUp className="h-4 w-4" /></button>
          <button disabled={index === total - 1} onClick={() => moveSection(paperId, section.id, 1)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800"><ChevronDown className="h-4 w-4" /></button>
          <button onClick={() => deleteSection(paperId, section.id)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-pen-red dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <Label>Section Instruction (optional)</Label>
          <Input
            value={section.instruction}
            onChange={(e) => updateSection(paperId, section.id, { instruction: e.target.value })}
            placeholder="e.g. All questions are compulsory."
          />
        </div>

        <div className="space-y-3">
          {section.questionGroups.map((group, gIdx) => (
            <QuestionGroupEditor
              key={group.id}
              paperId={paperId}
              sectionId={section.id}
              group={group}
              index={gIdx}
              total={section.questionGroups.length}
              numbering={numbering}
            />
          ))}
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => addQuestionGroup(paperId, section.id, { questionType: 'MCQ', mode: 'normal', questionCount: 3, marksPerQuestion: 1 })}
        >
          <Plus className="h-3.5 w-3.5" /> Add Question Group
        </Button>
      </div>
    </div>
  )
}
