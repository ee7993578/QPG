import React from 'react'
import { Card } from './Card'
import { cn } from '../../lib/utils'

/**
 * The dashboard stat tile, shared by the teacher and school dashboards
 * (section 45 — one component instead of two near-identical copies).
 * `hint` is the optional small line under the label, e.g. "1 of 3 used".
 */
export function StatCard({ icon: Icon, label, value, hint, className }) {
  return (
    <Card className={cn('flex items-center gap-4 px-5 py-4', className)}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-600 dark:bg-ink-800 dark:text-gold-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">{value}</p>
        <p className="truncate text-xs text-ink-400">{label}</p>
        {hint && <p className="truncate text-[11px] text-ink-400">{hint}</p>}
      </div>
    </Card>
  )
}
