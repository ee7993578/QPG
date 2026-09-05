import { PLAN } from '../store/subscriptionStore'

/**
 * Sections 3/4/27 — the single description of the three plans, shared by the
 * public pricing page, the landing page and the in-app Subscription screen so
 * the numbers can't drift between them.
 *
 * Rule that must survive every edit: paper creation, editing and preview are
 * unlimited on every plan. The paid plans only remove the download limit
 * (plus watermark/ads). Never gate creation.
 */
export const PLANS = [
  {
    id: PLAN.FREE,
    name: 'Free',
    price: '₹0',
    period: 'forever',
    tagline: 'Try it properly before paying',
    benefits: [
      'Unlimited paper creation',
      'Unlimited editing & preview',
      '3 free PDF downloads',
      'All question types & templates',
      'PaperCraft watermark on downloads',
    ],
    forType: 'both',
  },
  {
    id: PLAN.TEACHER_PRO,
    name: 'Teacher Pro',
    price: '₹99',
    period: '/ year',
    tagline: 'For individual teachers',
    highlight: true,
    benefits: [
      'Unlimited PDF downloads',
      'Unlimited paper creation',
      'No watermark',
      'No ads',
      'Personal question bank',
      'Premium templates & features',
    ],
    forType: 'teacher',
  },
  {
    id: PLAN.SCHOOL_PRO,
    name: 'School Pro',
    price: '₹499',
    period: '/ year',
    tagline: 'For schools & institutes',
    benefits: [
      'Unlimited teachers / users',
      'Unlimited papers & downloads',
      'School branding on every paper',
      'Shared templates',
      'Shared question bank',
      'Teacher management',
    ],
    forType: 'school',
  },
]

export function plansFor(accountType) {
  if (!accountType) return PLANS
  return PLANS.filter((p) => p.forType === 'both' || p.forType === accountType)
}
