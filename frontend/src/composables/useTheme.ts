import { ref } from 'vue'

type Theme = 'light' | 'dark'

// Intentionally uses the "fast-md-" prefix to preserve user settings
// across the fast-md -> fastmd rename. New users see "fastmd" everywhere
// except these internal localStorage keys — the inconsistency is invisible
// and not worth a one-shot migration. See todo-list.md for context.
// Intentionally uses the "fast-md-" prefix to preserve user settings
// across the fast-md -> fastmd rename. New users see "fastmd" everywhere
// except these internal localStorage keys — the inconsistency is invisible
// and not worth a one-shot migration. See todo-list.md for context.
const STORAGE_KEY = 'fast-md-theme'
const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme) ?? 'light')

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  localStorage.setItem(STORAGE_KEY, t)
}

applyTheme(theme.value)

export function useTheme() {
  function toggleTheme() {
    const next: Theme = theme.value === 'light' ? 'dark' : 'light'
    theme.value = next
    applyTheme(next)
  }

  function setTheme(t: Theme) {
    theme.value = t
    applyTheme(t)
  }

  return { theme, toggleTheme, setTheme }
}
