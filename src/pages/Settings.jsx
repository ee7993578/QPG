import React from 'react'
import { Sun, Moon, SunMoon, User, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Label, Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: SunMoon },
]

const languageOptions = [
  { value: 'en', label: 'English', ready: true },
  { value: 'hi', label: 'हिन्दी (Hindi)', ready: false },
  { value: 'ur', label: 'اردو (Urdu)', ready: false },
  { value: 'ar', label: 'العربية (Arabic)', ready: false },
]

export default function Settings() {
  const navigate = useNavigate()
  const teacher = useAppStore((s) => s.teacher)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const logout = useAppStore((s) => s.logout)

  return (
    <AppShell title="Settings" subtitle="Manage your profile, theme and language" mobileTitle="Settings">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={teacher?.name || ''} readOnly />
            </div>
            <div>
              <Label>Mobile Number</Label>
              <Input value={`+91 ${teacher?.mobile || ''}`} readOnly />
            </div>
            <div className="sm:col-span-2">
              <Label>School Name</Label>
              <Input value={teacher?.school || ''} readOnly />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm font-medium transition-colors',
                    theme === value
                      ? 'border-ink-700 bg-ink-50 text-ink-800 dark:border-gold-400 dark:bg-ink-800 dark:text-gold-300'
                      : 'border-ink-200 text-ink-500 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Language</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {languageOptions.map(({ value, label, ready }) => (
                <button
                  key={value}
                  disabled={!ready}
                  onClick={() => setLanguage(value)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                    language === value
                      ? 'border-ink-700 bg-ink-50 text-ink-800 dark:border-gold-400 dark:bg-ink-800 dark:text-gold-300'
                      : 'border-ink-200 text-ink-500 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800',
                    !ready && 'opacity-50'
                  )}
                >
                  {label}
                  {!ready && <span className="text-xs">Coming soon</span>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button variant="danger" className="w-full" onClick={() => { logout(); navigate('/login') }}>
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </AppShell>
  )
}
