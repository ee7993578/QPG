import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, FileText, Zap, Layers, GraduationCap, ArrowLeft, ArrowRight } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Label, Input, Textarea } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/uiStore'
import { useTranslate } from '../i18n'
import { EXAM_TYPES, DURATIONS, CLASS_PICKER_OPTIONS, SECTION_PICKER_OPTIONS, SUBJECT_PICKER_OPTIONS, QUICK_START_TEMPLATES } from '../data/mockData'

const TEMPLATE_ICON = { FileText, Zap, Layers, GraduationCap }

// Easy-to-use flow — the old single long form scared first-time (non-tech)
// teachers with 12+ fields at once. This breaks paper creation into a
// friendly "pick a starting point" screen + a short 3-step wizard so only
// a handful of fields are ever on screen together, and it's always obvious
// what to do next.
const STEPS = ['createExam_step1', 'createExam_step2', 'createExam_step3']

export default function CreateExam() {
  const navigate = useNavigate()
  const teacher = useAuthStore((s) => s.teacher)
  const accountType = useAuthStore((s) => s.accountType)
  const createPaper = useAppStore((s) => s.createPaper)
  const addSection = useAppStore((s) => s.addSection)
  const addQuestionGroup = useAppStore((s) => s.addQuestionGroup)
  const t = useTranslate()

  // Straight to the blank wizard — no "pick a starting point" screen. The
  // quick-start templates (QUICK_START_TEMPLATES) still exist in the data
  // layer for a future "Insert template" action inside the builder itself.
  const [template, setTemplate] = useState('blank')
  const [step, setStep] = useState(0) // 0,1,2 → STEPS

  // Feature 5 — school name & address are pulled from the teacher's profile
  // automatically, but stay fully editable right here.
  const [form, setForm] = useState({
    examType: 'Unit Test',
    customExamName: '',
    examDate: '',
    duration: 60,
    customDuration: '',
    totalMarks: '',
    schoolName: teacher?.school || '',
    showAddress: false,
    address: teacher?.address || '',
    className: 'X',
    customClassName: '',
    section: 'A',
    customSection: '',
    subject: 'Mathematics',
    customSubject: '',
  })
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validateStep = (s) => {
    const e = {}
    if (s === 0) {
      if (form.examType === 'Custom' && !form.customExamName.trim()) e.customExamName = 'Enter a custom exam name.'
      if (!form.examDate) e.examDate = 'Exam date is required.'
    } else if (s === 1) {
      if (form.className === 'Custom' && !form.customClassName.trim()) e.customClassName = 'Enter a custom class.'
      if (form.section === 'Custom' && !form.customSection.trim()) e.customSection = 'Enter a custom section.'
      if (form.subject === 'Custom' && !form.customSubject.trim()) e.customSubject = 'Enter a custom subject.'
    } else if (s === 2) {
      if (form.duration === 'custom' && !form.customDuration) e.customDuration = 'Enter a duration in minutes.'
      if (!form.totalMarks || Number(form.totalMarks) <= 0) e.totalMarks = 'Total marks must be a positive number.'
      if (!form.schoolName.trim()) e.schoolName = 'School name is required.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else submit()
  }
  const goBack = () => {
    if (step > 0) setStep((s) => s - 1)
    // A School admin creates papers too — send them back to their own home.
    else navigate(accountType === 'school' ? '/school' : '/dashboard')
  }

  const submit = () => {
    if (!validateStep(2)) return
    const durationMinutes = form.duration === 'custom' ? Number(form.customDuration) : Number(form.duration)
    const id = createPaper({
      examType: form.examType,
      customExamName: form.customExamName,
      duration: durationMinutes,
      totalMarks: Number(form.totalMarks),
      examDate: form.examDate,
      schoolName: form.schoolName,
      showAddress: form.showAddress,
      address: form.address,
      className: form.className,
      customClassName: form.customClassName,
      section: form.section,
      customSection: form.customSection,
      subject: form.subject,
      customSubject: form.customSubject,
    })

    // Quick-start template — pre-fill sections/question types so the teacher
    // lands on an already-populated paper instead of a blank one.
    const chosen = QUICK_START_TEMPLATES.find((tpl) => tpl.id === template)
    if (chosen?.sections?.length) {
      chosen.sections.forEach((sectionTpl) => {
        addSection(id)
        const paper = useAppStore.getState().papers.find((p) => p.id === id)
        const newSection = paper.sections[paper.sections.length - 1]
        ;(sectionTpl.questionGroups || []).forEach((groupTpl) => {
          addQuestionGroup(id, newSection.id, groupTpl)
        })
      })
    }

    navigate(`/paper/${id}?view=edit`)
    toast.success('Paper created. Add your questions on the left — the preview updates as you type.')
  }

  // ---------- Screen 0: pick a starting point ----------
  if (!template) {
    return (
      <AppShell title={t('createExam_title')} subtitle={t('createExam_pickStart')} mobileTitle={t('createExam_title')}>
        <div className="mx-auto max-w-2xl">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">{t('createExam_pickStart')}</h2>
            <p className="mt-1 text-sm text-ink-400">{t('createExam_pickStartHint')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_START_TEMPLATES.map((tpl) => {
              const Icon = TEMPLATE_ICON[tpl.icon] || FileText
              return (
                <button
                  key={tpl.id}
                  onClick={() => setTemplate(tpl.id)}
                  className="flex flex-col items-start gap-2 rounded-xl2 border border-ink-100 bg-white p-4 text-left shadow-card transition hover:border-gold-400 hover:shadow-page dark:border-ink-800 dark:bg-ink-900 dark:hover:border-gold-500"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600 dark:bg-ink-800 dark:text-gold-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-sm font-semibold text-ink-900 dark:text-ink-50">{tpl.title}</span>
                  <span className="text-xs leading-snug text-ink-400">{tpl.description}</span>
                </button>
              )
            })}
          </div>
        </div>
      </AppShell>
    )
  }

  // ---------- Screens 1–3: short guided wizard ----------
  return (
    <AppShell title={t('createExam_title')} subtitle={t('createExam_subtitle')} mobileTitle={t('createExam_title')}>
      <div className="mx-auto max-w-2xl">
        {/* Step progress — always visible so the teacher knows exactly how far along they are. */}
        <div className="mb-5 flex items-center gap-2">
          {STEPS.map((key, i) => (
            <React.Fragment key={key}>
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-ink-800 text-white dark:bg-gold-400 dark:text-ink-950' : 'bg-ink-100 text-ink-400 dark:bg-ink-800'
                  }`}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={`hidden text-xs font-medium sm:inline ${i === step ? 'text-ink-800 dark:text-ink-100' : 'text-ink-400'}`}>{t(key)}</span>
              </div>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />}
            </React.Fragment>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t(STEPS[step])}</CardTitle>
            <p className="text-sm text-ink-400 mt-1">
              {step === 0 && t('createExam_step1Hint')}
              {step === 1 && t('createExam_step2Hint')}
              {step === 2 && t('createExam_step3Hint')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {step === 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="examType">{t('field_examType')}</Label>
                    <Select id="examType" value={form.examType} onChange={set('examType')}>
                      {EXAM_TYPES.map((t2) => <option key={t2} value={t2}>{t2}</option>)}
                    </Select>
                  </div>
                  {form.examType === 'Custom' && (
                    <div>
                      <Label htmlFor="customExamName">{t('field_customExamName')}</Label>
                      <Input id="customExamName" value={form.customExamName} onChange={set('customExamName')} placeholder="e.g. Weekly Assessment" />
                      {errors.customExamName && <p className="mt-1 text-xs text-pen-red">{errors.customExamName}</p>}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="examDate">{t('field_examDate')}</Label>
                    <Input id="examDate" type="date" value={form.examDate} onChange={set('examDate')} />
                    {errors.examDate && <p className="mt-1 text-xs text-pen-red">{errors.examDate}</p>}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="className">{t('field_class')}</Label>
                    <Select id="className" value={form.className} onChange={set('className')}>
                      {CLASS_PICKER_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                    {form.className === 'Custom' && (
                      <>
                        <Input className="mt-2" value={form.customClassName} onChange={set('customClassName')} placeholder={t('field_customClassName')} />
                        {errors.customClassName && <p className="mt-1 text-xs text-pen-red">{errors.customClassName}</p>}
                      </>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="section">{t('field_section')}</Label>
                    <Select id="section" value={form.section} onChange={set('section')}>
                      {SECTION_PICKER_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    {form.section === 'Custom' && (
                      <>
                        <Input className="mt-2" value={form.customSection} onChange={set('customSection')} placeholder={t('field_customSection')} />
                        {errors.customSection && <p className="mt-1 text-xs text-pen-red">{errors.customSection}</p>}
                      </>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="subject">{t('field_subject')}</Label>
                    <Select id="subject" value={form.subject} onChange={set('subject')}>
                      {SUBJECT_PICKER_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    {form.subject === 'Custom' && (
                      <>
                        <Input className="mt-2" value={form.customSubject} onChange={set('customSubject')} placeholder={t('field_customSubject')} />
                        {errors.customSubject && <p className="mt-1 text-xs text-pen-red">{errors.customSubject}</p>}
                      </>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="duration">{t('field_duration')}</Label>
                      <Select id="duration" value={form.duration} onChange={set('duration')}>
                        {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </Select>
                    </div>
                    {form.duration === 'custom' && (
                      <div>
                        <Label htmlFor="customDuration">{t('field_customDuration')}</Label>
                        <Input id="customDuration" type="number" min="1" value={form.customDuration} onChange={set('customDuration')} placeholder="e.g. 75" />
                        {errors.customDuration && <p className="mt-1 text-xs text-pen-red">{errors.customDuration}</p>}
                      </div>
                    )}
                    <div>
                      <Label htmlFor="totalMarks">{t('field_totalMarks')}</Label>
                      <Input id="totalMarks" type="number" min="1" value={form.totalMarks} onChange={set('totalMarks')} placeholder="e.g. 80" />
                      {errors.totalMarks && <p className="mt-1 text-xs text-pen-red">{errors.totalMarks}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="schoolName">{t('field_schoolName')}</Label>
                    <Input id="schoolName" value={form.schoolName} onChange={set('schoolName')} placeholder="e.g. Green Valley Public School" />
                    {errors.schoolName && <p className="mt-1 text-xs text-pen-red">{errors.schoolName}</p>}
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-ink-600 dark:text-ink-300">
                      <input type="checkbox" checked={form.showAddress} onChange={(e) => setForm((f) => ({ ...f, showAddress: e.target.checked }))} />
                      {t('field_showAddress')}
                    </label>
                    {form.showAddress && (
                      <div className="mt-2">
                        <Label htmlFor="address">{t('field_address')}</Label>
                        <Textarea id="address" rows={2} value={form.address} onChange={set('address')} placeholder="e.g. 12 Civil Lines, Agra, Uttar Pradesh" />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button type="button" variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4" /> {t('common_back')}
                </Button>
                <Button type="button" onClick={goNext}>
                  {step < STEPS.length - 1 ? <>{t('common_next')} <ArrowRight className="h-4 w-4" /></> : t('common_continue')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
