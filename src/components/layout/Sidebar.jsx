import React from 'react'
import { NavLink } from 'react-router-dom'
import { GraduationCap, School } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { useTranslate } from '../../i18n'
import { navFor } from './navItems'

export function Sidebar() {
  const teacher = useAuthStore((s) => s.teacher)
  const school = useAuthStore((s) => s.school)
  const accountType = useAuthStore((s) => s.accountType)
  const t = useTranslate()

  const items = navFor(accountType)
  const isSchool = accountType === 'school'
  const BrandIcon = isSchool ? School : GraduationCap

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-ink-100 md:bg-white md:dark:border-ink-800 md:dark:bg-ink-900">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-700 text-gold-300 dark:bg-gold-400 dark:text-ink-950">
          <BrandIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold leading-none text-ink-900 dark:text-ink-50">{t('appName')}</p>
          <p className="truncate text-[11px] text-ink-400">{isSchool ? 'School Workspace' : t('tagline')}</p>
        </div>
      </div>

      <nav className="scroll-thin flex-1 space-y-1 overflow-y-auto px-3">
        {items.map(({ to, labelKey, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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
            {label || t(labelKey)}
          </NavLink>
        ))}
      </nav>

      {isSchool && school && (
        <div className="mx-3 mb-4 mt-3 rounded-lg bg-ink-50 px-3 py-3 dark:bg-ink-800">
          <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{school.schoolName}</p>
          <p className="truncate text-xs text-ink-400">{school.adminName}</p>
        </div>
      )}
      {!isSchool && teacher && (
        <div className="mx-3 mb-4 mt-3 rounded-lg bg-ink-50 px-3 py-3 dark:bg-ink-800">
          <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{teacher.name}</p>
          <p className="truncate text-xs text-ink-400">{teacher.school}</p>
        </div>
      )}
    </aside>
  )
}
