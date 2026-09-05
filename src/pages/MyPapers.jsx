import React, { useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { PapersBrowser, CreatePaperButton } from '../components/papers/PapersBrowser'
import { AdSlot } from '../components/ads/AdSlot'
import { paperApi } from '../services/paperApi'

/**
 * Teacher's paper list. The search/filter/sort/list behaviour lives in
 * PapersBrowser so /school/papers renders exactly the same thing.
 */
export default function MyPapers() {
  const [loading, setLoading] = useState(true)

  // Stands in for the real fetch once the backend exists (sections 32/36).
  useEffect(() => {
    let alive = true
    paperApi.getPapers().then(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return (
    <AppShell
      title="My Paper"
      subtitle="All your saved and draft question papers"
      mobileTitle="My Paper"
      right={<CreatePaperButton />}
    >
      <div className="mx-auto max-w-5xl">
        <PapersBrowser loading={loading} />
        {/* Section 28 — My Papers is on the allowed list; hidden for paid plans. */}
        <AdSlot slot="my-papers" format="banner" className="mt-6" />
      </div>
    </AppShell>
  )
}
