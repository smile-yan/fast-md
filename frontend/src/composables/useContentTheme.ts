import { ref } from 'vue'

// Intentionally uses the "fast-md-" prefix to preserve user settings
// across the fast-md -> fastmd rename. New users see "fastmd" everywhere
// except these internal localStorage keys — the inconsistency is invisible
// and not worth a one-shot migration. See todo-list.md for context.
// Intentionally uses the "fast-md-" prefix to preserve user settings
// across the fast-md -> fastmd rename. New users see "fastmd" everywhere
// except these internal localStorage keys — the inconsistency is invisible
// and not worth a one-shot migration. See todo-list.md for context.
const SETTINGS_STORAGE_KEY = 'fast-md-settings'
const DEFAULT_CONTENT_THEME = 'github'
const AVAILABLE_CONTENT_THEMES = new Set([DEFAULT_CONTENT_THEME])

function normalizeThemeName(name: unknown): string {
  return typeof name === 'string' && AVAILABLE_CONTENT_THEMES.has(name) ? name : DEFAULT_CONTENT_THEME
}

function readPersistedTheme(): string {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_CONTENT_THEME
    return normalizeThemeName(JSON.parse(raw).contentTheme)
  } catch {
    return DEFAULT_CONTENT_THEME
  }
}

function persistTheme(name: string) {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    const settings = raw ? JSON.parse(raw) : {}
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...settings, contentTheme: name }))
  } catch {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ contentTheme: name }))
  }
}

const contentTheme = ref<string>(readPersistedTheme())
let linkEl: HTMLLinkElement | null = null

function applyContentTheme(name: string) {
  const normalizedName = normalizeThemeName(name)
  if (!linkEl) {
    linkEl = document.createElement('link')
    linkEl.rel = 'stylesheet'
    linkEl.id = 'content-theme-stylesheet'
    document.head.appendChild(linkEl)
  }
  linkEl.disabled = false
  linkEl.href = `/themes/${normalizedName}.css`
  persistTheme(normalizedName)
  contentTheme.value = normalizedName
}

applyContentTheme(contentTheme.value)

export function useContentTheme() {
  return { contentTheme, applyContentTheme }
}
