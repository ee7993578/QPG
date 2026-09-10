import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid, sectionLetter } from '../lib/utils'
import { apiClient, ApiError } from '../lib/apiClient'

const AUTOSAVE_DELAY = 700

function makeBlankQuestion(marks = 1) {
  return {
    id: uid('q'),
    text: '',
    marks,
    dir: 'ltr',
    align: 'left', // Feature 7 — click-to-move alignment in preview
    keepTogether: false,
    showMarks: true, // marks for this question shown in preview by default; click the marks in preview to toggle
    image: null, // { url, width, height, caption, rotate, originalUrl }
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

// Backend PaperResponse -> the local `paper` shape the builder/preview
// already read (see PaperResponse.java javadoc: shaped deliberately to
// match this 1:1, right down to nested section/group/question field names).
function mapResponseToLocalPaper(res) {
  return {
    id: String(res.id),
    status: res.status,
    version: res.version,
    createdAt: res.createdAt,
    updatedAt: res.updatedAt,
    examType: res.examType,
    customExamName: res.customExamName,
    examDate: res.examDate,
    duration: res.duration,
    totalMarks: res.totalMarks,
    schoolName: res.schoolName,
    showAddress: res.showAddress,
    address: res.address,
    className: res.className,
    customClassName: res.customClassName,
    section: res.section,
    customSection: res.customSection,
    subject: res.subject,
    customSubject: res.customSubject,
    ownerUserId: res.ownerUserId,
    schoolId: res.schoolId,
    // School review-lifecycle fields — null/unused for individual-teacher papers.
    submittedAt: res.submittedAt,
    reviewedAt: res.reviewedAt,
    approvedAt: res.approvedAt,
    finalizedAt: res.finalizedAt,
    reviewComment: res.reviewComment,
    reviewedByName: res.reviewedByName,
    settings: res.settings || {},
    sections: res.sections || [],
    _structureLoaded: true, // fetched via GET /api/papers/{id} — has real sections, not just the summary row
  }
}

// Personal "My Templates" layout templates are stored with the client ids
// they were captured with (see paperTemplateApi.js) — re-issue fresh ones
// on every apply so dropping the same template onto several papers never
// creates id collisions, remapping correctOptionId along with its option.
function cloneStructureWithFreshIds(sections) {
  return (sections || []).map((sec) => ({
    ...sec,
    id: uid('sec'),
    questionGroups: (sec.questionGroups || []).map((g) => ({
      ...g,
      id: uid('qg'),
      questions: (g.questions || []).map((q) => {
        const optionIdMap = {}
        const options = (q.options || []).map((o) => {
          const newId = uid('opt')
          optionIdMap[o.id] = newId
          return { ...o, id: newId }
        })
        return {
          ...q,
          id: uid('q'),
          options,
          subQuestions: (q.subQuestions || []).map((sq) => ({ ...sq, id: uid('sq') })),
          matchPairs: (q.matchPairs || []).map((mp) => ({ ...mp, id: uid('mp') })),
          correctOptionId: q.correctOptionId ? (optionIdMap[q.correctOptionId] || null) : null,
        }
      }),
    })),
  }))
}

// Local paper meta fields -> UpdatePaperRequest / CreatePaperRequest body.
function buildMetaPayload(paper) {
  return {
    examType: paper.examType,
    customExamName: paper.customExamName,
    examDate: paper.examDate,
    duration: paper.duration,
    totalMarks: paper.totalMarks,
    schoolName: paper.schoolName,
    showAddress: paper.showAddress,
    address: paper.address,
    className: paper.className,
    customClassName: paper.customClassName,
    section: paper.section,
    customSection: paper.customSection,
    subject: paper.subject,
    customSubject: paper.customSubject,
    status: paper.status,
  }
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ---------------- Theme & language ----------------
      theme: 'system', // 'light' | 'dark' | 'system'
      setTheme: (theme) => set({ theme }),
      language: 'en',
      setLanguage: (language) => set({ language }),

      // ---------------- Papers ----------------
      papers: [],
      papersLoading: false,
      papersLoaded: false,
      activePaperId: null,
      saveStatus: 'saved', // 'saving' | 'saved' | 'error'
      _saveTimer: null,
      _dirtyPaperId: null,

      getPaper: (id) => get().papers.find((p) => p.id === id),

      // Called by authStore.logout() so a signed-out session doesn't leave
      // a stale "active paper" pointing at another account's paper.
      resetSession: () => set({ papers: [], papersLoaded: false, activePaperId: null }),

      // GET /api/papers — lightweight summary rows for MyPapers/SchoolPapers.
      // Full section/question data for a given paper is fetched on demand
      // by loadPaper() when the builder opens it.
      // `status` is an optional server-side filter used by the School
      // Admin's status tabs (All / Draft / Submitted / Needs Changes /
      // Approved / Final) — forwarded as ?status=. Calling this with no
      // argument (as MyPapers/individual teachers always do) is byte-for-
      // byte identical to before.
      loadPapers: async (status) => {
        set({ papersLoading: true })
        try {
          const rows = await apiClient.get('/api/papers', status ? { status } : undefined)
          set((state) => ({
            papers: rows.map((row) => {
              const existing = state.papers.find((p) => p.id === String(row.id))
              // Keep any already-loaded full structure around; summary rows
              // don't include sections/settings.
              return existing
                ? { ...existing, ...row, id: String(row.id) }
                : { ...row, id: String(row.id), sections: [], settings: {} }
            }),
            papersLoading: false,
            papersLoaded: true,
          }))
        } catch (err) {
          set({ papersLoading: false })
          throw err
        }
      },

      // GET /api/papers/{id} — full nested structure, used when opening the builder.
      loadPaper: async (id) => {
        const res = await apiClient.get(`/api/papers/${id}`)
        const paper = mapResponseToLocalPaper(res)
        set((state) => {
          const existing = state.papers.find((p) => p.id === paper.id)
          // PaperResponse (the detail endpoint) doesn't carry `ownerName` —
          // only the summary list (PaperSummaryResponse) does. Preserve it
          // from whatever's already in the store (e.g. the School Admin's
          // Papers list) so the builder's status banner can still show the
          // owning teacher's name after this full-structure fetch replaces
          // everything else.
          const merged = existing?.ownerName ? { ownerName: existing.ownerName, ...paper } : paper
          return {
            papers: existing
              ? state.papers.map((p) => (p.id === paper.id ? merged : p))
              : [merged, ...state.papers],
          }
        })
        return paper
      },

      // POST /api/papers
      createPaper: async (examDetails) => {
        const { showAddress, address, ...restDetails } = examDetails || {}
        const res = await apiClient.post('/api/papers', {
          ...restDetails,
          showAddress: !!showAddress,
          address: address || '',
        })
        const paper = mapResponseToLocalPaper(res)
        // Fresh papers start with no sections yet — the builder adds them locally.
        paper.sections = paper.sections?.length ? paper.sections : []
        paper.settings = {
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
          address: address || '',
          border: 'none',
          ...paper.settings,
        }
        set((state) => ({ papers: [paper, ...state.papers], activePaperId: paper.id }))
        return paper.id
      },

      setActivePaper: (id) => set({ activePaperId: id }),

      updatePaperMeta: (id, patch) => {
        get()._touch(id, (paper) => Object.assign(paper, patch))
      },

      // SRS 17.2 / 26 / 27-30 — template & header/footer/marks-position settings.
      updatePaperSettings: (id, patch, opts) => {
        get()._touch(id, (paper) => {
          paper.settings = { ...(paper.settings || {}), ...patch }
        }, opts)
      },

      // Apply a personal "My Templates" template (see paperTemplateApi.js) to
      // an existing paper. `settings` (header/footer/font/spacing/layout) is
      // always applied; `sections` (only present on a "layout" template) is
      // the full blank section/question skeleton — applying it replaces the
      // paper's current sections entirely, so callers should confirm with
      // the teacher first if the paper already has real questions.
      applyPaperTemplate: (id, { settings, sections } = {}) => {
        get()._touch(id, (paper) => {
          if (settings) paper.settings = { ...(paper.settings || {}), ...settings }
          if (sections) paper.sections = cloneStructureWithFreshIds(sections)
        })
      },

      // POST /api/papers/{id}/duplicate — deep clone happens server-side;
      // we just take the response and drop it into the local list.
      duplicatePaper: async (id) => {
        const res = await apiClient.post(`/api/papers/${id}/duplicate`)
        const clone = mapResponseToLocalPaper(res)
        set((state) => ({ papers: [clone, ...state.papers] }))
        return clone.id
      },

      // DELETE /api/papers/{id}
      deletePaper: async (id) => {
        await apiClient.delete(`/api/papers/${id}`)
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

      // ---------------- School paper review lifecycle ----------------
      // Each of these calls its dedicated review-action endpoint (the
      // backend re-validates the current status server-side every time —
      // these are never a second source of truth) and then patches the
      // matching entry in the local `papers` array with the fresh
      // response, same pattern as duplicatePaper/deletePaper above. Only
      // ever meaningful for school-connected teacher papers; calling these
      // for any other paper is rejected by the backend with a 400.

      // POST /api/papers/{id}/submit — teacher: Draft/Needs-Changes -> Submitted.
      submitPaperForReview: async (id) => {
        const res = await apiClient.post(`/api/papers/${id}/submit`)
        const updated = mapResponseToLocalPaper(res)
        set((state) => ({
          papers: state.papers.map((p) => (p.id === id ? { ...p, ...updated } : p)),
        }))
        return updated
      },

      // POST /api/papers/{id}/approve — admin: Submitted -> Approved.
      approveSchoolPaper: async (id) => {
        const res = await apiClient.post(`/api/papers/${id}/approve`)
        const updated = mapResponseToLocalPaper(res)
        set((state) => ({
          papers: state.papers.map((p) => (p.id === id ? { ...p, ...updated } : p)),
        }))
        return updated
      },

      // POST /api/papers/{id}/request-changes — admin: Submitted -> Needs Changes (reason required).
      requestSchoolPaperChanges: async (id, reason) => {
        const res = await apiClient.post(`/api/papers/${id}/request-changes`, { reason })
        const updated = mapResponseToLocalPaper(res)
        set((state) => ({
          papers: state.papers.map((p) => (p.id === id ? { ...p, ...updated } : p)),
        }))
        return updated
      },

      // POST /api/papers/{id}/finalize — admin: Approved -> Final (locked forever).
      finalizeSchoolPaper: async (id) => {
        const res = await apiClient.post(`/api/papers/${id}/finalize`)
        const updated = mapResponseToLocalPaper(res)
        set((state) => ({
          papers: state.papers.map((p) => (p.id === id ? { ...p, ...updated } : p)),
        }))
        return updated
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
        get()._triggerAutosave(get().activePaperId)
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
        get()._triggerAutosave(get().activePaperId)
      },

      // Internal helper: mutate a paper immutably + trigger autosave to the backend.
      // `opts.silent` skips pushing this step onto the undo stack — used by
      // multi-step automated flows (Smart Fix's rungs) that already snapshot
      // their own single "before" state up front, so a run that touches 8
      // settings one after another doesn't bury the teacher's real edit
      // history under 8 near-identical undo steps. Autosave and the actual
      // paper mutation are completely unaffected either way.
      _touch: (id, mutator, opts) => {
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
        if (!opts?.silent) {
          set((state) => ({
            _history: { past: [...state._history.past, before].slice(-50), future: [] },
          }))
        }
        get()._triggerAutosave(id)
      },

      // Debounced sync of the touched paper's meta + settings + full nested
      // structure to the backend (PATCH .../{id}, PUT .../{id}/settings,
      // PUT .../{id}/structure). One combined sync keeps this simple and
      // correct regardless of which specific action changed the paper —
      // at the cost of a couple of extra small requests per autosave tick.
      _triggerAutosave: (paperId) => {
        const timer = get()._saveTimer
        if (timer) clearTimeout(timer)
        set({ saveStatus: 'saving', _dirtyPaperId: paperId })
        const t = setTimeout(async () => {
          const id = get()._dirtyPaperId
          const paper = id ? get().getPaper(id) : null
          if (!id || !paper) {
            set({ saveStatus: 'saved' })
            return
          }
          try {
            await Promise.all([
              apiClient.patch(`/api/papers/${id}`, buildMetaPayload(paper)),
              apiClient.put(`/api/papers/${id}/settings`, paper.settings || {}),
              apiClient.put(`/api/papers/${id}/structure`, { sections: paper.sections || [] }),
            ])
            set({ saveStatus: 'saved' })
          } catch (err) {
            console.error('Autosave failed:', err instanceof ApiError ? err.message : err)
            set({ saveStatus: 'error' })
          }
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
      updateQuestionGroup: (paperId, sectionId, groupId, patch, opts) => {
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
        }, opts)
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
      updateQuestion: (paperId, sectionId, groupId, questionId, patch, opts) => {
        get()._touch(paperId, (paper) => {
          const sec = paper.sections.find((s) => s.id === sectionId)
          const grp = sec?.questionGroups.find((g) => g.id === groupId)
          const question = grp?.questions.find((q) => q.id === questionId)
          if (question) Object.assign(question, patch)
        }, opts)
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
        theme: state.theme,
        language: state.language,
        // Papers now live on the backend — only cache the active id locally
        // so a reload can jump straight back into the builder while
        // loadPapers()/loadPaper() refetch the real data.
        activePaperId: state.activePaperId,
      }),
    }
  )
)
