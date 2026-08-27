import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SunMoon, Moon, Sun, LogOut, Languages } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/utils'

const themeIcons = { light: Sun, dark: Moon, system: SunMoon }

export function Topbar({ title, subtitle, right }) {
  const navigate = useNavigate()
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const logout = useAppStore((s) => s.logout)
  const ThemeIcon = themeIcons[theme] || SunMoon

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system']
    setTheme(order[(order.indexOf(theme) + 1) % order.length])
  }

  return (
    <header className="hidden md:flex items-center justify-between border-b border-ink-100 bg-white px-6 py-4 dark:border-ink-800 dark:bg-ink-900">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">{title}</h1>
        {subtitle && <p className="text-sm text-ink-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {right}
        <button
          onClick={cycleTheme}
          title={`Theme: ${theme}`}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100',
            'dark:text-ink-300 dark:hover:bg-ink-800'
          )}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>
        <button
          title="Language: English"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
        >
          <Languages className="h-4 w-4" />
        </button>
        <button
          onClick={() => { logout(); navigate('/login') }}
          title="Logout"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-red-50 hover:text-pen-red dark:text-ink-300 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
