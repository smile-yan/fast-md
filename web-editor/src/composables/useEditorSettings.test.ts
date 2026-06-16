import { beforeEach, describe, expect, it } from 'vitest'

describe('useEditorSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('style')
  })

  it('uses default editor font settings when no preferences are saved', async () => {
    const { applyEditorSettingsVariables, readEditorSettings } = await import('./useEditorSettings')

    expect(readEditorSettings()).toMatchObject({
      fontFamily: 'system',
      fontSize: 16,
    })

    applyEditorSettingsVariables()

    expect(document.documentElement.style.getPropertyValue('--editor-font-family')).toContain('-apple-system')
    expect(document.documentElement.style.getPropertyValue('--editor-font-size')).toBe('16px')
  })

  it('applies saved font family and font size settings to CSS variables', async () => {
    localStorage.setItem('fast-md-settings', JSON.stringify({
      fontFamily: 'monospace',
      fontSize: 22,
    }))

    const { applyEditorSettingsVariables, readEditorSettings } = await import('./useEditorSettings')

    expect(readEditorSettings()).toMatchObject({
      fontFamily: 'monospace',
      fontSize: 22,
    })

    applyEditorSettingsVariables()

    expect(document.documentElement.style.getPropertyValue('--editor-font-family')).toContain('ui-monospace')
    expect(document.documentElement.style.getPropertyValue('--editor-font-size')).toBe('22px')
  })
})
