import React from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileHeader } from './MobileHeader'
import { BottomNav } from './BottomNav'
import { FirstRunIntro } from './FirstRunIntro'

export function AppShell({ title, subtitle, mobileTitle, right, noPadding, children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-50 dark:bg-ink-950">
      <FirstRunIntro />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} subtitle={subtitle} right={right} />
        <MobileHeader title={mobileTitle || title} />
        <main className={`scroll-thin flex-1 overflow-y-auto pb-20 md:pb-0 ${noPadding ? '' : 'p-4 md:p-6'}`}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
