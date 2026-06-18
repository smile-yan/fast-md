import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('useLocale translations', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
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

  it('t() returns the key as-is when the key is missing from translations', async () => {
    const { useLocale } = await import('./useLocale')
    const { t } = useLocale()

    // Top-level miss.
    expect(t('this.key.does.not.exist')).toBe('this.key.does.not.exist')
    // A partially-correct prefix still misses — the lookup is dot-walk.
    expect(t('menu.noSuchSubKey')).toBe('menu.noSuchSubKey')
    expect(t('file.nope')).toBe('file.nope')
  })

  it('t() walks nested keys correctly (2 levels deep)', async () => {
    const { useLocale } = await import('./useLocale')
    const { t } = useLocale()

    expect(t('menu.file')).toBe('文件')
    expect(t('menu.edit')).toBe('编辑')
    expect(t('file.saved')).toBe('已保存')
    expect(t('dialog.save')).toBe('保存')
  })

  it('t() returns the key when a deeper key is requested but a prefix is a string', async () => {
    // menu.file is the string '文件', not an object — trying to read
    // menu.file.open must NOT throw, it must return the requested key.
    const { useLocale } = await import('./useLocale')
    const { t } = useLocale()

    expect(t('menu.file.open')).toBe('menu.file.open')
    expect(t('file.saved.subkey')).toBe('file.saved.subkey')
  })

  it('locale switching round-trips through localStorage', async () => {
    localStorage.setItem('fast-md-locale', 'en')
    const { useLocale } = await import('./useLocale')
    const { locale, t } = useLocale()

    expect(locale.value).toBe('en')
    expect(t('menu.close')).toBe('Close')

    const { setLocale } = await import('./useLocale')
    setLocale('zh')
    expect(locale.value).toBe('zh')
    expect(t('menu.close')).toBe('关闭')
    expect(localStorage.getItem('fast-md-locale')).toBe('zh')
  })

  it('does not crash when localStorage has an unknown locale', async () => {
    localStorage.setItem('fast-md-locale', 'klingon')
    const { useLocale } = await import('./useLocale')
    const { locale, t } = useLocale()

    // The ref initializes from the localStorage value cast to Locale.
    // An unknown string is not 'zh' or 'en' but the lookup itself still
    // works against the dictionary by direct key — the point is the
    // composable doesn't crash on a bad stored value.
    expect(locale.value).toBe('klingon')
    // t() falls through the dictionary and returns the requested key
    // verbatim, which is the safe behavior — the menu builder reads
    // these directly and would render the key as the label.
    expect(t('menu.close')).toBe('menu.close')
  })
})


describe('useLocale t() interpolation', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('substitutes {name} placeholders with params', async () => {
    const { setLocale, useLocale } = await import('./useLocale')
    const { t } = useLocale()
    setLocale('zh')

    const result = t('dialog.discardUnsavedFile', { name: 'my-doc.md' })
    expect(result).toBe('"my-doc.md" 有未保存的更改。是否放弃并继续？')
  })

  it('substitutes {name} in English translations', async () => {
    const { setLocale, useLocale } = await import('./useLocale')
    const { t } = useLocale()
    setLocale('en')

    const result = t('dialog.discardUnsavedFile', { name: 'readme.md' })
    expect(result).toBe('"readme.md" has unsaved changes. Discard and continue?')
  })

  it('leaves unknown {placeholder} placeholders untouched', async () => {
    const { setLocale, useLocale } = await import('./useLocale')
    const { t } = useLocale()
    setLocale('zh')

    const result = t('dialog.discardUnsavedFile', { name: 'doc.md', extra: 'ignored' })
    expect(result).toBe('"doc.md" 有未保存的更改。是否放弃并继续？')
  })

  it('returns the string unchanged when no params are supplied', async () => {
    const { setLocale, useLocale } = await import('./useLocale')
    const { t } = useLocale()
    setLocale('zh')

    const result = t('dialog.discardUnsavedFile')
    expect(result).toBe('"{name}" 有未保存的更改。是否放弃并继续？')
  })

  it('substitutes numeric params', async () => {
    // None of the current translations use numeric params, but we can
    // test the engine directly via a key like dialog.exportSuccess which
    // uses {name} but we supply a number.
    const { setLocale, useLocale } = await import('./useLocale')
    const { t } = useLocale()
    setLocale('en')

    const result = t('dialog.exportSuccess', { name: 42 })
    expect(result).toBe('Exported 42')
  })
})
