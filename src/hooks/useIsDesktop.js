import { useEffect, useState } from 'react'

// Matches Tailwind's default `md` breakpoint (768px) — keep in sync with
// tailwind.config.js if that ever defines a custom `screens.md`.
const QUERY = '(min-width: 768px)'

/**
 * Real, JS-level knowledge of whether we're on the desktop (md+) layout —
 * not just a CSS `hidden md:block` class. Some parts of the app (the
 * Paper Builder's Edit/Preview workspace) need to actually mount only one
 * panel at a time on mobile, rather than mounting both and hiding one with
 * CSS, because a CSS-hidden panel is still a live, mounted component that
 * can react to global state (e.g. the "jump to this question" signal)
 * before the panel the teacher can actually see does.
 */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window === 'undefined' ? true : window.matchMedia(QUERY).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = (e) => setIsDesktop(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}
