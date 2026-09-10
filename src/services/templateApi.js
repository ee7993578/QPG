// templateApi — sections 25/36. Shared school templates (header/footer/
// formatting shells) that teachers apply to a paper's settings. Wired to
// the real backend (/api/school/templates) and cached in schoolStore.
import { useSchoolStore } from '../store/schoolStore'
import { apiClient } from '../lib/apiClient'

function mapTemplate(t) {
  return { ...t, id: String(t.id) }
}

export const templateApi = {
  // GET /api/school/templates
  async list() {
    const rows = await apiClient.get('/api/school/templates')
    const templates = rows.map(mapTemplate)
    useSchoolStore.setState({ templates, templatesLoaded: true })
    return templates
  },

  // POST /api/school/templates  |  PUT /api/school/templates/{id}
  async save(payload) {
    if (payload.id) {
      const res = await apiClient.put(`/api/school/templates/${payload.id}`, payload)
      const template = mapTemplate(res)
      useSchoolStore.setState((s) => ({
        templates: s.templates.map((tpl) => (tpl.id === template.id ? template : tpl)),
      }))
      return template
    }
    const res = await apiClient.post('/api/school/templates', payload)
    const template = mapTemplate(res)
    useSchoolStore.setState((s) => ({ templates: [...s.templates, template] }))
    return template
  },

  // DELETE /api/school/templates/{id}
  async remove(id) {
    await apiClient.delete(`/api/school/templates/${id}`)
    useSchoolStore.setState((s) => ({ templates: s.templates.filter((tpl) => tpl.id !== id) }))
    return { success: true }
  },

  // PUT /api/school/templates/{id}/default
  async setDefault(id) {
    const res = await apiClient.put(`/api/school/templates/${id}/default`)
    const updated = mapTemplate(res)
    useSchoolStore.setState((s) => ({
      templates: s.templates.map((tpl) => (tpl.id === updated.id ? updated : { ...tpl, isDefault: false })),
    }))
    return { success: true }
  },
}
