import { create } from 'zustand'

export interface Language {
  code: string
  name: string
  flag: string
  nativeName: string
}

export const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
]

// Sort languages by name
export const sortedLanguages = [...languages].sort((a, b) => a.name.localeCompare(b.name))

interface LanguageState {
  currentLanguage: Language
  setLanguage: (code: string) => void
  getLanguage: () => Language
}

// Load language from localStorage on initialization
const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return sortedLanguages[0]
  
  try {
    const stored = localStorage.getItem('aurora-language-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      const language = sortedLanguages.find((lang) => lang.code === parsed.code)
      // Only return if it's a valid language (en, fr, or de)
      if (language && (language.code === 'en' || language.code === 'fr' || language.code === 'de')) {
        return language
      }
    }
  } catch (error) {
    console.error('Error loading language from storage:', error)
  }
  
  return sortedLanguages[0] // Default to English
}

export const useLanguageStore = create<LanguageState>()((set, get) => ({
  currentLanguage: getStoredLanguage(),
  setLanguage: (code: string) => {
    // Only allow valid language codes (en, fr, de)
    const validCode = (code === 'en' || code === 'fr' || code === 'de') ? code : 'en'
    const language = sortedLanguages.find((lang) => lang.code === validCode) || sortedLanguages[0]
    set({ currentLanguage: language })
    // Persist to localStorage
    try {
      localStorage.setItem('aurora-language-storage', JSON.stringify({ code: language.code }))
    } catch (error) {
      console.error('Error saving language to storage:', error)
    }
  },
  getLanguage: () => get().currentLanguage,
}))

