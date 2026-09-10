// paperApi — every paper CRUD path a component needs, in one place, so no
// page imports fetch/apiClient directly. Delegates to useAppStore, which is
// now backed by the real Spring Boot API (GET/POST/PATCH/PUT/DELETE
// /api/papers/...). Structure autosave (sections/questions/etc.) happens
// automatically via useAppStore's debounced _triggerAutosave.
import { useAppStore } from '../store/useAppStore'
import { useSubscriptionStore } from '../store/subscriptionStore'
import { apiClient, ApiError } from '../lib/apiClient'
import { downloadPaperAsPdf, downloadPaperAsDoc } from '../lib/exportPaper'
import { downloadPaperAsDocx } from '../lib/exportDocx'

export const paperApi = {
  // GET /api/papers (optional ?status= filter — used by the School Admin's
  // status tabs; omit for the default unfiltered MyPapers/SchoolPapers list).
  async getPapers(status) {
    await useAppStore.getState().loadPapers(status)
    return useAppStore.getState().papers
  },

  // GET /api/papers/{id} — fetches the full nested structure.
  async getPaper(id) {
    try {
      return await useAppStore.getState().loadPaper(id)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  },

  // POST /api/papers
  async createPaper(examDetails) {
    return useAppStore.getState().createPaper(examDetails)
  },

  // PATCH /api/papers/{id} — applied locally immediately; the backend copy
  // is synced by useAppStore's debounced autosave.
  async updatePaper(id, patch) {
    useAppStore.getState().updatePaperMeta(id, patch)
    return { success: true }
  },

  // PATCH /api/papers/{id}/settings — same local-first + autosave pattern.
  async updatePaperSettings(id, patch) {
    useAppStore.getState().updatePaperSettings(id, patch)
    return { success: true }
  },

  // POST /api/papers/{id}/duplicate
  async duplicatePaper(id) {
    return useAppStore.getState().duplicatePaper(id)
  },

  // DELETE /api/papers/{id}
  async deletePaper(id) {
    await useAppStore.getState().deletePaper(id)
    return { success: true }
  },

  // ---- School paper review lifecycle (school-connected teachers only) ----

  // POST /api/papers/{id}/submit
  async submitForReview(id) {
    return useAppStore.getState().submitPaperForReview(id)
  },

  // POST /api/papers/{id}/approve
  async approvePaper(id) {
    return useAppStore.getState().approveSchoolPaper(id)
  },

  // POST /api/papers/{id}/request-changes
  async requestChanges(id, reason) {
    return useAppStore.getState().requestSchoolPaperChanges(id, reason)
  },

  // POST /api/papers/{id}/finalize
  async finalizePaper(id) {
    return useAppStore.getState().finalizeSchoolPaper(id)
  },

  /**
   * POST /api/papers/{id}/download — the backend enforces ownership/school
   * visibility and the free-download quota server-side (section 42); once
   * authorized, the PDF/DOC itself is still produced client-side from the
   * live preview DOM (section 43).
   *
   * Returns { success, reason } — reason 'quota' means the paywall should open.
   */
  async downloadPaper(paper, format = 'pdf') {
    try {
      await apiClient.post(`/api/papers/${paper.id}/download`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        // Quota exhausted server-side — open the same paywall the local
        // subscriptionStore used to gate on.
        useSubscriptionStore.setState({ downloadLockOpen: true })
        return { success: false, reason: 'quota' }
      }
      if (err instanceof ApiError && err.status === 403) {
        return { success: false, reason: 'forbidden', error: err }
      }
      return { success: false, reason: 'error', error: err }
    }

    try {
      if (format === 'pdf') await downloadPaperAsPdf(paper)
      else if (format === 'docx') await downloadPaperAsDocx(paper)
      else downloadPaperAsDoc(paper)
      return { success: true }
    } catch (err) {
      return { success: false, reason: 'error', error: err }
    }
  },
}
