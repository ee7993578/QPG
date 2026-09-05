import React, { useEffect, useState } from 'react'
import { Library, Users, Lock } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ListSkeleton } from '../components/ui/States'
import { QuestionBankBrowser } from '../components/bank/QuestionBankBrowser'
import { useAuthStore } from '../store/authStore'
import { useSubscriptionStore, PLAN } from '../store/subscriptionStore'
import { useQuestionBankStore } from '../store/questionBankStore'
import { cn } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

/**
 * Section 24 — the teacher's Question Bank.
 *
 * "My Questions" is always available. "School Questions" is the shared bank;
 * a teacher can only browse it (and copy from it) when the school is on
 * School Pro, which is the one place the plan changes what's visible rather
 * than just what's downloadable.
 */
export default function QuestionBank() {
  const navigate = useNavigate()
  const teacher = useAuthStore((s) => s.teacher)
  const planType = useSubscriptionStore((s) => s.planType)
  const subscriptionActive = useSubscriptionStore((s) => s.subscriptionActive)
  const schoolQuestions = useQuestionBankStore((s) => s.schoolQuestions)

  const hasSchoolPlan = subscriptionActive && planType === PLAN.SCHOOL_PRO
  const [tab, setTab] = useState('mine')
  const [loading, setLoading] = useState(true)

  // Stands in for questionBankApi.list() once the backend exists (section 32).
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 320)
    return () => clearTimeout(timer)
  }, [])

  const tabs = [
    { key: 'mine', label: 'My Questions', icon: Library },
    { key: 'school', label: 'School Questions', icon: hasSchoolPlan ? Users : Lock },
  ]

  return (
    <AppShell
      title="Question Bank"
      subtitle="Save questions once, reuse them in any paper"
      mobileTitle="Question Bank"
    >
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-900">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                tab === key
                  ? 'bg-white text-ink-900 shadow-card dark:bg-ink-800 dark:text-ink-50'
                  : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <ListSkeleton rows={4} />
        ) : tab === 'mine' ? (
          <QuestionBankBrowser
            scope="mine"
            author={teacher?.name || ''}
            emptyMessage="Add questions once and reuse them in any paper — filtered by class, chapter and difficulty."
          />
        ) : hasSchoolPlan ? (
          <>
            <Card className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                {schoolQuestions.length} questions shared by teachers at your school. Copy any of them into your own bank.
              </p>
            </Card>
            <QuestionBankBrowser scope="school" readOnly allowCopy />
          </>
        ) : (
          <Card className="flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-50 text-ink-400 dark:bg-ink-800 dark:text-ink-300">
              <Lock className="h-6 w-6" />
            </span>
            <p className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">
              Shared question bank is part of School Pro
            </p>
            <p className="mt-1.5 max-w-sm text-sm text-ink-400">
              On School Pro, every teacher at your school contributes to one shared bank — and you can copy from it into
              your own. Your personal bank stays free and unlimited either way.
            </p>
            <Button className="mt-5" onClick={() => navigate('/subscription')}>See plans</Button>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
