import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { School } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input, Label, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { ImageUploadField } from '../../components/ui/ImageUploadField'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../services/authApi'
import { toast } from '../../store/uiStore'

const STATES = [
  'Uttar Pradesh', 'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal',
  'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Bihar', 'Punjab', 'Haryana', 'Kerala', 'Other',
]

export default function RegisterSchool() {
  const navigate = useNavigate()
  const pendingMobile = useAuthStore((s) => s.pendingMobile)
  const [form, setForm] = useState({
    schoolName: '', adminName: '', email: '', city: '', state: '', address: '', logoUrl: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!pendingMobile) return <Navigate to="/login" replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.schoolName.trim() || !form.adminName.trim()) {
      setError('School name and admin name are required.')
      return
    }
    setError('')
    setSubmitting(true)
    await authApi.registerSchool(form)
    setSubmitting(false)
    toast.success('School account created. Add your teachers to get started.')
    navigate('/school')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10 dark:bg-ink-950">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl2 bg-ink-700 text-gold-300 dark:bg-gold-400 dark:text-ink-950">
            <School className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">Create your School Account</h1>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-xl2 border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
          <div>
            <Label htmlFor="schoolName">School Name *</Label>
            <Input id="schoolName" value={form.schoolName} onChange={set('schoolName')} placeholder="Delhi Public School" autoFocus />
          </div>
          <div>
            <Label htmlFor="adminName">Admin Name *</Label>
            <Input id="adminName" value={form.adminName} onChange={set('adminName')} placeholder="Principal / Admin name" />
          </div>
          <div>
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input id="mobile" value={`+91 ${pendingMobile}`} readOnly />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="admin@school.edu" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={set('city')} placeholder="Agra" />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Select id="state" value={form.state} onChange={set('state')}>
                <option value="">Select…</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} value={form.address} onChange={set('address')} placeholder="School address" />
          </div>
          <ImageUploadField label="School Logo (optional)" value={form.logoUrl} onChange={(v) => setForm((f) => ({ ...f, logoUrl: v }))} />

          {error && <p className="text-sm text-pen-red">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create School Account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
