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
- Download uses the browser print dialog (`window.print()`) against the same live-preview
  markup, as a stand-in for real PDF generation until the backend exists
- Light / Dark / System theme
- i18n-ready string layer (English complete; Hindi/Urdu/Arabic slots ready in `src/i18n`)
- Fully responsive: desktop sidebar + topbar, mobile bottom nav (Dashboard/Edit/Preview/My
  Paper) + hamburger side drawer

## Project structure

```
src/
  components/
    layout/     AppShell, Sidebar, Topbar, MobileHeader, BottomNav
    builder/    EditorPanel, PreviewPanel, A4Preview, SectionEditor,
                QuestionGroupEditor, QuestionInput, MarksSummaryBar
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
3. Replace `window.print()` download with a call to the `/pdf` endpoint.
4. Add optimistic-locking conflict handling around `_touch` using the API's `version` field.
