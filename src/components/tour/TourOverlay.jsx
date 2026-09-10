import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTourStore } from '../../store/tourStore'
import { useTranslate } from '../../i18n'
import { TOURS } from './tourSteps'

const PAD = 8 // gap between the spotlight ring and the highlighted element
const GAP = 14 // gap between the spotlight ring and the tooltip card
const isMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

// Finds the first *visible* element matching the selector. A step's target
// can legitimately exist twice in the DOM (once in the desktop layout, once
// in the mobile one) — Tailwind's responsive `hidden`/`md:flex` classes mean
// only one of them actually has a real box at any given screen size.
function findVisibleTarget(selector) {
  const candidates = document.querySelectorAll(selector)
  for (const el of candidates) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return el
  }
  return null
}

export function TourOverlay() {
  const activeTour = useTourStore((s) => s.activeTour)
  const stepIndex = useTourStore((s) => s.stepIndex)
  const skip = useTourStore((s) => s.skip)
  const next = useTourStore((s) => s.next)
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const t = useTranslate()

  const steps = activeTour ? TOURS[activeTour] : null
  const step = steps ? steps[stepIndex] : null

  const [rect, setRect] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const tooltipRef = useRef(null)
  const [tooltipSize, setTooltipSize] = useState({ w: 300, h: 140 })
  const rafRef = useRef(null)
  const attemptsRef = useRef(0)

  // Reset per-step bookkeeping whenever the step (or the tour) changes.
  useEffect(() => {
    attemptsRef.current = 0
    setNotFound(false)
    setRect(null)
  }, [activeTour, stepIndex])

  // On the Paper Builder, small screens only mount one panel at a time
  // (Edit or Preview). If this step needs the other one, switch the view
  // for the teacher before hunting for the element.
  useEffect(() => {
    if (!step) return
    if (!step.requiresView) return
    if (!location.pathname.startsWith('/paper/')) return
    if (!isMobileViewport()) return
    const currentView = searchParams.get('view') === 'preview' ? 'preview' : 'edit'
    if (currentView !== step.requiresView) {
      const next = new URLSearchParams(searchParams)
      next.set('view', step.requiresView)
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, location.pathname])

  // Poll (via rAF) for the target element to exist and be visible — it may
  // take a render tick after a view switch above, or after the page it's on
  // finishes loading data.
  useEffect(() => {
    if (!step) return
    let cancelled = false

    const tryFind = () => {
      if (cancelled) return
      const el = findVisibleTarget(step.target)
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        // One extra frame so the smooth-scroll has a chance to settle
        // before we measure its final position.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return
            const r = el.getBoundingClientRect()
            setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          })
        })
        return
      }
      attemptsRef.current += 1
      if (attemptsRef.current > 40) {
        // ~0.6s of trying — give up gracefully (auto-skip to the next
        // step) rather than freezing the tour on a target that never
        // showed up (e.g. a desktop-only button on a small screen).
        setNotFound(true)
        return
      }
      rafRef.current = requestAnimationFrame(tryFind)
    }
    tryFind()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [step])

  // Keep the spotlight glued to the target on scroll/resize.
  useEffect(() => {
    if (!step || !rect) return
    const onUpdate = () => {
      const el = findVisibleTarget(step.target)
      if (!el) return
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    window.addEventListener('resize', onUpdate)
    window.addEventListener('scroll', onUpdate, true)
    return () => {
      window.removeEventListener('resize', onUpdate)
      window.removeEventListener('scroll', onUpdate, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, !!rect])

  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const { offsetWidth, offsetHeight } = tooltipRef.current
      if (offsetWidth && offsetHeight && (offsetWidth !== tooltipSize.w || offsetHeight !== tooltipSize.h)) {
        setTooltipSize({ w: offsetWidth, h: offsetHeight })
      }
    }
  })

  // Skip this one un-findable step instead of getting stuck forever.
  useEffect(() => {
    if (notFound) next(steps.length)
  }, [notFound]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeTour || !step || !rect) return null

  const spotlightBox = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const tw = Math.min(tooltipSize.w || 300, vw - 24)
  const th = tooltipSize.h || 140

  let placement = step.placement === 'top' ? 'top' : 'bottom'
  const spaceBelow = vh - spotlightBox.top - spotlightBox.height
  const spaceAbove = spotlightBox.top
  if (placement === 'bottom' && spaceBelow < th + GAP && spaceAbove > spaceBelow) placement = 'top'
  if (placement === 'top' && spaceAbove < th + GAP && spaceBelow > spaceAbove) placement = 'bottom'

  let tooltipTop = placement === 'bottom'
    ? spotlightBox.top + spotlightBox.height + GAP
    : spotlightBox.top - th - GAP
  tooltipTop = Math.max(8, Math.min(tooltipTop, vh - th - 8))

  const targetCenterX = spotlightBox.left + spotlightBox.width / 2
  let tooltipLeft = targetCenterX - tw / 2
  tooltipLeft = Math.max(8, Math.min(tooltipLeft, vw - tw - 8))

  let arrowLeft = targetCenterX - tooltipLeft
  arrowLeft = Math.max(18, Math.min(arrowLeft, tw - 18))

  const isLast = stepIndex === steps.length - 1

  return createPortal(
    <div className="fixed inset-0 z-[9997]">
      {/* Full-screen click-catcher: tapping anywhere on the dimmed
          background (including "through" the spotlight hole) just moves
          the tour forward, same as the Next button — only the explicit
          Skip button / ✕ dismisses the whole tour. */}
      <button
        type="button"
        aria-label={t('tour_continueAria')}
        onClick={() => next(steps.length)}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      {/* Dimmed backdrop with a cut-out around the target (box-shadow trick:
          the box itself is transparent, everything outside it is dark). */}
      <div
        className="pointer-events-none absolute rounded-xl2 ring-2 ring-gold-300 transition-all duration-200"
        style={{
          top: spotlightBox.top,
          left: spotlightBox.left,
          width: spotlightBox.width,
          height: spotlightBox.height,
          boxShadow: '0 0 0 9999px rgba(10,10,15,0.72)',
        }}
      />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute w-[min(300px,calc(100vw-24px))] rounded-xl2 bg-white p-4 shadow-page transition-all duration-200 dark:bg-ink-900"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        {/* Arrow */}
        <span
          className="absolute h-3 w-3 rotate-45 bg-white dark:bg-ink-900"
          style={{
            left: arrowLeft - 6,
            top: placement === 'bottom' ? -6 : undefined,
            bottom: placement === 'top' ? -6 : undefined,
          }}
        />

        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-sm font-semibold text-ink-900 dark:text-ink-50">{t(step.titleKey)}</p>
          <button
            type="button"
            onClick={skip}
            aria-label={t('tour_closeAria')}
            className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{t(step.bodyKey)}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? 'w-4 bg-gold-500' : 'w-1.5 bg-ink-200 dark:bg-ink-700'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={skip} className="text-xs font-medium text-ink-400 hover:text-ink-600 dark:hover:text-ink-200">
              {t('tour_skip')}
            </button>
            <button
              type="button"
              onClick={() => next(steps.length)}
              className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-700 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300"
            >
              {isLast ? t('common_done') : t('common_next')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
