import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/utils'

/**
 * schoolStore — sections 9/22/25.
 *
 * Owns the school-side resources a School admin manages: the teacher roster
 * and the shared header/footer templates teachers can apply to their papers.
 *
 * Backend contract this stands in for (see services/schoolApi.js and
 * services/templateApi.js):
 *   schoolApi.getTeachers() / addTeacher() / removeTeacher()
 *   templateApi.list() / save() / remove()
 */

// Realistic seed roster (section 37) so the table is never empty on a demo.
const seedTeachers = [
  { id: 'tch_1', name: 'Rahul Sharma', mobile: '9876543211', email: 'rahul.sharma@dps.edu', subject: 'Mathematics', papers: 12, status: 'active', joinedAt: '2026-01-08T09:00:00.000Z' },
  { id: 'tch_2', name: 'Priya Menon', mobile: '9876543212', email: 'priya.menon@dps.edu', subject: 'Science', papers: 9, status: 'active', joinedAt: '2026-01-12T09:00:00.000Z' },
  { id: 'tch_3', name: 'Amit Verma', mobile: '9876543213', email: 'amit.verma@dps.edu', subject: 'Physics', papers: 6, status: 'active', joinedAt: '2026-01-20T09:00:00.000Z' },
  { id: 'tch_4', name: 'Sneha Kulkarni', mobile: '9876543214', email: 'sneha.k@dps.edu', subject: 'English', papers: 4, status: 'invited', joinedAt: '2026-02-14T09:00:00.000Z' },
]

// Section 25 — a school template is the reusable header/footer/formatting
// shell. Applying one patches a paper's `settings`, which is exactly the
// shape the builder's Paper Settings panel already reads.
const seedTemplates = [
  {
    id: 'tpl_1',
    name: 'DPS Standard Header',
    description: 'Centred logo, school name and exam title — the default for all term exams.',
    isDefault: true,
    settings: {
      template: 'school',
      headerLayout: 'center',
      showAddress: true,
      footerText: 'Delhi Public School — Best of luck!',
      showPageNumber: true,
      border: 'paper',
      marksPosition: 'bracket',
    },
  },
  {
    id: 'tpl_2',
    name: 'Board Pattern (Pre-Board)',
    description: 'Split header with logo on the left, instructions block, page numbers on every page.',
    isDefault: false,
    settings: {
      template: 'classic',
      headerLayout: 'split',
      showPageNumber: true,
      border: 'header',
      marksPosition: 'bracket',
      instructions: [
        'All questions are compulsory.',
        'Write your roll number on the top of the answer sheet.',
        'Marks for each question are indicated against it.',
      ],
    },
  },
  {
    id: 'tpl_3',
    name: 'Unit Test — Minimal',
    description: 'Compact single-page look for short class tests. No border, no page number.',
    isDefault: false,
    settings: {
      template: 'minimal',
      headerLayout: 'center',
      showPageNumber: false,
      border: 'none',
      marksPosition: 'plain',
    },
  },
]

export const useSchoolStore = create(
  persist(
    (set, get) => ({
      teachers: seedTeachers,
      templates: seedTemplates,

      // ---------------- Teachers (section 22) ----------------
      addTeacher: (data) => {
        const teacher = {
          id: uid('tch'),
          name: data.name,
          mobile: data.mobile,
          email: data.email || '',
          subject: data.subject || '',
          papers: 0,
          status: 'invited',
          joinedAt: new Date().toISOString(),
        }
        set((s) => ({ teachers: [...s.teachers, teacher] }))
        return teacher
      },

      removeTeacher: (id) => set((s) => ({ teachers: s.teachers.filter((t) => t.id !== id) })),

      getTeacher: (id) => get().teachers.find((t) => t.id === id),

      // ---------------- Shared templates (section 25) ----------------
      saveTemplate: (data) => {
        if (data.id) {
          set((s) => ({ templates: s.templates.map((tpl) => (tpl.id === data.id ? { ...tpl, ...data } : tpl)) }))
          return data
        }
        const template = {
          id: uid('tpl'),
          name: data.name,
          description: data.description || '',
          isDefault: false,
          settings: data.settings || {},
        }
        set((s) => ({ templates: [...s.templates, template] }))
        return template
      },

      removeTemplate: (id) => set((s) => ({ templates: s.templates.filter((tpl) => tpl.id !== id) })),

      setDefaultTemplate: (id) =>
        set((s) => ({ templates: s.templates.map((tpl) => ({ ...tpl, isDefault: tpl.id === id })) })),

      defaultTemplate: () => get().templates.find((tpl) => tpl.isDefault) || null,
    }),
    { name: 'papercraft-school' }
  )
)
