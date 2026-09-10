// paperTemplateApi — personal ("My Templates") header/layout templates a
// teacher saves straight from one of their own papers on My Paper. Wired to
// /api/templates/mine + /api/papers/{id}/save-as-template and cached in
// myTemplatesStore. Distinct from templateApi.js (shared school templates).
import { useMyTemplatesStore } from '../store/myTemplatesStore'
import { apiClient } from '../lib/apiClient'

function mapTemplate(t) {
  return { ...t, id: String(t.id) }
}

export const paperTemplateApi = {
  // GET /api/templates/mine
  async list() {
    useMyTemplatesStore.setState({ templatesLoading: true })
    try {
      const rows = await apiClient.get('/api/templates/mine')
      const templates = rows.map(mapTemplate)
      useMyTemplatesStore.setState({ templates, templatesLoaded: true, templatesLoading: false })
      return templates
    } catch (err) {
      useMyTemplatesStore.setState({ templatesLoading: false })
      throw err
    }
  },

  // POST /api/papers/{paperId}/save-as-template — { type: 'header' | 'layout', name, description }
  async saveFromPaper(paperId, payload) {
    const res = await apiClient.post(`/api/papers/${paperId}/save-as-template`, payload)
    const template = mapTemplate(res)
    useMyTemplatesStore.setState((s) => ({ templates: [template, ...s.templates] }))
    return template
  },

  // DELETE /api/templates/mine/{id}
  async remove(id) {
    await apiClient.delete(`/api/templates/mine/${id}`)
    useMyTemplatesStore.setState((s) => ({ templates: s.templates.filter((t) => t.id !== id) }))
    return { success: true }
  },

  // GET /api/school/templates/teachers — School Admin only. Aggregate,
  // read-only view of every teacher's personal templates at the school.
  // Not cached in a store (admin-only, single page) — callers keep it local.
  async listSchoolTeachers() {
    const rows = await apiClient.get('/api/school/templates/teachers')
    return rows.map(mapTemplate)
  },
}
