import React, { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Copy, Library, X } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Input, Textarea, Label } from '../ui/Input'
import { Select } from '../ui/Select'
import { Dialog } from '../ui/Dialog'
import { EmptyState } from '../ui/States'
import { useQuestionBankStore } from '../../store/questionBankStore'
import { questionBankApi } from '../../services/questionBankApi'
import { DIFFICULTIES, chaptersFor } from '../../data/questionBankData'
import { SUBJECTS, CLASS_OPTIONS, QUESTION_TYPES, OPTION_BASED_TYPES } from '../../data/mockData'
import { toast } from '../../store/uiStore'
import { cn } from '../../lib/utils'

/**
 * Sections 23/24 — the question bank browser, shared by the teacher's personal
 * bank (`scope="mine"`), the school-wide shared bank (`scope="school"`) and the
 * read-only view a Teacher Pro user gets of their school's bank.
 *
 * `readOnly` hides add/edit/delete; `allowCopy` shows "Copy to my bank".
 */

const BLANK = {
  subject: 'Mathematics',
  className: 'X',
  chapter: '',
  questionType: 'Short Answer',
  difficulty: 'Medium',
  marks: 2,
  text: '',
  options: ['', '', '', ''],
}

const DIFFICULTY_VARIANT = { Easy: 'success', Medium: 'gold', Hard: 'danger' }

function QuestionForm({ value, onChange }) {
  const chapters = chaptersFor(value.subject)
  const needsOptions = OPTION_BASED_TYPES.includes(value.questionType)
  const set = (patch) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="bq-text">Question</Label>
        <Textarea
          id="bq-text"
          rows={3}
          value={value.text}
          onChange={(e) => set({ text: e.target.value })}
          placeholder="Type the question exactly as it should appear on the paper"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="bq-subject">Subject</Label>
          <Select
            id="bq-subject"
            value={value.subject}
            onChange={(e) => set({ subject: e.target.value, chapter: '' })}
          >
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="bq-class">Class</Label>
          <Select id="bq-class" value={value.className} onChange={(e) => set({ className: e.target.value })}>
            {CLASS_OPTIONS.map((c) => <option key={c} value={c}>Class {c}</option>)}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="bq-chapter">Chapter</Label>
        <Select id="bq-chapter" value={value.chapter} onChange={(e) => set({ chapter: e.target.value })}>
          <option value="">— No chapter —</option>
          {chapters.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label htmlFor="bq-type">Question type</Label>
          <Select id="bq-type" value={value.questionType} onChange={(e) => set({ questionType: e.target.value })}>
            {QUESTION_TYPES.map((q) => <option key={q} value={q}>{q}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="bq-marks">Marks</Label>
          <Input
            id="bq-marks"
            type="number"
            min="1"
            value={value.marks}
            onChange={(e) => set({ marks: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Difficulty</Label>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => set({ difficulty: d })}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                value.difficulty === d
                  ? 'border-ink-700 bg-ink-700 text-white dark:border-gold-400 dark:bg-gold-400 dark:text-ink-950'
                  : 'border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800'
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {needsOptions && (
        <div>
          <Label>Options</Label>
          <div className="space-y-2">
            {value.options.map((opt, i) => (
              <Input
                key={i}
                value={opt}
                placeholder={`Option ${String.fromCharCode(97 + i)}`}
                onChange={(e) => {
                  const options = [...value.options]
                  options[i] = e.target.value
                  set({ options })
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function QuestionBankBrowser({
  scope = 'mine',
  readOnly = false,
  allowCopy = false,
  author = '',
  emptyMessage,
}) {
  const myQuestions = useQuestionBankStore((s) => s.myQuestions)
  const schoolQuestions = useQuestionBankStore((s) => s.schoolQuestions)
  const addQuestion = useQuestionBankStore((s) => s.addQuestion)
  const updateQuestion = useQuestionBankStore((s) => s.updateQuestion)
  const deleteQuestion = useQuestionBankStore((s) => s.deleteQuestion)
  const copyToMine = useQuestionBankStore((s) => s.copyToMine)

  const questions = scope === 'school' ? schoolQuestions : myQuestions

  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('all')
  const [className, setClassName] = useState('all')
  const [chapter, setChapter] = useState('all')
  const [difficulty, setDifficulty] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(BLANK)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const chapterOptions = useMemo(() => {
    const list = questions
      .filter((q) => subject === 'all' || q.subject === subject)
      .map((q) => q.chapter)
      .filter(Boolean)
    return [...new Set(list)].sort()
  }, [questions, subject])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return questions.filter((q) => {
      if (subject !== 'all' && q.subject !== subject) return false
      if (className !== 'all' && q.className !== className) return false
      if (chapter !== 'all' && q.chapter !== chapter) return false
      if (difficulty !== 'all' && q.difficulty !== difficulty) return false
      if (term && !q.text.toLowerCase().includes(term) && !(q.chapter || '').toLowerCase().includes(term)) return false
      return true
    })
  }, [questions, search, subject, className, chapter, difficulty])

  const activeFilters = [subject, className, chapter, difficulty].filter((f) => f !== 'all').length + (search ? 1 : 0)

  const clearFilters = () => {
    setSearch('')
    setSubject('all')
    setClassName('all')
    setChapter('all')
    setDifficulty('all')
  }

  const openAdd = () => {
    setEditing(null)
    setDraft(BLANK)
    setFormOpen(true)
  }

  const openEdit = (q) => {
    setEditing(q)
    setDraft({
      subject: q.subject || 'Mathematics',
      className: q.className || 'X',
      chapter: q.chapter || '',
      questionType: q.questionType || 'Short Answer',
      difficulty: q.difficulty || 'Medium',
      marks: q.marks || 1,
      text: q.text || '',
      options: q.options?.length ? [...q.options] : ['', '', '', ''],
    })
    setFormOpen(true)
  }

  const save = async () => {
    if (!draft.text.trim()) {
      toast.error('Please type the question first.')
      return
    }
    const payload = {
      ...draft,
      options: OPTION_BASED_TYPES.includes(draft.questionType)
        ? draft.options.filter((o) => o.trim())
        : [],
      author: editing ? editing.author : author,
    }
    if (editing) {
      await questionBankApi.update(scope, editing.id, payload)
      updateQuestion(scope, editing.id, payload)
      toast.success('Question updated.')
    } else {
      await questionBankApi.create(scope, payload)
      addQuestion(scope, payload)
      toast.success('Question added to the bank.')
    }
    setFormOpen(false)
    setEditing(null)
  }

  const remove = async () => {
    if (!confirmDelete) return
    await questionBankApi.remove(scope, confirmDelete.id)
    deleteQuestion(scope, confirmDelete.id)
    setConfirmDelete(null)
    toast.success('Question deleted.')
  }

  const copy = async (q) => {
    await questionBankApi.copyToMine(q.id)
    copyToMine(q.id)
    toast.success('Copied to your question bank.')
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="pl-9"
              aria-label="Search questions"
            />
          </div>
          {!readOnly && (
            <Button onClick={openAdd} className="md:w-auto">
              <Plus className="h-4 w-4" /> Add Question
            </Button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Select value={subject} onChange={(e) => { setSubject(e.target.value); setChapter('all') }} aria-label="Filter by subject">
            <option value="all">All subjects</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={className} onChange={(e) => setClassName(e.target.value)} aria-label="Filter by class">
            <option value="all">All classes</option>
            {CLASS_OPTIONS.map((c) => <option key={c} value={c}>Class {c}</option>)}
          </Select>
          <Select value={chapter} onChange={(e) => setChapter(e.target.value)} aria-label="Filter by chapter">
            <option value="all">All chapters</option>
            {chapterOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Filter by difficulty">
            <option value="all">All difficulties</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-400">
            {filtered.length} of {questions.length} question{questions.length === 1 ? '' : 's'}
          </p>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </div>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Library}
          title={questions.length === 0 ? 'Your question bank is empty' : 'No questions match these filters'}
          message={
            questions.length === 0
              ? emptyMessage || 'Add questions once and reuse them in any paper — filtered by class, chapter and difficulty.'
              : 'Try widening the filters or clearing the search.'
          }
          actionLabel={questions.length === 0 ? (readOnly ? undefined : 'Add your first question') : 'Clear filters'}
          onAction={questions.length === 0 ? (readOnly ? undefined : openAdd) : clearFilters}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-800 dark:text-ink-100">{q.text}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="neutral">{q.subject}</Badge>
                    <Badge variant="neutral">Class {q.className}</Badge>
                    {q.chapter && <Badge variant="neutral">{q.chapter}</Badge>}
                    <Badge variant="neutral">{q.questionType}</Badge>
                    <Badge variant={DIFFICULTY_VARIANT[q.difficulty] || 'neutral'}>{q.difficulty}</Badge>
                    <Badge variant="neutral">{q.marks} mark{q.marks === 1 ? '' : 's'}</Badge>
                    {q.author && <span className="text-xs text-ink-400">· by {q.author}</span>}
                  </div>
                  {q.options?.length > 0 && (
                    <ol className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
                      {q.options.map((opt, i) => (
                        <li key={i}>({String.fromCharCode(97 + i)}) {opt}</li>
                      ))}
                    </ol>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {allowCopy && (
                    <Button variant="ghost" size="icon" onClick={() => copy(q)} aria-label="Copy to my bank" title="Copy to my bank">
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  {!readOnly && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(q)} aria-label="Edit question" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(q)} aria-label="Delete question" title="Delete">
                        <Trash2 className="h-4 w-4 text-pen-red" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / edit dialog */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit question' : 'Add question to bank'}
        className="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Save changes' : 'Add question'}</Button>
          </>
        }
      >
        <QuestionForm value={draft} onChange={setDraft} />
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this question?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={remove}>Delete</Button>
          </>
        }
      >
        <p>
          This removes it from the bank only. Papers that already use this question are not affected.
        </p>
      </Dialog>
    </div>
  )
}
