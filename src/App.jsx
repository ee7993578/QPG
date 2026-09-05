import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/public/Landing'
import Pricing from './pages/public/Pricing'
import Login from './pages/Login'
import VerifyOtp from './pages/auth/VerifyOtp'
import SelectAccountType from './pages/auth/SelectAccountType'
import RegisterTeacher from './pages/auth/RegisterTeacher'
import RegisterSchool from './pages/auth/RegisterSchool'
import Dashboard from './pages/Dashboard'
import CreateExam from './pages/CreateExam'
import PaperBuilder from './pages/PaperBuilder'
import MyPapers from './pages/MyPapers'
import QuestionBank from './pages/QuestionBank'
import Templates from './pages/Templates'
import Subscription from './pages/Subscription'
import Settings from './pages/Settings'
import SchoolHome from './pages/SchoolHome'
import SchoolTeachers from './pages/school/SchoolTeachers'
import SchoolPapers from './pages/school/SchoolPapers'
import SchoolQuestionBank from './pages/school/SchoolQuestionBank'
import SchoolTemplatesPage from './pages/school/SchoolTemplatesPage'
import SchoolSettings from './pages/school/SchoolSettings'
import NotFound from './pages/NotFound'
import { useAppStore } from './store/useAppStore'
import { useAuthStore } from './store/authStore'
import { DownloadLockModal } from './components/subscription/DownloadLockModal'
import { PaymentDialog } from './components/subscription/PaymentDialog'
import { Toaster } from './components/ui/Toaster'

function useAppliedTheme() {
  const theme = useAppStore((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    const apply = (isDark) => root.classList.toggle('dark', isDark)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches)
      const listener = (e) => apply(e.matches)
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
    apply(theme === 'dark')
  }, [theme])
}

// Signed in, either account type — used for the routes both share (creating a
// paper and the builder itself). A school admin creates papers too, so these
// must not be behind RequireTeacher.
function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

// Teacher-only workspace (dashboard, my papers, ...). A signed-in School
// account is redirected to its own home instead of a 404/blank page.
function RequireTeacher({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accountType = useAuthStore((s) => s.accountType)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (accountType === 'school') return <Navigate to="/school" replace />
  return children
}

// School-only routes.
function RequireSchool({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accountType = useAuthStore((s) => s.accountType)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (accountType !== 'school') return <Navigate to="/dashboard" replace />
  return children
}

// The middle steps of signup (account type + registration forms) are only
// reachable mid-flow, right after OTP verification for a new number.
function RequireSignupInProgress({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const pendingMobile = useAuthStore((s) => s.pendingMobile)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  if (!pendingMobile) return <Navigate to="/login" replace />
  return children
}

// Renders children only once signed in, without redirecting — used purely to
// avoid mounting the paywall dialogs on public/auth screens.
function RequireAuthMaybe({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return null
  return children
}

export default function App() {
  useAppliedTheme()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accountType = useAuthStore((s) => s.accountType)

  const homeRoute = !isAuthenticated ? '/login' : accountType === 'school' ? '/school' : '/dashboard'

  return (
    <>
      <Routes>
        {/* Public — section 26/27. A signed-in visitor goes straight to their
            workspace instead of the marketing page. */}
        <Route path="/" element={isAuthenticated ? <Navigate to={homeRoute} replace /> : <Landing />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Auth flow — section 5 */}
        <Route path="/login" element={isAuthenticated ? <Navigate to={homeRoute} replace /> : <Login />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/select-account-type" element={<RequireSignupInProgress><SelectAccountType /></RequireSignupInProgress>} />
        <Route path="/register/teacher" element={<RequireSignupInProgress><RegisterTeacher /></RequireSignupInProgress>} />
        <Route path="/register/school" element={<RequireSignupInProgress><RegisterSchool /></RequireSignupInProgress>} />

        {/* Shared by both account types — both create and edit papers */}
        <Route path="/exam/new" element={<RequireAuth><CreateExam /></RequireAuth>} />
        <Route path="/paper/:paperId" element={<RequireAuth><PaperBuilder /></RequireAuth>} />

        {/* Teacher workspace */}
        <Route path="/dashboard" element={<RequireTeacher><Dashboard /></RequireTeacher>} />
        <Route path="/papers" element={<RequireTeacher><MyPapers /></RequireTeacher>} />
        <Route path="/question-bank" element={<RequireTeacher><QuestionBank /></RequireTeacher>} />
        <Route path="/templates" element={<RequireTeacher><Templates /></RequireTeacher>} />
        <Route path="/subscription" element={<RequireTeacher><Subscription /></RequireTeacher>} />
        <Route path="/settings" element={<RequireTeacher><Settings /></RequireTeacher>} />

        {/* School workspace — sections 9/11/22–25 */}
        <Route path="/school" element={<RequireSchool><SchoolHome /></RequireSchool>} />
        <Route path="/school/teachers" element={<RequireSchool><SchoolTeachers /></RequireSchool>} />
        <Route path="/school/papers" element={<RequireSchool><SchoolPapers /></RequireSchool>} />
        <Route path="/school/question-bank" element={<RequireSchool><SchoolQuestionBank /></RequireSchool>} />
        <Route path="/school/templates" element={<RequireSchool><SchoolTemplatesPage /></RequireSchool>} />
        <Route path="/school/subscription" element={<RequireSchool><Subscription /></RequireSchool>} />
        <Route path="/school/settings" element={<RequireSchool><SchoolSettings /></RequireSchool>} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Mounted once, globally, so any page can trigger the paywall / checkout. */}
      <RequireAuthMaybe>
        <DownloadLockModal />
        <PaymentDialog />
      </RequireAuthMaybe>

      {/* Section 34 — toasts are global; public pages can use them too. */}
      <Toaster />
    </>
  )
}
