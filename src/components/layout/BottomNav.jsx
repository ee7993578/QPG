import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, PenLine, Eye, FolderOpen } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const activePaperId = useAppStore((s) => s.activePaperId)
  const papers = useAppStore((s) => s.papers)

  const targetPaperId = activePaperId && papers.some((p) => p.id === activePaperId)
    ? activePaperId
    : papers[0]?.id

  const goBuilder = (view) => {
    if (!targetPaperId) {
      navigate('/exam/new')
      return
    }
    navigate(`/paper/${targetPaperId}?view=${view}`)
  }

  const isEdit = location.pathname.startsWith('/paper/') && new URLSearchParams(location.search).get('view') !== 'preview'
  const isPreview = location.pathname.startsWith('/paper/') && new URLSearchParams(location.search).get('view') === 'preview'

  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, active: location.pathname === '/dashboard', onClick: () => navigate('/dashboard') },
    { key: 'edit', label: 'Edit', icon: PenLine, active: isEdit, onClick: () => goBuilder('edit') },
    { key: 'preview', label: 'Preview', icon: Eye, active: isPreview, onClick: () => goBuilder('preview') },
    { key: 'myPaper', label: 'My Paper', icon: FolderOpen, active: location.pathname === '/papers', onClick: () => navigate('/papers') },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-ink-100 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] dark:border-ink-800 dark:bg-ink-900/95 md:hidden">
      {items.map(({ key, label, icon: Icon, active, onClick }) => (
        <button
          key={key}
          onClick={onClick}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
            active ? 'text-ink-800 dark:text-gold-300' : 'text-ink-400'
          )}
        >
          <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
          {label}
        </button>
      ))}
    </nav>
  )
}
