import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/utils'
import { seedTeacherQuestions, seedSchoolQuestions } from '../data/questionBankData'

/**
 * questionBankStore — sections 23/24.
 *
 * Two scopes, one store:
 *   'mine'   → the signed-in teacher's personal bank
 *   'school' → the school-wide shared bank (visible to a school account, and
 *              to a teacher whose school has an active School Pro plan)
 *
 * Backend contract this stands in for (see services/questionBankApi.js):
 *   questionBankApi.list() / create() / update() / remove()
 */
export const useQuestionBankStore = create(
  persist(
    (set, get) => ({
      myQuestions: seedTeacherQuestions,
      schoolQuestions: seedSchoolQuestions,

      list: (scope = 'mine') => (scope === 'school' ? get().schoolQuestions : get().myQuestions),

      addQuestion: (scope, data) => {
        const question = {
          id: uid('bq'),
          subject: data.subject || '',
          className: data.className || '',
          chapter: data.chapter || '',
          questionType: data.questionType || 'Short Answer',
          difficulty: data.difficulty || 'Medium',
          text: data.text || '',
          marks: Number(data.marks) || 1,
          options: data.options || [],
          author: data.author || '',
          createdAt: new Date().toISOString(),
        }
        const key = scope === 'school' ? 'schoolQuestions' : 'myQuestions'
        set((s) => ({ [key]: [question, ...s[key]] }))
        return question
      },

      updateQuestion: (scope, id, patch) => {
        const key = scope === 'school' ? 'schoolQuestions' : 'myQuestions'
        set((s) => ({
          [key]: s[key].map((q) => (q.id === id ? { ...q, ...patch, marks: Number(patch.marks ?? q.marks) || 1 } : q)),
        }))
      },

      deleteQuestion: (scope, id) => {
        const key = scope === 'school' ? 'schoolQuestions' : 'myQuestions'
        set((s) => ({ [key]: s[key].filter((q) => q.id !== id) }))
      },

      /** Copy a shared school question into the teacher's own bank. */
      copyToMine: (id) => {
        const source = get().schoolQuestions.find((q) => q.id === id)
        if (!source) return null
        return get().addQuestion('mine', { ...source, author: '' })
      },
    }),
    { name: 'papercraft-question-bank' }
  )
)
