import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input, Label } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../services/authApi'
import { toast } from '../../store/uiStore'
import { SUBJECTS } from '../../data/mockData'

export default function RegisterTeacher() {
  const navigate = useNavigate()
  const pendingMobile = useAuthStore((s) => s.pendingMobile)
  const [form, setForm] = useState({ name: '', email: '', city: '', subject: '', school: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!pendingMobile) return <Navigate to="/login" replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Full name is required.')
      return
    }
    setError('')
    setSubmitting(true)
    await authApi.registerTeacher(form)
    setSubmitting(false)
    toast.success('Account created. 3 free PDF downloads are ready for you.')
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10 dark:bg-ink-950">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl2 bg-ink-700 text-gold-300 dark:bg-gold-400 dark:text-ink-950">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">Create your Teacher Account</h1>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" value={form.name} onChange={set('name')} placeholder="Rahul Sharma" autoFocus />
          </div>
          <div>
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input id="mobile" value={`+91 ${pendingMobile}`} readOnly />
          </div>
          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">City (optional)</Label>
              <Input id="city" value={form.city} onChange={set('city')} placeholder="Agra" />
            </div>
            <div>
              <Label htmlFor="subject">Main Subject (optional)</Label>
              <Select id="subject" value={form.subject} onChange={set('subject')}>
                <option value="">Select…</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="school">School Name (optional)</Label>
            <Input id="school" value={form.school} onChange={set('school')} placeholder="Green Valley Public School" />
          </div>

          {error && <p className="text-sm text-pen-red">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Teacher Account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
