// Help & Guidance content — plain step-by-step guides for non-technical
// teachers/school admins. `schoolOnly: true` items are hidden from the
// Teacher nav's Help page automatically by the page component.

export const HELP_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    topics: [
      {
        id: 'create-exam',
        q: 'How to create an exam?',
        steps: [
          'From the sidebar, click "Create Exam".',
          'Step 1: choose the exam type (Unit Test, Half Yearly, Final, etc. or "Custom") and pick the exam date.',
          'Step 2: pick the class, section and subject (or choose "Custom" to type your own).',
          'Step 3: set the duration and total marks — the school name and address are filled in for you automatically, but you can edit them.',
          'Click "Create" on the last step — your new paper opens straight in the Paper Builder, ready to add questions.',
        ],
        tip: 'Any field with a "Custom" option lets you type your own text if the ready-made choices don\'t fit.',
      },
      {
        id: 'first-question-paper',
        q: 'How to create your first question paper?',
        steps: [
          'Create an exam first (see "How to create an exam?" above) — this opens the Paper Builder.',
          'Use "Add Section" to create sections like Section A, Section B, etc.',
          'Inside a section, use "Add Question Group" to add questions — type each question and its marks.',
          'Use the gear icon (Page Settings) any time to change how the paper looks — font, spacing, borders, margins and more.',
          'Switch to the "Preview" tab (or the Preview icon on mobile) to see exactly how the printed paper will look.',
          'When you\'re happy with it, use "Download" to export it as PDF/Word, or "Save" to keep working on it later from "My Papers".',
        ],
        tip: 'Your paper auto-saves as you type, so you can safely close the tab and come back later from "My Papers".',
      },
      {
        id: 'add-section-questions',
        q: 'How to add sections and questions?',
        steps: [
          'Open your paper in the Paper Builder.',
          'Click "Add Section" to create a new section (e.g. Section A — Multiple Choice).',
          'Inside a section, click "Add Question Group" and choose the question type (MCQ, Fill in the blanks, Long answer, etc.).',
          'Type the question text and marks for each question — click "Add Question" to add more inside the same group.',
          'Drag a section or question using its handle to reorder it.',
        ],
      },
    ],
  },
  {
    id: 'formatting',
    title: 'Formatting Your Paper',
    topics: [
      {
        id: 'font-size',
        q: 'How to change font size?',
        steps: [
          'Open your paper and click the gear icon (Page Settings) above the preview.',
          'Go to the "Text & Font" tab.',
          'Choose a ready-made size from "Font Size" (Small / Normal / Large), or pick "Custom" and type the exact size you want.',
          'The preview updates instantly so you can see the change before saving.',
        ],
        tip: 'Want to change just ONE line (like only the title)? Click that line in the preview — a small toolbar appears; tap the "Aa" icon on it to set a font size for that line only, without touching the rest of the paper.',
      },
      {
        id: 'line-spacing',
        q: 'How to change line spacing?',
        steps: [
          'Open your paper and click the gear icon (Page Settings).',
          'Go to the "Text & Font" tab.',
          'Choose "Line Height" — pick Compact / Normal / Relaxed, or "Custom" to set an exact value.',
          'This applies to the whole paper. To adjust spacing for a single line only, click that line and use the "Aa" icon in its toolbar.',
        ],
      },
      {
        id: 'border',
        q: 'How to add and remove a border?',
        steps: [
          'Open your paper and click the gear icon (Page Settings).',
          'Go to the "Border & Frame" tab.',
          'Under "Border", choose where you want it: Whole Paper, Header Only, Both, or "None" to remove it completely.',
          'Once a border is on, you can also set its "Style" (solid/dashed/dotted) and "Width" (thin/medium/thick) on the same tab.',
        ],
        tip: 'Pick "None" any time to remove the border again — nothing is deleted, you can switch it back on later.',
      },
      {
        id: 'page-spacing-margins',
        q: 'How to change page size, margins and spacing?',
        steps: [
          'Open the gear icon (Page Settings).',
          '"Page & Paper" tab — change paper size (A4/Letter), orientation, and number of columns.',
          '"Spacing" tab — adjust the gap between questions and sections.',
          '"Background" tab — add a light watermark or background colour.',
          '"Numbering" tab — turn page numbers on/off and choose their position.',
        ],
      },
    ],
  },
  {
    id: 'reuse',
    title: 'Templates & Question Bank',
    topics: [
      {
        id: 'use-template',
        q: 'How to use a template?',
        steps: [
          'Go to "Templates" in the sidebar.',
          'Browse the ready-made templates and click "Use Template" on the one you like.',
          'This opens "Create Exam" with everything pre-filled — just review the details and click Create.',
          'To save one of your own papers as a reusable template, open it in the Paper Builder and use "Save as Template".',
        ],
      },
      {
        id: 'question-bank',
        q: 'How to use the Question Bank?',
        steps: [
          'Go to "Question Bank" in the sidebar to see all questions you\'ve saved before.',
          'While building a paper, use "Add from Question Bank" inside a section to reuse a saved question instead of typing it again.',
          'Any new question you type in the Paper Builder can be saved to the bank for future papers too.',
        ],
      },
    ],
  },
  {
    id: 'school',
    title: 'School Management',
    schoolOnly: true,
    topics: [
      {
        id: 'add-teacher',
        q: 'How to add a teacher?',
        schoolOnly: true,
        steps: [
          'Go to "Teachers" in the sidebar (School Admin account only).',
          'Click "Add Teacher".',
          'Enter the teacher\'s name and mobile number, then click "Add teacher".',
          'The teacher appears in your list with an "Invited" badge until they sign in for the first time using that mobile number — the badge then changes to "Active".',
        ],
        tip: 'The invite SMS with the sign-in link is sent automatically to the mobile number you enter.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Billing',
    topics: [
      {
        id: 'subscribe',
        q: 'How to subscribe / upgrade my plan?',
        steps: [
          'Go to "Subscription" in the sidebar.',
          'Compare the plans shown (Free, Teacher Pro / School Pro).',
          'Click "Upgrade" on the plan you want.',
          'Complete the payment on the secure checkout screen that opens.',
          'Your plan updates automatically as soon as payment succeeds — no need to log out or refresh.',
        ],
        tip: 'A School Admin\'s plan covers every teacher added under that school — teachers under a school don\'t need to subscribe separately.',
      },
      {
        id: 'download-locked',
        q: 'Why is Download locked on my paper?',
        steps: [
          'Downloading a paper as PDF/Word uses your monthly download quota.',
          'If you\'re on the Free plan and have used up your free downloads, a lock screen will appear when you click "Download".',
          'Click "Upgrade" on that screen (or go to "Subscription") to unlock more downloads.',
        ],
      },
      {
        id: 'change-language-theme',
        q: 'How to change the app language or theme (light/dark)?',
        steps: [
          'Go to "Settings" in the sidebar.',
          'Under "Appearance", choose Light, Dark or System theme.',
          'Under "Language", switch between English and Hindi (more languages coming soon).',
        ],
      },
      {
        id: 'replay-tour',
        q: 'How to replay the guided app tour?',
        steps: [
          'Go to "Settings" in the sidebar.',
          'Scroll to the guided tour options and click "Replay" next to Dashboard, Edit or Preview tour.',
          'The on-screen spotlight tour will start again from the beginning for that screen.',
        ],
      },
    ],
  },
]
