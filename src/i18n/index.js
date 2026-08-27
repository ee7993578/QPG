import { useAppStore } from '../store/useAppStore'

// Translation keys live here so the UI never hardcodes strings.
// English is complete; Hindi/Urdu/Arabic can be added as sibling objects
// without touching any component.
export const dictionaries = {
  en: {
    appName: 'PaperCraft',
    tagline: 'Question Paper Builder',
    nav_dashboard: 'Dashboard',
    nav_edit: 'Edit',
    nav_preview: 'Preview',
    nav_myPaper: 'My Paper',
    nav_settings: 'Settings',
    nav_profile: 'Profile',
    nav_logout: 'Logout',
    nav_newPaper: 'Create New Paper',
    common_save: 'Save',
    common_cancel: 'Cancel',
    common_delete: 'Delete',
    common_edit: 'Edit',
    common_duplicate: 'Duplicate',
    common_download: 'Download',
    common_search: 'Search',
    common_back: 'Back',
    common_continue: 'Continue & Open Builder',
    common_saving: 'Saving…',
    common_saved: 'All changes saved',
  },
}

export function useTranslate() {
  const lang = useAppStore((s) => s.language)
  const dict = dictionaries[lang] || dictionaries.en
  return (key) => dict[key] ?? dictionaries.en[key] ?? key
}
