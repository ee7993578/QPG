import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutTemplate, Check, Star, Pencil, Trash2, Plus } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Input, Textarea, Label } from '../ui/Input'
import { Select } from '../ui/Select'
import { Dialog } from '../ui/Dialog'
import { EmptyState, ErrorState, ListSkeleton } from '../ui/States'
import { useSchoolStore } from '../../store/schoolStore'
import { useMyTemplatesStore } from '../../store/myTemplatesStore'
import { templateApi } from '../../services/templateApi'
import { paperTemplateApi } from '../../services/paperTemplateApi'
import { toast } from '../../store/uiStore'
import {
  PAPER_TEMPLATES, HEADER_LAYOUTS, BORDER_OPTIONS, MARKS_POSITIONS,
} from '../../data/mockData'
import { cn } from '../../lib/utils'

/**
 * Section 25 — templates.
 *
 * A "template" here is a patch over a paper's `settings` (the exact shape the
 * builder's Paper Settings panel already reads), so applying one never touches
 * the questions. Two flavours are rendered by the same components:
 *   • built-in layouts  — classic / modern / minimal / school
 *   • school templates  — saved by a School admin, shared with every teacher
 */

const TEMPLATE_RULE = {
  classic: 'border-b-2 border-ink-800',
  modern: 'border-b-4 border-ink-900',
  minimal: 'border-b border-ink-300',
  school: 'border-b-2 border-double border-ink-800',
}

/** Miniature of a paper header, enough to tell the four layouts apart. */
export function TemplateThumb({ variant = 'classic', className }) {
  return (
    <div className={cn('rounded-sm bg-paper-50 px-5 py-4 shadow-card', className)}>
      <div className={cn('pb-2 text-center font-display', TEMPLATE_RULE[variant] || TEMPLATE_RULE.classic)}>
        <p className="text-[9px] font-bold uppercase tracking-wide text-ink-900">Delhi Public School</p>
        <p className="text-[8px] font-semibold uppercase text-ink-700">Half Yearly Examination</p>
        <div className="mt-1 flex justify-between text-[7px] text-ink-500">
          <span>Class: X</span><span>Maths</span><span>80 Marks</span>
        </div>
      </div>
      <div className="mt-2.5 space-y-1.5">
        <span className="block h-1 w-2/3 rounded bg-ink-200" />
        <span className="block h-1 w-full rounded bg-ink-100" />
        <span className="block h-1 w-5/6 rounded bg-ink-100" />
        <span className="block h-1 w-3/4 rounded bg-ink-100" />
      </div>
    </div>
  )
}

/**
 * "Use template" always creates a brand-new paper — it never edits an
 * existing one. This just hands the template off to the same 3-step wizard
 * used for "Create Exam" (CreateExam.jsx): every normal field (exam type,
 * date, class, section, subject, duration, marks, school name, address) is
 * asked there exactly as usual, pre-filled where the template has an
 * opinion, and left fully editable. Only once that wizard actually creates
 * the new paper does the template's layout/header/footer (and, for a full
 * "layout" template, its blank section skeleton) get stamped onto it.
 */
function useTemplateForNewExam(navigate, template) {
  if (!template) return
  navigate('/exam/new', { state: { prefillTemplate: template } })
}

/** The four built-in layouts. Read-only — they ship with the app. */
export function BuiltInTemplates() {
  const navigate = useNavigate()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PAPER_TEMPLATES.map(({ value, label }) => (
        <Card key={value} className="flex flex-col p-4">
          <TemplateThumb variant={value} />
          <p className="mt-3 font-display font-semibold text-ink-900 dark:text-ink-50">{label}</p>
          <p className="mt-0.5 flex-1 text-xs text-ink-400">
            {value === 'classic' && 'Bold ruled header — the familiar school look.'}
            {value === 'modern' && 'Heavier header rule with cleaner spacing.'}
            {value === 'minimal' && 'Thin rule, maximum room for questions.'}
            {value === 'school' && 'Double rule, board-exam styling.'}
          </p>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => useTemplateForNewExam(navigate, { name: label, settings: { template: value } })}
          >
            Use this layout
          </Button>
        </Card>
      ))}
    </div>
  )
}

const BORDER_LABEL = {
  none: 'No border',
  paper: 'Around the page',
  header: 'Under the header only',
  both: 'Page + header',
}

const BLANK_TEMPLATE = {
  name: '',
  description: '',
  settings: {
    template: 'classic',
    headerLayout: 'center',
    border: 'none',
    marksPosition: 'bracket',
    footerText: '',
    showPageNumber: true,
  },
}

/**
 * School templates. `editable` is what separates the School admin's
 * /school/templates from the teacher's read-only view of the same list.
 */
export function SchoolTemplates({ editable = false }) {
  const navigate = useNavigate()
  const templates = useSchoolStore((s) => s.templates)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(BLANK_TEMPLATE)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const openAdd = () => {
    setEditing(null)
    setDraft(BLANK_TEMPLATE)
    setFormOpen(true)
  }

  const openEdit = (tpl) => {
    setEditing(tpl)
    setDraft({
      name: tpl.name,
      description: tpl.description || '',
      settings: { ...BLANK_TEMPLATE.settings, ...tpl.settings },
    })
    setFormOpen(true)
  }

  const setSetting = (patch) => setDraft((d) => ({ ...d, settings: { ...d.settings, ...patch } }))

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error('Give the template a name first.')
      return
    }
    const payload = editing ? { ...editing, ...draft } : draft
    await templateApi.save(payload)
    setFormOpen(false)
    setEditing(null)
    toast.success(editing ? 'Template updated.' : 'Template saved.')
  }

  const remove = async () => {
    if (!confirmDelete) return
    await templateApi.remove(confirmDelete.id)
    setConfirmDelete(null)
    toast.success('Template deleted.')
  }

  const makeDefault = async (tpl) => {
    await templateApi.setDefault(tpl.id)
    toast.success(`"${tpl.name}" is now the school default.`)
  }

  return (
    <>
      {editable && (
        <div className="mb-4 flex justify-end">
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> New Template</Button>
        </div>
      )}

      {templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No school templates yet"
          message={
            editable
              ? 'Save a header/footer style once and every teacher at your school can apply it to their papers.'
              : 'Your school has not shared any templates yet.'
          }
          actionLabel={editable ? 'Create the first template' : undefined}
          onAction={editable ? openAdd : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col p-4">
              <TemplateThumb variant={tpl.settings?.template || 'classic'} />
              <div className="mt-3 flex items-start justify-between gap-2">
                <p className="font-display font-semibold text-ink-900 dark:text-ink-50">{tpl.name}</p>
                {tpl.isDefault && <Badge variant="gold">Default</Badge>}
              </div>
              <p className="mt-1 flex-1 text-xs text-ink-400">{tpl.description}</p>

              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" className="flex-1" onClick={() => useTemplateForNewExam(navigate, tpl)}>
                  Use template
                </Button>
                {editable && (
                  <>
                    {!tpl.isDefault && (
                      <Button variant="ghost" size="icon" onClick={() => makeDefault(tpl)} aria-label="Make default" title="Make default">
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(tpl)} aria-label="Edit template" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(tpl)} aria-label="Delete template" title="Delete">
                      <Trash2 className="h-4 w-4 text-pen-red" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit template' : 'New school template'}
        className="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Save changes' : 'Save template'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="tpl-name">Template name</Label>
            <Input
              id="tpl-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. DPS Standard Header"
            />
          </div>
          <div>
            <Label htmlFor="tpl-desc">Description</Label>
            <Textarea
              id="tpl-desc"
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="When should teachers use this one?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tpl-layout">Base layout</Label>
              <Select id="tpl-layout" value={draft.settings.template} onChange={(e) => setSetting({ template: e.target.value })}>
                {PAPER_TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="tpl-header">Header layout</Label>
              <Select id="tpl-header" value={draft.settings.headerLayout} onChange={(e) => setSetting({ headerLayout: e.target.value })}>
                {HEADER_LAYOUTS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tpl-border">Border</Label>
              <Select id="tpl-border" value={draft.settings.border} onChange={(e) => setSetting({ border: e.target.value })}>
                {BORDER_OPTIONS.map((b) => <option key={b.value} value={b.value}>{BORDER_LABEL[b.value] || b.value}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="tpl-marks">Marks shown as</Label>
              <Select id="tpl-marks" value={draft.settings.marksPosition} onChange={(e) => setSetting({ marksPosition: e.target.value })}>
                {MARKS_POSITIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tpl-footer">Footer text</Label>
            <Input
              id="tpl-footer"
              value={draft.settings.footerText}
              onChange={(e) => setSetting({ footerText: e.target.value })}
              placeholder="e.g. Delhi Public School — Best of luck!"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-ink-700 dark:text-ink-200">
            <input
              type="checkbox"
              checked={!!draft.settings.showPageNumber}
              onChange={(e) => setSetting({ showPageNumber: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 accent-ink-700 dark:accent-gold-400"
            />
            Show page numbers
          </label>

          <div className="rounded-lg bg-ink-50 px-3 py-2.5 text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-400">
            <Check className="mr-1 inline h-3 w-3" />
            Applying a template only changes formatting. Questions are never touched.
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this template?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={remove}>Delete</Button>
          </>
        }
      >
        <p>Papers already using it keep their current formatting — they just won't be able to re-apply it.</p>
      </Dialog>
    </>
  )
}

/**
 * Personal "My Templates" — header/layout templates a teacher saved
 * straight from one of their own papers on My Paper ("Save Header as
 * Template" / "Save Paper Layout as Template"). Owner-only; nothing here is
 * shared with the rest of the school.
 */
export function MyTemplates() {
  const navigate = useNavigate()
  const templates = useMyTemplatesStore((s) => s.templates)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    paperTemplateApi.list()
      .catch((err) => setError(err?.message || 'Could not load your templates.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openApply = (tpl) => {
    // The new-exam wizard reads `.sections` for a layout template's blank
    // structure — the API stores/returns that same tree as `.structure`.
    useTemplateForNewExam(navigate, tpl.type === 'layout' ? { ...tpl, sections: tpl.structure } : tpl)
  }

  const remove = async () => {
    if (!confirmDelete) return
    await paperTemplateApi.remove(confirmDelete.id)
    setConfirmDelete(null)
    toast.success('Template deleted.')
  }

  if (loading) return <ListSkeleton rows={3} />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <>
      {templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No personal templates yet"
          message={'Open a paper from My Paper and use "Save Header as Template" or "Save Paper Layout as Template" to start your own library.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col p-4">
              <TemplateThumb variant={tpl.settings?.template || 'classic'} />
              <div className="mt-3 flex items-start justify-between gap-2">
                <p className="font-display font-semibold text-ink-900 dark:text-ink-50">{tpl.name}</p>
                <Badge variant={tpl.type === 'layout' ? 'gold' : 'neutral'}>
                  {tpl.type === 'layout' ? 'Full layout' : 'Header only'}
                </Badge>
              </div>
              <p className="mt-1 flex-1 text-xs text-ink-400">
                {tpl.description || (tpl.type === 'layout'
                  ? 'Sections, marks and formatting — question boxes left empty.'
                  : 'Header, footer, font and spacing only.')}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" className="flex-1" onClick={() => openApply(tpl)}>
                  Use template
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmDelete(tpl)}
                  aria-label="Delete template"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-pen-red" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this template?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={remove}>Delete</Button>
          </>
        }
      >
        <p>This only removes the saved template — papers you already made with it are unaffected.</p>
      </Dialog>
    </>
  )
}

/**
 * School Admin's "Teacher Templates" tab — a read-only, school-wide view of
 * every personal template every teacher at the school has saved from their
 * own papers (same personal templates each teacher sees under their own
 * "My Templates"). The admin can use one to start a new paper but can't
 * edit or delete a teacher's own template from here.
 */
export function TeacherTemplates() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    paperTemplateApi.listSchoolTeachers()
      .then(setTemplates)
      .catch((err) => setError(err?.message || 'Could not load teacher templates.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openApply = (tpl) => {
    // Same trick as MyTemplates: the wizard reads `.sections` for a layout
    // template's blank structure, the API returns that tree as `.structure`.
    useTemplateForNewExam(navigate, tpl.type === 'layout' ? { ...tpl, sections: tpl.structure } : tpl)
  }

  if (loading) return <ListSkeleton rows={3} />
  if (error) return <ErrorState message={error} onRetry={load} />

  return templates.length === 0 ? (
    <EmptyState
      icon={LayoutTemplate}
      title="No teacher templates yet"
      message="Once a teacher at your school saves a personal template from one of their papers, it will show up here."
    />
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((tpl) => (
        <Card key={tpl.id} className="flex flex-col p-4">
          <TemplateThumb variant={tpl.settings?.template || 'classic'} />
          <div className="mt-3 flex items-start justify-between gap-2">
            <p className="font-display font-semibold text-ink-900 dark:text-ink-50">{tpl.name}</p>
            <Badge variant={tpl.type === 'layout' ? 'gold' : 'neutral'}>
              {tpl.type === 'layout' ? 'Full layout' : 'Header only'}
            </Badge>
          </div>
          {tpl.ownerName && <p className="mt-0.5 text-[11px] font-medium text-ink-400">by {tpl.ownerName}</p>}
          <p className="mt-1 flex-1 text-xs text-ink-400">
            {tpl.description || (tpl.type === 'layout'
              ? 'Sections, marks and formatting — question boxes left empty.'
              : 'Header, footer, font and spacing only.')}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" className="flex-1" onClick={() => openApply(tpl)}>
              Use template
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
