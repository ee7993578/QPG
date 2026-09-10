// deadlineApi — School Paper Submission Deadline feature (Session 3 backend,
// wired here in Session 4). Talks to the real backend
// (/api/school/deadline) and caches results in schoolStore, same pattern as
// schoolApi.js for teachers/templates.
//
// GET is available to both a School Admin and a school-connected teacher
// (the banner reads it); every mutating call is admin-only server-side —
// this file doesn't re-check that, the backend does (403 otherwise).
import { useSchoolStore } from '../store/schoolStore'
import { apiClient } from '../lib/apiClient'

export const deadlineApi = {
  // GET /api/school/deadline
  async getDeadline() {
    const res = await apiClient.get('/api/school/deadline')
    useSchoolStore.setState({ schoolDeadline: res, schoolDeadlineLoaded: true })
    return res
  },

  // PUT /api/school/deadline
  // payload: { examName?, startAt?, deadlineAt, timezone, enabled?, policy?, examVisibility? }
  async setDeadline(payload) {
    const res = await apiClient.put('/api/school/deadline', payload)
    useSchoolStore.setState({ schoolDeadline: res, schoolDeadlineLoaded: true })
    return res
  },

  // POST /api/school/deadline/extend  { deadlineAt, note? }
  async extendDeadline(payload) {
    const res = await apiClient.post('/api/school/deadline/extend', payload)
    useSchoolStore.setState({ schoolDeadline: res, schoolDeadlineLoaded: true })
    return res
  },

  // POST /api/school/deadline/close  { note? }
  async closeSubmissions(note) {
    const res = await apiClient.post('/api/school/deadline/close', note ? { note } : {})
    useSchoolStore.setState({ schoolDeadline: res, schoolDeadlineLoaded: true })
    return res
  },

  // POST /api/school/deadline/reopen  { reopenedUntil?, note? }
  async reopenSubmissions(payload) {
    const res = await apiClient.post('/api/school/deadline/reopen', payload || {})
    useSchoolStore.setState({ schoolDeadline: res, schoolDeadlineLoaded: true })
    return res
  },

  // GET /api/school/deadline/history — School Admin only.
  async getDeadlineHistory() {
    const rows = await apiClient.get('/api/school/deadline/history')
    useSchoolStore.setState({ schoolDeadlineHistory: rows, schoolDeadlineHistoryLoaded: true })
    return rows
  },
}
