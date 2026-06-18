import { ref } from 'vue'

type Theme = 'light' | 'dark'

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
