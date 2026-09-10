// authApi — components call these instead of touching fetch/apiClient
// directly. Each function now delegates to authStore, which talks to the
// real Spring Boot backend (see store/authStore.js + lib/apiClient.js).
import { useAuthStore } from '../store/authStore'

export const authApi = {
  // POST /api/auth/otp/request
  async login(mobile) {
    return useAuthStore.getState().requestOtp(mobile)
  },

  // POST /api/auth/otp/verify -> { success, isNewUser }
  async verifyOtp(otp) {
    return useAuthStore.getState().verifyOtp(otp)
  },

  // POST /api/auth/register/teacher
  async registerTeacher(payload) {
    return useAuthStore.getState().registerTeacher(payload)
  },

  // POST /api/auth/register/school
  async registerSchool(payload) {
    return useAuthStore.getState().registerSchool(payload)
  },

  // Local session teardown (no backend session to invalidate — JWT is
  // stateless, so "logout" just means "forget the token on this device").
  async logout() {
    useAuthStore.getState().logout()
    return { success: true }
  },
}
