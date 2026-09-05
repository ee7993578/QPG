import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Menu, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../store/authStore'

/**
 * Shared chrome for the public (unauthenticated) pages — landing and pricing.
 * `anchors` are same-page hash links; pass an empty array on pages that have
 * no sections to jump to.
 */
export function PublicNav({ anchors = [] }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accountType = useAuthStore((s) => s.accountType)

  // Section 46 — a signed-in visitor landing on a public page should be able to
  // get back into their own workspace instead of being sent to /login again.
  const appHome = accountType === 'school' ? '/school' : '/dashboard'

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-700 text-gold-300 dark:bg-gold-400 dark:text-ink-950">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">PaperCraft</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {anchors.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-gold-300"
            >
              {label}
            </a>
          ))}
          <Link to="/pricing" className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-gold-300">
            Pricing
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Button onClick={() => navigate(appHome)}>Go to dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
              <Button onClick={() => navigate('/login')}>Create Free Paper</Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="rounded-md p-1.5 text-ink-700 dark:text-ink-200 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 px-4 py-3 dark:border-ink-800 md:hidden">
          <div className="space-y-1">
            {anchors.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                {label}
              </a>
            ))}
            <Link
              to="/pricing"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              Pricing
            </Link>
          </div>
          <Button className="mt-2 w-full" onClick={() => { setOpen(false); navigate(isAuthenticated ? appHome : '/login') }}>
            {isAuthenticated ? 'Go to dashboard' : 'Create Free Paper'}
          </Button>
        </div>
      )}
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-ink-100 dark:border-ink-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-ink-400 md:flex-row md:px-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <span>PaperCraft — Question papers, done in minutes.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-ink-700 dark:hover:text-ink-200">Home</Link>
          <Link to="/pricing" className="hover:text-ink-700 dark:hover:text-ink-200">Pricing</Link>
          <Link to="/login" className="hover:text-ink-700 dark:hover:text-ink-200">Log in</Link>
        </div>
      </div>
    </footer>
  )
}
