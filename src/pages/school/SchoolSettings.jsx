import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, SunMoon, Building2, LogOut, Users, ArrowRight } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Label, Input, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ImageUploadField } from '../../components/ui/ImageUploadField'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/authStore'
import { useSchoolStore } from '../../store/schoolStore'
import { authApi } from '../../services/authApi'
import { toast } from '../../store/uiStore'
import { useTranslate } from '../../i18n'

/**
 * Sections 11/46 — School Settings. Same shape as the teacher's Settings page
 * (profile / theme / language / logout) with the school's own fields, plus the
 * school logo that papers pick up in their header.
 */

const themeOptions = [
  { value: 'light', labelKey: 'theme_light', icon: Sun },
  { value: 'dark', labelKey: 'theme_dark', icon: Moon },
  { value: 'system', labelKey: 'theme_system', icon: SunMoon },
]

const languageOptions = [
  { value: 'en', label: 'English', ready: true },
  { value: 'hi', label: 'हिन्दी (Hindi)', ready: true },
  { value: 'ur', label: 'اردو (Urdu)', ready: false },
  { value: 'ta', label: 'தமிழ் (Tamil)', ready: false },
]

const BLANK = { schoolName: '', adminName: '', email: '', city: '', state: '', address: '', logoUrl: '' }

export default function SchoolSettings() {
  const navigate = useNavigate()
  const school = useAuthStore((s) => s.school)
  const updateSchoolProfile = useAuthStore((s) => s.updateSchoolProfile)
  const teachers = useSchoolStore((s) => s.teachers)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const t = useTranslate()

  const [form, setForm] = useState(BLANK)

  useEffect(() => {
    setForm({ ...BLANK, ...(school || {}) })
  }, [school])

  const dirty = Object.keys(BLANK).some((k) => (form[k] || '') !== (school?.[k] || ''))

  const save = () => {
    if (!form.schoolName.trim()) {
      toast.error('School name cannot be empty.')
      return
    }
    updateSchoolProfile({ ...form, schoolName: form.schoolName.trim(), adminName: form.adminName.trim() })
    toast.success('School details saved.')
  }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  return (
    <AppShell title="School Settings" subtitle="Your school's details, branding and preferences" mobileTitle="Settings">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> School details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="s-name">School / institute name</Label>
              <Input id="s-name" value={form.schoolName} onChange={(e) => set({ schoolName: e.target.value })} />
              <p className="mt-1 text-[11px] text-ink-400">This is what prints at the top of every paper.</p>
            </div>
            <div>
              <Label htmlFor="s-admin">Admin name</Label>
              <Input id="s-admin" value={form.adminName} onChange={(e) => set({ adminName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s-mobile">Mobile</Label>
              <Input id="s-mobile" value={`+91 ${school?.mobile || ''}`} readOnly />
            </div>
            <div>
              <Label htmlFor="s-email">Email</Label>
              <Input id="s-email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s-city">City</Label>
              <Input id="s-city" value={form.city} onChange={(e) => set({ city: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s-state">State</Label>
              <Input id="s-state" value={form.state} onChange={(e) => set({ state: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="s-address">Address</Label>
              <Textarea id="s-address" rows={2} value={form.address} onChange={(e) => set({ address: e.target.value })} />
              <p className="mt-1 text-[11px] text-ink-400">Shown under the school name when a paper has "Show address" on.</p>
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="School logo"
                value={form.logoUrl}
                onChange={(logoUrl) => set({ logoUrl })}
              />
              <p className="mt-1 text-[11px] text-ink-400">Used as the default header logo for papers created in this school.</p>
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button onClick={save} disabled={!dirty}>Save changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                {teachers.length} teacher{teachers.length === 1 ? '' : 's'} on your school account.
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/school/teachers')}>
                Manage teachers <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
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

        <Button variant="danger" className="w-full" onClick={async () => { await authApi.logout(); navigate('/login') }}>
          <LogOut className="h-4 w-4" /> {t('nav_logout')}
        </Button>
      </div>
    </AppShell>
  )
}
