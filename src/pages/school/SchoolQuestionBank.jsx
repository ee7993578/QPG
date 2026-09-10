import React, { useCallback, useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { ListSkeleton, ErrorState } from '../../components/ui/States'
import { QuestionBankBrowser } from '../../components/bank/QuestionBankBrowser'
import { useAuthStore } from '../../store/authStore'
import { useQuestionBankStore } from '../../store/questionBankStore'
import { questionBankApi } from '../../services/questionBankApi'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

/**
 * Section 23 — the school's shared question bank. The admin can add, edit and
 * delete; every teacher on School Pro sees the same list read-only on their own
 * /question-bank page and can copy questions into their personal bank.
 */
export default function SchoolQuestionBank() {
  const school = useAuthStore((s) => s.school)
  const schoolQuestions = useQuestionBankStore((s) => s.schoolQuestions)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isOnline = useOnlineStatus()

  const load = useCallback(() => {
    let alive = true
    setLoading(true)
    setError(null)
    questionBankApi.list('school')
      .then(() => { if (alive) setLoading(false) })
      .catch((err) => {
        if (!alive) return
        setError(err?.message || 'Could not load the shared question bank.')
        setLoading(false)
      })
    return () => { alive = false }
  }, [])

  useEffect(() => load(), [load])

  return (
    <AppShell
      title="Question Bank"
      subtitle="Shared with every teacher at your school"
      mobileTitle="Question Bank"
    >
      <div className="mx-auto max-w-4xl space-y-4">
        {!isOnline && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-400">
            <WifiOff className="h-3.5 w-3.5" /> You're offline — showing the last loaded questions.
          </div>
        )}
        <Card className="px-4 py-3">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {schoolQuestions.length} question{schoolQuestions.length === 1 ? '' : 's'} in the shared bank
            {school?.schoolName ? ` for ${school.schoolName}` : ''}. Teachers can copy any of these into their own bank,
            but only you can edit or delete them here.
          </p>
        </Card>

        {loading ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <QuestionBankBrowser
            scope="school"
            author={school?.adminName || ''}
            emptyMessage="Add the questions your teachers reuse every term — they'll be available to everyone at the school."
          />
        )}
      </div>
    </AppShell>
  )
}
