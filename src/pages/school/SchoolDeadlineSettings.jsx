import React, { useEffect, useState } from 'react'
import {
  CalendarClock, Save, PlayCircle, Lock, Unlock, History, ChevronDown, ChevronUp,
} from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Label, Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Dialog } from '../../components/ui/Dialog'
import { ListSkeleton } from '../../components/ui/States'
import { deadlineApi } from '../../services/deadlineApi'
import { useSchoolStore } from '../../store/schoolStore'
import { toast } from '../../store/uiStore'
import {
  deadlineStatusBadgeVariant, deadlineStatusLabelKey, formatDeadlineDateTime, toDateTimeLocalInput,
} from '../../lib/schoolDeadline'
import { useTranslate } from '../../i18n'

const BLANK_FORM = {
  examName: '',
  startAt: '',
  deadlineAt: '',
  timezone: 'Asia/Kolkata',
  enabled: true,
  policy: 'ADMIN_EXTENSION',
  examVisibility: 'NORMAL',
}

/**
 * School Admin's Submission Deadline settings — configure the window,
 * extend/close/reopen it, and review the audit history. Never shown to
 * teachers (this route sits under /school/*, admin-only via RequireSchool).
 *
 * Every mutating call here goes straight to SchoolDeadlineController; the
 * backend re-validates admin-only access and every rule (STRICT policy
 * blocking reopen, etc.) itself, so nothing here is a second security
 * boundary — it's purely UI/UX so the admin isn't shown an action the
 * server would reject.
 */
export default function SchoolDeadlineSettings() {
  const t = useTranslate()
  const deadline = useSchoolStore((s) => s.schoolDeadline)
  const history = useSchoolStore((s) => s.schoolDeadlineHistory)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedAudit, setExpandedAudit] = useState(null)

  const [extendOpen, setExtendOpen] = useState(false)
  const [extendValue, setExtendValue] = useState({ deadlineAt: '', note: '' })
  const [closeOpen, setCloseOpen] = useState(false)
  const [closeNote, setCloseNote] = useState('')
  const [reopenOpen, setReopenOpen] = useState(false)
  const [reopenValue, setReopenValue] = useState({ reopenedUntil: '', note: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    deadlineApi.getDeadline()
      .then((res) => {
        if (!alive) return
        if (res.configured) {
          setForm({
            examName: res.examName || '',
            startAt: toDateTimeLocalInput(res.startAt),
            deadlineAt: toDateTimeLocalInput(res.deadlineAt),
            timezone: res.timezone || 'Asia/Kolkata',
            enabled: res.enabled,
            policy: res.policy || 'ADMIN_EXTENSION',
            examVisibility: res.examVisibility || 'NORMAL',
          })
        }
      })
      .catch((err) => toast.error(err?.message || 'Could not load the submission deadline.'))
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const loadHistory = () => {
    setHistoryLoading(true)
    deadlineApi.getDeadlineHistory()
      .catch((err) => toast.error(err?.message || 'Could not load the history.'))
      .finally(() => setHistoryLoading(false))
  }

  const toggleHistory = () => {
    const next = !showHistory
    setShowHistory(next)
    if (next && history.length === 0) loadHistory()
  }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const save = async () => {
    if (!form.deadlineAt) {
      toast.error('A deadline date/time is required.')
      return
    }
    if (!form.timezone.trim()) {
      toast.error('Timezone is required.')
      return
    }
    setSaving(true)
    try {
      await deadlineApi.setDeadline({
        examName: form.examName.trim() || null,
        startAt: form.startAt || null,
        deadlineAt: form.deadlineAt,
        timezone: form.timezone.trim(),
        enabled: form.enabled,
        policy: form.policy,
        examVisibility: form.examVisibility,
      })
      toast.success('Submission deadline saved.')
    } catch (err) {
      toast.error(err?.message || 'Could not save the submission deadline.')
    } finally {
      setSaving(false)
    }
  }

  const confirmExtend = async () => {
    if (!extendValue.deadlineAt) {
      toast.error('A new deadline date/time is required.')
      return
    }
    setBusy(true)
    try {
      const res = await deadlineApi.extendDeadline(extendValue)
      setForm((f) => ({ ...f, deadlineAt: toDateTimeLocalInput(res.deadlineAt), enabled: res.enabled }))
      toast.success('Deadline extended.')
      setExtendOpen(false)
      setExtendValue({ deadlineAt: '', note: '' })
      if (showHistory) loadHistory()
    } catch (err) {
      toast.error(err?.message || 'Could not extend the deadline.')
    } finally {
      setBusy(false)
    }
  }

  const confirmClose = async () => {
    setBusy(true)
    try {
      await deadlineApi.closeSubmissions(closeNote.trim() || undefined)
      toast.success('Submissions closed.')
      setCloseOpen(false)
      setCloseNote('')
      if (showHistory) loadHistory()
    } catch (err) {
      toast.error(err?.message || 'Could not close submissions.')
    } finally {
      setBusy(false)
    }
  }

  const confirmReopen = async () => {
    setBusy(true)
    try {
      await deadlineApi.reopenSubmissions({
        reopenedUntil: reopenValue.reopenedUntil || undefined,
        note: reopenValue.note.trim() || undefined,
      })
      toast.success('Submissions reopened.')
      setReopenOpen(false)
      setReopenValue({ reopenedUntil: '', note: '' })
      if (showHistory) loadHistory()
    } catch (err) {
      toast.error(err?.message || 'Could not reopen submissions.')
    } finally {
      setBusy(false)
    }
  }

  const isStrict = deadline?.policy === 'STRICT'
  const isClosed = deadline?.status === 'CLOSED'

  return (
    <AppShell
      title="Submission Deadline"
      subtitle="Set a paper submission window for teachers connected to your school"
      mobileTitle="Deadline"
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {loading ? (
          <ListSkeleton rows={2} />
        ) : (
          <>
            {deadline?.configured && (
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={deadlineStatusBadgeVariant(deadline.status)}>
                      {t(deadlineStatusLabelKey(deadline.status))}
                    </Badge>
                    {deadline.examName && <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{deadline.examName}</span>}
                    <span className="text-xs text-ink-400">
                      Deadline: {formatDeadlineDateTime(deadline.deadlineAt)} ({deadline.timezone})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => { setExtendValue({ deadlineAt: toDateTimeLocalInput(deadline.deadlineAt), note: '' }); setExtendOpen(true) }}>
                      <PlayCircle className="h-3.5 w-3.5" /> Extend
                    </Button>
                    {!isClosed && (
                      <Button size="sm" variant="outline" onClick={() => setCloseOpen(true)}>
                        <Lock className="h-3.5 w-3.5" /> Close now
                      </Button>
                    )}
                    {isClosed && !isStrict && (
                      <Button size="sm" variant="outline" onClick={() => setReopenOpen(true)}>
                        <Unlock className="h-3.5 w-3.5" /> Reopen
                      </Button>
                    )}
                  </div>
                  {isClosed && isStrict && (
                    <p className="w-full text-[11px] text-ink-400">
                      This school's policy is STRICT — submissions can't be manually reopened once closed; extend the deadline instead.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Configure deadline</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="dl-examName">Exam / window name</Label>
                  <Input id="dl-examName" value={form.examName} onChange={(e) => set({ examName: e.target.value })} placeholder="e.g. Annual Examination 2026-27" />
                  <p className="mt-1 text-[11px] text-ink-400">Shown to teachers on their banner — for display only.</p>
                </div>
                <div>
                  <Label htmlFor="dl-startAt">Opens at (optional)</Label>
                  <Input id="dl-startAt" type="datetime-local" value={form.startAt} onChange={(e) => set({ startAt: e.target.value })} />
                  <p className="mt-1 text-[11px] text-ink-400">Leave blank to allow submissions immediately.</p>
                </div>
                <div>
                  <Label htmlFor="dl-deadlineAt">Deadline</Label>
                  <Input id="dl-deadlineAt" type="datetime-local" value={form.deadlineAt} onChange={(e) => set({ deadlineAt: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="dl-timezone">Timezone</Label>
                  <Input id="dl-timezone" value={form.timezone} onChange={(e) => set({ timezone: e.target.value })} placeholder="Asia/Kolkata" />
                  <p className="mt-1 text-[11px] text-ink-400">IANA timezone id — all times above are interpreted in this zone, never the browser's.</p>
                </div>
                <div>
                  <Label htmlFor="dl-policy">If the deadline passes</Label>
                  <Select id="dl-policy" value={form.policy} onChange={(e) => set({ policy: e.target.value })}>
                    <option value="ADMIN_EXTENSION">Allow me to reopen manually</option>
                    <option value="STRICT">Strict — only a new extension can reopen</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dl-visibility">Exam visibility</Label>
                  <Select id="dl-visibility" value={form.examVisibility} onChange={(e) => set({ examVisibility: e.target.value })}>
                    <option value="NORMAL">Normal</option>
                    <option value="CONFIDENTIAL">Confidential</option>
                  </Select>
                  <p className="mt-1 text-[11px] text-ink-400">Confidential has no extra restrictions yet — reserved for a future update.</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300 sm:col-span-2">
                  <input type="checkbox" checked={form.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="h-4 w-4 rounded border-ink-300" />
                  Enabled — when off, this behaves as if no deadline were configured
                </label>
                <div className="flex justify-end sm:col-span-2">
                  <Button onClick={save} disabled={saving}>
                    <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : (deadline?.configured ? 'Save changes' : 'Set deadline')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><History className="h-4 w-4" /> History</CardTitle>
                <Button size="sm" variant="ghost" onClick={toggleHistory}>
                  {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              </CardHeader>
              {showHistory && (
                <CardContent>
                  {historyLoading ? (
                    <ListSkeleton rows={3} />
                  ) : history.length === 0 ? (
                    <p className="text-sm text-ink-400">No changes recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((a) => (
                        <div key={a.id} className="rounded-lg border border-ink-100 p-3 text-xs dark:border-ink-800">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge>{a.action}</Badge>
                              <span className="text-ink-500 dark:text-ink-400">{a.actorName || 'Unknown'}</span>
                            </div>
                            <span className="text-ink-400">{formatDeadlineDateTime(a.createdAt)}</span>
                          </div>
                          {a.note && <p className="mt-1.5 text-ink-600 dark:text-ink-300">{a.note}</p>}
                          <button
                            className="mt-1.5 text-[11px] font-medium text-ink-400 underline underline-offset-2"
                            onClick={() => setExpandedAudit(expandedAudit === a.id ? null : a.id)}
                          >
                            {expandedAudit === a.id ? 'Hide details' : 'Show details'}
                          </button>
                          {expandedAudit === a.id && (
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <pre className="overflow-x-auto rounded-md bg-ink-50 p-2 text-[10px] dark:bg-ink-900">{a.previousSnapshotJson || '—'}</pre>
                              <pre className="overflow-x-auto rounded-md bg-ink-50 p-2 text-[10px] dark:bg-ink-900">{a.newSnapshotJson || '—'}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </>
        )}
      </div>

      <Dialog
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        title="Extend deadline"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExtendOpen(false)}>Cancel</Button>
            <Button onClick={confirmExtend} disabled={busy || !extendValue.deadlineAt}>Extend</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="ext-deadlineAt">New deadline</Label>
            <Input id="ext-deadlineAt" type="datetime-local" value={extendValue.deadlineAt} onChange={(e) => setExtendValue((v) => ({ ...v, deadlineAt: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="ext-note">Note (optional)</Label>
            <Textarea id="ext-note" rows={2} value={extendValue.note} onChange={(e) => setExtendValue((v) => ({ ...v, note: e.target.value }))} placeholder="e.g. Extended by 2 days on teachers' request" />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Close submissions now?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCloseOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmClose} disabled={busy}>Close now</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p>School-connected teachers will immediately lose the ability to create, edit, submit or duplicate papers until you extend or reopen.</p>
          <div>
            <Label htmlFor="close-note">Note (optional)</Label>
            <Textarea id="close-note" rows={2} value={closeNote} onChange={(e) => setCloseNote(e.target.value)} />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title="Reopen submissions"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReopenOpen(false)}>Cancel</Button>
            <Button onClick={confirmReopen} disabled={busy}>Reopen</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p>Allows teachers to submit again without changing the recorded deadline itself.</p>
          <div>
            <Label htmlFor="reopen-until">Reopen until (optional)</Label>
            <Input id="reopen-until" type="datetime-local" value={reopenValue.reopenedUntil} onChange={(e) => setReopenValue((v) => ({ ...v, reopenedUntil: e.target.value }))} />
            <p className="mt-1 text-[11px] text-ink-400">Leave blank to reopen with no end time.</p>
          </div>
          <div>
            <Label htmlFor="reopen-note">Note (optional)</Label>
            <Textarea id="reopen-note" rows={2} value={reopenValue.note} onChange={(e) => setReopenValue((v) => ({ ...v, note: e.target.value }))} />
          </div>
        </div>
      </Dialog>
    </AppShell>
  )
}
