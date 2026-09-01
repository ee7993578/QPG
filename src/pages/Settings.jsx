import React, { useEffect, useState } from 'react'
import { Sun, Moon, SunMoon, User, LogOut, Pencil, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Label, Input, Textarea } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'
import { useTranslate } from '../i18n'

const themeOptions = [
  { value: 'light', labelKey: 'theme_light', icon: Sun },
  { value: 'dark', labelKey: 'theme_dark', icon: Moon },
  { value: 'system', labelKey: 'theme_system', icon: SunMoon },
]

// Feature 6 — Hindi is a fully supported UI language now. Urdu/Tamil menus
// are still on the way, but teachers can already type questions in any
// language/script they like inside the paper itself.
const languageOptions = [
  { value: 'en', label: 'English', ready: true },
  { value: 'hi', label: 'हिन्दी (Hindi)', ready: true },
  { value: 'ur', label: 'اردو (Urdu)', ready: false },
  { value: 'ta', label: 'தமிழ் (Tamil)', ready: false },
]

export default function Settings() {
  const navigate = useNavigate()
  const teacher = useAppStore((s) => s.teacher)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const logout = useAppStore((s) => s.logout)
  const updateTeacherProfile = useAppStore((s) => s.updateTeacherProfile)
  const t = useTranslate()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', school: '', address: '' })
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setForm({ name: teacher?.name || '', school: teacher?.school || '', address: teacher?.address || '' })
  }, [teacher])

  const saveProfile = () => {
    updateTeacherProfile(form)
    setEditing(false)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  return (
    <AppShell title={t('settings_title')} subtitle={t('settings_subtitle')} mobileTitle={t('settings_title')}>
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> {t('profile_title')}</CardTitle>
            <div className="flex items-center gap-2">
              {savedFlash && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('common_profileUpdated')}</span>}
              <button
                onClick={() => (editing ? saveProfile() : setEditing(true))}
                className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800 dark:hover:text-gold-300"
              >
                {editing ? <><Check className="h-3.5 w-3.5" /> {t('common_done')}</> : <><Pencil className="h-3.5 w-3.5" /> {t('common_edit')}</>}
              </button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('profile_name')}</Label>
              {editing ? (
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              ) : (
                <Input value={teacher?.name || ''} readOnly />
              )}
            </div>
            <div>
              <Label>{t('profile_mobile')}</Label>
              <Input value={`+91 ${teacher?.mobile || ''}`} readOnly />
            </div>
            <div className="sm:col-span-2">
              <Label>{t('profile_school')}</Label>
              {editing ? (
                <Input value={form.school} onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))} />
              ) : (
                <Input value={teacher?.school || ''} readOnly />
              )}
            </div>
            <div className="sm:col-span-2">
              <Label>{t('profile_address')}</Label>
              {editing ? (
                <Textarea rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              ) : (
                <Textarea rows={2} value={teacher?.address || ''} readOnly />
              )}
              <p className="mt-1 text-[11px] text-ink-400">{t('profile_addressHint')}</p>
            </div>
            {editing && (
              <div className="sm:col-span-2 flex justify-end">
                <Button size="sm" onClick={saveProfile}>{t('common_saveChanges')}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('settings_theme')}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, labelKey, icon: Icon }) => (
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
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('settings_language')}</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-2.5 text-xs text-ink-400">{t('settings_languageHint')}</p>
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
                  {!ready && <span className="text-xs">{t('common_comingSoon')}</span>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button variant="danger" className="w-full" onClick={() => { logout(); navigate('/login') }}>
          <LogOut className="h-4 w-4" /> {t('nav_logout')}
        </Button>
      </div>
    </AppShell>
  )
}
