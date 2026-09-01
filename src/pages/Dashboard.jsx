import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus2, FileText, FileClock, CalendarDays, ArrowRight } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useAppStore } from '../store/useAppStore'
import { computePaperMarks, formatDate, classSectionLabel, resolveSubject } from '../lib/utils'

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-center gap-4 px-5 py-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-600 dark:bg-ink-800 dark:text-gold-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold font-display text-ink-900 dark:text-ink-50">{value}</p>
        <p className="text-xs text-ink-400">{label}</p>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const teacher = useAppStore((s) => s.teacher)
  const papers = useAppStore((s) => s.papers)
  const setActivePaper = useAppStore((s) => s.setActivePaper)

  const stats = useMemo(() => {
    const now = new Date()
    const monthly = papers.filter((p) => {
      const d = new Date(p.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    const drafts = papers.filter((p) => p.status === 'draft').length
    return { total: papers.length, monthly, drafts }
  }, [papers])

  const recent = [...papers].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4)

  const openPaper = (id) => {
    setActivePaper(id)
    navigate(`/paper/${id}?view=edit`)
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <AppShell title="Dashboard" subtitle="Overview of your exam papers" mobileTitle="Dashboard"
      right={<Button onClick={() => navigate('/exam/new')}><FilePlus2 className="h-4 w-4" /> Create New Paper</Button>}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4 md:hidden">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">
              {greeting()}, {teacher?.name?.split(' ')[0] || 'Teacher'}
            </h2>
            <p className="text-sm text-ink-400">Here's what's happening with your papers.</p>
          </div>
        </div>
        <p className="hidden md:block font-display text-lg text-ink-600 dark:text-ink-300">
          {greeting()}, {teacher?.name || 'Teacher'} 👋
        </p>

        <Button onClick={() => navigate('/exam/new')} size="lg" className="w-full md:hidden">
          <FilePlus2 className="h-4 w-4" /> Create New Paper
        </Button>

        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <StatCard icon={FileText} label="Total Papers" value={stats.total} />
          <StatCard icon={CalendarDays} label="This Month" value={stats.monthly} />
          <StatCard icon={FileClock} label="Drafts" value={stats.drafts} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">Recent Papers</h3>
            <button onClick={() => navigate('/papers')} className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800 dark:hover:text-gold-300">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recent.length === 0 ? (
            <Card className="p-8 text-center text-sm text-ink-400">
              No papers yet. Create your first question paper to get started.
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recent.map((paper) => {
                const { obtainableMarks } = computePaperMarks(paper)
                return (
                  <Card key={paper.id} className="cursor-pointer p-4 hover:shadow-page transition-shadow" onClick={() => openPaper(paper.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-800 dark:text-ink-100">
                          {paper.examType === 'Custom' ? paper.customExamName : paper.examType}{resolveSubject(paper) ? ` · ${resolveSubject(paper)}` : ''}
                        </p>
                        <p className="text-xs text-ink-400 mt-0.5">{classSectionLabel(paper) ? `Class ${classSectionLabel(paper)} · ` : ''}{formatDate(paper.examDate)}</p>
                      </div>
                      <Badge variant={paper.status === 'draft' ? 'neutral' : 'success'}>{paper.status === 'draft' ? 'Draft' : 'Saved'}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                      <span>{obtainableMarks} / {paper.totalMarks} marks</span>
                      <span>{paper.sections.length} sections</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
