import { create } from 'zustand'

/**
 * questionBankStore — sections 23/24.
 *
 * Now a thin local cache: services/questionBankApi.js is the only thing
 * that talks to the backend (GET/POST/PUT/DELETE /api/question-bank,
 * POST /api/question-bank/{id}/copy) and writes results back here with
 * setState, so every page/component reading useQuestionBankStore keeps
 * working unchanged.
 *
 *   'mine'   → the signed-in teacher's personal bank (myQuestions)
 *   'school' → the school-wide shared bank (schoolQuestions)
 */
export const useQuestionBankStore = create((set, get) => ({
  myQuestions: [],
  schoolQuestions: [],
  myQuestionsLoaded: false,
  schoolQuestionsLoaded: false,

  list: (scope = 'mine') => (scope === 'school' ? get().schoolQuestions : get().myQuestions),
}))
