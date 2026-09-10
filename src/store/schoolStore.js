import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * schoolStore — sections 9/22/25.
 *
 * Now a thin local cache: schoolApi.js and templateApi.js populate
 * `teachers`/`templates` from the real backend (GET/POST/DELETE
 * /api/school/teachers, /api/school/templates) and write results back here
 * with setState so every page reading useSchoolStore keeps working
 * unchanged.
 */
export const useSchoolStore = create(
  persist(
    (set, get) => ({
      teachers: [],
      templates: [],
      teachersLoaded: false,
      templatesLoaded: false,

      // School Paper Submission Deadline (deadlineApi.js). `schoolDeadline`
      // is the raw SchoolDeadlineResponse from the backend (configured,
      // status, teacherActionAllowed, serverNow, ...) — read via
      // lib/schoolDeadline.js helpers, never re-derived from browser time.
      schoolDeadline: null,
      schoolDeadlineLoaded: false,
      schoolDeadlineHistory: [],
      schoolDeadlineHistoryLoaded: false,

      getTeacher: (id) => get().teachers.find((t) => t.id === id),

      defaultTemplate: () => get().templates.find((tpl) => tpl.isDefault) || null,
    }),
    {
      name: 'papercraft-school',
      partialize: () => ({}), // backend is the source of truth now — nothing to persist locally
    }
  )
)
