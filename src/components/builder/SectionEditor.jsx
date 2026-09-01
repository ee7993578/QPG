import React, { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Copy, GripVertical, AlignLeft, AlignCenter, AlignRight, SlidersHorizontal, Eye, EyeOff } from 'lucide-react'
import { Input, Label, Textarea } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { InfoHint } from '../ui/InfoHint'
import { QuestionGroupEditor } from './QuestionGroupEditor'
import { useAppStore } from '../../store/useAppStore'
import { computeSectionMarks } from '../../lib/utils'
import { NUMBERING_STYLES } from '../../data/mockData'
import { useTranslate } from '../../i18n'

const ALIGN_OPTIONS = [
  { value: 'left', Icon: AlignLeft },
  { value: 'center', Icon: AlignCenter },
  { value: 'right', Icon: AlignRight },
]

export function SectionEditor({ paperId, section, index, total, numbering }) {
  const t = useTranslate()
  const [showMore, setShowMore] = useState(false)
  const updateSection = useAppStore((s) => s.updateSection)
  const deleteSection = useAppStore((s) => s.deleteSection)
  const duplicateSection = useAppStore((s) => s.duplicateSection)
  const moveSection = useAppStore((s) => s.moveSection)
  const reorderSections = useAppStore((s) => s.reorderSections)
  const addQuestionGroup = useAppStore((s) => s.addQuestionGroup)
  const noticeBox = section.noticeBox || { enabled: false, text: '' }
  const align = section.align || 'left'
  // Marks display on this row defaults ON; the section name defaults HIDDEN
  // (on the printed paper) until the teacher deliberately reveals it.
  const showMarks = section.showMarks !== false
  const showTitle = section.showTitle === true
  const instructionEnabled = !!section.instructionEnabled

  const { obtainableMarks } = computeSectionMarks(section)

  return (
    <div className="rounded-xl2 border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
      <div
        className="border-b border-ink-100 px-4 py-3 dark:border-ink-800"
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/section-id', section.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const draggedId = e.dataTransfer.getData('text/section-id')
          if (draggedId) reorderSections(paperId, draggedId, section.id)
        }}
      >
        {/* Title gets its own row with only the grip + show/hide toggle next to
            it, so on narrow/mobile screens it always has enough width to
            actually show the text being typed (it used to be squeezed to a
            few characters wide by ~10 other controls sharing one row). */}
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink-200 dark:text-ink-700" />
          <Input
            value={section.title}
            onChange={(e) => updateSection(paperId, section.id, { title: e.target.value })}
            className="h-10 flex-1 min-w-0 text-base font-semibold sm:h-9 sm:text-sm"
            placeholder={t('section_titlePlaceholder')}
          />
          <button
            onClick={() => updateSection(paperId, section.id, { showTitle: !showTitle })}
            title={showTitle ? t('section_hideTitle') : t('section_showTitle')}
            className={`shrink-0 rounded p-1.5 hover:bg-ink-100 dark:hover:bg-ink-800 ${showTitle ? 'text-ink-700 dark:text-ink-200' : 'text-ink-300 dark:text-ink-600'}`}
          >
            {showTitle ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>

        {/* Everything else wraps freely below the title on its own row(s). */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Easy-to-use flow — showing all 3 alignment options directly (instead of
              a single button that silently cycles through hidden states) means the
              teacher can see and pick exactly what they want in one tap. */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-ink-100 p-0.5 dark:border-ink-800">
            {ALIGN_OPTIONS.map(({ value, Icon }) => (
              <button
                key={value}
                onClick={() => updateSection(paperId, section.id, { align: value })}
                title={t(`section_align_${value}`)}
                className={`rounded p-1 ${align === value ? 'bg-ink-100 text-ink-800 dark:bg-ink-700 dark:text-ink-50' : 'text-ink-300 hover:text-ink-600 dark:text-ink-600'}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          <button
            onClick={() => updateSection(paperId, section.id, { showMarks: !showMarks })}
            title={showMarks ? t('section_hideMarks') : t('section_showMarks')}
            className="flex shrink-0 items-center gap-1 rounded p-1.5 text-xs font-mono text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            {showMarks ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {obtainableMarks} {t('section_marks')}
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <button disabled={index === 0} onClick={() => moveSection(paperId, section.id, -1)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800"><ChevronUp className="h-4 w-4" /></button>
            <button disabled={index === total - 1} onClick={() => moveSection(paperId, section.id, 1)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 disabled:opacity-30 dark:hover:bg-ink-800"><ChevronDown className="h-4 w-4" /></button>
            <button onClick={() => duplicateSection(paperId, section.id)} title={t('common_duplicate')} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"><Copy className="h-4 w-4" /></button>
            <button onClick={() => deleteSection(paperId, section.id)} className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-pen-red dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {instructionEnabled ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">{t('section_instruction')} ({t('common_optional')})</Label>
              <button
                type="button"
                onClick={() => updateSection(paperId, section.id, { instructionEnabled: false })}
                className="text-[11px] font-medium text-ink-400 hover:text-pen-red"
              >
                {t('section_removeInstruction')}
              </button>
            </div>
            <Input
              value={section.instruction}
              onChange={(e) => updateSection(paperId, section.id, { instruction: e.target.value })}
              placeholder={t('group_instructionPlaceholder')}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => updateSection(paperId, section.id, { instructionEnabled: true })}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-700 dark:hover:text-gold-300"
          >
            <Plus className="h-3.5 w-3.5" /> {t('section_addInstruction')}
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-700 dark:hover:text-gold-300"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> {showMore ? t('common_lessOptions') : t('common_moreOptions')}
        </button>

        {showMore && (
          <div className="space-y-3 rounded-lg bg-ink-50/60 p-3 dark:bg-ink-800/30">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div>
                <Label>{t('section_numberingStyle')}</Label>
                <Select
                  value={section.numberingStyle || 'numeric'}
                  onChange={(e) => updateSection(paperId, section.id, { numberingStyle: e.target.value })}
                >
                  {NUMBERING_STYLES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                </Select>
              </div>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-ink-600 dark:text-ink-300">
                  <input
                    type="checkbox"
                    checked={section.restartNumbering !== false}
                    onChange={(e) => updateSection(paperId, section.id, { restartNumbering: e.target.checked })}
                  />
                  {t('section_restartNumbering')}
                  <InfoHint text={t('section_restartNumbering_info')} />
                </label>
              </div>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-ink-600 dark:text-ink-300">
                  <input
                    type="checkbox"
                    checked={!!noticeBox.enabled}
                    onChange={(e) => updateSection(paperId, section.id, { noticeBox: { ...noticeBox, enabled: e.target.checked } })}
                  />
                  {t('section_addNoticeBox')}
                </label>
              </div>
            </div>

            {noticeBox.enabled && (
              <div>
                <Label>{t('section_noticeBoxText')}</Label>
                <Textarea
                  rows={2}
                  placeholder={t('section_noticeBoxPlaceholder')}
                  value={noticeBox.text}
                  onChange={(e) => updateSection(paperId, section.id, { noticeBox: { ...noticeBox, text: e.target.value } })}
                />
              </div>
            )}
          </div>
        )}

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
          <Plus className="h-3.5 w-3.5" /> {t('section_addGroup')}
        </Button>
      </div>
    </div>
  )
}
