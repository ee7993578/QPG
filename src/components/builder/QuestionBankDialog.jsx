import React, { useState } from 'react'
import { Dialog } from '../ui/Dialog'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { QUESTION_BANK, SUBJECTS } from '../../data/mockData'

/** SRS 47 — insert a ready-made question from a static bank instead of typing one. */
export function QuestionBankDialog({ open, onClose, paperId, sectionId, groupId, defaultSubject }) {
  const [subject, setSubject] = useState(defaultSubject || 'All')
  const insertFromBank = useAppStore((s) => s.insertFromBank)

  const filtered = QUESTION_BANK.filter((b) => subject === 'All' || b.subject === subject)

  return (
    <Dialog open={open} onClose={onClose} title="Insert from Question Bank">
      <div className="mb-3">
        <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="All">All Subjects</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <div className="scroll-thin max-h-72 space-y-1.5 overflow-y-auto">
        {filtered.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-2 rounded-lg border border-ink-100 p-2 text-xs dark:border-ink-800">
            <div>
              <p className="text-ink-800 dark:text-ink-200">{item.text}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-400">{item.subject} · {item.questionType} · {item.marks} marks</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs" onClick={() => insertFromBank(paperId, sectionId, groupId, item)}>
              Insert
            </Button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs italic text-ink-400">No bank questions for this subject yet.</p>}
      </div>
    </Dialog>
  )
}
