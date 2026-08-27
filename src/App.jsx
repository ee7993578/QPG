import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateExam from './pages/CreateExam'
import PaperBuilder from './pages/PaperBuilder'
import MyPapers from './pages/MyPapers'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import { useAppStore } from './store/useAppStore'

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

function RequireAuth({ children }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  useAppliedTheme()
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/exam/new" element={<RequireAuth><CreateExam /></RequireAuth>} />
      <Route path="/paper/:paperId" element={<RequireAuth><PaperBuilder /></RequireAuth>} />
      <Route path="/papers" element={<RequireAuth><MyPapers /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
