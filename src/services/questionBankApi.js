// questionBankApi — sections 23/24/36. Mirrors the future Spring Boot
// contract; delegates to questionBankStore for now.
import { useQuestionBankStore } from '../store/questionBankStore'

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms))

export const questionBankApi = {
  // GET /api/question-bank?scope=mine|school
  async list(scope = 'mine') {
    await delay()
    return useQuestionBankStore.getState().list(scope)
  },

  // POST /api/question-bank?scope=…
  async create(scope, payload) {
    await delay()
    return useQuestionBankStore.getState().addQuestion(scope, payload)
  },

  // PUT /api/question-bank/{id}
  async update(scope, id, patch) {
    await delay()
    useQuestionBankStore.getState().updateQuestion(scope, id, patch)
    return { success: true }
  },

  // DELETE /api/question-bank/{id}
  async remove(scope, id) {
    await delay()
    useQuestionBankStore.getState().deleteQuestion(scope, id)
    return { success: true }
  },

  // POST /api/question-bank/{id}/copy  (school → my bank)
  async copyToMine(id) {
    await delay()
    return useQuestionBankStore.getState().copyToMine(id)
  },
}
