import React from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Textarea, Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { DropdownMenu, DropdownMenuButton, MenuItem, MenuSeparator } from '../ui/DropdownMenu'
import { useTranslate } from '../../i18n'

/**
 * SRS 16 (sub-questions a/b/c with own marks) and 17 (OR choice nested
 * inside a sub-question).
 */
export function SubQuestionsEditor({ paperId, sectionId, groupId, questionId, subQuestions }) {
  const t = useTranslate()
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
          <div className="flex flex-col gap-1.5 rounded-lg border border-ink-100 p-2 dark:border-ink-800 sm:flex-row sm:items-start sm:border-0 sm:p-0">
            <div className="flex items-start gap-1.5">
              <span className="mt-2 w-6 shrink-0 text-xs font-mono font-semibold text-ink-400">({sq.label})</span>
              <Textarea
                rows={1}
                placeholder={`Sub-part (${sq.label})…`}
                value={sq.text}
                onChange={(e) => updateSubQuestion(paperId, sectionId, groupId, questionId, sq.id, { text: e.target.value })}
                className="min-w-0 flex-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 pl-8 sm:pl-0">
              <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-ink-400">
                Marks
                <Input
                  type="number" min="0" step="0.5"
                  value={sq.marks}
                  onChange={(e) => updateSubQuestion(paperId, sectionId, groupId, questionId, sq.id, { marks: Number(e.target.value) || 0 })}
                  className="h-9 w-16 text-sm sm:mt-0.5"
                />
              </label>
              <div className="ml-auto shrink-0 sm:ml-0 sm:mt-0.5">
                <DropdownMenu trigger={<DropdownMenuButton title={t('common_moreOptions')} />}>
                  <MenuItem icon={ChevronUp} disabled={i === 0} onClick={() => moveSubQuestion(paperId, sectionId, groupId, questionId, sq.id, -1)}>
                    {t('common_moveUp')}
                  </MenuItem>
                  <MenuItem icon={ChevronDown} disabled={i === list.length - 1} onClick={() => moveSubQuestion(paperId, sectionId, groupId, questionId, sq.id, 1)}>
                    {t('common_moveDown')}
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem icon={Trash2} danger onClick={() => deleteSubQuestion(paperId, sectionId, groupId, questionId, sq.id)}>
                    {t('common_delete')}
                  </MenuItem>
                </DropdownMenu>
              </div>
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
