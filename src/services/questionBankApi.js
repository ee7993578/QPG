// questionBankApi — sections 23/24/36. Wired to the real Spring Boot backend
// (/api/question-bank/*) and caches results in questionBankStore so pages
// that read useQuestionBankStore keep working unchanged.
import { useQuestionBankStore } from '../store/questionBankStore'
import { apiClient } from '../lib/apiClient'

// Backend's QuestionBankResponse: { id, subject, className, chapter,
// questionType, difficulty, text, marks, options: string[], author,
// schoolItem, createdAt }. Frontend components key items off `id` (string)
// and read `options` as a flat string[] already, so only the id needs coercing.
function mapItem(item) {
  return { ...item, id: String(item.id) }
}

// Frontend draft shape -> backend QuestionBankRequest.
function toPayload(scope, data) {
  return {
    subject: data.subject,
    className: data.className,
    chapter: data.chapter,
    questionType: data.questionType,
    difficulty: data.difficulty,
    text: data.text,
    marks: Number(data.marks) || 1,
    options: (data.options || []).filter((o) => o && o.trim()).map((text) => ({ text })),
    scope: scope === 'school' ? 'school' : 'mine',
  }
}

const keyFor = (scope) => (scope === 'school' ? 'schoolQuestions' : 'myQuestions')

export const questionBankApi = {
  // GET /api/question-bank?scope=mine|school
  async list(scope = 'mine') {
    const rows = await apiClient.get('/api/question-bank', { scope })
    const items = rows.map(mapItem)
    const key = keyFor(scope)
    useQuestionBankStore.setState({ [key]: items, [`${key}Loaded`]: true })
    return items
  },

  // POST /api/question-bank
  async create(scope, payload) {
    const res = await apiClient.post('/api/question-bank', toPayload(scope, payload))
    const item = mapItem(res)
    const key = keyFor(scope)
    useQuestionBankStore.setState((s) => ({ [key]: [item, ...s[key]] }))
    return item
  },

  // PUT /api/question-bank/{id}
  async update(scope, id, patch) {
    const res = await apiClient.put(`/api/question-bank/${id}`, toPayload(scope, patch))
    const item = mapItem(res)
    const key = keyFor(scope)
    useQuestionBankStore.setState((s) => ({
      [key]: s[key].map((q) => (String(q.id) === String(id) ? item : q)),
    }))
    return item
  },

  // DELETE /api/question-bank/{id}
  async remove(scope, id) {
    await apiClient.delete(`/api/question-bank/${id}`)
    const key = keyFor(scope)
    useQuestionBankStore.setState((s) => ({
      [key]: s[key].filter((q) => String(q.id) !== String(id)),
    }))
    return { success: true }
  },

  // POST /api/question-bank/{id}/copy  (school -> my bank)
  async copyToMine(id) {
    const res = await apiClient.post(`/api/question-bank/${id}/copy`)
    const item = mapItem(res)
    useQuestionBankStore.setState((s) => ({ myQuestions: [item, ...s.myQuestions] }))
    return item
  },
}
