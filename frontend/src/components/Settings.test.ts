import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../bindings/changeme/core/appservice', () => ({
  RestartApp: vi.fn(),
  SaveConfig: vi.fn(),
}))

describe('Settings content theme', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('normalizes legacy default content theme settings to GitHub', async () => {
    localStorage.setItem('fast-md-settings', JSON.stringify({ contentTheme: 'default' }))
    const { default: Settings } = await import('./Settings.vue')
    const wrapper = mount(Settings)

    await wrapper.findAll('.settings-category').find((category) => category.text() === '外观')?.trigger('click')
    const contentThemeSelect = wrapper
      .findAll('select.settings-select')
      .find((select) => select.find('option[value="github"]').exists())

    expect(contentThemeSelect).toBeTruthy()
    expect(contentThemeSelect?.element.value).toBe('github')
  })

  it('defaults to the GitHub content theme and only offers available content themes', async () => {
    const { default: Settings } = await import('./Settings.vue')
    const wrapper = mount(Settings)

    await wrapper.findAll('.settings-category').find((category) => category.text() === '外观')?.trigger('click')
    const contentThemeSelect = wrapper
      .findAll('select.settings-select')
      .find((select) => select.find('option[value="github"]').exists())

    expect(contentThemeSelect?.element.value).toBe('github')
    const options = contentThemeSelect?.findAll('option').map((option) => ({
      value: (option.element as HTMLOptionElement).value,
      text: option.text(),
    }))

    expect(options).toEqual([{ value: 'github', text: 'GitHub' }])
    expect(contentThemeSelect?.find('option[value="default"]').exists()).toBe(false)
    expect(contentThemeSelect?.find('option[value="typora"]').exists()).toBe(false)
  })

  it('defaults to auto save every 10 seconds', async () => {
    const { default: Settings } = await import('./Settings.vue')
    const wrapper = mount(Settings)

    const saveModeSelect = wrapper
      .findAll('select.settings-select')
      .find((select) => select.find('option').text() === '手动保存')
    const intervalInput = wrapper.find('input.settings-input[type="number"]')

    expect(saveModeSelect?.element.value).toBe('true')
    expect((intervalInput.element as HTMLInputElement).value).toBe('10')
  })

  it('uses localized restart confirmation when changing language', async () => {
    const bindings = await import('../../bindings/changeme/core/appservice')
    vi.mocked(bindings.SaveConfig).mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    localStorage.setItem('fast-md-locale', 'en')

    const { default: Settings } = await import('./Settings.vue')
    const wrapper = mount(Settings)

    const languageSelect = wrapper
      .findAll('select.settings-select')
      .find((select) => select.find('option[value="zh"]').exists())

    expect(languageSelect).toBeTruthy()

    await languageSelect!.setValue('zh')

    expect(window.confirm).toHaveBeenCalledWith('语言已切换为中文，需要重启应用才能生效。是否立即重启？')
  })

  it('keeps the selected sidebar category background spacious around the label', () => {
    const source = readFileSync(resolve(__dirname, 'Settings.vue'), 'utf-8')

    expect(source).toMatch(/\.settings-sidebar\s*{[^}]*width:\s*28%;[^}]*min-width:\s*176px;[^}]*padding:\s*16px\s+12px;[^}]*gap:\s*6px;/s)
    expect(source).toMatch(/\.settings-category\s*{[^}]*gap:\s*14px;[^}]*padding:\s*12px\s+18px;[^}]*font-size:\s*14px;[^}]*width:\s*100%;[^}]*min-height:\s*44px;/s)
    expect(source).toMatch(/\.settings-category-icon\s*{[^}]*width:\s*20px;/s)
    expect(source).toMatch(/\.settings-category-icon\s+svg\s*{[^}]*width:\s*16px;[^}]*height:\s*16px;/s)
  })

  it('omits unfinished text, export, and word wrap settings from the UI model', () => {
    const settingsSource = readFileSync(resolve(__dirname, 'Settings.vue'), 'utf-8')
    const localeSource = readFileSync(resolve(__dirname, '../composables/useLocale.ts'), 'utf-8')
    const removedKeys = [
      'spellCheck',
      'autoSuggest',
      'autoCorrect',
      'wordWrap',
      'exportFormat',
      'codeHighlight',
      'exportMath',
    ]

    for (const key of removedKeys) {
      expect(settingsSource).not.toContain(`settings.${key}`)
      expect(settingsSource).not.toMatch(new RegExp(`${key}:`))
      expect(localeSource).not.toMatch(new RegExp(`\\b${key}:`))
    }

    expect(settingsSource).not.toContain("id: 'text'")
    expect(settingsSource).not.toContain("id: 'export'")
  })
})
