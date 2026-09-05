import React, { useEffect, useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { PapersBrowser, CreatePaperButton } from '../../components/papers/PapersBrowser'
import { AdSlot } from '../../components/ads/AdSlot'
import { paperApi } from '../../services/paperApi'
import { useAuthStore } from '../../store/authStore'

/**
 * Sections 11/46 — the School admin's paper list. Same browser as the
 * teacher's /papers; only the framing copy differs.
 *
 * Per-teacher attribution is a backend concern (papers are owned by a user
 * server-side), so this build lists the papers in the school workspace rather
 * than inventing an author field the store doesn't have.
 */
export default function SchoolPapers() {
  const school = useAuthStore((s) => s.school)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    paperApi.getPapers().then(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return (
    <AppShell
      title="Papers"
      subtitle={school?.schoolName ? `Question papers in ${school.schoolName}` : 'Question papers in your school'}
      mobileTitle="Papers"
      right={<CreatePaperButton />}
    >
      <div className="mx-auto max-w-5xl">
        <PapersBrowser
          loading={loading}
          emptyMessage="No papers in the school workspace yet. Create one, or invite your teachers so they can start."
        />
        <AdSlot slot="school-papers" format="banner" className="mt-6" />
      </div>
    </AppShell>
  )
}
