import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Check, ArrowRight } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { PricingPlans } from '../../components/marketing/PricingPlans'
import { PublicNav, PublicFooter } from '../../components/marketing/PublicNav'
import { AdSlot } from '../../components/ads/AdSlot'
import { useAuthStore } from '../../store/authStore'
import { useSubscriptionStore } from '../../store/subscriptionStore'

// Sections 27/46 — the public /pricing route. Kept intentionally plain: three
// columns, one line about what is free, and the honest answer to "what happens
// after 3 downloads". Nothing here charges anybody; selecting a plan sends you
// into the app, where the (mock) checkout lives.

const COMPARISON = [
  { feature: 'Create question papers', free: 'Unlimited', teacher: 'Unlimited', school: 'Unlimited' },
  { feature: 'Edit & live A4 preview', free: 'Unlimited', teacher: 'Unlimited', school: 'Unlimited' },
  { feature: 'PDF downloads', free: '3 total', teacher: 'Unlimited', school: 'Unlimited' },
  { feature: 'Word / Doc export', free: '3 total', teacher: 'Unlimited', school: 'Unlimited' },
  { feature: 'Watermark on downloads', free: 'Yes', teacher: 'No', school: 'No' },
  { feature: 'Ads', free: 'Yes', teacher: 'No', school: 'No' },
  { feature: 'Question bank', free: 'Personal', teacher: 'Personal', school: 'Personal + shared' },
  { feature: 'Templates', free: 'All built-in', teacher: 'All built-in', school: 'Built-in + school templates' },
  { feature: 'Teachers on one account', free: '1', teacher: '1', school: 'Unlimited' },
  { feature: 'School branding', free: '—', teacher: '—', school: 'Yes' },
]

const FAQS = [
  {
    q: 'What exactly is limited on the free plan?',
    a: 'Only downloads. Creating papers, editing them and previewing them on the A4 page are unlimited and free forever. You get 3 downloads (PDF or Doc) on the free plan.',
  },
  {
    q: 'What happens to my papers if I never upgrade?',
    a: 'Nothing — they stay in your account and you can keep editing and previewing them. You just cannot download more than 3 until you upgrade.',
  },
  {
    q: 'Teacher Pro or School Pro — which one do I need?',
    a: 'Teacher Pro (₹99/year) is for one teacher working on their own papers. School Pro (₹499/year) is for a school or institute: unlimited teachers on one account, shared templates, a shared question bank and school branding.',
  },
  {
    q: 'Is it a one-time payment or a subscription?',
    a: 'It is billed yearly. Your plan runs for 365 days from the day you upgrade, and the expiry date is shown on your Subscription page.',
  },
  {
    q: 'Do you take payments right now?',
    a: 'The checkout in this build is a demo — no card details are collected and no money moves. Real payments will be handled by the backend payment gateway.',
  },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-medium text-ink-800 dark:text-ink-100">{q}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <p className="border-t border-ink-100 px-5 py-4 text-sm leading-relaxed text-ink-500 dark:border-ink-800 dark:text-ink-400">{a}</p>}
    </Card>
  )
}

function Cell({ value }) {
  if (value === 'Yes') return <Check className="mx-auto h-4 w-4 text-emerald-600" />
  if (value === 'No' || value === '—') return <span className="text-ink-300 dark:text-ink-600">—</span>
  return <span>{value}</span>
}

export default function Pricing() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accountType = useAuthStore((s) => s.accountType)
  const subscriptionActive = useSubscriptionStore((s) => s.subscriptionActive)

  // Signed in already? Send them to the in-app Subscription screen, which is
  // where the actual upgrade lives. Otherwise, into signup.
  const handleSelect = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    navigate(accountType === 'school' ? '/school/subscription' : '/subscription')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-ink-950">
      <PublicNav />

      <section className="mx-auto max-w-6xl px-4 pb-2 pt-14 text-center md:px-6 md:pt-16">
        <Badge variant="neutral" className="mx-auto">Creating papers is always free</Badge>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold text-ink-900 dark:text-ink-50 md:text-4xl">
          Simple pricing. You only pay to download.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-ink-500 dark:text-ink-400 md:text-base">
          Build as many papers as you like on the free plan. Upgrade when you need more than 3 downloads.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <PricingPlans onSelect={handleSelect} ctaLabel={subscriptionActive ? 'View plan' : 'Upgrade'} />
        <p className="mt-6 text-center text-xs text-ink-400">
          Prices in INR, billed yearly. In this build the checkout is a demo — no card details are collected.
        </p>
      </section>

      {/* Comparison table — desktop table, stacked cards on mobile (section 29) */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <h2 className="text-center font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">
          What's in each plan
        </h2>

        <Card className="mt-8 hidden overflow-hidden p-0 md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-left dark:border-ink-800 dark:bg-ink-900">
                <th className="px-5 py-3 font-semibold text-ink-700 dark:text-ink-200">Feature</th>
                <th className="px-5 py-3 text-center font-semibold text-ink-700 dark:text-ink-200">Free</th>
                <th className="px-5 py-3 text-center font-semibold text-ink-700 dark:text-ink-200">Teacher Pro</th>
                <th className="px-5 py-3 text-center font-semibold text-ink-700 dark:text-ink-200">School Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                  <td className="px-5 py-3 text-ink-700 dark:text-ink-200">{row.feature}</td>
                  <td className="px-5 py-3 text-center text-ink-500 dark:text-ink-400"><Cell value={row.free} /></td>
                  <td className="px-5 py-3 text-center text-ink-500 dark:text-ink-400"><Cell value={row.teacher} /></td>
                  <td className="px-5 py-3 text-center text-ink-500 dark:text-ink-400"><Cell value={row.school} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="mt-8 space-y-3 md:hidden">
          {COMPARISON.map((row) => (
            <Card key={row.feature} className="p-4">
              <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{row.feature}</p>
              <dl className="mt-2 space-y-1 text-xs">
                {[['Free', row.free], ['Teacher Pro', row.teacher], ['School Pro', row.school]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <dt className="text-ink-400">{k}</dt>
                    <dd className="text-ink-700 dark:text-ink-200">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14" id="faq">
        <h2 className="text-center font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">Pricing questions</h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>

        {/* Section 28 — public page, so an ad slot is allowed here. */}
        <AdSlot slot="pricing-footer" format="leaderboard" className="mt-10" />
      </section>

      <section className="border-t border-ink-100 bg-ink-50 dark:border-ink-800 dark:bg-ink-900">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center md:px-6">
          <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">
            Start with the free plan
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500 dark:text-ink-400">
            Make a paper, look at the A4 preview, and decide afterwards.
          </p>
          <Button size="lg" className="mt-7" onClick={handleSelect}>
            Create Free Paper <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
