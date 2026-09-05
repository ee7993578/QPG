// authApi — components should call these instead of touching fetch/axios
// directly. Right now every function delegates to authStore (mock/local
// state) after a simulated network delay; once the Spring Boot backend
// exists, only the bodies below need to change — call sites stay the same.
import { useAuthStore } from '../store/authStore'

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))

export const authApi = {
  // POST /api/auth/otp/request
  async login(mobile) {
    await delay()
    return useAuthStore.getState().requestOtp(mobile)
  },

  // POST /api/auth/otp/verify -> { success, isNewUser }
  async verifyOtp(otp) {
    await delay()
    return useAuthStore.getState().verifyOtp(otp)
  },

  // POST /api/auth/register/teacher
  async registerTeacher(payload) {
    await delay(500)
    return useAuthStore.getState().registerTeacher(payload)
  },

  // POST /api/auth/register/school
  async registerSchool(payload) {
    await delay(500)
    return useAuthStore.getState().registerSchool(payload)
  },

  // POST /api/auth/logout
  async logout() {
    useAuthStore.getState().logout()
    return { success: true }
  },
}
