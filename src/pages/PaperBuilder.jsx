import React, { useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Save } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { MobileHeader } from '../components/layout/MobileHeader'
import { BottomNav } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import { EditorPanel } from '../components/builder/EditorPanel'
import { PreviewPanel } from '../components/builder/PreviewPanel'
import { useAppStore } from '../store/useAppStore'

export default function PaperBuilder() {
  const { paperId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const view = searchParams.get('view') === 'preview' ? 'preview' : 'edit'

  const paper = useAppStore((s) => s.getPaper(paperId))
  const setActivePaper = useAppStore((s) => s.setActivePaper)
  const markPaperSaved = useAppStore((s) => s.markPaperSaved)

  useEffect(() => {
    if (paper) setActivePaper(paper.id)
  }, [paper, setActivePaper])

  if (!paper) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-center">
          <p className="mb-3 text-sm text-ink-500">This paper could not be found.</p>
          <Button onClick={() => navigate('/papers')}>Go to My Paper</Button>
        </div>
      </div>
    )
  }

  const examTitle = paper.examType === 'Custom' ? paper.customExamName : paper.examType

  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-50 dark:bg-ink-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop header */}
        <header className="hidden items-center justify-between border-b border-ink-100 bg-white px-6 py-3.5 dark:border-ink-800 dark:bg-ink-900 md:flex">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/papers')} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-semibold text-ink-900 dark:text-ink-50">
                {examTitle} · {paper.subject}
              </h1>
              <p className="truncate text-xs text-ink-400">Class {paper.className}-{paper.section} · {paper.schoolName}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button onClick={() => markPaperSaved(paper.id)}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </header>

        {/* Mobile header */}
        <MobileHeader title={`${examTitle} · ${view === 'edit' ? 'Edit' : 'Preview'}`} />

        {/* Desktop split workspace (SRS 4.1 - 4.5) */}
        <div className="hidden min-h-0 flex-1 md:grid" style={{ gridTemplateColumns: '42% 58%' }}>
          <div className="min-h-0 border-r border-ink-100 dark:border-ink-800">
            <EditorPanel paper={paper} />
          </div>
          <div className="min-h-0">
            <PreviewPanel paper={paper} />
          </div>
        </div>

        {/* Mobile single-panel workspace (SRS 4.6 / 13.7) */}
        <div className="min-h-0 flex-1 pb-16 md:hidden">
          {view === 'edit' ? <EditorPanel paper={paper} /> : <PreviewPanel paper={paper} />}
        </div>

        <BottomNav />
      </div>
    </div>
  )
}
