import { uid } from '../lib/utils'

// Sections 23/24 — seed data for the Question Bank pages. Richer than the
// builder's small QUESTION_BANK insert-list (mockData.js) because the bank
// pages filter by class, chapter and difficulty too. Realistic content, no
// lorem ipsum (section 37).

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export const CHAPTERS = {
  Mathematics: ['Real Numbers', 'Polynomials', 'Linear Equations', 'Triangles', 'Circles', 'Statistics', 'Probability'],
  Science: ['Chemical Reactions', 'Acids & Bases', 'Life Processes', 'Light', 'Electricity', 'Our Environment'],
  English: ['Reading Comprehension', 'Grammar', 'Writing Skills', 'Literature — Prose', 'Literature — Poetry'],
  Hindi: ['गद्य खंड', 'काव्य खंड', 'व्याकरण', 'रचना'],
  'Social Science': ['Nationalism in India', 'Resources & Development', 'Power Sharing', 'Money & Credit'],
  Physics: ['Motion', 'Force & Laws of Motion', 'Gravitation', 'Work & Energy', 'Sound'],
  Chemistry: ['Matter', 'Atoms & Molecules', 'Structure of the Atom', 'Carbon Compounds'],
  Biology: ['Cell Structure', 'Tissues', 'Control & Coordination', 'Heredity'],
  'Computer Science': ['Python Basics', 'Data Types', 'Loops & Conditionals', 'Databases'],
}

export function chaptersFor(subject) {
  return CHAPTERS[subject] || []
}

function bq(subject, className, chapter, questionType, difficulty, text, marks, extra = {}) {
  return {
    id: uid('bq'),
    subject,
    className,
    chapter,
    questionType,
    difficulty,
    text,
    marks,
    options: [],
    createdAt: '2026-02-10T09:00:00.000Z',
    ...extra,
  }
}

// A teacher's own personal bank (section 24 — "My Questions").
export const seedTeacherQuestions = [
  bq('Mathematics', 'X', 'Real Numbers', 'MCQ', 'Easy', 'The HCF of 24 and 36 is:', 1, {
    options: ['6', '12', '18', '24'],
  }),
  bq('Mathematics', 'X', 'Polynomials', 'Short Answer', 'Medium', 'Find the zeroes of the polynomial x² − 7x + 12.', 2),
  bq('Mathematics', 'X', 'Triangles', 'Long Answer', 'Hard', 'Prove that the sum of the angles of a triangle is 180°.', 5),
  bq('Mathematics', 'IX', 'Statistics', 'Short Answer', 'Easy', 'The mean of 5 observations is 10. Find their sum.', 2),
  bq('Science', 'X', 'Electricity', 'MCQ', 'Medium', 'Which of the following is a good conductor of electricity?', 1, {
    options: ['Rubber', 'Copper', 'Glass', 'Wood'],
  }),
  bq('Science', 'X', 'Life Processes', 'Very Short Answer', 'Easy', 'Name the powerhouse of the cell.', 1),
  bq('Science', 'IX', 'Motion', 'Short Answer', 'Medium', 'Differentiate between speed and velocity with one example each.', 2),
  bq('English', 'X', 'Grammar', 'Fill in the Blanks', 'Easy', 'She ______ (go) to school every day.', 1),
  bq('English', 'X', 'Literature — Poetry', 'Detailed Answer', 'Hard', 'Discuss the central idea of the poem "Dust of Snow".', 5),
  bq('Hindi', 'X', 'व्याकरण', 'One Word Answer', 'Easy', '"विद्यालय" शब्द का संधि-विच्छेद कीजिए।', 1),
  bq('Social Science', 'X', 'Nationalism in India', 'Detailed Answer', 'Hard', 'Explain the causes and impact of the Non-Cooperation Movement.', 5),
  bq('Social Science', 'X', 'Money & Credit', 'True/False', 'Easy', 'Formal sources of credit include moneylenders.', 1),
]

// The school-wide shared bank (section 23). Contributed by named teachers so
// the "shared resource" idea is visible in the UI.
export const seedSchoolQuestions = [
  bq('Mathematics', 'X', 'Circles', 'Long Answer', 'Hard', 'Prove that the tangent at any point of a circle is perpendicular to the radius through the point of contact.', 5, {
    author: 'Rahul Sharma',
  }),
  bq('Mathematics', 'XII', 'Probability', 'Short Answer', 'Medium', 'A die is thrown twice. Find the probability of getting a sum of 8.', 3, {
    author: 'Rahul Sharma',
  }),
  bq('Science', 'X', 'Chemical Reactions', 'Assertion-Reason', 'Medium', 'Assertion: Rusting of iron is a redox reaction. Reason: Iron gains oxygen during rusting.', 1, {
    author: 'Priya Menon',
  }),
  bq('Science', 'X', 'Acids & Bases', 'Short Answer', 'Medium', 'Why does dry HCl gas not change the colour of dry litmus paper?', 2, {
    author: 'Priya Menon',
  }),
  bq('Physics', 'XI', 'Work & Energy', 'Detailed Answer', 'Hard', 'State and prove the work–energy theorem for a variable force.', 5, {
    author: 'Amit Verma',
  }),
  bq('Chemistry', 'XI', 'Structure of the Atom', 'MCQ', 'Medium', 'The maximum number of electrons in the M shell is:', 1, {
    options: ['8', '18', '32', '2'],
    author: 'Amit Verma',
  }),
  bq('English', 'IX', 'Reading Comprehension', 'Detailed Answer', 'Medium', 'Read the given passage and answer the questions that follow in your own words.', 5, {
    author: 'Sneha Kulkarni',
  }),
  bq('Computer Science', 'XI', 'Loops & Conditionals', 'Short Answer', 'Easy', 'Write a Python program to print the first 10 natural numbers using a while loop.', 3, {
    author: 'Sneha Kulkarni',
  }),
  bq('Biology', 'X', 'Heredity', 'Short Answer', 'Medium', 'Explain Mendel’s law of independent assortment with a suitable example.', 3, {
    author: 'Priya Menon',
  }),
  bq('Social Science', 'X', 'Power Sharing', 'Short Answer', 'Easy', 'List any two prudential reasons for power sharing in a democracy.', 2, {
    author: 'Sneha Kulkarni',
  }),
]
