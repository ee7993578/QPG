import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockTeacher } from '../data/mockData'
import { useAppStore } from './useAppStore'

// Mobile numbers that are treated as "already have an account" in this
// mock/demo flow, so the existing-user vs. new-user branch of section 5 can
// actually be exercised without a backend. Any other valid 10-digit number
// is treated as a brand-new signup.
const KNOWN_MOBILES = {
  [mockTeacher.mobile]: { accountType: 'teacher', profile: mockTeacher },
}

/**
 * authStore — owns everything in FINAL FRONTEND spec section 5–7:
 * mobile+OTP login, new-vs-existing-user branching, account type selection,
 * and the Teacher/School registration records themselves.
 *
 * Backend contract this is standing in for (see services/authApi.js):
 *   authApi.login() / authApi.verifyOtp() / authApi.registerTeacher() / authApi.registerSchool()
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ---------------- Session ----------------
      isAuthenticated: false,
      accountType: null, // 'teacher' | 'school' | null
      teacher: null, // { name, mobile, email, city, subject, school, address }
      school: null, // { schoolName, adminName, mobile, email, city, state, address, logoUrl }

      // ---------------- In-flight signup/login state ----------------
      pendingMobile: null,
      isNewUser: false,
      justRegistered: false, // drives the one-time "Welcome to PaperCraft" screen

      // Shown once, first launch only (kept here since it's an auth/session concern).
      hasSeenIntro: false,
      dismissIntro: () => set({ hasSeenIntro: true }),

      // ---------------- Step 1: mobile number ----------------
      requestOtp: (mobile) => {
        // Static/mock flow: any valid 10-digit mobile is accepted, OTP is always 1234.
        set({ pendingMobile: mobile })
        return { success: true }
      },

      // ---------------- Step 2: OTP verification ----------------
      verifyOtp: (otp) => {
        if (otp !== '1234') {
          return { success: false, message: 'Incorrect OTP. Use 1234 for this demo.' }
        }
        const mobile = get().pendingMobile
        const known = KNOWN_MOBILES[mobile]

        if (known) {
          // Existing user → straight into the dashboard, per section 5.
          set({
            isAuthenticated: true,
            accountType: known.accountType,
            teacher: known.accountType === 'teacher' ? { ...known.profile, mobile } : null,
            school: known.accountType === 'school' ? { ...known.profile, mobile } : null,
            pendingMobile: null,
            isNewUser: false,
          })
          return { success: true, isNewUser: false }
        }

        // New number → hand off to account-type selection. Not authenticated
        // yet; registration below finishes the job.
        set({ isNewUser: true })
        return { success: true, isNewUser: true }
      },

      // ---------------- Step 3 (new users only): account type ----------------
      selectAccountType: (accountType) => set({ accountType }),

      // ---------------- Step 4a: teacher registration ----------------
      registerTeacher: (data) => {
        const mobile = get().pendingMobile
        const teacher = {
          name: data.name,
          mobile,
          email: data.email || '',
          city: data.city || '',
          subject: data.subject || '',
          school: data.school || '',
          address: data.address || '',
        }
        set({
          isAuthenticated: true,
          accountType: 'teacher',
          teacher,
          school: null,
          pendingMobile: null,
          isNewUser: false,
          justRegistered: true,
        })
        return { success: true }
      },

      // ---------------- Step 4b: school registration ----------------
      registerSchool: (data) => {
        const mobile = get().pendingMobile
        const school = {
          schoolName: data.schoolName,
          adminName: data.adminName,
          mobile,
          email: data.email || '',
          city: data.city || '',
          state: data.state || '',
          address: data.address || '',
          logoUrl: data.logoUrl || '',
        }
        set({
          isAuthenticated: true,
          accountType: 'school',
          school,
          teacher: null,
          pendingMobile: null,
          isNewUser: false,
          justRegistered: true,
        })
        return { success: true }
      },

      acknowledgeWelcome: () => set({ justRegistered: false }),

      // ---------------- Profile edits (Settings page) ----------------
      updateTeacherProfile: (patch) => {
        set((state) => ({ teacher: { ...(state.teacher || {}), ...patch } }))
      },
      updateSchoolProfile: (patch) => {
        set((state) => ({ school: { ...(state.school || {}), ...patch } }))
      },

      // ---------------- Logout ----------------
      logout: () => {
        set({ isAuthenticated: false, accountType: null, teacher: null, school: null, pendingMobile: null, isNewUser: false })
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
        hasSeenIntro: state.hasSeenIntro,
      }),
    }
  )
)
