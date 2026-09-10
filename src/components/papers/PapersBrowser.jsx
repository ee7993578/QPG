import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Download, Pencil, Eye, Copy, Trash2, FilePlus2, SlidersHorizontal,
  FolderOpen, X, LayoutTemplate, FileText, FileCode2, FileType, MoreVertical,
  Send, Lock,
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Input, Label } from '../ui/Input'
import { Select } from '../ui/Select'
import { Dialog } from '../ui/Dialog'
import { DropdownMenu, MenuItem, MenuSeparator } from '../ui/DropdownMenu'
import { EmptyState, ListSkeleton } from '../ui/States'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../store/uiStore'
import { paperTemplateApi } from '../../services/paperTemplateApi'
import { useTranslate } from '../../i18n'
import {
  computePaperMarks, formatDate, formatDuration, classSectionLabel,
  resolveSubject, resolveClass,
} from '../../lib/utils'
import {
  normalizeStatus, isEditableByTeacher, schoolPaperStatusLabelKey, schoolPaperStatusBadgeVariant,
} from '../../lib/schoolPaperStatus'
import { useDeadlineGate } from '../../lib/schoolDeadline'
import { CLASS_OPTIONS, SUBJECTS } from '../../data/mockData'

/**
 * The paper list, shared by the teacher's /papers and the school's
 * /school/papers (section 45 — one implementation, two routes). Search,
 * filters, sort, and the row actions all live here.
 *
 * School paper review lifecycle: a paper's own `schoolId` field is all
 * that's needed to tell an individual teacher's paper apart from a
 * school-connected teacher's paper (see PaperService.isSchoolWorkflowPaper
 * on the backend — the same test, mirrored here). If `schoolId` is falsy
 * this renders exactly as it always has: Draft/Saved badge, unrestricted
 * Edit/Delete. If it's set, the 5-state lifecycle badge/actions apply. The
 * backend is the real enforcement for every transition here — this is
 * purely UI/UX so a teacher isn't shown actions the server will reject.
 */

const SORTS = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'created', label: 'Recently created' },
  { value: 'examDate', label: 'Exam date' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'marks', label: 'Marks (high → low)' },
]

function examName(p) {
  return (p.examType === 'Custom' ? p.customExamName : p.examType) || 'Untitled paper'
}

export function PapersBrowser({ loading = false, emptyMessage }) {
  const navigate = useNavigate()
  const t = useTranslate()
  const papers = useAppStore((s) => s.papers)
  const setActivePaper = useAppStore((s) => s.setActivePaper)
  const duplicatePaper = useAppStore((s) => s.duplicatePaper)
  const deletePaper = useAppStore((s) => s.deletePaper)
  const submitPaperForReview = useAppStore((s) => s.submitPaperForReview)
  const accountType = useAuthStore((s) => s.accountType)
  const isTeacherView = accountType === 'teacher'
  // Submission Deadline — UI/UX only, hides/disables actions the backend
  // (PaperService -> SchoolDeadlineService.assertTeacherActionAllowed)
  // would reject anyway. Never applies to a School Admin's own view of
  // this same list (their actions here are never gated by the deadline).
  const deadlineGate = useDeadlineGate()

  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('updated')
  const [showFilters, setShowFilters] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [templateDraft, setTemplateDraft] = useState(null) // { paper, type }
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [submittingId, setSubmittingId] = useState(null)

  const activeFilters = [classFilter, subjectFilter, statusFilter].filter(Boolean).length

  const filtered = useMemo(() => {
    const list = papers.filter((p) => {
      const haystack = `${examName(p)} ${resolveSubject(p)} ${classSectionLabel(p)} ${p.examDate}`.toLowerCase()
      if (query && !haystack.includes(query.toLowerCase())) return false
      if (classFilter && resolveClass(p) !== classFilter) return false
      if (subjectFilter && resolveSubject(p) !== subjectFilter) return false
      if (statusFilter && p.status !== statusFilter) return false
      return true
    })

    const byDate = (a, b, key) => new Date(b[key] || 0) - new Date(a[key] || 0)
    return list.sort((a, b) => {
      if (sort === 'created') return byDate(a, b, 'createdAt')
      if (sort === 'examDate') return byDate(a, b, 'examDate')
      if (sort === 'name') return examName(a).localeCompare(examName(b))
      if (sort === 'marks') return (b.totalMarks || 0) - (a.totalMarks || 0)
      return byDate(a, b, 'updatedAt')
    })
  }, [papers, query, classFilter, subjectFilter, statusFilter, sort])

  const clearFilters = () => {
    setQuery('')
    setClassFilter('')
    setSubjectFilter('')
    setStatusFilter('')
  }

  const openPaper = (id, view = 'edit') => {
    setActivePaper(id)
    navigate(`/paper/${id}?view=${view}`)
  }

  // Downloading from the list opens the paper in Preview and asks the builder
  // to run the export as soon as the page is on screen, so a file downloaded
  // from here is byte-for-byte the one the Download button in the builder
  // produces — the export reads the live preview DOM (#print-root).
  //
  // The quota is spent in exactly one place (PaperBuilder.handleDownload), so
  // opening the paper here never costs a download by itself.
  //
  // Section 42 — all of this is UI gating only. The backend must re-check
  // entitlement before it ever serves a file; nothing here is a boundary.
  const handleDownload = (paper, format = 'pdf') => {
    setActivePaper(paper.id)
    navigate(`/paper/${paper.id}?view=preview&download=${format}`)
  }

  const handleDuplicate = async (paper) => {
    try {
      await duplicatePaper(paper.id)
      toast.success('Paper duplicated.')
    } catch (err) {
      toast.error(err?.message || t('schoolPaper_actionFailed'))
    }
  }

  const confirmDelete = () => {
    deletePaper(pendingDelete)
    setPendingDelete(null)
    toast.success('Paper deleted.')
  }

  // POST /api/papers/{id}/submit — teacher submits a Draft, or resubmits a
  // Needs-Changes paper. Only ever shown/enabled for school-connected
  // teacher papers in the right status (see isSchoolPaper/locked below);
  // the backend re-validates the transition regardless.
  const handleSubmitForReview = async (paper) => {
    setSubmittingId(paper.id)
    try {
      await submitPaperForReview(paper.id)
      toast.success(
        normalizeStatus(paper.status) === 'NEEDS_CHANGES'
          ? t('schoolPaper_resubmitSuccess')
          : t('schoolPaper_submitSuccess')
      )
    } catch (err) {
      toast.error(err?.message || t('schoolPaper_actionFailed'))
    } finally {
      setSubmittingId(null)
    }
  }

  // "Save Header as Template" / "Save Paper Layout as Template" — opens the
  // naming dialog below; the actual snapshot is built server-side from the
  // saved paper (POST /api/papers/{id}/save-as-template), so this always
  // saves the paper's real, persisted state.
  const openSaveTemplate = (paper, type) => {
    setTemplateDraft({ paper, type })
    setTemplateName(`${examName(paper)} ${type === 'header' ? 'Header' : 'Layout'}`)
  }

  const confirmSaveTemplate = async () => {
    if (!templateDraft || !templateName.trim()) return
    setSavingTemplate(true)
    try {
      await paperTemplateApi.saveFromPaper(templateDraft.paper.id, {
        type: templateDraft.type,
        name: templateName.trim(),
      })
      toast.success(
        templateDraft.type === 'header'
          ? 'Header saved as template — find it under Templates → My Templates.'
          : 'Paper layout saved as template — find it under Templates → My Templates.'
      )
      setTemplateDraft(null)
    } catch (err) {
      toast.error(err?.message || 'Could not save this as a template.')
    } finally {
      setSavingTemplate(false)
    }
  }

  if (loading) return <ListSkeleton rows={4} />

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div data-tour="mypapers-search" className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            className="pl-9"
            placeholder="Search by exam name, subject, class, section, date…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search papers"
          />
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="sm:w-52" aria-label="Sort papers">
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Button data-tour="mypapers-filters" variant="outline" onClick={() => setShowFilters((v) => !v)} className="sm:w-auto">
          <SlidersHorizontal className="h-4 w-4" /> Filters{activeFilters ? ` (${activeFilters})` : ''}
        </Button>
      </div>

      {showFilters && (
        <Card className="mt-3 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} aria-label="Filter by class">
            <option value="">All Classes</option>
            {CLASS_OPTIONS.map((c) => <option key={c} value={c}>Class {c}</option>)}
          </Select>
          <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} aria-label="Filter by subject">
            <option value="">All Subjects</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="saved">Saved</option>
          </Select>
        </Card>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-400">
          {filtered.length} of {papers.length} paper{papers.length === 1 ? '' : 's'}
        </p>
        {(activeFilters > 0 || query) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <div className="mt-3">
        {papers.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No papers yet"
            message={
              deadlineGate.applies && !deadlineGate.allowed
                ? 'The submission window is currently closed — contact your School Admin if you need an extension.'
                : (emptyMessage || 'Create your first question paper — it takes about ten minutes, and creating is always free.')
            }
            actionLabel={deadlineGate.applies && !deadlineGate.allowed ? undefined : 'Create New Paper'}
            onAction={deadlineGate.applies && !deadlineGate.allowed ? undefined : () => navigate('/exam/new')}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No papers match your search"
            message="Try a different keyword, or clear the filters to see everything again."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((paper) => {
              const { obtainableMarks } = computePaperMarks(paper)
              // School review lifecycle only ever applies to a school-connected
              // teacher's own paper (paper.schoolId set) — an individual
              // teacher's paper (schoolId falsy) renders exactly as before.
              const isSchoolPaper = !!paper.schoolId
              const normalizedStatus = isSchoolPaper ? normalizeStatus(paper.status) : null
              // Submission Deadline — only ever narrows things further for
              // the owning teacher's own school-connected paper; never
              // applies to an individual teacher's paper or a School
              // Admin's view of this same list.
              const deadlineBlocked = isTeacherView && isSchoolPaper && !deadlineGate.allowed
              const editable = (!isSchoolPaper || isEditableByTeacher(paper.status)) && !deadlineBlocked
              const canSubmit = isSchoolPaper && (normalizedStatus === 'DRAFT' || normalizedStatus === 'NEEDS_CHANGES') && !deadlineBlocked
              const canDuplicate = !deadlineBlocked
              const isSubmitting = submittingId === paper.id
              return (
                <Card key={paper.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display font-semibold text-ink-900 dark:text-ink-50">{examName(paper)}</p>
                        {isSchoolPaper ? (
                          <Badge variant={schoolPaperStatusBadgeVariant(paper.status)}>
                            {t(schoolPaperStatusLabelKey(paper.status))}
                          </Badge>
                        ) : (
                          <Badge variant={paper.status === 'draft' ? 'neutral' : 'success'}>
                            {paper.status === 'draft' ? 'Draft' : 'Saved'}
                          </Badge>
                        )}
                        {isSchoolPaper && !editable && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-400">
                            <Lock className="h-3 w-3" /> {t('schoolPaper_lockedReadOnly')}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-ink-400">
                        {resolveSubject(paper)} · {classSectionLabel(paper) ? `Class ${classSectionLabel(paper)} · ` : ''}
                        {formatDate(paper.examDate)} · {formatDuration(paper.duration)} · {obtainableMarks}/{paper.totalMarks} marks
                      </p>
                      {isSchoolPaper && normalizedStatus === 'NEEDS_CHANGES' && paper.reviewComment && (
                        <p className="mt-1.5 rounded-md bg-red-50 px-2 py-1 text-xs text-pen-red dark:bg-red-900/20 dark:text-red-300">
                          {paper.reviewComment}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      {isSchoolPaper && canSubmit && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSubmitForReview(paper)}
                          disabled={isSubmitting}
                          title={normalizedStatus === 'NEEDS_CHANGES' ? t('schoolPaper_resubmit') : t('schoolPaper_submitForReview')}
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">
                            {normalizedStatus === 'NEEDS_CHANGES' ? t('schoolPaper_resubmit') : t('schoolPaper_submitForReview')}
                          </span>
                        </Button>
                      )}
                      <Button data-tour="mypapers-preview" size="sm" variant="outline" onClick={() => openPaper(paper.id, 'preview')} title="Preview" aria-label="Preview paper">
                        <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Preview</span>
                      </Button>
                      {editable && (
                        <Button data-tour="mypapers-edit" size="sm" variant="outline" onClick={() => openPaper(paper.id, 'edit')} title="Edit" aria-label="Edit paper">
                          <Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
                        </Button>
                      )}
                      <DropdownMenu
                        trigger={
                          <Button data-tour="mypapers-download" size="sm" variant="secondary" title="Download" aria-label="Download paper">
                            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Download</span>
                          </Button>
                        }
                        menuClassName="min-w-[14rem]"
                      >
                        <MenuItem icon={FileText} onClick={() => handleDownload(paper, 'pdf')}>
                          Download as PDF
                        </MenuItem>
                        <MenuItem icon={FileCode2} onClick={() => handleDownload(paper, 'docx')}>
                          Download as Word (.docx)
                        </MenuItem>
                        <MenuItem icon={FileType} onClick={() => handleDownload(paper, 'doc')}>
                          Download as Word (.doc)
                        </MenuItem>
                      </DropdownMenu>
                      {/* Everything secondary is tucked behind one "More" menu so the
                          card never wraps to a crowded second row on mobile — this
                          always shows, unlike the previous row of loose icon buttons. */}
                      <DropdownMenu
                        trigger={
                          <Button data-tour="mypapers-more" size="sm" variant="ghost" title="More actions" aria-label="More actions">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        }
                      >
                        <MenuItem icon={Copy} onClick={() => handleDuplicate(paper)} disabled={!canDuplicate}>
                          Duplicate
                        </MenuItem>
                        <MenuSeparator />
                        <MenuItem icon={FileText} onClick={() => openSaveTemplate(paper, 'header')}>
                          Save Header as Template
                        </MenuItem>
                        <MenuItem icon={LayoutTemplate} onClick={() => openSaveTemplate(paper, 'layout')}>
                          Save Paper Layout as Template
                        </MenuItem>
                        {editable && (
                          <>
                            <MenuSeparator />
                            <MenuItem icon={Trash2} danger onClick={() => setPendingDelete(paper.id)}>
                              Delete paper
                            </MenuItem>
                          </>
                        )}
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this paper?"
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        This will remove the paper from your list. This action cannot be undone.
      </Dialog>

      <Dialog
        open={!!templateDraft}
        onClose={() => setTemplateDraft(null)}
        title={templateDraft?.type === 'header' ? 'Save header as template' : 'Save paper layout as template'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTemplateDraft(null)}>Cancel</Button>
            <Button onClick={confirmSaveTemplate} disabled={savingTemplate || !templateName.trim()}>
              {savingTemplate ? 'Saving…' : 'Save template'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-500">
            {templateDraft?.type === 'header'
              ? 'Saves the header, footer, font and spacing only — nothing about the questions.'
              : 'Saves the full section/question layout — marks, counts, and formatting — with every question box left empty, ready to fill in next time.'}
          </p>
          <div>
            <Label htmlFor="new-tpl-name">Template name</Label>
            <Input
              id="new-tpl-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Half Yearly Header"
            />
          </div>
          <p className="text-xs text-ink-400">Find it later under Templates → My Templates.</p>
        </div>
      </Dialog>
    </>
  )
}

/**
 * Shared header action so both routes offer the same primary CTA.
 * Submission Deadline — disabled for a school-connected teacher once the
 * backend would reject `createPaper()` anyway (server is still the real
 * gate); never disabled for an individual teacher or a School Admin.
 */
export function CreatePaperButton() {
  const navigate = useNavigate()
  const deadlineGate = useDeadlineGate()
  const blocked = deadlineGate.applies && !deadlineGate.allowed
  return (
    <Button onClick={() => navigate('/exam/new')} disabled={blocked} title={blocked ? 'The submission window is currently closed.' : undefined}>
      <FilePlus2 className="h-4 w-4" /> Create New Paper
    </Button>
  )
}
