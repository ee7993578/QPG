import React from 'react'
import { Check, Sparkles, Building2 } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useAuthStore } from '../store/authStore'
import { useSubscriptionStore, PLAN } from '../store/subscriptionStore'
import { subscriptionApi } from '../services/subscriptionApi'
import { plansFor } from '../data/plans'
import { formatDate } from '../lib/utils'

const PLAN_LABEL = { [PLAN.FREE]: 'Free', [PLAN.TEACHER_PRO]: 'Teacher Pro', [PLAN.SCHOOL_PRO]: 'School Pro' }

export default function Subscription() {
  const accountType = useAuthStore((s) => s.accountType) || 'teacher'
  const teacher = useAuthStore((s) => s.teacher)
  const planType = useSubscriptionStore((s) => s.planType)
  const subscriptionActive = useSubscriptionStore((s) => s.subscriptionActive)
  const subscriptionExpiry = useSubscriptionStore((s) => s.subscriptionExpiry)
  const freeDownloadsUsed = useSubscriptionStore((s) => s.freeDownloadsUsed)
  const freeDownloadsLimit = useSubscriptionStore((s) => s.freeDownloadsLimit)
  const managedBySchool = useSubscriptionStore((s) => s.managedBySchool)

  // A teacher added by a School Admin (see authStore.mapUserToProfile —
  // `schoolId` is only set for that case) has no plan of their own: the
  // backend's GET /api/subscription already returns the SCHOOL's plan for
  // them (read-only, `managedBySchool: true`), so here we just render it
  // without any pricing grid or upgrade button. Fall back to the schoolId
  // check before that first fetch has resolved. Only the admin
  // (accountType 'school') can upgrade.
  const isSchoolLinkedTeacher = accountType === 'teacher' && (managedBySchool || !!teacher?.schoolId)

  if (isSchoolLinkedTeacher) {
    return (
      <AppShell title="Subscription" subtitle="Your plan, managed by your school" mobileTitle="Subscription">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="flex flex-col gap-3 p-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gold-500" />
              <p className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">
                {PLAN_LABEL[planType] || 'Free'} <span className="text-sm font-normal text-ink-400">(your school's plan)</span>
              </p>
              {subscriptionActive && <Badge variant="success">Active</Badge>}
            </div>
            {subscriptionActive ? (
              <p className="text-sm text-ink-500 dark:text-ink-400">Renews {formatDate(subscriptionExpiry)}</p>
            ) : (
              <p className="text-sm text-ink-500 dark:text-ink-400">{freeDownloadsUsed}/{freeDownloadsLimit} free downloads used across your school</p>
            )}
            <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2.5 text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-400">
              This paper's account is linked to your school, so it shares your school's subscription. Only your
              school admin can upgrade or change this plan.
            </p>
          </Card>
        </div>
      </AppShell>
    )
  }

  // Plans come from data/plans.js so this page, the landing page and the public
  // /pricing page can never quote different numbers (section 45).
  const relevantPlans = plansFor(accountType)

  return (
    <AppShell title="Subscription" subtitle="Choose the plan that fits how you use PaperCraft" mobileTitle="Subscription">
      <div className="mx-auto max-w-4xl space-y-6">
        {subscriptionActive && (
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-500" />
              <p className="text-sm">
                You're on <strong>{planType === PLAN.SCHOOL_PRO ? 'School Pro' : 'Teacher Pro'}</strong> · renews {formatDate(subscriptionExpiry)}
              </p>
            </div>
          </Card>
        )}

        <div className={`grid grid-cols-1 gap-4 ${relevantPlans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {relevantPlans.map((plan) => {
            const isCurrent = subscriptionActive ? planType === plan.id : plan.id === PLAN.FREE
            const isPaid = plan.id !== PLAN.FREE
            return (
              <Card key={plan.id} className={`flex flex-col p-6 ${isCurrent ? 'ring-2 ring-ink-700 dark:ring-gold-400' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">{plan.name}</p>
                  {isCurrent && <Badge variant="success">Current</Badge>}
                </div>
                <p className="mt-1 text-xs text-ink-400">{plan.tagline}</p>
                <p className="mt-4">
                  <span className="font-display text-3xl font-semibold text-ink-900 dark:text-ink-50">{plan.price}</span>
                  <span className="text-sm text-ink-400"> {plan.period}</span>
                </p>
                {plan.id === PLAN.FREE && (
                  <p className="mt-1 text-xs text-ink-400">{freeDownloadsUsed}/{freeDownloadsLimit} downloads used</p>
                )}
                <ul className="mt-5 flex-1 space-y-2">
                  {plan.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-200">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> {b}
                    </li>
                  ))}
                </ul>
                {isPaid && !isCurrent && (
                  <Button className="mt-6 w-full" onClick={() => subscriptionApi.createOrder(plan.id)}>
                    Upgrade — {plan.price}{plan.period}
                  </Button>
                )}
                {isPaid && isCurrent && (
                  <Button className="mt-6 w-full" variant="outline" disabled>Active Plan</Button>
                )}
              </Card>
            )
          })}
        </div>

        <p className="text-center text-xs text-ink-400">
          Paper creation, editing and preview are always free and unlimited — you only pay when you download.
        </p>
      </div>
    </AppShell>
  )
}
