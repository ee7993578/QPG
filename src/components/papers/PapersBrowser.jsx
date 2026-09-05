import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Download, Pencil, Eye, Copy, Trash2, FilePlus2, SlidersHorizontal,
  FolderOpen, X,
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Dialog } from '../ui/Dialog'
import { EmptyState, ListSkeleton } from '../ui/States'
import { useAppStore } from '../../store/useAppStore'
import { toast } from '../../store/uiStore'
import {
  computePaperMarks, formatDate, formatDuration, classSectionLabel,
  resolveSubject, resolveClass,
} from '../../lib/utils'
import { CLASS_OPTIONS, SUBJECTS } from '../../data/mockData'

/**
 * The paper list, shared by the teacher's /papers and the school's
 * /school/papers (section 45 — one implementation, two routes). Search,
 * filters, sort, and the row actions all live here.
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
  const papers = useAppStore((s) => s.papers)
  const setActivePaper = useAppStore((s) => s.setActivePaper)
  const duplicatePaper = useAppStore((s) => s.duplicatePaper)
  const deletePaper = useAppStore((s) => s.deletePaper)

  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('updated')
  const [showFilters, setShowFilters] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

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
  const handleDownload = (paper) => {
    setActivePaper(paper.id)
    navigate(`/paper/${paper.id}?view=preview&download=pdf`)
  }

  const handleDuplicate = (paper) => {
    duplicatePaper(paper.id)
    toast.success('Paper duplicated.')
  }

  const confirmDelete = () => {
    deletePaper(pendingDelete)
    setPendingDelete(null)
    toast.success('Paper deleted.')
  }

  if (loading) return <ListSkeleton rows={4} />

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
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
        <Button variant="outline" onClick={() => setShowFilters((v) => !v)} className="sm:w-auto">
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
            message={emptyMessage || 'Create your first question paper — it takes about ten minutes, and creating is always free.'}
            actionLabel="Create New Paper"
            onAction={() => navigate('/exam/new')}
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
              return (
                <Card key={paper.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-display font-semibold text-ink-900 dark:text-ink-50">{examName(paper)}</p>
                        <Badge variant={paper.status === 'draft' ? 'neutral' : 'success'}>
                          {paper.status === 'draft' ? 'Draft' : 'Saved'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-400">
                        {resolveSubject(paper)} · {classSectionLabel(paper) ? `Class ${classSectionLabel(paper)} · ` : ''}
                        {formatDate(paper.examDate)} · {formatDuration(paper.duration)} · {obtainableMarks}/{paper.totalMarks} marks
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openPaper(paper.id, 'preview')}>
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openPaper(paper.id, 'edit')}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleDownload(paper)}>
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDuplicate(paper)} title="Duplicate" aria-label="Duplicate paper">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPendingDelete(paper.id)}
                        title="Delete"
                        aria-label="Delete paper"
                        className="text-pen-red hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
    </>
  )
}

/** Shared header action so both routes offer the same primary CTA. */
export function CreatePaperButton() {
  const navigate = useNavigate()
  return (
    <Button onClick={() => navigate('/exam/new')}>
      <FilePlus2 className="h-4 w-4" /> Create New Paper
    </Button>
  )
}
