import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FilePlus2, FileText, Users, Download, CreditCard, ArrowRight,
  PartyPopper, UserPlus, Library, LayoutTemplate,
} from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import { StatsSkeleton } from '../components/ui/States'
import { DownloadUsageCard } from '../components/subscription/DownloadUsageCard'
import { AdSlot } from '../components/ads/AdSlot'
import { useAuthStore } from '../store/authStore'
import { useAppStore } from '../store/useAppStore'
import { useSchoolStore } from '../store/schoolStore'
import { useSubscriptionStore, PLAN } from '../store/subscriptionStore'
import { computePaperMarks, formatDate, classSectionLabel, resolveSubject } from '../lib/utils'

/**
 * Sections 9/11/22 — the School admin dashboard.
 *
 * Same shell as the teacher dashboard (AppShell + school nav) so a school
 * admin gets sidebar, mobile drawer and bottom nav instead of the bespoke
 * header this page used to carry.
 */
export default function SchoolHome() {
  const navigate = useNavigate()
  const school = useAuthStore((s) => s.school)
  const justRegistered = useAuthStore((s) => s.justRegistered)
  const acknowledgeWelcome = useAuthStore((s) => s.acknowledgeWelcome)
  const papers = useAppStore((s) => s.papers)
  const setActivePaper = useAppStore((s) => s.setActivePaper)
  const teachers = useSchoolStore((s) => s.teachers)
  const planType = useSubscriptionStore((s) => s.planType)
  const subscriptionActive = useSubscriptionStore((s) => s.subscriptionActive)
  const freeDownloadsUsed = useSubscriptionStore((s) => s.freeDownloadsUsed)
  const freeDownloadsLimit = useSubscriptionStore((s) => s.freeDownloadsLimit)

  const [loading, setLoading] = useState(true)

  // Stands in for schoolApi.getTeachers() + paperApi.getPapers() (section 32).
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 320)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const staffPapers = teachers.reduce((sum, t) => sum + (t.papers || 0), 0)
    return {
      teachers: teachers.length,
      activeTeachers: teachers.filter((t) => t.status === 'active').length,
      papers: staffPapers + papers.length,
    }
  }, [teachers, papers])

  const planLabel = subscriptionActive
    ? (planType === PLAN.SCHOOL_PRO ? 'School Pro' : 'Teacher Pro')
    : 'Free'

  const recent = [...papers].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4)

  const openPaper = (id) => {
    setActivePaper(id)
    navigate(`/paper/${id}?view=edit`)
  }

  const quickActions = [
    { label: 'Create Paper', icon: FilePlus2, to: '/exam/new' },
    { label: 'Add Teacher', icon: UserPlus, to: '/school/teachers' },
    { label: 'Question Bank', icon: Library, to: '/school/question-bank' },
    { label: 'Templates', icon: LayoutTemplate, to: '/school/templates' },
  ]

  return (
    <AppShell
      title={school?.schoolName || 'School Dashboard'}
      subtitle="Overview of your school's papers and teachers"
      mobileTitle={school?.schoolName || 'School'}
      right={<Button onClick={() => navigate('/exam/new')}><FilePlus2 className="h-4 w-4" /> Create New Paper</Button>}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {justRegistered && (
          <Card className="flex items-start gap-3 border-gold-300 p-5">
            <PartyPopper className="mt-0.5 h-5 w-5 text-gold-500" />
            <div className="flex-1">
              <p className="font-display font-semibold text-ink-900 dark:text-ink-50">
                Welcome to PaperCraft, {school?.schoolName} 🎉
              </p>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                You have 3 free PDF downloads. Add your teachers whenever you're ready.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { acknowledgeWelcome(); navigate('/exam/new') }}>
                  Create First Paper
                </Button>
                <Button size="sm" variant="outline" onClick={() => { acknowledgeWelcome(); navigate('/school/teachers') }}>
                  Add Teachers
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="md:hidden">
          <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">
            {school?.schoolName || 'Your School'}
          </h2>
          <p className="text-sm text-ink-400">{school?.adminName ? `Signed in as ${school.adminName}` : 'School workspace'}</p>
        </div>

        <Button onClick={() => navigate('/exam/new')} size="lg" className="w-full md:hidden">
          <FilePlus2 className="h-4 w-4" /> Create New Paper
        </Button>

        {loading ? (
          <StatsSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Teachers"
              value={stats.teachers}
              hint={`${stats.activeTeachers} active`}
            />
            <StatCard icon={FileText} label="Total Papers" value={stats.papers} hint="Across the school" />
            <StatCard
              icon={Download}
              label="Downloads"
              value={subscriptionActive ? 'Unlimited' : `${freeDownloadsUsed}/${freeDownloadsLimit}`}
              hint={subscriptionActive ? 'No limit on your plan' : 'Free downloads used'}
            />
            <StatCard icon={CreditCard} label="Current Plan" value={planLabel} hint={subscriptionActive ? 'Active' : 'Upgrade for ₹499/year'} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickActions.map(({ label, icon: Icon, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="flex flex-col items-start gap-2.5 rounded-xl2 border border-ink-100 bg-white px-4 py-4 text-left shadow-card transition-shadow hover:shadow-page dark:border-ink-800 dark:bg-ink-900"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600 dark:bg-ink-800 dark:text-gold-300">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-ink-800 dark:text-ink-100">{label}</span>
            </button>
          ))}
        </div>

        <DownloadUsageCard />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">Recent Papers</h3>
            <button
              onClick={() => navigate('/school/papers')}
              className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800 dark:hover:text-gold-300"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recent.length === 0 ? (
            <Card className="p-8 text-center text-sm text-ink-400">
              No papers yet. Create the first one, or invite your teachers to start.
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recent.map((paper) => {
                const { obtainableMarks } = computePaperMarks(paper)
                return (
                  <Card
                    key={paper.id}
                    className="cursor-pointer p-4 transition-shadow hover:shadow-page"
                    onClick={() => openPaper(paper.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-800 dark:text-ink-100">
                          {paper.examType === 'Custom' ? paper.customExamName : paper.examType}
                          {resolveSubject(paper) ? ` · ${resolveSubject(paper)}` : ''}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-400">
                          {classSectionLabel(paper) ? `Class ${classSectionLabel(paper)} · ` : ''}{formatDate(paper.examDate)}
                        </p>
                      </div>
                      <Badge variant={paper.status === 'draft' ? 'neutral' : 'success'}>
                        {paper.status === 'draft' ? 'Draft' : 'Saved'}
                      </Badge>
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

        {/* Section 28 — dashboards may carry ads; hidden automatically for paid plans. */}
        <AdSlot slot="school-dashboard" format="banner" />
      </div>
    </AppShell>
  )
}
