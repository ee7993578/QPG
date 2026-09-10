// Sections 23/24 — static lookup data for the Question Bank pages
// (difficulty levels + chapter lists per subject, used to populate filter
// dropdowns and the add/edit form). Actual question bank *items* are never
// static — they come from the backend via services/questionBankApi.js and
// are cached in store/questionBankStore.js.

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
