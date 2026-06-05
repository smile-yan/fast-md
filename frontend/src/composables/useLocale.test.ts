import { beforeEach, describe, expect, it } from 'vitest'

describe('useLocale translations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('contains visible app and dialog labels in both languages', async () => {
    const { setLocale, useLocale } = await import('./useLocale')
    const { t } = useLocale()

    setLocale('zh')
    expect(t('menu.close')).toBe('关闭')
    expect(t('sidebar.noFolder')).toBe('无文件夹')
    expect(t('file.saved')).toBe('已保存')
    expect(t('dialog.restartForLanguageChange')).toBe('语言已切换为中文，需要重启应用才能生效。是否立即重启？')

    setLocale('en')
    expect(t('menu.close')).toBe('Close')
    expect(t('sidebar.noFolder')).toBe('No folder')
    expect(t('file.saved')).toBe('Saved')
    expect(t('dialog.restartForLanguageChange')).toBe('Language changed to English. Restart to apply?')
  })
})
