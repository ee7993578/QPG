import { create } from 'zustand'

/**
 * Personal "My Templates" — header/layout templates a teacher saved
 * straight from one of their own papers (see paperTemplateApi.js). Kept as
 * its own tiny store, separate from schoolStore's shared school templates.
 */
export const useMyTemplatesStore = create(() => ({
  templates: [],
  templatesLoaded: false,
  templatesLoading: false,
}))
