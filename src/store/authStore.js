import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAppStore } from './useAppStore'
import { apiClient, ApiError } from '../lib/apiClient'

/**
 * authStore — wired to the real Spring Boot backend (/api/auth/*, /api/me).
 *
 * Same public shape as before (isAuthenticated, accountType, teacher,
 * school, requestOtp/verifyOtp/registerTeacher/registerSchool/logout, ...)
 * so pages and authApi.js did not need to change — only what happens
 * inside these functions changed from local mock state to real HTTP calls.
 */

// Maps the backend's flat UserResponse (role/accountType/schoolId/...) onto
// the two shapes the rest of the app already reads: `teacher` or `school`.
function mapUserToProfile(user) {
  if (!user) return { accountType: null, teacher: null, school: null }

  if (user.role === 'SCHOOL_ADMIN') {
    return {
      accountType: 'school',
      teacher: null,
      school: {
        id: user.schoolId,
        schoolName: user.schoolName || '',
        adminName: user.name || '',
        mobile: user.mobile,
        email: user.email || '',
        city: user.city || '',
        address: user.address || '',
      },
    }
  }

  return {
    accountType: 'teacher',
    school: null,
    teacher: {
      id: user.id,
      name: user.name || '',
      mobile: user.mobile,
      email: user.email || '',
      city: user.city || '',
      subject: user.subject || '',
      school: user.schoolName || '',
      address: user.address || '',
      schoolId: user.schoolId || null, // present when this teacher belongs to a school
    },
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ---------------- Session ----------------
      isAuthenticated: false,
      accountType: null, // 'teacher' | 'school' | null
      teacher: null,
      school: null,
      token: null, // JWT — read directly from localStorage by apiClient too

      // ---------------- In-flight signup/login state ----------------
      pendingMobile: null,
      isNewUser: false,
      justRegistered: false,

      hasSeenIntro: false,
      dismissIntro: () => set({ hasSeenIntro: true }),

      // ---------------- Step 1: mobile number ----------------
      // POST /api/auth/otp/request
      requestOtp: async (mobile) => {
        set({ pendingMobile: mobile })
        try {
          await apiClient.post('/api/auth/otp/request', { mobile }, { auth: false })
          return { success: true }
        } catch (err) {
          return { success: false, message: err instanceof ApiError ? err.message : 'Could not send OTP.' }
        }
      },

      // ---------------- Step 2: OTP verification ----------------
      // POST /api/auth/otp/verify -> AuthResponse
      verifyOtp: async (otp) => {
        const mobile = get().pendingMobile
        try {
          const res = await apiClient.post('/api/auth/otp/verify', { mobile, otp }, { auth: false })

          if (res.isNewUser || res.requiresRegistration) {
            set({ isNewUser: true })
            return { success: true, isNewUser: true }
          }

          const { accountType, teacher, school } = mapUserToProfile(res.user)
          set({
            isAuthenticated: true,
            token: res.token,
            accountType,
            teacher,
            school,
            pendingMobile: null,
            isNewUser: false,
          })
          return { success: true, isNewUser: false }
        } catch (err) {
          return {
            success: false,
            message: err instanceof ApiError ? err.message : 'Incorrect OTP. Please try again.',
          }
        }
      },

      // ---------------- Step 3 (new users only): account type ----------------
      selectAccountType: (accountType) => set({ accountType }),

      // ---------------- Step 4a: teacher registration ----------------
      // POST /api/auth/register/teacher
      registerTeacher: async (data) => {
        const mobile = get().pendingMobile
        try {
          const res = await apiClient.post(
            '/api/auth/register/teacher',
            { mobile, otp: '1234', ...data },
            { auth: false }
          )
          const { accountType, teacher, school } = mapUserToProfile(res.user)
          set({
            isAuthenticated: true,
            token: res.token,
            accountType,
            teacher,
            school,
            pendingMobile: null,
            isNewUser: false,
            justRegistered: true,
          })
          return { success: true }
        } catch (err) {
          return {
            success: false,
            message: err instanceof ApiError ? err.message : 'Registration failed. Please try again.',
          }
        }
      },

      // ---------------- Step 4b: school registration ----------------
      // POST /api/auth/register/school
      registerSchool: async (data) => {
        const mobile = get().pendingMobile
        try {
          const res = await apiClient.post(
            '/api/auth/register/school',
            { mobile, otp: '1234', ...data },
            { auth: false }
          )
          const { accountType, teacher, school } = mapUserToProfile(res.user)
          set({
            isAuthenticated: true,
            token: res.token,
            accountType,
            teacher,
            school,
            pendingMobile: null,
            isNewUser: false,
            justRegistered: true,
          })
          return { success: true }
        } catch (err) {
          return {
            success: false,
            message: err instanceof ApiError ? err.message : 'Registration failed. Please try again.',
          }
        }
      },

      acknowledgeWelcome: () => set({ justRegistered: false }),

      // ---------------- Restore session on reload (section 56) ----------------
      // GET /api/me — refreshes the profile from the backend using the
      // already-persisted JWT. Safe to call even if not authenticated.
      restoreSession: async () => {
        const { token, isAuthenticated } = get()
        if (!token || !isAuthenticated) return
        try {
          const user = await apiClient.get('/api/me')
          const { accountType, teacher, school } = mapUserToProfile(user)
          set({ accountType, teacher, school })
        } catch {
          // If the token is invalid, apiClient's 401 handler already
          // signs the session out and redirects to /login.
        }
      },

      // ---------------- Profile edits (Settings page) ----------------
      // PATCH /api/me. Applied optimistically to local state first (so the
      // Settings form feels instant), then synced to the backend; on
      // failure the local change is rolled back and the caller finds out
      // via the returned { success, message }.
      updateTeacherProfile: async (patch) => {
        const previous = get().teacher
        set((state) => ({ teacher: { ...(state.teacher || {}), ...patch } }))
        try {
          const user = await apiClient.patch('/api/me', {
            name: patch.name,
            email: patch.email,
            city: patch.city,
            subject: patch.subject,
            address: patch.address,
            schoolName: patch.school, // free-text org name (ignored server-side if linked to a real school)
          })
          const { teacher } = mapUserToProfile(user)
          set({ teacher })
          return { success: true }
        } catch (err) {
          set({ teacher: previous })
          return { success: false, message: err instanceof ApiError ? err.message : 'Could not save your profile.' }
        }
      },
      updateSchoolProfile: async (patch) => {
        const previous = get().school
        set((state) => ({ school: { ...(state.school || {}), ...patch } }))
        try {
          const user = await apiClient.patch('/api/me', {
            schoolName: patch.schoolName,
            adminName: patch.adminName,
            email: patch.email,
            city: patch.city,
            state: patch.state,
            address: patch.address,
            logoUrl: patch.logoUrl,
          })
          const { school } = mapUserToProfile(user)
          set({ school })
          return { success: true }
        } catch (err) {
          set({ school: previous })
          return { success: false, message: err instanceof ApiError ? err.message : 'Could not save school details.' }
        }
      },

      // ---------------- Logout ----------------
      logout: () => {
        set({
          isAuthenticated: false,
          accountType: null,
          teacher: null,
          school: null,
          token: null,
          pendingMobile: null,
          isNewUser: false,
        })
        useAppStore.getState().resetSession()
      },
    }),
    {
      name: 'papercraft-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accountType: state.accountType,
        teacher: state.teacher,
        school: state.school,
        token: state.token,
        hasSeenIntro: state.hasSeenIntro,
      }),
    }
  )
)
