import React, { useState } from 'react'
import { LayoutTemplate, Building2 } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { BuiltInTemplates, SchoolTemplates } from '../components/templates/TemplateGallery'
import { cn } from '../lib/utils'

/**
 * Section 25 — the teacher's Templates page. Built-in layouts are always
 * available; the school's shared templates are read-only here (only a School
 * admin can edit them, on /school/templates).
 */
export default function Templates() {
  const [tab, setTab] = useState('builtin')

  const tabs = [
    { key: 'builtin', label: 'Paper Layouts', icon: LayoutTemplate },
    { key: 'school', label: 'School Templates', icon: Building2 },
  ]

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

        {tab === 'builtin' ? <BuiltInTemplates /> : <SchoolTemplates />}
      </div>
    </AppShell>
  )
}
