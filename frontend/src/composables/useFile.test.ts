import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../bindings/changeme/core/appservice', () => ({
  OpenFileDialog: vi.fn(),
  SaveFileDialog: vi.fn(),
  ReadFile: vi.fn(),
  WriteFile: vi.fn(),
  OpenFolderDialog: vi.fn(),
}))

describe('useFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('initializes with empty state', async () => {
    const { useFile } = await import('./useFile')
    const { filePath, content, isDirty } = useFile()
    expect(filePath.value).toBe('')
    expect(content.value).toBe('')
    expect(isDirty.value).toBe(false)
  })

  it('setContent marks dirty', async () => {
    const { useFile, setContent } = await import('./useFile')
    const { isDirty } = useFile()
    setContent('# Hello')
    expect(isDirty.value).toBe(true)
  })

  it('openFile reads file and clears dirty', async () => {
    const bindings = await import('../../bindings/changeme/core/appservice')
    vi.mocked(bindings.OpenFileDialog).mockResolvedValue('/tmp/test.md')
    vi.mocked(bindings.ReadFile).mockResolvedValue('# Content')
    const { useFile } = await import('./useFile')
    const { filePath, content, isDirty, openFile } = useFile()
    await openFile()
    expect(filePath.value).toBe('/tmp/test.md')
    expect(content.value).toBe('# Content')
    expect(isDirty.value).toBe(false)
  })

  it('saveFile writes to current path', async () => {
    const bindings = await import('../../bindings/changeme/core/appservice')
    vi.mocked(bindings.WriteFile).mockResolvedValue(undefined)
    const { useFile, setContent } = await import('./useFile')
    const { filePath, saveFile } = useFile()
    filePath.value = '/tmp/test.md'
    setContent('# Updated')
    await saveFile()
    expect(bindings.WriteFile).toHaveBeenCalledWith('/tmp/test.md', '# Updated')
  })

  it('saveFile calls SaveFileDialog when no path', async () => {
    const bindings = await import('../../bindings/changeme/core/appservice')
    vi.mocked(bindings.SaveFileDialog).mockResolvedValue('/tmp/new.md')
    vi.mocked(bindings.WriteFile).mockResolvedValue(undefined)
    const { useFile, setContent } = await import('./useFile')
    const { filePath, saveFile } = useFile()
    setContent('# New')
    await saveFile()
    expect(bindings.SaveFileDialog).toHaveBeenCalled()
    expect(filePath.value).toBe('/tmp/new.md')
  })

  it('auto saves existing files every 10 seconds by default', async () => {
    vi.useFakeTimers()
    const bindings = await import('../../bindings/changeme/core/appservice')
    vi.mocked(bindings.WriteFile).mockResolvedValue(undefined)

    const { useFile, setContent } = await import('./useFile')
    const { filePath } = useFile()
    filePath.value = '/tmp/auto.md'

    setContent('# Auto')
    await vi.advanceTimersByTimeAsync(9999)
    expect(bindings.WriteFile).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(bindings.WriteFile).toHaveBeenCalledWith('/tmp/auto.md', '# Auto')

    vi.useRealTimers()
  })

  it('newFile resets all state', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { useFile, setContent } = await import('./useFile')
    const { filePath, content, isDirty, newFile } = useFile()
    filePath.value = '/tmp/old.md'
    setContent('# Old')
    newFile()
    expect(filePath.value).toBe('')
    expect(content.value).toBe('')
    expect(isDirty.value).toBe(false)
  })

  it('localizes file name and save status labels', async () => {
    localStorage.setItem('fast-md-locale', 'zh')

    const { useFile } = await import('./useFile')
    const { fileName, saveStatus } = useFile()

    expect(fileName.value).toBe('未命名')
    expect(saveStatus.value).toBe('')
  })
})
