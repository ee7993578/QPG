import React from 'react'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ImageUploadField } from '../ui/ImageUploadField'
import { useAppStore } from '../../store/useAppStore'

const LETTERS = 'ABCDEFGH'

/** SRS 18 (options can be text or image), 19 (layout) & 50 (mark correct answer for the answer key). */
export function OptionsEditor({ paperId, sectionId, groupId, questionId, options, correctOptionId }) {
  const addOption = useAppStore((s) => s.addOption)
  const updateOption = useAppStore((s) => s.updateOption)
  const deleteOption = useAppStore((s) => s.deleteOption)
  const setCorrectOption = useAppStore((s) => s.setCorrectOption)
  const list = options || []

  return (
    <div className="space-y-1.5">
      {list.map((opt, i) => (
        <div key={opt.id} className="flex items-center gap-1.5">
          <button
            type="button"
            title="Mark as correct answer"
            onClick={() => setCorrectOption(paperId, sectionId, groupId, questionId, opt.id)}
            className={correctOptionId === opt.id ? 'text-emerald-600' : 'text-ink-300 hover:text-ink-500'}
          >
            {correctOptionId === opt.id ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          </button>
          <span className="w-5 shrink-0 text-xs font-mono font-semibold text-ink-400">{LETTERS[i] || i + 1}.</span>
          <Input
            placeholder="Option text"
            value={opt.text}
            onChange={(e) => updateOption(paperId, sectionId, groupId, questionId, opt.id, { text: e.target.value })}
            className="h-8 flex-1 text-xs"
          />
          <ImageUploadField
            label=""
            compact
            value={opt.imageUrl}
            onChange={(url) => updateOption(paperId, sectionId, groupId, questionId, opt.id, { imageUrl: url })}
          />
          <button
            onClick={() => deleteOption(paperId, sectionId, groupId, questionId, opt.id)}
            className="shrink-0 rounded p-1 text-ink-400 hover:bg-red-50 hover:text-pen-red dark:hover:bg-red-900/20"
          ><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => addOption(paperId, sectionId, groupId, questionId)}>
          <Plus className="h-3 w-3" /> Add Option
        </Button>
        <span className="text-[10px] text-ink-400">Tap the circle to mark the correct answer (used by the Answer Key).</span>
      </div>
    </div>
  )
}
