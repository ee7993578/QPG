import React from 'react'
import { A4Preview } from './A4Preview'

export function PreviewPanel({ paper }) {
  return (
    <div className="scroll-thin h-full overflow-y-auto bg-ink-100/60 p-4 dark:bg-ink-950 sm:p-8">
      <A4Preview paper={paper} />
    </div>
  )
}
