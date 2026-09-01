import { uid } from '../lib/utils'

export const EXAM_TYPES = [
  'Unit Test',
  'Monthly Test',
  'Half Yearly',
  'Annual',
  'Pre-Board',
  'Terminal Examination',
  'Custom',
]

export const DURATIONS = [
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
  { label: '90 minutes', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '2 hours 30 minutes', value: 150 },
  { label: '3 hours', value: 180 },
  { label: 'Custom', value: 'custom' },
]

export const QUESTION_TYPES = [
  'MCQ',
  'Multiple Choice',
  'Assertion-Reason',
  'Short Answer',
  'Very Short Answer',
  'Detailed Answer',
  'Long Answer',
  'Word Meaning',
  'Fill in the Blanks',
  'True/False',
  'One Word Answer',
  'Match the Following',
  'Table/Grid',
  'Case Study',
  'Custom',
]

// Question types that use a discrete options list (SRS 18/19).
export const OPTION_BASED_TYPES = ['MCQ', 'Multiple Choice', 'Assertion-Reason']

export const GROUP_MODES = [
  { value: 'normal', label: 'Normal / All Questions' },
  { value: 'attempt_any', label: 'Attempt Any' },
  { value: 'or', label: 'Optional / OR' },
]

// SRS 6 — answer space is a layout property, independent of marks.
export const ANSWER_SPACE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '1', label: '1 Line' },
  { value: '2', label: '2 Lines' },
  { value: '4', label: '4 Lines' },
  { value: '6', label: '6 Lines' },
  { value: 'half', label: 'Half Page' },
  { value: 'full', label: 'Full Page' },
  { value: 'custom', label: 'Custom Height' },
  { value: 'drawing', label: 'Drawing Space' },
]

// SRS 21/23 — section numbering style.
export const NUMBERING_STYLES = [
  { value: 'numeric', label: '1. 2. 3.' },
  { value: 'q-numeric', label: 'Q1. Q2. Q3.' },
  { value: 'numeric-paren', label: '1) 2) 3)' },
  { value: 'alpha-paren', label: '(a) (b) (c)' },
  { value: 'roman-paren', label: '(i) (ii) (iii)' },
]

// SRS 26 — marks positioning.
export const MARKS_POSITIONS = [
  { value: 'bracket', label: '[2]' },
  { value: 'paren', label: '(2)' },
  { value: 'plain', label: '2' },
]

export const OPTIONS_LAYOUTS = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'grid', label: 'Two Columns' },
]

export const HEADER_LAYOUTS = [
  { value: 'center', label: 'Logo Centered / Above' },
  { value: 'split', label: 'Logo Left, Text Right' },
  { value: 'split-both', label: 'Logo Both Sides' },
]

export const PAPER_TEMPLATES = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'school', label: 'School Standard' },
]

export const PAPER_SIZES = [
  { value: 'A4', label: 'A4 (210 × 297 mm)', widthPx: 720, aspect: 210 / 297 },
  { value: 'A5', label: 'A5 (148 × 210 mm)', widthPx: 520, aspect: 148 / 210 },
  { value: 'Letter', label: 'Letter (8.5 × 11 in)', widthPx: 720, aspect: 8.5 / 11 },
  { value: 'Legal', label: 'Legal (8.5 × 14 in)', widthPx: 720, aspect: 8.5 / 14 },
]

export const PAPER_SETS = ['A', 'B', 'C']

// Feature 9 — border can be drawn around the whole paper, only the header, both, or none.
export const BORDER_OPTIONS = [
  { value: 'none', labelKey: 'border_none' },
  { value: 'paper', labelKey: 'border_paper' },
  { value: 'header', labelKey: 'border_header' },
  { value: 'both', labelKey: 'border_both' },
]

// Feature 2 / 7 — simple left/center/right horizontal alignment, cycled by one click.
export const ALIGN_CYCLE = ['left', 'center', 'right']
export function nextAlign(current) {
  const idx = ALIGN_CYCLE.indexOf(current || 'left')
  return ALIGN_CYCLE[(idx + 1) % ALIGN_CYCLE.length]
}

// SRS 47 — a small static Question Bank teachers can insert from instead of
// typing from scratch. Grouped loosely by subject; real backend would page
// and search a much larger store.
export const QUESTION_BANK = [
  { id: 'bank_1', subject: 'Mathematics', questionType: 'MCQ', text: 'The HCF of 24 and 36 is:', marks: 1 },
  { id: 'bank_2', subject: 'Mathematics', questionType: 'Short Answer', text: 'Find the roots of x² - 7x + 12 = 0.', marks: 2 },
  { id: 'bank_3', subject: 'Mathematics', questionType: 'Long Answer', text: 'Prove that the sum of the angles of a triangle is 180°.', marks: 5 },
  { id: 'bank_4', subject: 'Science', questionType: 'True/False', text: 'Metals are good conductors of electricity.', marks: 1 },
  { id: 'bank_5', subject: 'Science', questionType: 'Very Short Answer', text: 'Name the powerhouse of the cell.', marks: 1 },
  { id: 'bank_6', subject: 'Science', questionType: 'Short Answer', text: 'Differentiate between speed and velocity.', marks: 2 },
  { id: 'bank_7', subject: 'English', questionType: 'Fill in the Blanks', text: 'She ______ (go) to school every day.', marks: 1 },
  { id: 'bank_8', subject: 'English', questionType: 'Word Meaning', text: 'Give the meaning of the word "Benevolent".', marks: 1 },
  { id: 'bank_9', subject: 'Social Science', questionType: 'One Word Answer', text: 'Who was the first President of India?', marks: 1 },
  { id: 'bank_10', subject: 'Social Science', questionType: 'Detailed Answer', text: 'Explain the causes of the French Revolution.', marks: 5 },
]

export const FONT_FAMILIES = [
  { value: 'sans', label: 'Default (Sans)' },
  { value: 'serif', label: 'Serif (Times-like)' },
  { value: 'display', label: 'Display / Headings Font' },
]

// SRS 51 — special symbol palette, grouped by subject.
export const SYMBOL_GROUPS = [
  { label: 'Math', symbols: ['√', '∛', '∜', '±', '×', '÷', '∑', '∏', '∫', '∮', '∞', '≤', '≥', '≠', '≈', '≡', '∝', 'π', '°', '∆', '∂', '∇', '%', '‰'] },
  { label: 'Sets & Logic', symbols: ['∈', '∉', '⊂', '⊆', '⊄', '∪', '∩', '∅', '∀', '∃', '¬', '∧', '∨', '⇒', '⇔', '∴', '∵'] },
  { label: 'Greek (lower)', symbols: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'φ', 'χ', 'ψ', 'ω'] },
  { label: 'Greek (upper)', symbols: ['Γ', 'Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω'] },
  { label: 'Physics', symbols: ['Ω', 'θ', 'λ', 'μ', 'Δ', '→', '←', '↔', '⇌', 'α', 'β', 'γ', '∝', '⊥', '∥', 'ħ', 'ε₀', 'μ₀', '°C', '°F', 'Å'] },
  { label: 'Chemistry — reactions', symbols: ['→', '⇌', '⇋', '⇄', '↔', 'Δ', '↑', '↓', '·', '(s)', '(l)', '(g)', '(aq)', '(cat.)'] },
  { label: 'Chemistry — formulas', symbols: ['H₂O', 'CO₂', 'O₂', 'H₂', 'N₂', 'NH₃', 'CH₄', 'H₂SO₄', 'NaOH', 'CaCO₃', '⁺', '⁻', '²⁺', '²⁻'] },
  { label: 'Ready-made super/sub', symbols: ['x²', 'x³', 'xⁿ', 'x₁', 'x₂', 'aⁿ', 'H₂O'] },
]

export const CLASS_OPTIONS = [
  'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
]

export const SECTION_OPTIONS = ['A', 'B', 'C', 'D']

export const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Science',
  'Physics', 'Chemistry', 'Biology', 'Computer Science',
]

// Feature — Class / Section / Subject pickers also offer "Custom" (type your
// own) and "None" (omit the field from the paper entirely), same pattern as
// the existing Exam Type "Custom" option.
export const CLASS_PICKER_OPTIONS = [...CLASS_OPTIONS, 'Custom', 'None']
export const SECTION_PICKER_OPTIONS = [...SECTION_OPTIONS, 'Custom', 'None']
export const SUBJECT_PICKER_OPTIONS = [...SUBJECTS, 'Custom', 'None']

// Quick-start templates — Easy-to-use flow: a non-technical teacher can pick
// a ready-made pattern instead of starting from a totally blank paper.
// `sections[].questionGroups[]` overrides feed straight into the store's
// addSection/addQuestionGroup, same shape their `initial` param expects.
export const QUICK_START_TEMPLATES = [
  {
    id: 'blank',
    title: 'Blank Paper',
    description: 'Start from scratch — add your own sections and questions.',
    icon: 'FileText',
  },
  {
    id: 'class-test',
    title: 'Quick Class Test',
    description: '1 section · 10 MCQs (1 mark each) — a fast objective-only test.',
    icon: 'Zap',
    sections: [
      { questionGroups: [{ questionType: 'MCQ', mode: 'normal', questionCount: 10, marksPerQuestion: 1 }] },
    ],
  },
  {
    id: 'mixed',
    title: 'Objective + Subjective Mix',
    description: 'Section A: 10 MCQs (1 mark) · Section B: 5 Short Answer (3 marks) · Section C: 2 Long Answer (5 marks)',
    icon: 'Layers',
    sections: [
      { questionGroups: [{ questionType: 'MCQ', mode: 'normal', questionCount: 10, marksPerQuestion: 1 }] },
      { questionGroups: [{ questionType: 'Short Answer', mode: 'normal', questionCount: 5, marksPerQuestion: 3 }] },
      { questionGroups: [{ questionType: 'Long Answer', mode: 'normal', questionCount: 2, marksPerQuestion: 5 }] },
    ],
  },
  {
    id: 'full-term',
    title: 'Full Term Exam Pattern',
    description: 'Section A: 20 MCQs (1) · Section B: 6 Short Answer (2) · Section C: 6 Short Answer (3) · Section D: 4 Long Answer (5)',
    icon: 'GraduationCap',
    sections: [
      { questionGroups: [{ questionType: 'MCQ', mode: 'normal', questionCount: 20, marksPerQuestion: 1 }] },
      { questionGroups: [{ questionType: 'Short Answer', mode: 'normal', questionCount: 6, marksPerQuestion: 2 }] },
      { questionGroups: [{ questionType: 'Short Answer', mode: 'normal', questionCount: 6, marksPerQuestion: 3 }] },
      { questionGroups: [{ questionType: 'Long Answer', mode: 'normal', questionCount: 4, marksPerQuestion: 5 }] },
    ],
  },
]

export const mockTeacher = {
  id: 'teacher_1',
  name: 'Anita Sharma',
  mobile: '9876543210',
  school: 'Green Valley Public School',
  address: '12 Civil Lines, Agra, Uttar Pradesh',
}

function q(text, marks, extra = {}) {
  return { id: uid('q'), text, marks, answerSpace: { type: 'none', lines: 4, heightMm: 40 }, dir: 'ltr', keepTogether: false, ...extra }
}

// Default header/template/marks-position settings a teacher can tweak from
// the Paper Settings panel (SRS 8, 17.2, 26, 27-30).
function defaultSettings(overrides = {}) {
  return {
    marksPosition: 'bracket',
    numberingStyle: 'numeric',
    headerLogoUrl: '',
    headerLayout: 'center',
    fontFamily: 'sans',
    watermarkText: '',
    footerText: '',
    showPageNumber: true,
    template: 'classic',
    paperSize: 'A4',
    // Feature 1 — optional header instructions list (bold "Instructions" label +
    // bullet list). Empty array = nothing shown at all.
    instructions: [],
    // Feature 5 — school name/address auto-filled from profile, still editable.
    showAddress: false,
    address: '',
    // Feature 9 — border around paper / header / both / none.
    border: 'none',
    ...overrides,
  }
}

// A couple of ready-made, fully-populated papers so Dashboard / My Paper
// screens have realistic content on first load.
export const seedPapers = [
  {
    id: 'paper_1',
    status: 'saved', // 'draft' | 'saved'
    examType: 'Annual',
    customExamName: '',
    duration: 180,
    totalMarks: 80,
    examDate: '2026-03-12',
    schoolName: 'Green Valley Public School',
    className: 'X',
    section: 'A',
    subject: 'Mathematics',
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-20T09:30:00.000Z',
    version: 3,
    settings: defaultSettings({ footerText: 'Prepared by: Anita Sharma' }),
    sections: [
      {
        id: uid('sec'),
        title: 'Objective Questions',
        instruction: 'All questions are compulsory.',
        questionGroups: [
          {
            id: uid('qg'),
            questionType: 'MCQ',
            mode: 'normal',
            questionCount: 5,
            attemptCount: 5,
            marksPerQuestion: 1,
            instruction: 'Choose the correct option.',
            questions: [
              q('The HCF of 12 and 18 is:', 1),
              q('Which of the following is a rational number?', 1),
              q('The value of √144 is:', 1),
              q('The degree of the polynomial 3x² + 2x + 1 is:', 1),
              q('If the mean of 5 numbers is 10, their sum is:', 1),
            ],
          },
          {
            id: uid('qg'),
            questionType: 'Fill in the Blanks',
            mode: 'normal',
            questionCount: 3,
            attemptCount: 3,
            marksPerQuestion: 1,
            instruction: 'Fill in the blanks with appropriate words.',
            questions: [
              q('The sum of angles of a triangle is ______ degrees.', 1),
              q('A number having only two factors is called a ______ number.', 1),
              q('The formula for area of a circle is ______.', 1),
            ],
          },
        ],
      },
      {
        id: uid('sec'),
        title: 'Short Answer Questions',
        instruction: 'Answer any 5 out of the given 7 questions.',
        questionGroups: [
          {
            id: uid('qg'),
            questionType: 'Short Answer',
            mode: 'attempt_any',
            questionCount: 7,
            attemptCount: 5,
            marksPerQuestion: 2,
            instruction: 'Attempt any 5 questions.',
            questions: [
              q('Solve for x: 2x + 5 = 15.', 2),
              q('Find the LCM of 15 and 20.', 2),
              q('Prove that √2 is irrational.', 2),
              q('Find the roots of x² - 5x + 6 = 0.', 2),
              q('Simplify: (3x + 2)(x - 4).', 2),
              q('Find the mean of 4, 8, 15, 16, 23.', 2),
              q('Convert 0.75 into a fraction in simplest form.', 2),
            ],
          },
        ],
      },
      {
        id: uid('sec'),
        title: 'Long Answer Questions',
        instruction: 'Attempt any one part of each question.',
        questionGroups: [
          {
            id: uid('qg'),
            questionType: 'Long Answer',
            mode: 'or',
            questionCount: 2,
            attemptCount: 1,
            marksPerQuestion: 5,
            instruction: 'Attempt Part A OR Part B.',
            questions: [
              q('(A) Prove that the diagonals of a rectangle are equal.', 5),
              q('(B) Prove that opposite angles of a cyclic quadrilateral are supplementary.', 5),
            ],
          },
        ],
      },
      {
        id: uid('sec'),
        title: 'Assertion, Passage & Skill-Based Questions',
        instruction: 'Read each item carefully before answering.',
        numberingStyle: 'numeric',
        restartNumbering: false,
        noticeBox: { enabled: true, text: 'Use of calculators is not permitted in this section.' },
        questionGroups: [
          {
            id: uid('qg'),
            questionType: 'Assertion-Reason',
            mode: 'normal',
            questionCount: 1,
            attemptCount: 1,
            marksPerQuestion: 1,
            negativeMarks: 0,
            optionsLayout: 'vertical',
            instruction: '',
            questions: (() => {
              const options = [
                { id: uid('opt'), text: 'Both A and R are true and R is the correct explanation of A.', imageUrl: '' },
                { id: uid('opt'), text: 'Both A and R are true but R is not the correct explanation of A.', imageUrl: '' },
                { id: uid('opt'), text: 'A is true but R is false.', imageUrl: '' },
                { id: uid('opt'), text: 'A is false but R is true.', imageUrl: '' },
              ]
              return [q('', 1, {
                assertion: 'Assertion (A): The diagonals of a parallelogram bisect each other.',
                reason: 'Reason (R): A parallelogram is a quadrilateral with both pairs of opposite sides parallel.',
                options,
                correctOptionId: options[0].id,
              })]
            })(),
          },
          {
            id: uid('qg'),
            questionType: 'Match the Following',
            mode: 'normal',
            questionCount: 1,
            attemptCount: 1,
            marksPerQuestion: 4,
            negativeMarks: 0,
            instruction: 'Match Column I with Column II.',
            questions: [
              q('', 4, {
                matchColumnHeads: ['Column I', 'Column II'],
                matchPairs: [
                  { id: uid('mp'), left: 'A. Circle', right: '1. πr²' },
                  { id: uid('mp'), left: 'B. Square', right: '2. side²' },
                  { id: uid('mp'), left: 'C. Rectangle', right: '3. length × breadth' },
                  { id: uid('mp'), left: 'D. Triangle', right: '4. ½ × base × height' },
                ],
              }),
            ],
          },
          {
            id: uid('qg'),
            questionType: 'Case Study',
            mode: 'normal',
            questionCount: 1,
            attemptCount: 1,
            marksPerQuestion: 6,
            negativeMarks: 0,
            passage: 'A ladder 5 m long is placed against a vertical wall such that the foot of the ladder is 3 m away from the base of the wall. A construction team plans similar ladder placements at three more sites with different distances from the wall.',
            instruction: 'Study the case and answer the following.',
            questions: [
              q('Answer the following based on the case above:', 6, {
                image: { url: '', width: 40, caption: 'Figure: ladder against a wall (diagram placeholder)' },
                answerSpace: { type: '4', lines: 4, heightMm: 40 },
                subQuestions: [
                  { id: uid('sq'), label: 'a', text: 'Find the height of the wall the ladder reaches.', marks: 2, orWith: false },
                  { id: uid('sq'), label: 'b', text: 'Find the height if the foot of the ladder is moved to 4 m from the wall (ladder length unchanged).', marks: 2, orWith: true },
                  { id: uid('sq'), label: 'c', text: 'State the Pythagoras theorem used above and draw a labelled diagram.', marks: 2, orWith: false },
                ],
              }),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'paper_2',
    status: 'draft',
    examType: 'Unit Test',
    customExamName: '',
    duration: 60,
    totalMarks: 25,
    examDate: '2026-02-10',
    schoolName: 'Green Valley Public School',
    className: 'IX',
    section: 'B',
    subject: 'Science',
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-02-05T11:15:00.000Z',
    version: 1,
    settings: defaultSettings({ marksPosition: 'plain', numberingStyle: 'q-numeric' }),
    sections: [
      {
        id: uid('sec'),
        title: 'Objective Questions',
        instruction: 'Answer all questions.',
        numberingStyle: 'q-numeric',
        questionGroups: [
          {
            id: uid('qg'),
            questionType: 'True/False',
            mode: 'normal',
            questionCount: 5,
            attemptCount: 5,
            marksPerQuestion: 1,
            negativeMarks: 0,
            instruction: 'State whether the following are True or False.',
            questions: [
              q('Sound cannot travel through vacuum.', 1),
              q('Atoms are indivisible.', 1),
              q('Plants release oxygen during photosynthesis.', 1),
              q('The SI unit of force is Newton.', 1),
              q('Diffusion occurs faster in gases than in liquids.', 1),
            ],
          },
          {
            id: uid('qg'),
            questionType: 'MCQ',
            mode: 'normal',
            questionCount: 1,
            attemptCount: 1,
            marksPerQuestion: 1,
            negativeMarks: 0.25,
            optionsLayout: 'grid',
            instruction: 'Choose the correct option. Diagram-based.',
            questions: (() => {
              const options = [
                { id: uid('opt'), text: 'Diagram A', imageUrl: '' },
                { id: uid('opt'), text: 'Diagram B', imageUrl: '' },
                { id: uid('opt'), text: 'Diagram C', imageUrl: '' },
                { id: uid('opt'), text: 'Diagram D', imageUrl: '' },
              ]
              return [q('Which of the following diagrams correctly shows the direction of diffusion of a gas from high to low concentration?', 1, {
                image: { url: '', width: 55, caption: 'Diagram: concentration gradient (placeholder)' },
                options,
                correctOptionId: options[2].id,
              })]
            })(),
          },
        ],
      },
      {
        id: uid('sec'),
        title: 'Short & Skill Based Questions',
        instruction: 'Answer any 2 of the following in the space provided.',
        numberingStyle: 'numeric',
        restartNumbering: true,
        questionGroups: [
          {
            id: uid('qg'),
            questionType: 'Very Short Answer',
            mode: 'attempt_any',
            questionCount: 3,
            attemptCount: 2,
            marksPerQuestion: 2,
            negativeMarks: 0,
            instruction: 'Attempt any 2 questions.',
            questions: [
              q('Define diffusion with one everyday example.', 2, { answerSpace: { type: '2', lines: 2, heightMm: 20 } }),
              q('State one difference between an atom and a molecule.', 2, { answerSpace: { type: '2', lines: 2, heightMm: 20 } }),
              q('Draw a well-labelled diagram of a plant cell.', 2, { answerSpace: { type: 'drawing', lines: 0, heightMm: 55 } }),
            ],
          },
        ],
      },
    ],
  },
]
