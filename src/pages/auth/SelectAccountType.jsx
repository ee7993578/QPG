import React from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { GraduationCap, User, School, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const OPTIONS = [
  {
    type: 'teacher',
    icon: User,
    title: 'Teacher',
    description: 'Create and manage question papers individually.',
  },
  {
    type: 'school',
    icon: School,
    title: 'School / Institute',
    description: 'Manage multiple teachers, shared templates and a shared question bank.',
  },
]

export default function SelectAccountType() {
  const navigate = useNavigate()
  const pendingMobile = useAuthStore((s) => s.pendingMobile)
  const selectAccountType = useAuthStore((s) => s.selectAccountType)

  if (!pendingMobile) return <Navigate to="/login" replace />

  const choose = (type) => {
    selectAccountType(type)
    navigate(`/register/${type}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10 dark:bg-ink-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl2 bg-ink-700 text-gold-300 dark:bg-gold-400 dark:text-ink-950">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">How will you use PaperCraft?</h1>
          <p className="mt-1 text-sm text-ink-400">You can't switch this later without contacting support.</p>
        </div>

        <div className="space-y-3">
          {OPTIONS.map(({ type, icon: Icon, title, description }) => (
            <button
              key={type}
              onClick={() => choose(type)}
              className="flex w-full items-center gap-4 rounded-xl2 border border-ink-100 bg-white p-5 text-left shadow-card transition-colors hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-ink-600"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-700 dark:bg-ink-800 dark:text-gold-300">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-ink-900 dark:text-ink-50">{title}</p>
                <p className="mt-0.5 text-sm text-ink-400">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
