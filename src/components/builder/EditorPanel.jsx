import React, { useState } from 'react'
import { Plus, Pencil, Check, Settings2, Undo2, Redo2, Trash2, MessageSquarePlus, ListPlus, PenSquare, Eye as EyeIcon } from 'lucide-react'
import { SectionEditor } from './SectionEditor'
import { MarksSummaryBar } from './MarksSummaryBar'
import { Button } from '../ui/Button'
import { Input, Label } from '../ui/Input'
import { Select } from '../ui/Select'
import { ImageUploadField } from '../ui/ImageUploadField'
import { InfoHint } from '../ui/InfoHint'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/authStore'
import { useTranslate } from '../../i18n'
import { computePaperMarks, buildNumbering, formatDuration, classSectionLabel, resolveSubject } from '../../lib/utils'
import { EXAM_TYPES, CLASS_PICKER_OPTIONS, SECTION_PICKER_OPTIONS, SUBJECT_PICKER_OPTIONS, DURATIONS, MARKS_POSITIONS, HEADER_LAYOUTS, FONT_FAMILIES, PAPER_TEMPLATES, PAPER_SIZES } from '../../data/mockData'

// Feature 1 — header instructions: an optional bullet list that appears below
// the paper header, bold "Instructions" label included. If the list is
// empty, nothing renders on the paper at all.
function HeaderInstructions({ paper }) {
  const t = useTranslate()
  const updatePaperSettings = useAppStore((s) => s.updatePaperSettings)
  const instructions = paper.settings?.instructions || []

  const setList = (list) => updatePaperSettings(paper.id, { instructions: list })
  const update = (i, value) => setList(instructions.map((x, idx) => (idx === i ? value : x)))
  const remove = (i) => setList(instructions.filter((_, idx) => idx !== i))
  const add = () => setList([...instructions, ''])

  return (
    <div>
      <p className="mb-1.5 text-sm font-bold text-ink-800 dark:text-ink-100">{t('headerInstructions_title')}</p>
      <p className="mb-2 text-[11px] text-ink-400">{t('headerInstructions_hint')}</p>
      <div className="space-y-1.5">
        {instructions.map((text, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={text}
              placeholder={t('headerInstructions_placeholder')}
              onChange={(e) => update(i, e.target.value)}
              className="h-8 text-xs"
            />
            <button onClick={() => remove(i)} className="shrink-0 rounded p-2.5 sm:p-1.5 text-ink-400 hover:bg-red-50 hover:text-pen-red dark:hover:bg-red-900/20">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <Button size="sm" variant="ghost" className="mt-1.5" onClick={add}>
        <MessageSquarePlus className="h-3.5 w-3.5" /> {t('headerInstructions_add')}
      </Button>
    </div>
  )
}

export function EditorPanel({ paper }) {
  const [editingMeta, setEditingMeta] = useState(false)
  // Auto-hidden by default — the teacher can tap "Show" to reveal exam details.
  const [showDetails, setShowDetails] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const addSection = useAppStore((s) => s.addSection)
  const updatePaperMeta = useAppStore((s) => s.updatePaperMeta)
  const updatePaperSettings = useAppStore((s) => s.updatePaperSettings)
  const saveStatus = useAppStore((s) => s.saveStatus)
  const teacher = useAuthStore((s) => s.teacher)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  const canUndo = useAppStore((s) => s._history.past.length > 0)
  const canRedo = useAppStore((s) => s._history.future.length > 0)
  const settings = paper.settings || {}
  const t = useTranslate()

  const numbering = buildNumbering(paper)
  const { obtainableMarks } = computePaperMarks(paper)

  return (
    <div className="flex h-full flex-col">
      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center justify-end gap-1.5">
          <button
            disabled={!canUndo}
            onClick={undo}
            title="Undo (Ctrl+Z)"
            className="flex h-8 items-center gap-1 rounded-lg border border-ink-200 px-2.5 text-xs font-medium text-ink-600 hover:bg-ink-100 disabled:opacity-30 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          ><Undo2 className="h-3.5 w-3.5" /> Undo</button>
          <button
            disabled={!canRedo}
            onClick={redo}
            title="Redo (Ctrl+Y)"
            className="flex h-8 items-center gap-1 rounded-lg border border-ink-200 px-2.5 text-xs font-medium text-ink-600 hover:bg-ink-100 disabled:opacity-30 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          ><Redo2 className="h-3.5 w-3.5" /> Redo</button>
        </div>

        <div className="rounded-xl2 border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="font-display text-sm font-semibold text-ink-900 dark:text-ink-50">{t('exam_details')}</span>
            <span className="text-xs text-ink-400">{showDetails ? t('common_hide') : t('common_show')}</span>
          </button>

          {showDetails && (
          <div className="mt-3">
          <div className="mb-2 flex justify-end">
            <button
              onClick={() => setEditingMeta((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800 dark:hover:text-gold-300"
            >
              {editingMeta ? <><Check className="h-3.5 w-3.5" /> {t('common_done')}</> : <><Pencil className="h-3.5 w-3.5" /> {t('common_edit')}</>}
            </button>
          </div>

          {!editingMeta ? (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-ink-500 dark:text-ink-400">
              <div><dt className="inline text-ink-400">{t('exam_school')}: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{paper.schoolName}</dd></div>
              <div><dt className="inline text-ink-400">{t('exam_exam')}: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{paper.examType === 'Custom' ? paper.customExamName : paper.examType}</dd></div>
              <div><dt className="inline text-ink-400">{t('exam_class')}: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{classSectionLabel(paper) || '—'}</dd></div>
              <div><dt className="inline text-ink-400">{t('exam_subject')}: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{resolveSubject(paper) || '—'}</dd></div>
              <div><dt className="inline text-ink-400">{t('exam_duration')}: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{formatDuration(paper.duration)}</dd></div>
              <div><dt className="inline text-ink-400">{t('exam_maxMarks')}: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{paper.totalMarks}</dd></div>
            </dl>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="mb-1 flex items-center justify-between">
                  <Label className="mb-0">{t('field_schoolName')}</Label>
                  {teacher?.school && (
                    <button
                      type="button"
                      onClick={() => updatePaperMeta(paper.id, { schoolName: teacher.school })}
                      className="text-[11px] font-medium text-ink-400 hover:text-ink-700 dark:hover:text-gold-300"
                    >{t('paperSettings_useProfileSchool')}</button>
                  )}
                </div>
                <Input value={paper.schoolName} onChange={(e) => updatePaperMeta(paper.id, { schoolName: e.target.value })} />
              </div>
              <div>
                <Label>{t('field_examType')}</Label>
                <Select value={paper.examType} onChange={(e) => updatePaperMeta(paper.id, { examType: e.target.value })}>
                  {EXAM_TYPES.map((t2) => <option key={t2} value={t2}>{t2}</option>)}
                </Select>
              </div>
              {paper.examType === 'Custom' && (
                <div>
                  <Label>{t('field_customExamName')}</Label>
                  <Input value={paper.customExamName} onChange={(e) => updatePaperMeta(paper.id, { customExamName: e.target.value })} />
                </div>
              )}
              <div>
                <Label>{t('field_class')}</Label>
                <Select value={paper.className} onChange={(e) => updatePaperMeta(paper.id, { className: e.target.value })}>
                  {CLASS_PICKER_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
                {paper.className === 'Custom' && (
                  <Input className="mt-2" value={paper.customClassName || ''} onChange={(e) => updatePaperMeta(paper.id, { customClassName: e.target.value })} placeholder={t('field_customClassName')} />
                )}
              </div>
              <div>
                <Label>{t('field_section')}</Label>
                <Select value={paper.section} onChange={(e) => updatePaperMeta(paper.id, { section: e.target.value })}>
                  {SECTION_PICKER_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
                {paper.section === 'Custom' && (
                  <Input className="mt-2" value={paper.customSection || ''} onChange={(e) => updatePaperMeta(paper.id, { customSection: e.target.value })} placeholder={t('field_customSection')} />
                )}
              </div>
              <div>
                <Label>{t('field_subject')}</Label>
                <Select value={paper.subject} onChange={(e) => updatePaperMeta(paper.id, { subject: e.target.value })}>
                  {SUBJECT_PICKER_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
                {paper.subject === 'Custom' && (
                  <Input className="mt-2" value={paper.customSubject || ''} onChange={(e) => updatePaperMeta(paper.id, { customSubject: e.target.value })} placeholder={t('field_customSubject')} />
                )}
              </div>
              <div>
                <Label>{t('field_duration')}</Label>
                <Select value={paper.duration} onChange={(e) => updatePaperMeta(paper.id, { duration: Number(e.target.value) })}>
                  {DURATIONS.filter((d) => d.value !== 'custom').map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </Select>
              </div>
              <div>
                <Label>{t('field_examDate')}</Label>
                <Input type="date" value={paper.examDate} onChange={(e) => updatePaperMeta(paper.id, { examDate: e.target.value })} />
              </div>
              <div>
                <Label>{t('field_totalMarks')}</Label>
                <Input type="number" value={paper.totalMarks} onChange={(e) => updatePaperMeta(paper.id, { totalMarks: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2 border-t border-dashed border-ink-100 pt-3 dark:border-ink-800">
                <label className="flex items-center gap-1.5 text-xs font-medium text-ink-600 dark:text-ink-300">
                  <input
                    type="checkbox"
                    checked={!!settings.showAddress}
                    onChange={(e) => updatePaperSettings(paper.id, { showAddress: e.target.checked, address: settings.address || teacher?.address || '' })}
                  />
                  {t('paperSettings_showAddress')}
                </label>
                {settings.showAddress && (
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between">
                      <Label className="mb-0">{t('paperSettings_address')}</Label>
                      {teacher?.address && (
                        <button
                          type="button"
                          onClick={() => updatePaperSettings(paper.id, { address: teacher.address })}
                          className="text-[11px] font-medium text-ink-400 hover:text-ink-700 dark:hover:text-gold-300"
                        >{t('paperSettings_useProfileSchool')}</button>
                      )}
                    </div>
                    <Input value={settings.address || ''} onChange={(e) => updatePaperSettings(paper.id, { address: e.target.value })} />
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
          )}
        </div>

        <div className="rounded-xl2 border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-1.5 font-display text-sm font-semibold text-ink-900 dark:text-ink-50">
              <Settings2 className="h-3.5 w-3.5" /> {t('paperSettings_title')}
            </span>
            <span className="text-xs text-ink-400">{showSettings ? t('common_hide') : t('common_show')}</span>
          </button>
          {showSettings && (
            <div className="mt-3 space-y-4">
              <HeaderInstructions paper={paper} />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-dashed border-ink-100 pt-3 dark:border-ink-800">
                <div>
                  <Label>{t('paperSettings_marksPosition')} <InfoHint text={t('paperSettings_marksPosition_info')} /></Label>
                  <Select value={settings.marksPosition || 'bracket'} onChange={(e) => updatePaperSettings(paper.id, { marksPosition: e.target.value })}>
                    {MARKS_POSITIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>{t('paperSettings_headerLayout')}</Label>
                  <Select value={settings.headerLayout || 'center'} onChange={(e) => updatePaperSettings(paper.id, { headerLayout: e.target.value })}>
                    {HEADER_LAYOUTS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <ImageUploadField
                    label={t('paperSettings_logo')}
                    value={settings.headerLogoUrl || ''}
                    onChange={(url) => updatePaperSettings(paper.id, { headerLogoUrl: url })}
                  />
                </div>
                <div>
                  <Label>{t('paperSettings_template')}</Label>
                  <Select value={settings.template || 'classic'} onChange={(e) => updatePaperSettings(paper.id, { template: e.target.value })}>
                    {PAPER_TEMPLATES.map((t2) => <option key={t2.value} value={t2.value}>{t2.label}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>{t('paperSettings_paperSize')}</Label>
                  <Select value={settings.paperSize || 'A4'} onChange={(e) => updatePaperSettings(paper.id, { paperSize: e.target.value })}>
                    {PAPER_SIZES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>{t('paperSettings_font')}</Label>
                  <Select value={settings.fontFamily || 'sans'} onChange={(e) => updatePaperSettings(paper.id, { fontFamily: e.target.value })}>
                    {FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>{t('paperSettings_watermark')}</Label>
                  <Input placeholder="e.g. CONFIDENTIAL" value={settings.watermarkText || ''} onChange={(e) => updatePaperSettings(paper.id, { watermarkText: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>{t('paperSettings_footer')}</Label>
                  <Input placeholder="e.g. Prepared by: Anita Sharma" value={settings.footerText || ''} onChange={(e) => updatePaperSettings(paper.id, { footerText: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-ink-600 dark:text-ink-300">
                    <input
                      type="checkbox"
                      checked={settings.showPageNumber !== false}
                      onChange={(e) => updatePaperSettings(paper.id, { showPageNumber: e.target.checked })}
                    />
                    {t('paperSettings_pageNumber')}
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {paper.sections.map((section, idx) => (
          <SectionEditor
            key={section.id}
            paperId={paper.id}
            section={section}
            index={idx}
            total={paper.sections.length}
            numbering={numbering}
          />
        ))}

        {paper.sections.length === 0 ? (
          // Easy-to-use flow — a blank builder with just a small button is
          // confusing for a first-time, non-technical teacher. Show a big,
          // friendly starting point with a short "what happens next" checklist.
          <div className="rounded-xl2 border-2 border-dashed border-ink-200 bg-ink-50/50 p-6 text-center dark:border-ink-800 dark:bg-ink-900/40">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-500 shadow-sm dark:bg-ink-800 dark:text-gold-300">
              <ListPlus className="h-6 w-6" />
            </div>
            <p className="font-display text-sm font-semibold text-ink-800 dark:text-ink-100">{t('emptyState_title')}</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-ink-400">{t('emptyState_hint')}</p>
            <Button className="mt-4" onClick={() => addSection(paper.id)}>
              <Plus className="h-4 w-4" /> {t('paper_addSection')}
            </Button>
            <div className="mx-auto mt-5 flex max-w-sm items-start justify-between gap-2 text-left text-[11px] text-ink-400">
              <div className="flex items-start gap-1.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink-200 text-[10px] font-bold text-ink-600 dark:bg-ink-700 dark:text-ink-200">1</span>
                <span>{t('emptyState_step1')}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <ListPlus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{t('emptyState_step2')}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <EyeIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{t('emptyState_step3')}</span>
              </div>
            </div>
          </div>
        ) : (
          <Button variant="secondary" className="w-full" onClick={() => addSection(paper.id)}>
            <Plus className="h-4 w-4" /> {t('paper_addSection')}
          </Button>
        )}
      </div>

      <MarksSummaryBar obtainableMarks={obtainableMarks} totalMarks={paper.totalMarks} saveStatus={saveStatus} />
    </div>
  )
}
