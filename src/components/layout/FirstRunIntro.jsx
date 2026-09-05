import React, { useState } from 'react'
import { FilePlus2, LayoutList, Eye, Download, ArrowRight, Check } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../store/authStore'

// Feature — shown exactly once, the very first time the app is opened
// (guarded by the persisted `hasSeenIntro` flag), so a new teacher isn't
// dropped into a blank builder with no idea where to start.
const STEPS = [
  {
    icon: FilePlus2,
    title: 'Start a new paper',
    body: 'Tap "Create New Paper" on the Dashboard. Fill in the exam name, class, subject and duration — it only takes a few taps.',
  },
  {
    icon: LayoutList,
    title: 'Add sections & questions',
    body: 'Inside a paper, use "Add Section" and then "Add Question Group" to build up MCQs, Short Answer, Long Answer and more.',
  },
  {
    icon: Eye,
    title: 'Check the live preview',
    body: 'The right-hand panel always shows exactly how the printed paper will look. Tap any line or image in it to move or format it.',
  },
  {
    icon: Download,
    title: 'Export when ready',
    body: 'Once everything looks right, use Export/Print at the top of the paper to get your final, ready-to-print question paper.',
  },
]

export function FirstRunIntro() {
  const hasSeenIntro = useAuthStore((s) => s.hasSeenIntro)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const dismissIntro = useAuthStore((s) => s.dismissIntro)
  const [step, setStep] = useState(0)

  if (!isAuthenticated || hasSeenIntro) return null

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]
  const Icon = current.icon

  return (
    <Dialog open title="Welcome to Papercraft" onClose={dismissIntro} className="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-gold-600 dark:bg-gold-400/10 dark:text-gold-300">
          <Icon className="h-6 w-6" />
        </span>
        <h4 className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">{current.title}</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{current.body}</p>
      </div>

      <div className="mt-5 flex items-center justify-center gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-gold-500' : 'w-1.5 bg-ink-200 dark:bg-ink-700'}`}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={dismissIntro}
          className="text-xs font-medium text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
        >Skip</button>
        <Button
          type="button"
          onClick={() => (isLast ? dismissIntro() : setStep((s) => s + 1))}
        >
          {isLast ? <>Got it <Check className="h-4 w-4" /></> : <>Next <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </Dialog>
  )
}
