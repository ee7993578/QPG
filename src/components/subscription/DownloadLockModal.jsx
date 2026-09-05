import React from 'react'
import { Check, Lock } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../store/authStore'
import { useSubscriptionStore, PLAN } from '../../store/subscriptionStore'
import { subscriptionApi } from '../../services/subscriptionApi'

const COPY = {
  teacher: {
    title: 'Download Locked',
    message: "You've used your 3 free downloads.",
    pitch: 'Create unlimited papers and download them anytime with Teacher Pro.',
    price: '₹99 / year',
    cta: 'Upgrade for ₹99',
    benefits: ['Unlimited downloads', 'No watermark', 'No ads', 'Premium features'],
    plan: PLAN.TEACHER_PRO,
  },
  school: {
    title: 'Unlock School Pro',
    message: 'Your 3 free downloads are complete.',
    pitch: '',
    price: '₹499 / year',
    cta: 'Upgrade School — ₹499/year',
    benefits: ['Unlimited teachers', 'Unlimited papers', 'Unlimited downloads', 'School branding', 'Shared templates', 'Shared question bank'],
    plan: PLAN.SCHOOL_PRO,
  },
}

export function DownloadLockModal() {
  const accountType = useAuthStore((s) => s.accountType) || 'teacher'
  const open = useSubscriptionStore((s) => s.downloadLockOpen)
  const closeDownloadLock = useSubscriptionStore((s) => s.closeDownloadLock)

  const copy = COPY[accountType] || COPY.teacher

  return (
    <Dialog
      open={open}
      onClose={closeDownloadLock}
      title={
        <span className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-gold-500" /> {copy.title}
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={closeDownloadLock}>Maybe Later</Button>
          <Button onClick={() => subscriptionApi.createOrder(copy.plan)}>{copy.cta}</Button>
        </>
      }
    >
      <p className="mb-1">{copy.message}</p>
      {copy.pitch && <p className="mb-4 text-ink-500 dark:text-ink-400">{copy.pitch}</p>}
      <p className="mb-3 font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">{copy.price}</p>
      <ul className="space-y-1.5">
        {copy.benefits.map((b) => (
          <li key={b} className="flex items-center gap-2 text-ink-700 dark:text-ink-200">
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> {b}
          </li>
        ))}
      </ul>
    </Dialog>
  )
}
