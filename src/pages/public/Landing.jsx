import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, ArrowRight, Check, ChevronDown, FileText, Eye, Download,
  LayoutTemplate, Library, Users, Sparkles, ListChecks, Table2, ToggleLeft,
  ScrollText, SquareStack, Type, ImageIcon,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { PricingPlans } from '../../components/marketing/PricingPlans'
import { PublicNav, PublicFooter } from '../../components/marketing/PublicNav'
import { AdSlot } from '../../components/ads/AdSlot'

const ANCHORS = [
  { href: '#features', label: 'Features' },
  { href: '#templates', label: 'Templates' },
  { href: '#faq', label: 'FAQ' },
]

// Section 26 — public landing page. Ten sections, in the order the spec
// lists them, with the two CTAs both leading into the same signup flow
// (paper creation is free, so there's no reason to gate the entry point).

const FEATURES = [
  { icon: Eye, title: 'Live A4 preview', body: 'See the exact printed page as you type. No guessing, no surprises at the printer.' },
  { icon: LayoutTemplate, title: 'Ready-made templates', body: 'Classic, Modern, Minimal and School Standard layouts — pick one and you are done.' },
  { icon: ListChecks, title: 'Every question type', body: 'MCQ, Assertion-Reason, Match the Following, Case Study, sub-questions and more.' },
  { icon: Library, title: 'Question bank', body: 'Save questions once, reuse them in any paper. Filter by class, chapter and difficulty.' },
  { icon: Users, title: 'Built for schools too', body: 'Add your teachers, share templates and a common question bank across the school.' },
  { icon: Download, title: 'Download & print', body: 'Export a clean PDF or an editable Word/Google Doc that matches the preview exactly.' },
]

const QUESTION_TYPES = [
  { icon: ListChecks, label: 'MCQ' },
  { icon: SquareStack, label: 'Assertion–Reason' },
  { icon: Table2, label: 'Match the Following' },
  { icon: ToggleLeft, label: 'True / False' },
  { icon: Type, label: 'Fill in the Blanks' },
  { icon: ScrollText, label: 'Case Study / Passage' },
  { icon: FileText, label: 'Short & Long Answer' },
  { icon: ImageIcon, label: 'Diagrams & Tables' },
]

const TEMPLATES = [
  { name: 'Classic', desc: 'Bold ruled header. The familiar school look.', rule: 'border-b-2 border-ink-800' },
  { name: 'Modern', desc: 'Heavier header rule, cleaner spacing.', rule: 'border-b-4 border-ink-900' },
  { name: 'Minimal', desc: 'Thin rule, maximum room for questions.', rule: 'border-b border-ink-300' },
  { name: 'School Standard', desc: 'Double rule, board-exam styling.', rule: 'border-b-2 border-double border-ink-800' },
]

const TEACHER_BENEFITS = [
  'Unlimited papers, unlimited editing — always free',
  'Your own personal question bank',
  '3 free PDF downloads to try it properly',
  'Then ₹99 a year for unlimited downloads',
  'Works on your phone as well as your laptop',
]

const SCHOOL_BENEFITS = [
  'Unlimited teachers on one school account',
  'School branding on every paper',
  'Shared templates so all papers look consistent',
  'A common question bank the whole staff contributes to',
  'One ₹499 a year plan covers everybody',
]

const FAQS = [
  {
    q: 'Is creating papers really unlimited on the free plan?',
    a: 'Yes. You can create, edit and preview as many papers as you like — 5, 50 or 500 — without paying. Only PDF downloads are limited on the free plan, and you get 3 of those to start.',
  },
  {
    q: 'What happens after my 3 free downloads?',
    a: 'Your papers stay exactly where they are and you can keep creating and editing them. To download more, upgrade to Teacher Pro at ₹99 a year or School Pro at ₹499 a year.',
  },
  {
    q: 'Do I need any design skills?',
    a: 'No. Pick a template, fill in the exam details and type your questions. The A4 preview on the right always shows the finished page, so you can see it is right before you download.',
  },
  {
    q: 'Can my whole school use one account?',
    a: 'Yes — that is what School Pro is for. A school account can add unlimited teachers, share templates and a question bank, and manage everything from one place.',
  },
  {
    q: 'Can I type questions in Hindi or other languages?',
    a: 'Yes. You can type in any language or script inside a paper, and there is a right-to-left toggle for Urdu and Arabic. The app interface is available in English and Hindi.',
  },
  {
    q: 'Will the download look the same as the preview?',
    a: 'It is captured straight from the preview you are looking at, so yes. You can export a print-ready PDF or an editable Word/Google Doc file.',
  },
]

/** Section 26.2 — a static, scaled-down mock of the real split workspace. */
function PreviewDemo() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50 px-4 py-2.5 dark:border-ink-800 dark:bg-ink-900">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200 dark:bg-ink-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200 dark:bg-ink-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200 dark:bg-ink-700" />
        <p className="ml-2 text-xs font-medium text-ink-400">Half Yearly · Mathematics · Class X</p>
      </div>

      <div className="grid md:grid-cols-[42%_58%]">
        {/* Editor side */}
        <div className="space-y-3 border-b border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900 md:border-b-0 md:border-r">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Editor</p>
          {[
            { label: 'Section A · MCQ', text: 'The HCF of 12 and 18 is:' },
            { label: 'Section A · MCQ', text: 'The value of √144 is:' },
            { label: 'Section B · Short Answer', text: 'Find the zeroes of x² − 7x + 12.' },
          ].map(({ label, text }, i) => (
            <div key={i} className="rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-2.5 dark:border-ink-800 dark:bg-ink-950/40">
              <p className="text-[10px] font-medium uppercase tracking-wide text-ink-400">{label}</p>
              <p className="mt-1 text-xs text-ink-700 dark:text-ink-200">{text}</p>
            </div>
          ))}
          <p className="text-[11px] text-ink-400">Type here — the page on the right updates as you go.</p>
        </div>

        {/* Paper side */}
        <div className="bg-ink-50 p-4 dark:bg-ink-950">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Live A4 Preview</p>
          <div className="mx-auto max-w-sm rounded-sm bg-paper-50 px-6 py-6 shadow-page">
            <div className="border-b-2 border-ink-800 pb-2.5 text-center font-display">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-900">Delhi Public School</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase text-ink-700">Half Yearly Examination</p>
              <div className="mt-1.5 flex justify-between text-[8px] text-ink-500">
                <span>Class: X</span><span>Subject: Mathematics</span><span>Max Marks: 80</span>
              </div>
            </div>
            <div className="mt-3 space-y-2.5">
              <p className="text-[9px] font-bold uppercase text-ink-800">Section A</p>
              <p className="text-[9px] text-ink-800">1. The HCF of 12 and 18 is: <span className="float-right">[1]</span></p>
              <p className="text-[9px] text-ink-800">2. The value of √144 is: <span className="float-right">[1]</span></p>
              <p className="pt-1.5 text-[9px] font-bold uppercase text-ink-800">Section B</p>
              <p className="text-[9px] text-ink-800">3. Find the zeroes of x² − 7x + 12. <span className="float-right">[2]</span></p>
              <div className="space-y-1.5 pt-1">
                <span className="block h-px bg-ink-200" />
                <span className="block h-px bg-ink-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-medium text-ink-800 dark:text-ink-100">{q}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <p className="border-t border-ink-100 px-5 py-4 text-sm leading-relaxed text-ink-500 dark:border-ink-800 dark:text-ink-400">{a}</p>}
    </Card>
  )
}

function Section({ id, eyebrow, title, subtitle, children, className }) {
  return (
    <section id={id} className={cn('mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20', className)}>
      {eyebrow && <p className="text-center text-xs font-semibold uppercase tracking-widest text-gold-600 dark:text-gold-400">{eyebrow}</p>}
      {title && <h2 className="mt-2 text-center font-display text-2xl font-semibold text-ink-900 dark:text-ink-50 md:text-3xl">{title}</h2>}
      {subtitle && <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-ink-500 dark:text-ink-400 md:text-base">{subtitle}</p>}
      <div className="mt-10">{children}</div>
    </section>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-ink-950">
      <PublicNav anchors={ANCHORS} />

      {/* 1. Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-4 pt-14 text-center md:px-6 md:pt-20">
        <Badge variant="neutral" className="mx-auto">Free to create · ₹99/year to download unlimited</Badge>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
          Create Professional Question Papers in Minutes
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-ink-500 dark:text-ink-400 md:text-lg">
          Design, preview and download beautiful school question papers without any design skills.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => navigate('/login')}>
            Create Free Paper <ArrowRight className="h-4 w-4" />
          </Button>
          <a href="#how-it-works">
            <Button size="lg" variant="outline">See How It Works</Button>
          </a>
        </div>
        <p className="mt-4 text-xs text-ink-400">No credit card. Unlimited papers on the free plan.</p>
      </section>

      {/* 2. Live A4 preview demonstration */}
      <Section
        id="how-it-works"
        eyebrow="How it works"
        title="Type on the left, watch the paper on the right"
        subtitle="The preview is the real page — same fonts, same spacing, same margins as the file you download. Three steps and you're done."
      >
        <PreviewDemo />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: FileText, step: '1', title: 'Fill in the exam details', body: 'Exam name, class, subject, duration, marks.' },
            { icon: ListChecks, step: '2', title: 'Add your questions', body: 'Sections, question types, marks and answer space.' },
            { icon: Download, step: '3', title: 'Preview and download', body: 'Check the A4 page, then export PDF or Doc.' },
          ].map(({ icon: Icon, step, title, body }) => (
            <Card key={step} className="p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-700 text-sm font-semibold text-white dark:bg-gold-400 dark:text-ink-950">{step}</span>
                <Icon className="h-4 w-4 text-ink-400" />
              </div>
              <p className="mt-3 font-display font-semibold text-ink-900 dark:text-ink-50">{title}</p>
              <p className="mt-1 text-sm text-ink-400">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 3. Features */}
      <Section
        id="features"
        eyebrow="Features"
        title="Everything a question paper needs"
        subtitle="Simple by default. The advanced controls are there when you want them, out of the way when you don't."
        className="border-t border-ink-100 dark:border-ink-800"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-600 dark:bg-ink-800 dark:text-gold-300">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3.5 font-display font-semibold text-ink-900 dark:text-ink-50">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-400">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 4. Question types */}
      <Section
        id="question-types"
        eyebrow="Question types"
        title="Set any pattern your board uses"
        subtitle="Mix compulsory questions, internal choice, OR questions and optional sections — the marks total updates itself."
        className="border-t border-ink-100 dark:border-ink-800"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUESTION_TYPES.map(({ icon: Icon, label }) => (
            <Card key={label} className="flex flex-col items-center gap-2 px-3 py-5 text-center">
              <Icon className="h-5 w-5 text-ink-400" />
              <p className="text-sm font-medium text-ink-700 dark:text-ink-200">{label}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 5. Templates */}
      <Section
        id="templates"
        eyebrow="Templates"
        title="Four looks, one click apart"
        subtitle="Switch template any time — your questions stay exactly as they are."
        className="border-t border-ink-100 dark:border-ink-800"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map(({ name, desc, rule }) => (
            <Card key={name} className="p-4">
              <div className="rounded-sm bg-paper-50 px-4 py-4 shadow-card">
                <div className={cn('pb-2 text-center font-display', rule)}>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-ink-900">School Name</p>
                  <p className="text-[8px] font-semibold uppercase text-ink-700">Annual Examination</p>
                </div>
                <div className="mt-2 space-y-1">
                  <span className="block h-1 w-3/4 rounded bg-ink-200" />
                  <span className="block h-1 w-full rounded bg-ink-100" />
                  <span className="block h-1 w-5/6 rounded bg-ink-100" />
                </div>
              </div>
              <p className="mt-3 font-display font-semibold text-ink-900 dark:text-ink-50">{name}</p>
              <p className="mt-0.5 text-xs text-ink-400">{desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 6 + 7. Teacher and school benefits */}
      <Section
        id="who-its-for"
        eyebrow="Who it's for"
        title="One tool, two ways to use it"
        className="border-t border-ink-100 dark:border-ink-800"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-600 dark:bg-ink-800 dark:text-gold-300">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">For teachers</p>
                <p className="text-xs text-ink-400">Working on your own papers</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2.5">
              {TEACHER_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-200">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> {b}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-6 w-full" onClick={() => navigate('/login')}>Start as a teacher</Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-600 dark:bg-ink-800 dark:text-gold-300">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">For schools & institutes</p>
                <p className="text-xs text-ink-400">Managing a whole teaching staff</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2.5">
              {SCHOOL_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-200">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> {b}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-6 w-full" onClick={() => navigate('/login')}>Set up a school account</Button>
          </Card>
        </div>
      </Section>

      {/* 8. Pricing (section 27 — kept deliberately simple) */}
      <Section
        id="pricing"
        eyebrow="Pricing"
        title="Free to create. Pay only to download."
        subtitle="Every plan includes unlimited paper creation, editing and preview. The only difference is downloads."
        className="border-t border-ink-100 dark:border-ink-800"
      >
        <PricingPlans onSelect={() => navigate('/login')} ctaLabel="Get started" />
        <p className="mt-6 text-center text-xs text-ink-400">
          Prices in INR, billed yearly. Cancel any time — your papers stay yours.
        </p>
      </Section>

      {/* 9. FAQ */}
      <Section
        id="faq"
        eyebrow="FAQ"
        title="Questions teachers ask us"
        className="border-t border-ink-100 dark:border-ink-800"
      >
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>

        {/* Section 28 — ads are allowed on public content pages only. */}
        <AdSlot slot="landing-footer" format="leaderboard" className="mx-auto mt-10 max-w-3xl" />
      </Section>

      {/* 10. Final CTA */}
      <section className="border-t border-ink-100 bg-ink-50 dark:border-ink-800 dark:bg-ink-900">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6 md:py-20">
          <Sparkles className="mx-auto h-6 w-6 text-gold-500" />
          <h2 className="mt-4 font-display text-2xl font-semibold text-ink-900 dark:text-ink-50 md:text-3xl">
            Your next paper is 10 minutes away
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500 dark:text-ink-400">
            Create it free, see it on an A4 page as you type, and download when you're happy with it.
          </p>
          <Button size="lg" className="mt-7" onClick={() => navigate('/login')}>
            Create Free Paper <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
