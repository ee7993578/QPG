import {
  LayoutDashboard, FilePlus2, FolderOpen, Settings, CreditCard,
  Library, LayoutTemplate, Users,
} from 'lucide-react'

/**
 * Sections 10/11 — one source of truth for both navigations so the desktop
 * sidebar and the mobile drawer can never drift apart.
 *
 * `labelKey` reads through i18n; `label` is a literal for strings that don't
 * have a dictionary entry yet.
 */
export const TEACHER_NAV = [
  { to: '/dashboard', labelKey: 'nav_dashboard', icon: LayoutDashboard },
  { to: '/exam/new', labelKey: 'nav_createExam', icon: FilePlus2 },
  { to: '/papers', labelKey: 'nav_myPaper', icon: FolderOpen },
  { to: '/question-bank', label: 'Question Bank', icon: Library },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/settings', labelKey: 'nav_settings', icon: Settings },
]

export const SCHOOL_NAV = [
  { to: '/school', labelKey: 'nav_dashboard', icon: LayoutDashboard, end: true },
  { to: '/exam/new', labelKey: 'nav_createExam', icon: FilePlus2 },
  { to: '/school/papers', label: 'Papers', icon: FolderOpen },
  { to: '/school/teachers', label: 'Teachers', icon: Users },
  { to: '/school/question-bank', label: 'Question Bank', icon: Library },
  { to: '/school/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/school/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/school/settings', label: 'School Settings', icon: Settings },
]

export function navFor(accountType) {
  return accountType === 'school' ? SCHOOL_NAV : TEACHER_NAV
}
