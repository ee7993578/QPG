import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FilePlus2, FolderOpen, Settings, GraduationCap } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'
import { useTranslate } from '../../i18n'

const items = [
  { to: '/dashboard', labelKey: 'nav_dashboard', icon: LayoutDashboard },
  { to: '/exam/new', labelKey: 'nav_createExam', icon: FilePlus2 },
  { to: '/papers', labelKey: 'nav_myPaper', icon: FolderOpen },
  { to: '/settings', labelKey: 'nav_settings', icon: Settings },
]

export function Sidebar() {
  const teacher = useAppStore((s) => s.teacher)
  const t = useTranslate()

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-ink-100 md:bg-white md:dark:border-ink-800 md:dark:bg-ink-900">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-700 text-gold-300 dark:bg-gold-400 dark:text-ink-950">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-none text-ink-900 dark:text-ink-50">{t('appName')}</p>
          <p className="text-[11px] text-ink-400">{t('tagline')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-ink-700 text-white dark:bg-gold-400 dark:text-ink-950'
                  : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      {teacher && (
        <div className="mx-3 mb-4 rounded-lg bg-ink-50 px-3 py-3 dark:bg-ink-800">
          <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{teacher.name}</p>
          <p className="truncate text-xs text-ink-400">{teacher.school}</p>
        </div>
      )}
    </aside>
  )
}
