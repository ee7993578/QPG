import React, { useCallback, useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { PapersBrowser, CreatePaperButton } from '../components/papers/PapersBrowser'
import { BatchSmartFixDialog } from '../components/builder/BatchSmartFixDialog'
import { SchoolDeadlineBanner } from '../components/builder/SchoolDeadlineBanner'
import { AdSlot } from '../components/ads/AdSlot'
import { ErrorState } from '../components/ui/States'
import { Button } from '../components/ui/Button'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useAppStore } from '../store/useAppStore'
import { useTourStore } from '../store/tourStore'
import { useTranslate } from '../i18n'
import { paperApi } from '../services/paperApi'
import { WifiOff, Sparkles } from 'lucide-react'

/**
 * Teacher's paper list. The search/filter/sort/list behaviour lives in
 * PapersBrowser so /school/papers renders exactly the same thing.
 */
export default function MyPapers() {
  const t = useTranslate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBatchSmartFix, setShowBatchSmartFix] = useState(false)
  const isOnline = useOnlineStatus()
  const papers = useAppStore((s) => s.papers)
  const startTourIfUnseen = useTourStore((s) => s.startIfUnseen)

  const load = useCallback(() => {
    let alive = true
    setLoading(true)
    setError(null)
    paperApi.getPapers()
      .then(() => { if (alive) setLoading(false) })
      .catch((err) => {
        if (!alive) return
        setError(err?.message || 'Could not load your papers.')
        setLoading(false)
      })
    return () => { alive = false }
  }, [])

  useEffect(() => load(), [load])

  // First time the teacher opens the My Paper tab (with at least one paper
  // already in the list, so the per-paper action buttons actually exist to
  // spotlight), walk them through search, filters, and the row actions.
  // Never auto-shows again after this (see tourStore); replayable from
  // Settings.
  useEffect(() => {
    if (loading || papers.length === 0) return
    const id = setTimeout(() => startTourIfUnseen('myPaper'), 500)
    return () => clearTimeout(id)
  }, [loading, papers.length, startTourIfUnseen])

  return (
    <AppShell
      title="My Paper"
      subtitle="All your saved and draft question papers"
      mobileTitle="My Paper"
      right={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowBatchSmartFix(true)}>
            <Sparkles className="h-3.5 w-3.5" /> {t('batchSmartFix_button')}
          </Button>
          <CreatePaperButton />
        </div>
      }
    >
      <BatchSmartFixDialog open={showBatchSmartFix} onClose={() => setShowBatchSmartFix(false)} />
      <div className="mx-auto max-w-5xl space-y-3">
        <SchoolDeadlineBanner className="rounded-lg border px-3 py-2" />
        {!isOnline && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-400">
            <WifiOff className="h-3.5 w-3.5" /> You're offline — showing the last loaded papers.
          </div>
        )}
        {error && !loading ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <PapersBrowser loading={loading} />
        )}
        {/* Section 28 — My Papers is on the allowed list; hidden for paid plans. */}
        <AdSlot slot="my-papers" format="banner" className="mt-6" />
      </div>
    </AppShell>
  )
}
