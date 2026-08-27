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
  'Short Answer',
  'Very Short Answer',
  'Detailed Answer',
  'Long Answer',
  'Word Meaning',
  'Fill in the Blanks',
  'True/False',
  'One Word Answer',
  'Match the Following',
  'Custom',
]

export const GROUP_MODES = [
  { value: 'normal', label: 'Normal / All Questions' },
  { value: 'attempt_any', label: 'Attempt Any' },
  { value: 'or', label: 'Optional / OR' },
]

export const CLASS_OPTIONS = [
  'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
]

export const SECTION_OPTIONS = ['A', 'B', 'C', 'D']

export const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Science',
  'Physics', 'Chemistry', 'Biology', 'Computer Science',
]

export const mockTeacher = {
  id: 'teacher_1',
  name: 'Anita Sharma',
  mobile: '9876543210',
  school: 'Green Valley Public School',
}

function q(text, marks) {
  return { id: uid('q'), text, marks }
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
    sections: [
      {
        id: uid('sec'),
        title: 'Objective Questions',
        instruction: 'Answer all questions.',
        questionGroups: [
          {
            id: uid('qg'),
            questionType: 'True/False',
            mode: 'normal',
            questionCount: 5,
            attemptCount: 5,
            marksPerQuestion: 1,
            instruction: 'State whether the following are True or False.',
            questions: [
              q('Sound cannot travel through vacuum.', 1),
              q('Atoms are indivisible.', 1),
              q('Plants release oxygen during photosynthesis.', 1),
              q('The SI unit of force is Newton.', 1),
              q('Diffusion occurs faster in gases than in liquids.', 1),
            ],
          },
        ],
      },
    ],
  },
]
