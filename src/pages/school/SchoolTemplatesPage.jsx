import React, { useEffect, useState } from 'react'
import { LayoutTemplate, Building2 } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { GridSkeleton } from '../../components/ui/States'
import { BuiltInTemplates, SchoolTemplates as SchoolTemplateList } from '../../components/templates/TemplateGallery'
import { templateApi } from '../../services/templateApi'
import { cn } from '../../lib/utils'

/**
 * Section 25 — school templates. Identical gallery to the teacher's page, with
 * editing switched on: only a School admin creates, edits, deletes and sets the
 * default template for the school.
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
    { key: 'builtin', label: 'Paper Layouts', icon: LayoutTemplate },
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

        {loading ? (
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
