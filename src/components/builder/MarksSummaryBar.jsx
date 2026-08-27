import React from 'react'
import { Check, Loader2, AlertTriangle, CircleCheck } from 'lucide-react'
import { cn } from '../../lib/utils'

export function MarksSummaryBar({ obtainableMarks, totalMarks, saveStatus }) {
  const diff = (totalMarks || 0) - obtainableMarks
  let status = 'ok'
  if (diff > 0) status = 'under'
  else if (diff < 0) status = 'over'

  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-ink-100 bg-white/95 px-4 py-2.5 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95">
      <div className="flex items-center gap-1.5 text-xs text-ink-400">
        {saveStatus === 'saving' ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
        ) : (
          <><Check className="h-3.5 w-3.5 text-emerald-500" /> Auto Saved</>
        )}
      </div>
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold font-mono',
          status === 'ok' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
          status === 'under' && 'bg-gold-50 text-gold-700 dark:bg-gold-900/20 dark:text-gold-300',
          status === 'over' && 'bg-red-50 text-pen-red dark:bg-red-900/20'
        )}
      >
        {status === 'ok' && <CircleCheck className="h-3.5 w-3.5" />}
        {status === 'under' && <AlertTriangle className="h-3.5 w-3.5" />}
        {status === 'over' && <AlertTriangle className="h-3.5 w-3.5" />}
        {obtainableMarks} / {totalMarks || 0} Marks
        {status === 'under' && ` · ${diff} remaining`}
        {status === 'over' && ` · ${Math.abs(diff)} over limit`}
      </div>
    </div>
  )
}
