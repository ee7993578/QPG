import React, { useEffect, useState } from 'react'
import { LayoutTemplate, Building2, BookmarkCheck } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { BuiltInTemplates, SchoolTemplates, MyTemplates } from '../components/templates/TemplateGallery'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/utils'

/**
 * Section 25 — the teacher's Templates page.
 *
 * - Individual teacher (no school): only "Software Templates" (built-in)
 *   and "My Templates" (their own) — there is no school to share templates
 *   with, so that tab is hidden entirely.
 * - School-affiliated teacher: same as before — built-in layouts are always
 *   available; the school's shared templates are read-only here (only a
 *   School admin can edit them, on /school/templates); "My Templates" are
 *   personal header/layout templates saved from My Paper.
 */
export default function Templates() {
  const schoolId = useAuthStore((s) => s.teacher?.schoolId)
  const isIndividual = !schoolId
  const [tab, setTab] = useState('builtin')

  const allTabs = [
    { key: 'builtin', label: 'Software Templates', icon: LayoutTemplate },
    { key: 'mine', label: 'My Templates', icon: BookmarkCheck },
    { key: 'school', label: 'School Templates', icon: Building2 },
  ]
  const tabs = isIndividual ? allTabs.filter((t) => t.key !== 'school') : allTabs

  // If this teacher was ever on the school tab and their school link goes
  // away (or the page loads for an individual teacher), fall back safely.
  useEffect(() => {
    if (isIndividual && tab === 'school') setTab('builtin')
  }, [isIndividual, tab])

  return (
    <AppShell
      title="Templates"
      subtitle="Change how a paper looks without touching its questions"
      mobileTitle="Templates"
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-900">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                tab === key
                  ? 'bg-white text-ink-900 shadow-card dark:bg-ink-800 dark:text-ink-50'
                  : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'builtin' ? <BuiltInTemplates /> : tab === 'mine' ? <MyTemplates /> : <SchoolTemplates />}
      </div>
    </AppShell>
  )
}
