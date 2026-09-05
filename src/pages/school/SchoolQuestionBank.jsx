import React, { useEffect, useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { ListSkeleton } from '../../components/ui/States'
import { QuestionBankBrowser } from '../../components/bank/QuestionBankBrowser'
import { useAuthStore } from '../../store/authStore'
import { useQuestionBankStore } from '../../store/questionBankStore'
import { questionBankApi } from '../../services/questionBankApi'

/**
 * Section 23 — the school's shared question bank. The admin can add, edit and
 * delete; every teacher on School Pro sees the same list read-only on their own
 * /question-bank page and can copy questions into their personal bank.
 */
export default function SchoolQuestionBank() {
  const school = useAuthStore((s) => s.school)
  const schoolQuestions = useQuestionBankStore((s) => s.schoolQuestions)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    questionBankApi.list('school').then(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return (
    <AppShell
      title="Question Bank"
      subtitle="Shared with every teacher at your school"
      mobileTitle="Question Bank"
    >
      <div className="mx-auto max-w-4xl space-y-4">
        <Card className="px-4 py-3">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {schoolQuestions.length} question{schoolQuestions.length === 1 ? '' : 's'} in the shared bank
            {school?.schoolName ? ` for ${school.schoolName}` : ''}. Teachers can copy any of these into their own bank,
            but only you can edit or delete them here.
          </p>
        </Card>

        {loading ? (
          <ListSkeleton rows={4} />
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
