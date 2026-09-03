import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu, X, User, LayoutDashboard, PenLine, Eye, FolderOpen,
  Settings, Languages, SunMoon, LogOut, GraduationCap,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/utils'
import { useTranslate } from '../../i18n'

export function MobileHeader({ title, rightAction }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const teacher = useAppStore((s) => s.teacher)
  const logout = useAppStore((s) => s.logout)
  const activePaperId = useAppStore((s) => s.activePaperId)
  const papers = useAppStore((s) => s.papers)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const t = useTranslate()

  const targetPaperId = activePaperId && papers.some((p) => p.id === activePaperId) ? activePaperId : papers[0]?.id

  const go = (path) => {
    setOpen(false)
    navigate(path)
  }

  const items = [
    { label: t('nav_profile'), icon: User, onClick: () => go('/settings') },
    { label: t('nav_dashboard'), icon: LayoutDashboard, onClick: () => go('/dashboard') },
    { label: t('nav_edit'), icon: PenLine, onClick: () => go(targetPaperId ? `/paper/${targetPaperId}?view=edit` : '/exam/new') },
    { label: t('nav_preview'), icon: Eye, onClick: () => go(targetPaperId ? `/paper/${targetPaperId}?view=preview` : '/exam/new') },
    { label: t('nav_myPaper'), icon: FolderOpen, onClick: () => go('/papers') },
    { label: t('nav_settings'), icon: Settings, onClick: () => go('/settings') },
  ]

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95 md:hidden">
        <button onClick={() => setOpen(true)} className="rounded-md p-1.5 text-ink-700 dark:text-ink-200" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <p className="min-w-0 flex-1 truncate px-2 text-center font-display text-sm font-semibold text-ink-900 dark:text-ink-50">{title || 'PaperCraft'}</p>
        <div className="flex shrink-0 items-center gap-1">
          {rightAction}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-md p-1.5 text-ink-700 dark:text-ink-200"
            aria-label="Toggle theme"
          >
            <SunMoon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white shadow-page dark:bg-ink-900 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 dark:border-ink-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-700 text-gold-300 dark:bg-gold-400 dark:text-ink-950">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="font-display font-semibold text-ink-900 dark:text-ink-50">{t('appName')}</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-ink-400"><X className="h-5 w-5" /></button>
            </div>

            {teacher && (
              <div className="px-5 py-4 border-b border-ink-100 dark:border-ink-800">
                <p className="font-semibold text-ink-800 dark:text-ink-100">{teacher.name}</p>
                <p className="text-xs text-ink-400">{teacher.school}</p>
              </div>
            )}

            <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto scroll-thin">
              {items.map(({ label, icon: Icon, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}

              <div className="my-2 border-t border-ink-100 dark:border-ink-800" />

              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                <SunMoon className="h-4 w-4" />
                {t('nav_theme')} · {t(`theme_${theme}`)}
              </button>
              <button
                onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                <Languages className="h-4 w-4" />
                {t('nav_language')} · {language === 'hi' ? 'हिन्दी' : 'English'}
              </button>
            </nav>

            <div className="px-3 py-3 border-t border-ink-100 dark:border-ink-800">
              <button
                onClick={() => { logout(); go('/login') }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  'text-pen-red hover:bg-red-50 dark:hover:bg-red-900/20'
                )}
              >
                <LogOut className="h-4 w-4" />
                {t('nav_logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
