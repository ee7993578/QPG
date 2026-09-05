// paperApi — sections 36/40. Every paper CRUD path a component needs, in
// one place, so no page imports fetch/axios directly. Delegates to
// useAppStore (localStorage-backed) until the Spring Boot API exists.
import { useAppStore } from '../store/useAppStore'
import { useSubscriptionStore } from '../store/subscriptionStore'
import { downloadPaperAsPdf, downloadPaperAsDoc } from '../lib/exportPaper'

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms))

export const paperApi = {
  // GET /api/papers
  async getPapers() {
    await delay()
    return useAppStore.getState().papers
  },

  // GET /api/papers/{id}
  async getPaper(id) {
    await delay()
    return useAppStore.getState().getPaper(id) || null
  },

  // POST /api/papers
  async createPaper(examDetails) {
    await delay(380)
    return useAppStore.getState().createPaper(examDetails)
  },

  // PATCH /api/papers/{id}
  async updatePaper(id, patch) {
    await delay(0)
    useAppStore.getState().updatePaperMeta(id, patch)
    return { success: true }
  },

  // PATCH /api/papers/{id}/settings
  async updatePaperSettings(id, patch) {
    useAppStore.getState().updatePaperSettings(id, patch)
    return { success: true }
  },

  // POST /api/papers/{id}/duplicate
  async duplicatePaper(id) {
    await delay()
    return useAppStore.getState().duplicatePaper(id)
  },

  // DELETE /api/papers/{id}
  async deletePaper(id) {
    await delay()
    useAppStore.getState().deletePaper(id)
    return { success: true }
  },

  /**
   * POST /api/papers/{id}/download  → the real backend will return a PDF
   * stream and enforce the quota server-side (section 42). For now the quota
   * check is a UI gate only and the file is produced client-side from the
   * live preview DOM.
   *
   * Returns { success, reason } — reason 'quota' means the paywall opened.
   */
  async downloadPaper(paper, format = 'pdf') {
    const allowed = useSubscriptionStore.getState().attemptDownload()
    if (!allowed) return { success: false, reason: 'quota' }
    try {
      if (format === 'pdf') await downloadPaperAsPdf(paper)
      else downloadPaperAsDoc(paper)
      return { success: true }
    } catch (err) {
      return { success: false, reason: 'error', error: err }
    }
  },
}
