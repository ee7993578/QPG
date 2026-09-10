import React, { useEffect, useState } from 'react'
import { LayoutTemplate, Building2, Users } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { GridSkeleton } from '../../components/ui/States'
import { BuiltInTemplates, SchoolTemplates as SchoolTemplateList, TeacherTemplates } from '../../components/templates/TemplateGallery'
import { templateApi } from '../../services/templateApi'
import { cn } from '../../lib/utils'

/**
 * Section 25 — templates, as seen by a School Admin ("school login"). Shows
 * exactly three tabs: the school's own shared templates (editable here),
 * the built-in software layouts, and a read-only aggregate of every
 * template every teacher at the school has personally saved. A School
 * Admin does not get a separate "My Templates" tab on this page — their own
 * personal templates (if any) show up alongside every other teacher's under
 * "Teacher Templates".
 */
export default function SchoolTemplatesPage() {
  const [tab, setTab] = useState('school')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    templateApi.list().then(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const tabs = [
    { key: 'school', label: 'School Templates', icon: Building2 },
    { key: 'builtin', label: 'Software Templates', icon: LayoutTemplate },
    { key: 'teachers', label: 'Teacher Templates', icon: Users },
  ]

  return (
    <AppShell
      title="Templates"
      subtitle="Shared header, footer and formatting styles for your school"
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

        {tab === 'teachers' ? (
          <TeacherTemplates />
        ) : loading ? (
          <GridSkeleton items={3} />
        ) : tab === 'school' ? (
          <SchoolTemplateList editable />
        ) : (
          <BuiltInTemplates />
        )}
      </div>
    </AppShell>
  )
}
