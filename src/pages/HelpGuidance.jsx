import React, { useMemo, useState } from 'react'
import { Search, ChevronDown, Lightbulb, LifeBuoy, MessageCircleQuestion } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Card, CardContent } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { HELP_CATEGORIES } from '../data/helpData'

// A tiny illustrative "screenshot" of the Page Settings panel — built from
// plain divs (no image assets), so it always matches the app's real theme
// and never goes stale. Used on the three formatting guides that all point
// into this same panel, so readers instantly recognise where to click.
const PAGE_SETTINGS_TABS = ['Page & Paper', 'Text & Font', 'Spacing', 'Border & Frame', 'Background', 'Numbering']
function PageSettingsMock({ highlight }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-950/40">
      <div className="flex items-center gap-1.5 border-b border-ink-200 bg-white px-3 py-2 dark:border-ink-700 dark:bg-ink-900">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200 dark:bg-ink-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200 dark:bg-ink-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200 dark:bg-ink-700" />
        <span className="ml-2 text-[11px] font-medium text-ink-500 dark:text-ink-400">Page Settings</span>
      </div>
      <div className="flex flex-wrap gap-1 px-2 py-2">
        {PAGE_SETTINGS_TABS.map((tab) => (
          <span
            key={tab}
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-medium',
              tab === highlight
                ? 'bg-ink-700 text-white dark:bg-gold-400 dark:text-ink-950'
                : 'bg-white text-ink-500 dark:bg-ink-900 dark:text-ink-400'
            )}
          >
            {tab}
          </span>
        ))}
      </div>
      <div className="px-3 pb-3">
        <div className="h-2 w-3/4 rounded bg-ink-200 dark:bg-ink-700" />
        <div className="mt-1.5 h-2 w-1/2 rounded bg-ink-200 dark:bg-ink-700" />
      </div>
    </div>
  )
}

const MOCK_FOR = {
  'font-size': 'Text & Font',
  'line-spacing': 'Text & Font',
  border: 'Border & Frame',
  'page-spacing-margins': 'Page & Paper',
}

function TopicItem({ topic, isOpen, onToggle }) {
  return (
    <div className="border-b border-ink-100 last:border-b-0 dark:border-ink-800">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-ink-800 dark:text-ink-100">
          <MessageCircleQuestion className="h-4 w-4 shrink-0 text-ink-400" />
          {topic.q}
          {topic.schoolOnly && (
            <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold text-gold-700 dark:bg-gold-400/10 dark:text-gold-300">
              School Admin
            </span>
          )}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-ink-400 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="pb-4 pl-6 pr-2">
          <ol className="list-decimal space-y-1.5 pl-4 text-sm text-ink-600 dark:text-ink-300">
            {topic.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {MOCK_FOR[topic.id] && <PageSettingsMock highlight={MOCK_FOR[topic.id]} />}
          {topic.tip && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-gold-50 px-3 py-2 text-xs text-ink-700 dark:bg-gold-400/10 dark:text-ink-200">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
              <span>{topic.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HelpGuidance() {
  const accountType = useAuthStore((s) => s.accountType)
  const isSchool = accountType === 'school'
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  const categories = useMemo(() => {
    const q = query.trim().toLowerCase()
    return HELP_CATEGORIES
      .filter((cat) => !cat.schoolOnly || isSchool)
      .map((cat) => ({
        ...cat,
        topics: cat.topics
          .filter((t) => !t.schoolOnly || isSchool)
          .filter((t) => !q || t.q.toLowerCase().includes(q) || t.steps.some((s) => s.toLowerCase().includes(q))),
      }))
      .filter((cat) => cat.topics.length > 0)
  }, [query, isSchool])

  return (
    <AppShell title="Help & Guidance" subtitle="Step-by-step answers for every part of PaperCraft" mobileTitle="Help & Guidance">
      <div className="mx-auto max-w-3xl space-y-5">
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-700 text-gold-300 dark:bg-gold-400 dark:text-ink-950">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-ink-900 dark:text-ink-50">How can we help?</p>
              <p className="text-xs text-ink-400">Search a question below, or browse by topic.</p>
            </div>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help, e.g. font size, border, subscribe…"
            className="pl-9"
          />
        </div>

        {categories.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-ink-400">No results for "{query}".</CardContent></Card>
        )}

        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="pt-5">
              <p className="mb-1 font-display text-sm font-semibold uppercase tracking-wide text-ink-400">{cat.title}</p>
              <div>
                {cat.topics.map((topic) => (
                  <TopicItem
                    key={topic.id}
                    topic={topic}
                    isOpen={openId === topic.id}
                    onToggle={() => setOpenId((id) => (id === topic.id ? null : topic.id))}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
