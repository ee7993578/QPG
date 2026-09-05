import React from 'react'
import { cn } from '../../lib/utils'
import { useSubscriptionStore } from '../../store/subscriptionStore'

/**
 * Section 28 — AdSense placeholder.
 *
 * Ads are secondary monetization, so this exists purely so that pages can
 * declare "an ad belongs here" today and a real AdSense unit can be dropped
 * in later without touching a single page component.
 *
 * Two rules are enforced here rather than at every call site:
 *   1. Paid users never see ads — an active subscription renders nothing.
 *   2. Never place this inside the paper editor, live A4 preview, PDF
 *      preview, payment page or download modal. That's a placement rule the
 *      component can't enforce for you; those surfaces simply don't use it.
 *
 * To go live: replace the placeholder markup with the AdSense <ins> tag and
 * push to `window.adsbygoogle`. `slot` maps to the AdSense data-ad-slot id.
 */
const FORMATS = {
  banner: 'h-[90px]',
  leaderboard: 'h-[90px] md:h-[100px]',
  rectangle: 'h-[250px]',
}

export function AdSlot({ slot = 'placeholder', format = 'banner', className, label = 'Advertisement' }) {
  const subscriptionActive = useSubscriptionStore((s) => s.subscriptionActive)

  // Rule 1 — no ads for paying users.
  if (subscriptionActive) return null

  return (
    <div
      data-ad-slot={slot}
      aria-label={label}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50/60 text-center dark:border-ink-700 dark:bg-ink-900/40',
        FORMATS[format] || FORMATS.banner,
        className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-300 dark:text-ink-600">{label}</p>
      <p className="mt-1 text-xs text-ink-400">Ad space — hidden on Pro plans</p>
    </div>
  )
}
