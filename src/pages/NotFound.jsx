import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-50 text-center dark:bg-ink-950">
      <p className="font-display text-5xl font-bold text-ink-800 dark:text-ink-100">404</p>
      <p className="text-sm text-ink-400">This page doesn't exist.</p>
      <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
    </div>
  )
}
