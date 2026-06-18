import { describe, it, expect, beforeEach } from 'vitest'

describe('useTheme', () => {
  beforeEach(async () => {
    document.documentElement.className = ''
    localStorage.clear()
    vi.resetModules()
  })

  it('defaults to light when no localStorage entry', async () => {
    const { useTheme } = await import('./useTheme')
    const { theme } = useTheme()
    expect(theme.value).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('restores dark theme from localStorage', async () => {
    localStorage.setItem('fast-md-theme', 'dark')
    const { useTheme } = await import('./useTheme')
    const { theme } = useTheme()
    expect(theme.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTheme switches light → dark', async () => {
    const { useTheme } = await import('./useTheme')
    const { theme, toggleTheme } = useTheme()
    toggleTheme()
    expect(theme.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTheme switches dark → light', async () => {
    localStorage.setItem('fast-md-theme', 'dark')
    const { useTheme } = await import('./useTheme')
    const { theme, toggleTheme } = useTheme()
    toggleTheme()
    expect(theme.value).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists toggle to localStorage', async () => {
    const { useTheme } = await import('./useTheme')
    const { toggleTheme } = useTheme()
    toggleTheme()
    expect(localStorage.getItem('fast-md-theme')).toBe('dark')
  })
})
