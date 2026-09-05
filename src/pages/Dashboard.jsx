import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FilePlus2, FileText, FileClock, CalendarDays, ArrowRight, PartyPopper,
  Download, BadgeCheck, Library, LayoutTemplate,
} from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import { StatsSkeleton, GridSkeleton } from '../components/ui/States'
import { AdSlot } from '../components/ads/AdSlot'
import { DownloadUsageCard } from '../components/subscription/DownloadUsageCard'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/authStore'
import { useSubscriptionStore } from '../store/subscriptionStore'
import { paperApi } from '../services/paperApi'
import { PLANS } from '../data/plans'
import { computePaperMarks, formatDate, classSectionLabel, resolveSubject } from '../lib/utils'

export default function Dashboard() {
  const navigate = useNavigate()
  const teacher = useAuthStore((s) => s.teacher)
  const justRegistered = useAuthStore((s) => s.justRegistered)
  const acknowledgeWelcome = useAuthStore((s) => s.acknowledgeWelcome)
  const papers = useAppStore((s) => s.papers)
  const setActivePaper = useAppStore((s) => s.setActivePaper)
  const planType = useSubscriptionStore((s) => s.planType)
  const subscriptionActive = useSubscriptionStore((s) => s.subscriptionActive)
  const freeDownloadsUsed = useSubscriptionStore((s) => s.freeDownloadsUsed)
  const freeDownloadsLimit = useSubscriptionStore((s) => s.freeDownloadsLimit)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    paperApi.getPapers().then(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const monthly = papers.filter((p) => {
      const d = new Date(p.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    const drafts = papers.filter((p) => p.status === 'draft').length
    return { total: papers.length, monthly, drafts }
  }, [papers])

  const planName = PLANS.find((p) => p.id === planType)?.name || 'Free'
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

  const quickActions = [
    { label: 'Create Paper', hint: 'Start a new question paper', icon: FilePlus2, to: '/exam/new' },
    { label: 'My Papers', hint: 'Open, edit or download', icon: FileText, to: '/papers' },
    { label: 'Question Bank', hint: 'Reuse your saved questions', icon: Library, to: '/question-bank' },
    { label: 'Templates', hint: 'Change the paper layout', icon: LayoutTemplate, to: '/templates' },
  ]

  return (
    <AppShell title="Dashboard" subtitle="Overview of your exam papers" mobileTitle="Dashboard"
      right={<Button onClick={() => navigate('/exam/new')}><FilePlus2 className="h-4 w-4" /> Create New Paper</Button>}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {justRegistered && (
          <Card className="flex items-start gap-3 border-gold-300 p-5">
            <PartyPopper className="mt-0.5 h-5 w-5 text-gold-500" />
            <div className="flex-1">
              <p className="font-display font-semibold text-ink-900 dark:text-ink-50">Welcome to PaperCraft 🎉</p>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">3 free PDF downloads available.</p>
              <Button size="sm" className="mt-3" onClick={() => { acknowledgeWelcome(); navigate('/exam/new') }}>
                Create Your First Paper
              </Button>
            </div>
          </Card>
        )}

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

        {loading ? (
          <StatsSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <StatCard icon={FileText} label="Total Papers" value={stats.total} />
            <StatCard icon={CalendarDays} label="This Month" value={stats.monthly} />
            <StatCard icon={FileClock} label="Drafts" value={stats.drafts} />
            <StatCard
              icon={subscriptionActive ? BadgeCheck : Download}
              label={subscriptionActive ? 'Current Plan' : 'Free Downloads'}
              value={subscriptionActive ? planName : `${freeDownloadsUsed}/${freeDownloadsLimit}`}
              hint={subscriptionActive ? 'Unlimited downloads' : 'used so far'}
            />
          </div>
        )}

        <DownloadUsageCard />

        <div>
          <h3 className="mb-3 font-display text-base font-semibold text-ink-900 dark:text-ink-50">Quick actions</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {quickActions.map(({ label, hint, icon: Icon, to }) => (
              <Card
                key={to}
                role="button"
                tabIndex={0}
                onClick={() => navigate(to)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(to) } }}
                className="cursor-pointer p-4 transition-shadow hover:shadow-page"
              >
                <Icon className="h-5 w-5 text-ink-600 dark:text-gold-300" />
                <p className="mt-2.5 text-sm font-semibold text-ink-800 dark:text-ink-100">{label}</p>
                <p className="mt-0.5 text-xs text-ink-400">{hint}</p>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">Recent Papers</h3>
            <button onClick={() => navigate('/papers')} className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800 dark:hover:text-gold-300">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <GridSkeleton items={4} />
          ) : recent.length === 0 ? (
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

        {/* Section 28 — ads are allowed on the dashboard, never in the editor,
            preview, payment or download surfaces. */}
        <AdSlot slot="teacher-dashboard" format="banner" />
      </div>
    </AppShell>
  )
}
