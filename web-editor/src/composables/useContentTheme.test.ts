import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('useContentTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.head.innerHTML = ''
    vi.resetModules()
  })

  it('uses the Typora GitHub theme as the default content theme', async () => {
    const { useContentTheme } = await import('./useContentTheme')
    const { contentTheme } = useContentTheme()
    const link = document.head.querySelector<HTMLLinkElement>('#content-theme-stylesheet')

    expect(contentTheme.value).toBe('github')
    expect(link?.disabled).toBe(false)
    expect(link?.getAttribute('href')).toBe('/themes/github.css')
  })

  it('restores content theme from persisted settings', async () => {
    localStorage.setItem('fast-md-settings', JSON.stringify({ contentTheme: 'github' }))

    const { useContentTheme } = await import('./useContentTheme')
    const { contentTheme } = useContentTheme()
    const link = document.head.querySelector<HTMLLinkElement>('#content-theme-stylesheet')

    expect(contentTheme.value).toBe('github')
    expect(link?.disabled).toBe(false)
    expect(link?.getAttribute('href')).toBe('/themes/github.css')
  })

  it('normalizes legacy default content theme settings to GitHub', async () => {
    localStorage.setItem('fast-md-settings', JSON.stringify({ contentTheme: 'default' }))

    const { useContentTheme } = await import('./useContentTheme')
    const { contentTheme } = useContentTheme()
    const link = document.head.querySelector<HTMLLinkElement>('#content-theme-stylesheet')

    expect(contentTheme.value).toBe('github')
    expect(link?.disabled).toBe(false)
    expect(link?.getAttribute('href')).toBe('/themes/github.css')
    expect(JSON.parse(localStorage.getItem('fast-md-settings') || '{}')).toMatchObject({
      contentTheme: 'github',
    })
  })

  it('persists content theme into shared settings', async () => {
    localStorage.setItem('fast-md-settings', JSON.stringify({ theme: 'dark' }))

    const { useContentTheme } = await import('./useContentTheme')
    const { applyContentTheme } = useContentTheme()

    applyContentTheme('github')

    expect(JSON.parse(localStorage.getItem('fast-md-settings') || '{}')).toMatchObject({
      theme: 'dark',
      contentTheme: 'github',
    })
  })
})
