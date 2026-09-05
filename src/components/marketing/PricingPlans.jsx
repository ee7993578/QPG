import React from 'react'
import { Check } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { PLAN } from '../../store/subscriptionStore'
import { plansFor } from '../../data/plans'
import { cn } from '../../lib/utils'

/**
 * Section 27 — the plan grid, shared by the landing page and the public
 * /pricing route. Deliberately dumb: it renders plans and calls `onSelect`.
 * The in-app Subscription screen keeps its own current-plan/upgrade wiring.
 */
export function PricingPlans({ accountType, onSelect, ctaLabel = 'Choose plan', className }) {
  const plans = plansFor(accountType)

  return (
    <div className={cn('grid gap-4', plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3', className)}>
      {plans.map((plan) => {
        const isFree = plan.id === PLAN.FREE
        return (
          <Card
            key={plan.id}
            className={cn('flex flex-col p-6', plan.highlight && 'ring-2 ring-ink-700 dark:ring-gold-400')}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">{plan.name}</p>
              {plan.highlight && <Badge variant="gold">Most popular</Badge>}
            </div>
            <p className="mt-1 text-xs text-ink-400">{plan.tagline}</p>

            <p className="mt-4">
              <span className="font-display text-3xl font-semibold text-ink-900 dark:text-ink-50">{plan.price}</span>
              <span className="text-sm text-ink-400"> {plan.period}</span>
            </p>

            <ul className="mt-5 flex-1 space-y-2">
              {plan.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-200">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> {b}
                </li>
              ))}
            </ul>

            <Button
              className="mt-6 w-full"
              variant={plan.highlight ? 'primary' : 'outline'}
              onClick={() => onSelect?.(plan)}
            >
              {isFree ? 'Start free' : ctaLabel}
            </Button>
          </Card>
        )
      })}
    </div>
  )
}
