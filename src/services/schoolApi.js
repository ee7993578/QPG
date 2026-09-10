// schoolApi — sections 22/36. Talks to the real backend
// (/api/school/teachers) and caches results in schoolStore so pages that
// read useSchoolStore keep working unchanged.
import { useSchoolStore } from '../store/schoolStore'
import { apiClient } from '../lib/apiClient'

function mapTeacher(t) {
  return { ...t, id: String(t.id) }
}

export const schoolApi = {
  // GET /api/school/teachers
  async getTeachers() {
    const rows = await apiClient.get('/api/school/teachers')
    const teachers = rows.map(mapTeacher)
    useSchoolStore.setState({ teachers, teachersLoaded: true })
    return teachers
  },

  // POST /api/school/teachers  { name, mobile, email, subject }
  async addTeacher(payload) {
    const res = await apiClient.post('/api/school/teachers', payload)
    const teacher = mapTeacher(res)
    useSchoolStore.setState((s) => ({ teachers: [...s.teachers, teacher] }))
    return teacher
  },

  // DELETE /api/school/teachers/{id}
  async removeTeacher(id) {
    await apiClient.delete(`/api/school/teachers/${id}`)
    useSchoolStore.setState((s) => ({ teachers: s.teachers.filter((t) => t.id !== id) }))
    return { success: true }
  },
}
