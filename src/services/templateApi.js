// templateApi — sections 25/36. Shared school templates (header/footer/
// formatting shells) that teachers apply to a paper's settings.
import { useSchoolStore } from '../store/schoolStore'

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms))

export const templateApi = {
  // GET /api/school/templates
  async list() {
    await delay()
    return useSchoolStore.getState().templates
  },

  // POST /api/school/templates  |  PUT /api/school/templates/{id}
  async save(payload) {
    await delay(380)
    return useSchoolStore.getState().saveTemplate(payload)
  },

  // DELETE /api/school/templates/{id}
  async remove(id) {
    await delay()
    useSchoolStore.getState().removeTemplate(id)
    return { success: true }
  },

  // PUT /api/school/templates/{id}/default
  async setDefault(id) {
    await delay()
    useSchoolStore.getState().setDefaultTemplate(id)
    return { success: true }
  },
}
