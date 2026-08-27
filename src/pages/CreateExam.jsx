import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Label, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { useAppStore } from '../store/useAppStore'
import { EXAM_TYPES, DURATIONS, CLASS_OPTIONS, SECTION_OPTIONS, SUBJECTS } from '../data/mockData'

export default function CreateExam() {
  const navigate = useNavigate()
  const teacher = useAppStore((s) => s.teacher)
  const createPaper = useAppStore((s) => s.createPaper)

  const [form, setForm] = useState({
    examType: 'Unit Test',
    customExamName: '',
    duration: 60,
    customDuration: '',
    totalMarks: '',
    examDate: '',
    schoolName: teacher?.school || '',
    className: 'X',
    section: 'A',
    subject: 'Mathematics',
  })
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const e = {}
    if (form.examType === 'Custom' && !form.customExamName.trim()) e.customExamName = 'Enter a custom exam name.'
    if (form.duration === 'custom' && !form.customDuration) e.customDuration = 'Enter a duration in minutes.'
    if (!form.totalMarks || Number(form.totalMarks) <= 0) e.totalMarks = 'Total marks must be a positive number.'
    if (!form.examDate) e.examDate = 'Exam date is required.'
    if (!form.schoolName.trim()) e.schoolName = 'School name is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const durationMinutes = form.duration === 'custom' ? Number(form.customDuration) : Number(form.duration)
    const id = createPaper({
      examType: form.examType,
      customExamName: form.customExamName,
      duration: durationMinutes,
      totalMarks: Number(form.totalMarks),
      examDate: form.examDate,
      schoolName: form.schoolName,
      className: form.className,
      section: form.section,
      subject: form.subject,
    })
    navigate(`/paper/${id}?view=edit`)
  }

  return (
    <AppShell title="Create Exam" subtitle="Set up exam details for your new paper" mobileTitle="Create Exam">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
            <p className="text-sm text-ink-400 mt-1">
              These details automatically populate the paper header — no need to retype them later.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="examType">Exam Type</Label>
                  <Select id="examType" value={form.examType} onChange={set('examType')}>
                    {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                {form.examType === 'Custom' && (
                  <div>
                    <Label htmlFor="customExamName">Custom Exam Name</Label>
                    <Input id="customExamName" value={form.customExamName} onChange={set('customExamName')} placeholder="e.g. Weekly Assessment" />
                    {errors.customExamName && <p className="mt-1 text-xs text-pen-red">{errors.customExamName}</p>}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Select id="duration" value={form.duration} onChange={set('duration')}>
                    {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </Select>
                </div>
                {form.duration === 'custom' && (
                  <div>
                    <Label htmlFor="customDuration">Custom Duration (minutes)</Label>
                    <Input id="customDuration" type="number" min="1" value={form.customDuration} onChange={set('customDuration')} placeholder="e.g. 75" />
                    {errors.customDuration && <p className="mt-1 text-xs text-pen-red">{errors.customDuration}</p>}
                  </div>
                )}
                <div>
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input id="totalMarks" type="number" min="1" value={form.totalMarks} onChange={set('totalMarks')} placeholder="e.g. 80" />
                  {errors.totalMarks && <p className="mt-1 text-xs text-pen-red">{errors.totalMarks}</p>}
                </div>
                <div>
                  <Label htmlFor="examDate">Exam Date</Label>
                  <Input id="examDate" type="date" value={form.examDate} onChange={set('examDate')} />
                  {errors.examDate && <p className="mt-1 text-xs text-pen-red">{errors.examDate}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input id="schoolName" value={form.schoolName} onChange={set('schoolName')} placeholder="e.g. Green Valley Public School" />
                {errors.schoolName && <p className="mt-1 text-xs text-pen-red">{errors.schoolName}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="className">Class</Label>
                  <Select id="className" value={form.className} onChange={set('className')}>
                    {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select id="section" value={form.section} onChange={set('section')}>
                    {SECTION_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select id="subject" value={form.subject} onChange={set('subject')}>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>Cancel</Button>
                <Button type="submit">Continue &amp; Open Builder</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
