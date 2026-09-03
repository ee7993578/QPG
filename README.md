# PaperCraft — Question Paper Builder (Frontend v1)

React + Tailwind frontend for the Question Paper Builder SRS, wired to **static/mock data**
(no backend yet). This is the UI + interaction layer only — every add/edit/delete works in
memory (persisted to `localStorage` so refreshing the page doesn't lose your work), ready for
the Spring Boot backend to be wired in next.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

To create a production build:

```bash
npm run build
npm run preview
```

## Demo login

- Enter any valid 10-digit Indian mobile number (starts with 6-9).
- OTP is always **1234** in this static build.

## What's implemented

- Mobile number + OTP login (mocked)
- Dashboard with stats + recent papers
- Create Exam form (exam type, duration, marks, date, school, class/section, subject)
- Desktop **side-by-side Paper Builder**: left editor / right live A4 preview, ~42/58 split,
  independent scrolling, no manual refresh needed
- Mobile Paper Builder: dedicated Edit / Preview screens via the bottom nav
- Sections → Question Groups → Questions hierarchy
- Question Group modes: Normal, Attempt Any, Optional/OR — with correct
  provided-marks vs obtainable-marks math
- Automatic continuous question numbering + automatic A/B/C section lettering
- Live marks validation banner (remaining / over-limit / on target)
- Autosave indicator (debounced) + explicit Save button
- My Paper: search, filters, Duplicate, Delete (with confirmation), Preview, Edit, Download
- Download offers two formats from the same header button (`src/lib/exportPaper.js`), both
  reading the exact live-preview DOM node (`#print-root`) the teacher is already looking at
  so the file always matches Preview exactly:
  - **PDF** — a full-fidelity capture of the preview (`html2canvas` + `jsPDF`), paginated to
    match the paper's chosen size/orientation.
  - **Google Doc (.doc)** — the same markup with every element's on-screen style frozen
    inline, saved as a Word-compatible `.doc` file that opens fully editable in Microsoft
    Word or Google Docs (Google Docs converts it to a native, editable Doc on open).
  `.no-print` elements (edit-only affordances) are stripped from both exports, matching the
  existing `@media print` rule.
- Light / Dark / System theme
- i18n-ready string layer (English complete; Hindi/Urdu/Arabic slots ready in `src/i18n`)
- Fully responsive: desktop sidebar + topbar, mobile bottom nav (Dashboard/Edit/Preview/My
  Paper) + hamburger side drawer

## New in this build — advanced question authoring

Based on a 55-point feature wishlist, the Question model was upgraded from a plain
`question_text` string into a small structured object (content + options + sub-parts +
answer space + layout), as recommended for a future-proof architecture. Implemented in
this frontend pass (static data, no backend):

- **Content blocks per question**: text, image (URL + width% + caption), and — for the
  Table/Grid type — a rows×cols table editor
- **Assertion–Reason** and **Match the Following** as first-class question types, with a
  real two-column table editor for matching pairs
- **Case Study / Passage** groups: one shared passage rendered once above several
  questions, plus an "Important Instructions" box per section
- **Sub-questions (a)(b)(c)** with their own marks, and an "OR with previous part" toggle
  for nested internal choice
- **Answer space** as a layout-only property: none / 1–6 lines / half page / full page /
  custom height / drawing space — never affects marks
- **MCQ / Assertion-Reason options** with text or image, vertical or two-column layout
- **Negative marking**, configurable **marks position** ([2] / (2) / 2), and configurable
  **numbering style** per section (1. / Q1. / 1) / (a) / (i)), with optional per-section
  restart
- **Keep-together** pin per question and a manual **page break** before a group
  (`break-inside`/`break-before` CSS, applied in both live preview and print)
- **Header customization**: logo URL, centered/split layout; **watermark text**; **footer
  text** + page number toggle — all under a new "Paper Settings" panel
- **Special symbol palette** (math/physics/chemistry/super-sub-script) that inserts at the
  cursor position in the focused question field
- **RTL toggle** per question for Hindi/Urdu/Arabic mixed papers
- **Duplicate Section** (Duplicate Question already existed)
- Two demo papers now show these features live (Assertion-Reason, Match the Following,
  Case Study with sub-questions, MCQ with a diagram, drawing space, etc.)

### Deliberately not in this pass

These need a real backend, a PDF/typesetting engine, or a third-party editor library, so
building them into a static-data frontend now would be fragile and worth doing properly
once the Spring Boot API exists: a true WYSIWYG rich-text/equation editor, real image
upload & storage, paste-from-Word cleanup, drag-and-drop reordering (up/down arrows cover
reordering for now), offline sync, automatic pagination/overflow recalculation for the
real PDF, font embedding, question bank, AI question generation, multi-set randomization,
auto-generated answer keys, and full multilingual UI (the i18n layer is scaffolded but not
filled in for Hindi/Urdu/Arabic).

## Round 2 — remaining wishlist items

- **Real image upload** (not just URL): question images, MCQ option images, and the
  header logo now support picking a file from disk (`ImageUploadField`, read via
  `FileReader` as a base64 data-URL) — swap this for real object storage later without
  touching any component
- **Drag-and-drop reordering** (native HTML5 DnD, no library) for sections, question
  groups, and individual questions — the old up/down arrows still work too
- **Undo/Redo**: `Ctrl+Z` / `Ctrl+Y` (or `Ctrl+Shift+Z`), plus buttons in the editor
  panel, backed by a 50-step history stack in the store
- **Rich text**: a small Bold/Italic/Underline/Strikethrough toolbar wraps the current
  selection in `**`/`*`/`__`/`~~` markers; the preview renders them properly. Paste from
  Word/any rich source is intercepted and stripped down to plain text
- **Offline indicator**: the builder header shows "Offline — saved locally" using
  `navigator.onLine`/the `online`/`offline` events — local drafts already survive this
  via the existing `localStorage` persistence
- **Question Bank**: a static bank of sample questions per subject, with an "Insert from
  Question Bank" button on every question group
- **Answer Key mode**: mark the correct option on any MCQ/Assertion-Reason question (a
  tap on the circle next to each option); a "Show Answer Key" toggle in the preview
  toolbar marks it with a check mark without altering the underlying paper
- **Multiple paper sets (preview)**: a Set A/B/C selector deterministically reshuffles
  question order within each group for preview purposes, without mutating the saved
  paper — real per-set persistence needs the backend
- **Templates** (Classic/Modern/Minimal/School Standard) and **paper sizes**
  (A4/A5/Letter/Legal) are now real, selectable options in Paper Settings that change the
  live preview's look and page proportions

### Still deliberately out of scope

A true WYSIWYG/LaTeX equation editor, real backend-hosted image storage, automatic
PDF pagination/overflow recalculation, font embedding for the real PDF, AI question
generation, school profiles, multi-teacher collaboration, sharing links/analytics, and
full Hindi/Urdu/Arabic UI translation. All of these need the Spring Boot backend, a real
PDF/typesetting engine, or a third-party editor — building them against static frontend
data would just have to be redone.

## Project structure

```
src/
  components/
    layout/     AppShell, Sidebar, Topbar, MobileHeader, BottomNav
    builder/    EditorPanel, PreviewPanel, A4Preview, SectionEditor,
                QuestionGroupEditor, QuestionInput, MarksSummaryBar,
                SymbolPalette, AnswerSpaceEditor, SubQuestionsEditor,
                OptionsEditor, MatchPairsEditor, TableGridEditor
    ui/         Button, Input, Select, Card, Badge, Dialog
  pages/        Login, Dashboard, CreateExam, PaperBuilder, MyPapers, Settings, NotFound
  store/        useAppStore.js  (zustand — all state + business logic lives here)
  data/         mockData.js     (static seed data — swap for API calls later)
  i18n/         translation dictionary
  lib/          utils.js        (marks calculation, numbering, formatting)
```

## Swapping in the real backend later

Everything that currently reads/writes `src/data/mockData.js` and `useAppStore.js` is
isolated on purpose. When the Spring Boot API is ready:

1. Replace the store's static `papers` array + CRUD actions with calls to
   `services/api` (REST client) — the component layer won't need to change.
2. Replace `requestOtp` / `verifyOtp` with real `/auth` endpoints.
3. Optionally replace the client-side `html2canvas`/`jsPDF` PDF export in `exportPaper.js`
   with a call to a real `/pdf` endpoint once the backend can render server-side PDFs
   (keeps the exact same look, but avoids the client doing the rendering work).
4. Add optimistic-locking conflict handling around `_touch` using the API's `version` field.
