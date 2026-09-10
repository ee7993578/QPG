# PaperCraft UX Improvements — Progress Notes

## ✅ Done and working

### Feature — Edit directly from preview (COMPLETE — revised)
- `src/store/uiStore.js` — transient `focusQuestion` request
  (`requestFocusQuestion(sectionId, groupId, questionId)` /
  `clearFocusQuestion()`), not persisted, just a signal between the Preview
  tree and the Editor tree.
- **Revised interaction**: the first version of this feature showed a
  floating "✏️ Edit" text pill on top of every question, which covered the
  marks badge and looked cluttered/permanent (especially on mobile, where
  it has no hover state to fade out). That pill (`EditQuestionHandle`) has
  been removed entirely — the word "Edit" no longer appears anywhere in
  the preview.
  - `src/components/builder/EditableLine.jsx` — the same line already has
    a click-to-select popup toolbar for Bold/Italic/Underline (and Move,
    for whole lines). That toolbar now takes one more optional prop,
    `onJumpToQuestion`, and shows a plain pencil icon in it when passed.
    Nothing else about that toolbar changed.
  - `src/components/builder/A4Preview.jsx` — `QuestionBody` passes
    `onJumpToQuestion` through to the question's own text line (and to
    the Assertion line, for Assertion–Reason questions), for both normal
    questions and OR-mode options. Clicking the pencil there does exactly
    what the old pill did — jumps into the existing editor, scrolls to
    the question, focuses it.
  - Double-click on the question row still works too, as a quick
    alternative, and is completely invisible until used.
  - Table/Grid and Match-the-Following question types still use a plain
    (non-`EditableLine`) text line, so they don't get the pencil — for
    those, double-click on the row is the only way in for now.
- `src/components/builder/QuestionInput.jsx` — listens for a matching
  focus request: scrolls itself into view, focuses its own text box, shows
  a brief highlight. No second editor — this is 100% the existing editor.
- `src/components/builder/QuestionGroupEditor.jsx` — auto-expands a
  collapsed question-type group if the focused question is inside it.
- `src/pages/PaperBuilder.jsx` — on mobile, automatically switches to the
  Edit tab when a question is picked from Preview.
- i18n: removed the now-unused `preview_edit: 'Edit'` key entirely;
  `preview_editQuestion` ("Edit this question") remains as the pencil
  icon's tooltip/aria-label only — never rendered as visible text.

### Feature — Smart Fix, round 2 (COMPLETE)
- `src/lib/smartFix.js` — measures the real live `#print-root` DOM node
  (same node the PDF export uses), tightens spacing → margins → line
  height → font size in priority order via `paper.settings`, floored at
  the app's existing minimum font size, with a full undo snapshot.
  - Auto-detects direction: shrinks a paper that runs long, or — when the
    target is a whole page ABOVE where the paper currently sits — spreads
    the same knobs open instead (`buildSpreadRungs`/`runSmartSpreadInternal`)
    so a trailing near-empty last page fills neatly rather than staying
    blank. `suggestedTargetPages()` offers that "spread to fill" choice
    whenever the paper trails off.
  - Widow/orphan protection: `findSplitQuestions`/`protectWidows` scan the
    live DOM for any question straddling a page boundary and turn on that
    question's own `keepTogether` flag (never touching text/marks). Wired
    into both the shrink and force-fit passes; undoable via `widowFixes`.
  - `buildChangeSummary()` — teacher-facing "what changed" diff (Spacing,
    Margins, Line height, Font size, before → after).
  - `getRememberedTarget`/`rememberTarget` — localStorage per-paper memory
    of the last target page count chosen, purely a dropdown prefill.
  - `onLiveUpdate({ pages, appliedSettings })` fires after every rung
    settles, for a live mini-preview / running page counter.
- `src/components/builder/A4Preview.jsx` — every question row carries
  `data-question-el` / `data-section-id` / `data-group-id` /
  `data-keep-together` attributes, used by widow/orphan detection.
- `src/store/useAppStore.js` — `_touch`, `updatePaperSettings`,
  `updateQuestionGroup`, `updateQuestion` all take an optional
  `opts.silent` flag that skips pushing that one mutation onto the
  undo-history stack, so a multi-rung Smart Fix run collapses into a
  single undoable step instead of a dozen near-identical ones.
- `src/components/builder/SmartFixDialog.jsx` — the dialog UI:
  - Current page count, target-page dropdown (spread-to-fill options
    labelled distinctly, e.g. "2 pages (spread to fill)"), friendly
    loading state, honest "can't comfortably fit" message, Undo Fix.
  - Passes `{ silent }` through `applySettings`/`clearPageBreaks`/
    `restorePageBreaks`/`markKeepTogether`/`clearWidowFixes` via a small
    ref-based helper that marks only the very first store mutation of a
    run (or of an Undo) as non-silent — every mutation after that in the
    same run stays silent, so the run/undo each land as exactly one entry
    on the app's normal undo/redo stack.
  - Live mini-preview thumbnail while optimizing: reuses `<A4Preview
    paper={paper} />` itself inside a small fixed-size `overflow-hidden`
    box with `transform: scale(0.17)` and `pointerEvents: 'none'`, plus a
    running page-count readout. Relies on the main `<A4Preview>` staying
    ahead of `<SmartFixDialog>` in `PreviewPanel.jsx`'s JSX so
    `getVisiblePrintRoot()` keeps measuring the real page, never this
    thumbnail's own `#print-root` copy.
  - Reads `getRememberedTarget(paper.id)` on open to prefill the target
    dropdown, and calls `rememberTarget(paper.id, target)` when the
    teacher clicks Fix/Spread.
  - Renders `buildChangeSummary()` as a bullet list in the `done` phase,
    plus a widows-protected note (singular/plural) when any were found,
    plus a print-safety zoom note under a Force Fit result.
- Wired into `src/components/builder/PreviewPanel.jsx` via a
  "✨ Smart Fix" button.
- i18n strings under `smartFix_*` (English + Hindi).

### Feature — Batch Smart Fix (COMPLETE)
- `src/components/builder/BatchSmartFixDialog.jsx` (new) — fits several
  papers into the same target page count in one go (e.g. a school admin
  lining up a full set of subject papers before printing).
  - Lists every paper with a checkbox + one shared target-pages
    `<Select>` (1–6 pages).
  - Processes selected papers ONE AT A TIME (only one DOM node can be "the
    visible print-root" at a time): mounts that paper's own `<A4Preview
    paper={paper} />` off-screen (`position: fixed; left: -9999px; top: 0`
    — deliberately not `display: none`, since `getVisiblePrintRoot()`
    needs it actually laid out with real client rects), waits a couple of
    frames + a short settle, runs the exact same `runSmartFix` engine
    against it (all mutations silent — a bulk run across many unrelated
    papers shouldn't bury the undo stack), unmounts, moves to the next.
  - Per-paper progress row (pending → processing → fit ✓ / couldn't
    comfortably fit ✗).
  - My Papers page never shows its own regular preview, so there's no
    DOM-order ambiguity with any other `#print-root` while this runs.
- `src/pages/MyPapers.jsx` — added a "✨ Batch Smart Fix" button next to
  "Create Paper", opening the new dialog.
- i18n strings under `batchSmartFix_*` (English + Hindi).

**Confirmed:** `npm run build` succeeds with the full Smart Fix round 2 +
Batch Smart Fix feature set in place.

### Feature — Teacher-friendly terminology audit (COMPLETE)
Audited the visible UI (i18n `en` dictionary + hardcoded label text) for
the jargon list in the brief. Most of the app already used plain wording;
actually changed:
- "Typography" → **"Text & Font"** — the Page Settings tab label
  (`pageSettings_typography` in `i18n/index.js`), plus the matching
  references in `pages/HelpGuidance.jsx` (`PAGE_SETTINGS_TABS`, the
  font-size/line-spacing → tab-name map) and `data/helpData.js` ("Go to
  the … tab." guides), so every place that names this tab stayed
  consistent.
- "Auto Saved" → **"Saved"** in `components/builder/MarksSummaryBar.jsx`
  (there's already a ✓ checkmark icon next to it).
- "Export a clean PDF…" → **"Download a clean PDF…"** on the public
  Landing page, to match the "Download" wording used everywhere else in
  the app (Export/Download were previously mixed).

Left as-is (already fine — not blindly renamed):
- "Footer Alignment" — already plain, contextual wording.
- Wording inside `components/layout/FirstRunIntro.jsx` — this component
  was already retired in favour of the spotlight tour (`TourOverlay`) and
  is no longer rendered anywhere, so it isn't visible UI.
- "Properties", "Content Block", "Insert Element", "Configuration",
  "Canvas", "Layout Properties", "Rich Text Editor", "Drag & Drop",
  "Node" — none of these appear as visible UI text anywhere in this
  codebase (checked via full-project search), so there was nothing to
  rename.

### Feature — Optional Quick Setup (COMPLETE)
- `src/components/exam/QuickSetupDialog.jsx` — new dialog:
  - "What does your paper contain?" checklist built directly from the
    real `QUESTION_TYPES` registry in `data/mockData.js` (no hardcoded
    list).
  - For each checked type: **Marks per question** + **Number of
    questions**, with a live per-type total and a running grand total —
    no "Calculate" button, same pattern as `MarksSummaryBar.jsx`.
  - Compares the grand total against the paper's Total Marks (from Step
    3's `form.totalMarks`): match → green "✓ N / N Marks" and an enabled
    **Open Builder**; mismatch → a clear warning and a softer, explicit
    **Open Builder anyway** (never a silent proceed, never a hard block).
  - Basic validation: every marks/count field must be a positive number,
    with a plain-language message (no technical text) if not.
  - On confirm, hands back a `sections` array in the exact shape
    `QUICK_START_TEMPLATES` already uses — `{ questionGroups: [{
    questionType, mode: 'normal', questionCount, marksPerQuestion }] }`.
- `src/pages/CreateExam.jsx`:
  - Added exactly one new element to Step 3 (`step === 2`): a
    `⚡ Quick Setup` button. Nothing else on that step changed. A teacher
    who never clicks it sees zero difference from the previous flow.
  - `submit()` now optionally takes a `quickSetupSections` argument and
    applies it with the **exact same** `addSection` + `addQuestionGroup`
    calls the existing quick-start-template flow already uses right
    above it — real sections/question groups, not a parallel data model.
  - Confirming Quick Setup re-runs the same Step-3 field validation the
    normal "Continue" button uses, then calls `submit(sections)` and
    lands on the normal `/paper/:id?view=edit` builder route, fully
    editable like any other paper.
- New i18n strings under `quickSetup_*` (English only; Hindi falls back
  automatically, per existing `useTranslate()` behavior).

**Confirmed**: `npm run build` succeeds with everything above in place
(re-verified after the terminology pass and again after Quick Setup).

## ❌ Not started / out of scope for this round

- Nothing outstanding from the brief for this round (terminology audit +
  Quick Setup). Everything requested has been implemented and build-
  verified.
- Unrelated pre-existing gap, noted for awareness only: the per-tab
  guided tour (`tourStore.js` / `components/tour/`) auto-starts on
  Dashboard, the Builder's Edit/Preview tabs, and My Papers, but the
  Question Bank and Templates pages don't yet have their `startIfUnseen`
  trigger wired up (the step content for both already exists in
  `tourSteps.js`, under the `questionBank` and `templates` keys — just
  the two page-level "call it on mount" effects are missing). This was
  not part of the terminology/Quick Setup brief, so it was left
  untouched rather than bundled in silently.

## Manual testing still worth doing in a real browser

- Smart Fix: run it on a paper with images/tables/multiple sections, undo
  it, then export to PDF and confirm the PDF matches what Smart Fix left
  on screen.
- Smart Fix "spread out": open a paper that trails off onto a mostly-empty
  last page, confirm the target dropdown offers the "(spread to fill)"
  option, run it, and check the paper now fills that page instead of
  leaving obvious dead space.
- Smart Fix widow protection: construct a paper where a question straddles
  a page break, run Smart Fix/Force Fit, and confirm that question's own
  "keep together" setting got turned on (and turns back off on Undo).
- Smart Fix live thumbnail: confirm the small preview inside the dialog
  visibly updates while optimizing, and that it never gets mistaken for
  the real page (e.g. exported PDF still matches the main preview, not the
  thumbnail).
- Smart Fix memory: run Smart Fix on a paper, pick a non-default target,
  close and reopen the dialog (or leave and come back), confirm the same
  target is prefilled; try it on a second, different paper to confirm the
  memory is per-paper, not global.
- Batch Smart Fix: from My Papers, select several papers with different
  current page counts (including at least one that already fits and one
  that can't comfortably reach the target), run it, and confirm each row's
  status lands correctly and the papers themselves show the same result as
  running Smart Fix on each individually.
- Quick Setup: try a mismatch, fix it live without closing the dialog,
  then confirm the resulting builder has fully editable sections/questions
  (add/delete/reorder/marks-change all still work).
- Full combined flow: Quick Setup → write questions → Smart Fix → double-
  click a question in Preview to jump into editing it → download PDF.
