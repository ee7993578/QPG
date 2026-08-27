import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid, sectionLetter } from '../lib/utils'
import { mockTeacher, seedPapers } from '../data/mockData'

const AUTOSAVE_DELAY = 700

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ---------------- Auth ----------------
      isAuthenticated: false,
      teacher: null,
      pendingMobile: null,

      requestOtp: (mobile) => {
        // Static/mock flow: any 10-digit mobile is accepted, OTP is always 1234.
        set({ pendingMobile: mobile })
        return { success: true }
      },
      verifyOtp: (otp) => {
        if (otp === '1234') {
          set({
            isAuthenticated: true,
            teacher: { ...mockTeacher, mobile: get().pendingMobile || mockTeacher.mobile },
            pendingMobile: null,
          })
          return { success: true }
        }
        return { success: false, message: 'Incorrect OTP. Use 1234 for this demo.' }
      },
      logout: () => set({ isAuthenticated: false, teacher: null, activePaperId: null }),

      // ---------------- Theme & language ----------------
      theme: 'system', // 'light' | 'dark' | 'system'
      setTheme: (theme) => set({ theme }),
      language: 'en',
      setLanguage: (language) => set({ language }),

      // ---------------- Papers ----------------
      papers: seedPapers,
      activePaperId: null,
      saveStatus: 'saved', // 'saving' | 'saved'
      _saveTimer: null,

      getPaper: (id) => get().papers.find((p) => p.id === id),

      createPaper: (examDetails) => {
        const id = uid('paper')
        const now = new Date().toISOString()
        const paper = {
          id,
          status: 'draft',
          sections: [],
          createdAt: now,
          updatedAt: now,
          version: 1,
          ...examDetails,
        }
        set((state) => ({ papers: [paper, ...state.papers], activePaperId: id }))
        return id
      },

      setActivePaper: (id) => set({ activePaperId: id }),

      updatePaperMeta: (id, patch) => {
        get()._touch(id, (paper) => Object.assign(paper, patch))
      },

      duplicatePaper: (id) => {
        const original = get().getPaper(id)
        if (!original) return null
        const newId = uid('paper')
        const now = new Date().toISOString()
        const clone = JSON.parse(JSON.stringify(original))
        clone.id = newId
        clone.status = 'draft'
        clone.createdAt = now
        clone.updatedAt = now
        clone.version = 1
        clone.examType = original.examType
        set((state) => ({ papers: [clone, ...state.papers] }))
        return newId
      },

      deletePaper: (id) => {
        set((state) => ({
          papers: state.papers.filter((p) => p.id !== id),
          activePaperId: state.activePaperId === id ? null : state.activePaperId,
        }))
      },

      markPaperSaved: (id) => {
        get()._touch(id, (paper) => {
          paper.status = 'saved'
        })
      },

      // Internal helper: mutate a paper immutably + trigger autosave indicator
      _touch: (id, mutator) => {
        set((state) => ({
          papers: state.papers.map((p) => {
            if (p.id !== id) return p
            const draft = JSON.parse(JSON.stringify(p))
            mutator(draft)
            draft.updatedAt = new Date().toISOString()
            draft.version = (draft.version || 1) + 1
            return draft
          }),
        }))
        get()._triggerAutosave()
      },

      _triggerAutosave: () => {
        const timer = get()._saveTimer
        if (timer) clearTimeout(timer)
        set({ saveStatus: 'saving' })
        const t = setTimeout(() => {
          set({ saveStatus: 'saved' })
        }, AUTOSAVE_DELAY)
        set({ _saveTimer: t })
      },

      // ---------------- Section operations ----------------
      addSection: (paperId) => {
        get()._touch(paperId, (paper) => {
          const idx = paper.sections.length
          paper.sections.push({
            id: uid('sec'),
            title: `Section ${sectionLetter(idx)}`,
            instruction: '',
            questionGroups: [],
          })
        })
      },
      updateSection: (paperId, sectionId, patch) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          if (sec) Object.assign(sec, patch)
        })
      },
      deleteSection: (paperId, sectionId) => {
        get()._touch(paperId, (paper) => {
          paper.sections = paper.sections.filter((s) => s.id !== sectionId)
        })
      },
      moveSection: (paperId, sectionId, direction) => {
        get()._touch(paperId, (paper) => {
          const idx = paper.sections.findIndex((s) => s.id === sectionId)
          const swapWith = idx + direction
          if (idx < 0 || swapWith < 0 || swapWith >= paper.sections.length) return
          const [item] = paper.sections.splice(idx, 1)
          paper.sections.splice(swapWith, 0, item)
        })
      },

      // ---------------- Question group operations ----------------
      addQuestionGroup: (paperId, sectionId, initial) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          if (!sec) return
          const count = initial?.questionCount ?? 1
          sec.questionGroups.push({
            id: uid('qg'),
            questionType: initial?.questionType ?? 'MCQ',
            mode: initial?.mode ?? 'normal',
            questionCount: count,
            attemptCount: initial?.attemptCount ?? count,
            marksPerQuestion: initial?.marksPerQuestion ?? 1,
            instruction: initial?.instruction ?? '',
            questions: Array.from({ length: count }, () => ({ id: uid('q'), text: '', marks: initial?.marksPerQuestion ?? 1 })),
          })
        })
      },
      updateQuestionGroup: (paperId, sectionId, groupId, patch) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          const grp = sec?.questionGroups.find((g) => g.id === groupId)
          if (!grp) return
          Object.assign(grp, patch)

          // Keep question array length in sync with questionCount (11.1 Dynamic Question Fields)
          if (patch.questionCount !== undefined) {
            const count = Number(patch.questionCount) || 0
            if (count > grp.questions.length) {
              const toAdd = count - grp.questions.length
              for (let i = 0; i < toAdd; i++) {
                grp.questions.push({ id: uid('q'), text: '', marks: grp.marksPerQuestion })
              }
            } else if (count < grp.questions.length) {
              grp.questions = grp.questions.slice(0, count)
            }
            if (!grp.attemptCount || grp.attemptCount > count) grp.attemptCount = count
          }
          if (patch.marksPerQuestion !== undefined) {
            grp.questions.forEach((q) => (q.marks = Number(patch.marksPerQuestion) || 0))
          }
        })
      },
      deleteQuestionGroup: (paperId, sectionId, groupId) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          if (!sec) return
          sec.questionGroups = sec.questionGroups.filter((g) => g.id !== groupId)
        })
      },
      moveQuestionGroup: (paperId, sectionId, groupId, direction) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          if (!sec) return
          const idx = sec.questionGroups.findIndex((g) => g.id === groupId)
          const swapWith = idx + direction
          if (idx < 0 || swapWith < 0 || swapWith >= sec.questionGroups.length) return
          const [item] = sec.questionGroups.splice(idx, 1)
          sec.questionGroups.splice(swapWith, 0, item)
        })
      },

      // ---------------- Question operations ----------------
      updateQuestion: (paperId, sectionId, groupId, questionId, patch) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          const grp = sec?.questionGroups.find((g) => g.id === groupId)
          const question = grp?.questions.find((q) => q.id === questionId)
          if (question) Object.assign(question, patch)
        })
      },
      addQuestion: (paperId, sectionId, groupId) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          const grp = sec?.questionGroups.find((g) => g.id === groupId)
          if (!grp) return
          grp.questions.push({ id: uid('q'), text: '', marks: grp.marksPerQuestion })
          grp.questionCount = grp.questions.length
        })
      },
      deleteQuestion: (paperId, sectionId, groupId, questionId) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          const grp = sec?.questionGroups.find((g) => g.id === groupId)
          if (!grp) return
          grp.questions = grp.questions.filter((q) => q.id !== questionId)
          grp.questionCount = grp.questions.length
        })
      },
      duplicateQuestion: (paperId, sectionId, groupId, questionId) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          const grp = sec?.questionGroups.find((g) => g.id === groupId)
          if (!grp) return
          const idx = grp.questions.findIndex((q) => q.id === questionId)
          if (idx === -1) return
          const clone = { ...grp.questions[idx], id: uid('q') }
          grp.questions.splice(idx + 1, 0, clone)
          grp.questionCount = grp.questions.length
        })
      },
      moveQuestion: (paperId, sectionId, groupId, questionId, direction) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          const grp = sec?.questionGroups.find((g) => g.id === groupId)
          if (!grp) return
          const idx = grp.questions.findIndex((q) => q.id === questionId)
          const swapWith = idx + direction
          if (idx < 0 || swapWith < 0 || swapWith >= grp.questions.length) return
          const [item] = grp.questions.splice(idx, 1)
          grp.questions.splice(swapWith, 0, item)
        })
      },
    }),
    {
      name: 'papercraft-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        teacher: state.teacher,
        theme: state.theme,
        language: state.language,
        papers: state.papers,
        activePaperId: state.activePaperId,
      }),
    }
  )
)
