import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Card } from './Card'
import { Button } from './Button'

/**
 * Sections 31/32/33 — the three states every API-ready page needs, in one
 * place so they look identical everywhere.
 */

/** Section 31 — empty state with an icon, a line of copy and one clear CTA. */
export function EmptyState({ icon: Icon, title, message, actionLabel, onAction, className }) {
  return (
    <Card className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-50 text-ink-400 dark:bg-ink-800 dark:text-ink-300">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <p className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">{title}</p>
      {message && <p className="mt-1.5 max-w-sm text-sm text-ink-400">{message}</p>}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>
      )}
    </Card>
  )
}

/** Section 33 — reusable error card with an optional retry. */
export function ErrorState({ title = 'Something went wrong', message, onRetry, className }) {
  return (
    <Card className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-pen-red dark:bg-red-900/20">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">{title}</p>
      {message && <p className="mt-1.5 max-w-sm text-sm text-ink-400">{message}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RotateCcw className="h-3.5 w-3.5" /> Try Again
        </Button>
      )}
    </Card>
  )
}

/** Section 32 — a single shimmering block, the building material below. */
export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded bg-ink-100 dark:bg-ink-800', className)} />
}

/** Stat-tile row placeholder (dashboards). */
export function StatsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        </Card>
      ))}
    </div>
  )
}

/** Stacked list/card placeholder (papers, question bank, teachers). */
export function ListSkeleton({ rows = 4, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="flex items-center justify-between gap-4 p-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
        </Card>
      ))}
    </div>
  )
}

/** Card-grid placeholder (templates). */
export function GridSkeleton({ items = 4, className }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <Card key={i} className="space-y-3 p-5">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </Card>
      ))}
    </div>
  )
}
