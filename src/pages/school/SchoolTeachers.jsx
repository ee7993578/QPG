import React, { useEffect, useMemo, useState } from 'react'
import { UserPlus, Search, Trash2, Users, Phone, Mail } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input, Label } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Dialog } from '../../components/ui/Dialog'
import { EmptyState, ListSkeleton } from '../../components/ui/States'
import { useSchoolStore } from '../../store/schoolStore'
import { schoolApi } from '../../services/schoolApi'
import { SUBJECTS } from '../../data/mockData'
import { toast } from '../../store/uiStore'
import { formatDate } from '../../lib/utils'

/**
 * Section 22 — teacher management for a School account.
 *
 * Desktop gets the table the spec asks for (Name / Mobile / Papers / Status /
 * Joined / Actions); mobile gets the same rows as cards so nothing is cut off
 * (section 29). Adding a teacher creates an "invited" row — the actual invite
 * SMS/OTP is a backend job (section 39), which the empty-state copy says out
 * loud rather than pretending it was sent.
 */

const BLANK = { name: '', mobile: '', email: '', subject: 'Mathematics' }

function StatusBadge({ status }) {
  return status === 'active'
    ? <Badge variant="success">Active</Badge>
    : <Badge variant="gold">Invited</Badge>
}

export default function SchoolTeachers() {
  const teachers = useSchoolStore((s) => s.teachers)
  const addTeacher = useSchoolStore((s) => s.addTeacher)
  const removeTeacher = useSchoolStore((s) => s.removeTeacher)

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)

  // Stands in for schoolApi.getTeachers() (section 32).
  useEffect(() => {
    let alive = true
    schoolApi.getTeachers().then(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return teachers.filter((t) => {
      if (status !== 'all' && t.status !== status) return false
      if (!term) return true
      return (
        t.name.toLowerCase().includes(term) ||
        t.mobile.includes(term) ||
        (t.subject || '').toLowerCase().includes(term)
      )
    })
  }, [teachers, search, status])

  const openAdd = () => {
    setDraft(BLANK)
    setAddOpen(true)
  }

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error('Enter the teacher’s name.')
      return
    }
    if (!/^\d{10}$/.test(draft.mobile.trim())) {
      toast.error('Enter a valid 10-digit mobile number.')
      return
    }
    if (teachers.some((t) => t.mobile === draft.mobile.trim())) {
      toast.error('A teacher with this mobile number is already on your list.')
      return
    }
    setSaving(true)
    const payload = { ...draft, name: draft.name.trim(), mobile: draft.mobile.trim(), email: draft.email.trim() }
    await schoolApi.addTeacher(payload)
    addTeacher(payload)
    setSaving(false)
    setAddOpen(false)
    toast.success(`${payload.name} added. They can sign in with ${payload.mobile}.`)
  }

  const remove = async () => {
    if (!confirmRemove) return
    await schoolApi.removeTeacher(confirmRemove.id)
    removeTeacher(confirmRemove.id)
    setConfirmRemove(null)
    toast.success('Teacher removed from your school.')
  }

  const addButton = (
    <Button onClick={openAdd}><UserPlus className="h-4 w-4" /> Add Teacher</Button>
  )

  return (
    <AppShell
      title="Teachers"
      subtitle="Everyone who can create papers under your school"
      mobileTitle="Teachers"
      right={addButton}
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <Card className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, mobile or subject…"
                className="pl-9"
                aria-label="Search teachers"
              />
            </div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="md:w-44"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
            </Select>
            <div className="md:hidden">{addButton}</div>
          </div>
          <p className="mt-3 text-xs text-ink-400">
            {filtered.length} of {teachers.length} teacher{teachers.length === 1 ? '' : 's'}
          </p>
        </Card>

        {loading ? (
          <ListSkeleton rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={teachers.length === 0 ? 'No teachers yet' : 'No teachers match this search'}
            message={
              teachers.length === 0
                ? 'Add a teacher with their mobile number and they can sign in and start creating papers under your school.'
                : 'Try a different name, number or status.'
            }
            actionLabel={teachers.length === 0 ? 'Add your first teacher' : undefined}
            onAction={teachers.length === 0 ? openAdd : undefined}
          />
        ) : (
          <>
            {/* Desktop table */}
            <Card className="hidden overflow-hidden p-0 md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50 text-left dark:border-ink-800 dark:bg-ink-900/60">
                    <th className="px-5 py-3 font-semibold text-ink-700 dark:text-ink-200">Name</th>
                    <th className="px-5 py-3 font-semibold text-ink-700 dark:text-ink-200">Mobile</th>
                    <th className="px-5 py-3 font-semibold text-ink-700 dark:text-ink-200">Subject</th>
                    <th className="px-5 py-3 text-center font-semibold text-ink-700 dark:text-ink-200">Papers</th>
                    <th className="px-5 py-3 font-semibold text-ink-700 dark:text-ink-200">Status</th>
                    <th className="px-5 py-3 font-semibold text-ink-700 dark:text-ink-200">Joined</th>
                    <th className="px-5 py-3 text-right font-semibold text-ink-700 dark:text-ink-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink-800 dark:text-ink-100">{t.name}</p>
                        {t.email && <p className="text-xs text-ink-400">{t.email}</p>}
                      </td>
                      <td className="px-5 py-3 text-ink-500 dark:text-ink-400">{t.mobile}</td>
                      <td className="px-5 py-3 text-ink-500 dark:text-ink-400">{t.subject || '—'}</td>
                      <td className="px-5 py-3 text-center text-ink-500 dark:text-ink-400">{t.papers || 0}</td>
                      <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-5 py-3 text-ink-500 dark:text-ink-400">{formatDate(t.joinedAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmRemove(t)}
                          aria-label={`Remove ${t.name}`}
                          title="Remove teacher"
                        >
                          <Trash2 className="h-4 w-4 text-pen-red" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filtered.map((t) => (
                <Card key={t.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-800 dark:text-ink-100">{t.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
                        <Phone className="h-3 w-3" /> {t.mobile}
                      </p>
                      {t.email && (
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-400">
                          <Mail className="h-3 w-3" /> {t.email}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                    <span>{t.subject || '—'} · {t.papers || 0} paper{(t.papers || 0) === 1 ? '' : 's'}</span>
                    <span>Joined {formatDate(t.joinedAt)}</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setConfirmRemove(t)}>
                    <Trash2 className="h-3.5 w-3.5 text-pen-red" /> Remove
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add teacher */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a teacher"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Adding…' : 'Add teacher'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="t-name">Full name</Label>
            <Input
              id="t-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
            />
          </div>
          <div>
            <Label htmlFor="t-mobile">Mobile number</Label>
            <Input
              id="t-mobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={draft.mobile}
              onChange={(e) => setDraft({ ...draft, mobile: e.target.value.replace(/\D/g, '') })}
              placeholder="10-digit number"
            />
            <p className="mt-1.5 text-xs text-ink-400">This is what they'll use to sign in.</p>
          </div>
          <div>
            <Label htmlFor="t-email">Email (optional)</Label>
            <Input
              id="t-email"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              placeholder="teacher@school.edu"
            />
          </div>
          <div>
            <Label htmlFor="t-subject">Main subject</Label>
            <Select id="t-subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <p className="rounded-lg bg-ink-50 px-3 py-2.5 text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-400">
            They'll show as <strong>Invited</strong> until they sign in for the first time. Invitation SMS is sent by the
            backend, so nothing leaves the app in this build.
          </p>
        </div>
      </Dialog>

      {/* Remove confirmation */}
      <Dialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title={confirmRemove ? `Remove ${confirmRemove.name}?` : 'Remove teacher?'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button variant="danger" onClick={remove}>Remove</Button>
          </>
        }
      >
        <p>
          They'll lose access to your school workspace. Papers they already created stay with the school.
        </p>
      </Dialog>
    </AppShell>
  )
}
