import { computed, ref } from 'vue'
import vi from '../locales/vi'
import en from '../locales/en'

const STORAGE_KEY = 'jb_locale'
const messages = { vi, en }

function readInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'vi') return saved
  } catch {
    /* ignore */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : ''
  return nav.toLowerCase().startsWith('en') ? 'en' : 'vi'
}

const locale = ref(readInitial())

function applyDocumentLang(next) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = next === 'en' ? 'en' : 'vi'
}

applyDocumentLang(locale.value)

function resolve(path, dict) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), dict)
}

function t(path, params = {}) {
  const dict = messages[locale.value] || messages.vi
  let text = resolve(path, dict) ?? resolve(path, messages.vi) ?? path
  if (typeof text !== 'string') return path
  Object.entries(params).forEach(([key, value]) => {
    text = text.replaceAll(`{${key}}`, String(value))
  })
  return text
}

function setLocale(next) {
  const value = next === 'en' ? 'en' : 'vi'
  locale.value = value
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* ignore */
  }
  applyDocumentLang(value)
}

function toggleLocale() {
  setLocale(locale.value === 'vi' ? 'en' : 'vi')
}

export function useLocale() {
  return {
    locale: computed(() => locale.value),
    isVi: computed(() => locale.value === 'vi'),
    isEn: computed(() => locale.value === 'en'),
    t,
    setLocale,
    toggleLocale,
  }
}
