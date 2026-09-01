import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid, sectionLetter } from '../lib/utils'
import { mockTeacher, seedPapers } from '../data/mockData'

const AUTOSAVE_DELAY = 700

function makeBlankQuestion(marks = 1) {
  return {
    id: uid('q'),
    text: '',
    marks,
    dir: 'ltr',
    align: 'left', // Feature 7 — click-to-move alignment in preview
    keepTogether: false,
    image: null, // { url, width, caption }
    answerSpace: { type: 'none', lines: 4, heightMm: 40 },
    subQuestions: [],
    options: [],
    matchPairs: [],
    matchColumnHeads: ['Column I', 'Column II'],
    assertion: '',
    reason: '',
    correctOptionId: null,
    tableGrid: null, // { rows, cols, cells: string[][] }
  }
}

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

      // Feature 5 — profile edit (school name / address / name), editable from Settings.
      updateTeacherProfile: (patch) => {
        set((state) => ({ teacher: { ...(state.teacher || {}), ...patch } }))
      },

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
        const teacher = get().teacher
        const { showAddress, address, ...restDetails } = examDetails || {}
        const paper = {
          id,
          status: 'draft',
          sections: [],
          createdAt: now,
          updatedAt: now,
          version: 1,
          settings: {
            marksPosition: 'bracket',
            numberingStyle: 'numeric',
            headerLogoUrl: '',
            headerLayout: 'center',
            fontFamily: 'sans',
            watermarkText: '',
            footerText: '',
            showPageNumber: true,
            template: 'classic',
            paperSize: 'A4',
            instructions: [],
            showAddress: !!showAddress,
            address: address || teacher?.address || '',
            border: 'none',
          },
          ...restDetails,
        }
        set((state) => ({ papers: [paper, ...state.papers], activePaperId: id }))
        return id
      },

      setActivePaper: (id) => set({ activePaperId: id }),

      updatePaperMeta: (id, patch) => {
        get()._touch(id, (paper) => Object.assign(paper, patch))
      },

      // SRS 17.2 / 26 / 27-30 — template & header/footer/marks-position settings.
      updatePaperSettings: (id, patch) => {
        get()._touch(id, (paper) => {
          paper.settings = { ...(paper.settings || {}), ...patch }
        })
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

      // ---------------- Undo / Redo (SRS 43) ----------------
      _history: { past: [], future: [] },
      undo: () => {
        const { past, future } = get()._history
        if (past.length === 0) return
        const previous = past[past.length - 1]
        const newPast = past.slice(0, -1)
        set((state) => ({
          papers: previous,
          _history: { past: newPast, future: [state.papers, ...future].slice(0, 50) },
        }))
      },
      redo: () => {
        const { past, future } = get()._history
        if (future.length === 0) return
        const next = future[0]
        const newFuture = future.slice(1)
        set((state) => ({
          papers: next,
          _history: { past: [...past, state.papers].slice(-50), future: newFuture },
        }))
      },

      // Internal helper: mutate a paper immutably + trigger autosave indicator
      _touch: (id, mutator) => {
        const before = get().papers
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
        set((state) => ({
          _history: { past: [...state._history.past, before].slice(-50), future: [] },
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
            align: 'left', // Feature 2 — click-to-move section title (left/center/right)
            restartNumbering: true, // auto-selected by default, teacher can turn it off
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
      // SRS 11.5 — native drag-and-drop reordering (drop `draggedId` before `targetId`).
      reorderSections: (paperId, draggedId, targetId) => {
        get()._touch(paperId, (paper) => {
          if (draggedId === targetId) return
          const from = paper.sections.findIndex((s) => s.id === draggedId)
          const to = paper.sections.findIndex((s) => s.id === targetId)
          if (from === -1 || to === -1) return
          const [item] = paper.sections.splice(from, 1)
          paper.sections.splice(to, 0, item)
        })
      },
      duplicateSection: (paperId, sectionId) => {
        get()._touch(paperId, (paper) => {
          const idx = paper.sections.findIndex((s) => s.id === sectionId)
          if (idx === -1) return
          const clone = JSON.parse(JSON.stringify(paper.sections[idx]))
          clone.id = uid('sec')
          clone.title = `${clone.title} (Copy)`
          clone.questionGroups.forEach((g) => {
            g.id = uid('qg')
            g.questions.forEach((qn) => {
              qn.id = uid('q')
              ;(qn.subQuestions || []).forEach((sq) => (sq.id = uid('sq')))
              ;(qn.options || []).forEach((o) => (o.id = uid('opt')))
              ;(qn.matchPairs || []).forEach((m) => (m.id = uid('mp')))
            })
          })
          paper.sections.splice(idx + 1, 0, clone)
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
            // Question Type (Optional) field starts pre-filled with the picked
            // type and stays editable — same field the dropdown auto-syncs to.
            customTypeName: initial?.questionType ?? 'MCQ',
            mode: initial?.mode ?? 'normal',
            questionCount: count,
            attemptCount: initial?.attemptCount ?? count,
            marksPerQuestion: initial?.marksPerQuestion ?? 1,
            negativeMarks: 0,
            optionsLayout: 'vertical',
            pageBreakBefore: false,
            restartNumbering: true, // Feature 3 — auto-selected by default, same as section-level restart
            showMarks: true, // Feature 8 — total marks for this question type shown in preview by default
            passage: '',
            instruction: initial?.instruction ?? '',
            questions: Array.from({ length: count }, () => makeBlankQuestion(initial?.marksPerQuestion ?? 1)),
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
                grp.questions.push(makeBlankQuestion(grp.marksPerQuestion))
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
      reorderQuestionGroups: (paperId, sectionId, draggedId, targetId) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          if (!sec || draggedId === targetId) return
          const from = sec.questionGroups.findIndex((g) => g.id === draggedId)
          const to = sec.questionGroups.findIndex((g) => g.id === targetId)
          if (from === -1 || to === -1) return
          const [item] = sec.questionGroups.splice(from, 1)
          sec.questionGroups.splice(to, 0, item)
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
          grp.questions.push(makeBlankQuestion(grp.marksPerQuestion))
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
      reorderQuestions: (paperId, sectionId, groupId, draggedId, targetId) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          const grp = sec?.questionGroups.find((g) => g.id === groupId)
          if (!grp || draggedId === targetId) return
          const from = grp.questions.findIndex((q) => q.id === draggedId)
          const to = grp.questions.findIndex((q) => q.id === targetId)
          if (from === -1 || to === -1) return
          const [item] = grp.questions.splice(from, 1)
          grp.questions.splice(to, 0, item)
        })
      },
      insertFromBank: (paperId, sectionId, groupId, bankItem) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          const grp = sec?.questionGroups.find((g) => g.id === groupId)
          if (!grp) return
          const question = makeBlankQuestion(grp.marksPerQuestion)
          question.text = bankItem.text
          grp.questions.push(question)
          grp.questionCount = grp.questions.length
        })
      },
      setCorrectOption: (paperId, sectionId, groupId, questionId, optionId) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          if (question) question.correctOptionId = optionId
        })
      },

      // Small helper: locate a question inside a mutable paper draft.
      _findQuestion: (paper, sectionId, groupId, questionId) => {
        const sec = paper.sections.find((s) => s.id === sectionId)
        const grp = sec?.questionGroups.find((g) => g.id === groupId)
        return grp?.questions.find((q) => q.id === questionId) || null
      },

      // ---------------- Sub-questions (SRS 16 & 17) ----------------
      addSubQuestion: (paperId, sectionId, groupId, questionId) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          if (!question) return
          question.subQuestions = question.subQuestions || []
          const label = String.fromCharCode(97 + question.subQuestions.length)
          question.subQuestions.push({ id: uid('sq'), label, text: '', marks: 1, orWith: false })
        })
      },
      updateSubQuestion: (paperId, sectionId, groupId, questionId, subId, patch) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          const sub = question?.subQuestions?.find((s) => s.id === subId)
          if (sub) Object.assign(sub, patch)
        })
      },
      deleteSubQuestion: (paperId, sectionId, groupId, questionId, subId) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          if (!question) return
          question.subQuestions = (question.subQuestions || []).filter((s) => s.id !== subId)
          question.subQuestions.forEach((s, i) => { s.label = String.fromCharCode(97 + i) })
        })
      },
      moveSubQuestion: (paperId, sectionId, groupId, questionId, subId, direction) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          if (!question?.subQuestions) return
          const idx = question.subQuestions.findIndex((s) => s.id === subId)
          const swapWith = idx + direction
          if (idx < 0 || swapWith < 0 || swapWith >= question.subQuestions.length) return
          const [item] = question.subQuestions.splice(idx, 1)
          question.subQuestions.splice(swapWith, 0, item)
          question.subQuestions.forEach((s, i) => { s.label = String.fromCharCode(97 + i) })
        })
      },

      // ---------------- MCQ / Assertion-Reason options (SRS 18 & 19) ----------------
      addOption: (paperId, sectionId, groupId, questionId) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          if (!question) return
          question.options = question.options || []
          question.options.push({ id: uid('opt'), text: '', imageUrl: '' })
        })
      },
      updateOption: (paperId, sectionId, groupId, questionId, optionId, patch) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          const opt = question?.options?.find((o) => o.id === optionId)
          if (opt) Object.assign(opt, patch)
        })
      },
      deleteOption: (paperId, sectionId, groupId, questionId, optionId) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          if (!question) return
          question.options = (question.options || []).filter((o) => o.id !== optionId)
        })
      },

      // ---------------- Match the Following pairs (SRS 4) ----------------
      addMatchPair: (paperId, sectionId, groupId, questionId) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          if (!question) return
          question.matchPairs = question.matchPairs || []
          question.matchPairs.push({ id: uid('mp'), left: '', right: '' })
        })
      },
      updateMatchPair: (paperId, sectionId, groupId, questionId, pairId, patch) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          const pair = question?.matchPairs?.find((p) => p.id === pairId)
          if (pair) Object.assign(pair, patch)
        })
      },
      deleteMatchPair: (paperId, sectionId, groupId, questionId, pairId) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          if (!question) return
          question.matchPairs = (question.matchPairs || []).filter((p) => p.id !== pairId)
        })
      },

      // ---------------- Table/Grid question type (SRS 13) ----------------
      setTableGrid: (paperId, sectionId, groupId, questionId, rows, cols) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          if (!question) return
          const prev = question.tableGrid?.cells || []
          const cells = Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => prev[r]?.[c] ?? '')
          )
          question.tableGrid = { rows, cols, cells }
        })
      },
      updateTableCell: (paperId, sectionId, groupId, questionId, r, c, value) => {
        get()._touch(paperId, (paper) => {
          const question = get()._findQuestion(paper, sectionId, groupId, questionId)
          if (!question?.tableGrid) return
          question.tableGrid.cells[r][c] = value
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
