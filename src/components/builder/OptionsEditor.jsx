import React, { useState } from 'react'
import { Trash2, CheckCircle2, Circle, ImagePlus } from 'lucide-react'
import { Input } from '../ui/Input'
import { ImageUploadField } from '../ui/ImageUploadField'
import { useAppStore } from '../../store/useAppStore'

const LETTERS = 'ABCDEFGH'

/**
 * SRS 18 (options can be text or image), 19 (layout) & 50 (mark correct
 * answer for the answer key). "Add Option" itself lives in the question's
 * ⋮ menu (QuestionInput) — this component only lays out the options that
 * already exist.
 *
 * Each option gets its own bordered row so it's obvious where one option
 * ends and the next starts on a small phone screen. The per-option image
 * upload is tucked behind a small "Add image" link instead of always
 * showing inline — with it gone, the option-text box gets the full row
 * width instead of fighting three other controls for space.
 */
export function OptionsEditor({ paperId, sectionId, groupId, questionId, options, correctOptionId }) {
  const updateOption = useAppStore((s) => s.updateOption)
  const deleteOption = useAppStore((s) => s.deleteOption)
  const setCorrectOption = useAppStore((s) => s.setCorrectOption)
  const list = options || []
  const [openImageFor, setOpenImageFor] = useState(() => new Set())

  const toggleImage = (id) => {
    setOpenImageFor((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {list.map((opt, i) => {
        const showImage = openImageFor.has(opt.id) || !!opt.imageUrl
        return (
          <div key={opt.id} className="rounded-lg border border-ink-100 p-2 dark:border-ink-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="Mark as correct answer"
                onClick={() => setCorrectOption(paperId, sectionId, groupId, questionId, opt.id)}
                className={`shrink-0 rounded p-2 sm:p-1 ${correctOptionId === opt.id ? 'text-emerald-600' : 'text-ink-300 hover:text-ink-500'}`}
              >
                {correctOptionId === opt.id ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              </button>
              <span className="w-5 shrink-0 text-xs font-mono font-semibold text-ink-400">{LETTERS[i] || i + 1}.</span>
              <Input
                placeholder="Option text"
                value={opt.text}
                onChange={(e) => updateOption(paperId, sectionId, groupId, questionId, opt.id, { text: e.target.value })}
                className="h-9 min-w-0 flex-1 text-sm"
              />
              <button
                onClick={() => deleteOption(paperId, sectionId, groupId, questionId, opt.id)}
                title="Delete this option"
                className="shrink-0 rounded p-2.5 sm:p-1.5 text-ink-400 hover:bg-red-50 hover:text-pen-red dark:hover:bg-red-900/20"
              ><Trash2 className="h-3.5 w-3.5" /></button>
            </div>

            <div className="mt-1.5 pl-7">
              {showImage ? (
                <ImageUploadField
                  label="Option image (optional)"
                  value={opt.imageUrl}
                  onChange={(url) => updateOption(paperId, sectionId, groupId, questionId, opt.id, { imageUrl: url })}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleImage(opt.id)}
                  className="flex items-center gap-1 text-[11px] font-medium text-ink-400 hover:text-ink-700 dark:hover:text-gold-300"
                >
                  <ImagePlus className="h-3 w-3" /> Add image to this option
                </button>
              )}
            </div>
          </div>
        )
      })}
      {list.length > 0 && (
        <p className="pl-1 text-[10px] text-ink-400">Tap the circle next to an option to mark it as the correct answer (used by the Answer Key).</p>
      )}
    </div>
  )
}
