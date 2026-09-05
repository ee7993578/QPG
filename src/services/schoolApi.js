// schoolApi — sections 22/36. Mirrors the future Spring Boot contract;
// delegates to schoolStore for now.
import { useSchoolStore } from '../store/schoolStore'

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

export const schoolApi = {
  // GET /api/school/teachers
  async getTeachers() {
    await delay()
    return useSchoolStore.getState().teachers
  },

  // POST /api/school/teachers  { name, mobile, email }
  async addTeacher(payload) {
    await delay(420)
    return useSchoolStore.getState().addTeacher(payload)
  },

  // DELETE /api/school/teachers/{id}
  async removeTeacher(id) {
    await delay()
    useSchoolStore.getState().removeTeacher(id)
    return { success: true }
  },
}
