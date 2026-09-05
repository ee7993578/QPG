import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../store/authStore'
import { useSubscriptionStore, PLAN_PRICE, PLAN } from '../../store/subscriptionStore'

export function DownloadUsageCard() {
  const navigate = useNavigate()
  const accountType = useAuthStore((s) => s.accountType) || 'teacher'
  const subscriptionActive = useSubscriptionStore((s) => s.subscriptionActive)
  const freeDownloadsUsed = useSubscriptionStore((s) => s.freeDownloadsUsed)
  const freeDownloadsLimit = useSubscriptionStore((s) => s.freeDownloadsLimit)
  const planType = useSubscriptionStore((s) => s.planType)

  const remaining = Math.max(0, freeDownloadsLimit - freeDownloadsUsed)
  const pct = Math.min(100, Math.round((freeDownloadsUsed / freeDownloadsLimit) * 100))
  const price = accountType === 'school' ? PLAN_PRICE[PLAN.SCHOOL_PRO] : PLAN_PRICE[PLAN.TEACHER_PRO]
  const subscribeRoute = accountType === 'school' ? '/school/subscription' : '/subscription'

  if (subscriptionActive) {
    return (
      <Card className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-400">Current Plan</p>
          <p className="mt-0.5 font-display font-semibold text-ink-900 dark:text-ink-50">
            {planType === PLAN.SCHOOL_PRO ? 'School Pro' : 'Teacher Pro'} · Unlimited downloads
          </p>
        </div>
        <Sparkles className="h-5 w-5 text-gold-500" />
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-ink-400">Free Downloads</p>
        <p className="text-xs font-medium text-ink-500 dark:text-ink-300">{freeDownloadsUsed} / {freeDownloadsLimit} used</p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className="h-full rounded-full bg-ink-700 transition-all dark:bg-gold-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-400">
        {remaining > 0
          ? `${remaining} free download${remaining === 1 ? '' : 's'} remaining`
          : 'Free downloads completed'}
      </p>
      <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => navigate(subscribeRoute)}>
        Upgrade for {price.label}
      </Button>
    </Card>
  )
}
