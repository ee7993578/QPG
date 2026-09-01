import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download, Pencil, Eye, Copy, Trash2, FilePlus2, SlidersHorizontal } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Dialog } from '../components/ui/Dialog'
import { useAppStore } from '../store/useAppStore'
import { computePaperMarks, formatDate, formatDuration, classSectionLabel, resolveSubject, resolveClass } from '../lib/utils'
import { CLASS_OPTIONS, SUBJECTS, EXAM_TYPES } from '../data/mockData'

export default function MyPapers() {
  const navigate = useNavigate()
  const papers = useAppStore((s) => s.papers)
  const setActivePaper = useAppStore((s) => s.setActivePaper)
  const duplicatePaper = useAppStore((s) => s.duplicatePaper)
  const deletePaper = useAppStore((s) => s.deletePaper)

  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const filtered = useMemo(() => {
    return papers
      .filter((p) => {
        const name = p.examType === 'Custom' ? p.customExamName : p.examType
        const haystack = `${name} ${resolveSubject(p)} ${classSectionLabel(p)} ${p.examDate}`.toLowerCase()
        if (query && !haystack.includes(query.toLowerCase())) return false
        if (classFilter && resolveClass(p) !== classFilter) return false
        if (subjectFilter && resolveSubject(p) !== subjectFilter) return false
        if (statusFilter && p.status !== statusFilter) return false
        return true
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [papers, query, classFilter, subjectFilter, statusFilter])

  const openPaper = (id, view = 'edit') => {
    setActivePaper(id)
    navigate(`/paper/${id}?view=${view}`)
  }

  return (
    <AppShell title="My Paper" subtitle="All your saved and draft question papers" mobileTitle="My Paper"
      right={<Button onClick={() => navigate('/exam/new')}><FilePlus2 className="h-4 w-4" /> Create New Paper</Button>}
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              className="pl-9"
              placeholder="Search by exam name, subject, class, section, date…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters((v) => !v)} className="sm:w-auto">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </div>

        {showFilters && (
          <Card className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
            <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {CLASS_OPTIONS.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </Select>
            <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="">All Subjects</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="saved">Saved</option>
            </Select>
          </Card>
        )}

        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-sm text-ink-400">
            No papers match your search. Try a different keyword or filter, or create a new paper.
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((paper) => {
              const { obtainableMarks } = computePaperMarks(paper)
              const examName = paper.examType === 'Custom' ? paper.customExamName : paper.examType
              return (
                <Card key={paper.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-display font-semibold text-ink-900 dark:text-ink-50">{examName}</p>
                        <Badge variant={paper.status === 'draft' ? 'neutral' : 'success'}>{paper.status === 'draft' ? 'Draft' : 'Saved'}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-400">
                        {resolveSubject(paper)} · {classSectionLabel(paper) ? `Class ${classSectionLabel(paper)} · ` : ''}{formatDate(paper.examDate)} · {formatDuration(paper.duration)} · {obtainableMarks}/{paper.totalMarks} marks
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openPaper(paper.id, 'preview')}>
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openPaper(paper.id, 'edit')}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => { openPaper(paper.id, 'preview'); setTimeout(() => window.print(), 300) }}>
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => duplicatePaper(paper.id)} title="Duplicate">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPendingDelete(paper.id)} title="Delete" className="text-pen-red hover:bg-red-50 dark:hover:bg-red-900/20">
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
            <Button variant="danger" onClick={() => { deletePaper(pendingDelete); setPendingDelete(null) }}>Delete</Button>
          </>
        }
      >
        This will remove the paper from My Paper. This action cannot be undone.
      </Dialog>
    </AppShell>
  )
}
