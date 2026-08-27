import React, { useState } from 'react'
import { Plus, Pencil, Check } from 'lucide-react'
import { SectionEditor } from './SectionEditor'
import { MarksSummaryBar } from './MarksSummaryBar'
import { Button } from '../ui/Button'
import { Input, Label } from '../ui/Input'
import { Select } from '../ui/Select'
import { useAppStore } from '../../store/useAppStore'
import { computePaperMarks, buildNumbering, formatDuration } from '../../lib/utils'
import { EXAM_TYPES, CLASS_OPTIONS, SECTION_OPTIONS, SUBJECTS, DURATIONS } from '../../data/mockData'

export function EditorPanel({ paper }) {
  const [editingMeta, setEditingMeta] = useState(false)
  const addSection = useAppStore((s) => s.addSection)
  const updatePaperMeta = useAppStore((s) => s.updatePaperMeta)
  const saveStatus = useAppStore((s) => s.saveStatus)

  const numbering = buildNumbering(paper)
  const { obtainableMarks } = computePaperMarks(paper)

  return (
    <div className="flex h-full flex-col">
      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-xl2 border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-ink-50">Exam Details</h3>
            <button
              onClick={() => setEditingMeta((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800 dark:hover:text-gold-300"
            >
              {editingMeta ? <><Check className="h-3.5 w-3.5" /> Done</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
            </button>
          </div>

          {!editingMeta ? (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-ink-500 dark:text-ink-400">
              <div><dt className="inline text-ink-400">School: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{paper.schoolName}</dd></div>
              <div><dt className="inline text-ink-400">Exam: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{paper.examType === 'Custom' ? paper.customExamName : paper.examType}</dd></div>
              <div><dt className="inline text-ink-400">Class: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{paper.className}-{paper.section}</dd></div>
              <div><dt className="inline text-ink-400">Subject: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{paper.subject}</dd></div>
              <div><dt className="inline text-ink-400">Duration: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{formatDuration(paper.duration)}</dd></div>
              <div><dt className="inline text-ink-400">Max Marks: </dt><dd className="inline font-medium text-ink-700 dark:text-ink-200">{paper.totalMarks}</dd></div>
            </dl>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>School Name</Label>
                <Input value={paper.schoolName} onChange={(e) => updatePaperMeta(paper.id, { schoolName: e.target.value })} />
              </div>
              <div>
                <Label>Exam Type</Label>
                <Select value={paper.examType} onChange={(e) => updatePaperMeta(paper.id, { examType: e.target.value })}>
                  {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              {paper.examType === 'Custom' && (
                <div>
                  <Label>Custom Name</Label>
                  <Input value={paper.customExamName} onChange={(e) => updatePaperMeta(paper.id, { customExamName: e.target.value })} />
                </div>
              )}
              <div>
                <Label>Class</Label>
                <Select value={paper.className} onChange={(e) => updatePaperMeta(paper.id, { className: e.target.value })}>
                  {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label>Section</Label>
                <Select value={paper.section} onChange={(e) => updatePaperMeta(paper.id, { section: e.target.value })}>
                  {SECTION_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Select value={paper.subject} onChange={(e) => updatePaperMeta(paper.id, { subject: e.target.value })}>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div>
                <Label>Duration</Label>
                <Select value={paper.duration} onChange={(e) => updatePaperMeta(paper.id, { duration: Number(e.target.value) })}>
                  {DURATIONS.filter((d) => d.value !== 'custom').map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </Select>
              </div>
              <div>
                <Label>Exam Date</Label>
                <Input type="date" value={paper.examDate} onChange={(e) => updatePaperMeta(paper.id, { examDate: e.target.value })} />
              </div>
              <div>
                <Label>Total Marks</Label>
                <Input type="number" value={paper.totalMarks} onChange={(e) => updatePaperMeta(paper.id, { totalMarks: Number(e.target.value) })} />
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

        <Button variant="secondary" className="w-full" onClick={() => addSection(paper.id)}>
          <Plus className="h-4 w-4" /> Add Section
        </Button>
      </div>

      <MarksSummaryBar obtainableMarks={obtainableMarks} totalMarks={paper.totalMarks} saveStatus={saveStatus} />
    </div>
  )
}
