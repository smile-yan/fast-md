import { describe, it, expect, vi, beforeEach } from 'vitest'

function createMockHandle(name: string, initialText = ''): FileSystemFileHandle {
  let text = initialText
  return {
    name,
    kind: 'file',
    getFile: vi.fn(async () => new File([text], name, { type: 'text/markdown' })),
    createWritable: vi.fn(async () => ({
      write: vi.fn(async (data: string) => { text = data }),
      close: vi.fn(async () => {}),
    })),
    requestPermission: vi.fn(async () => 'granted'),
    queryPermission: vi.fn(async () => 'granted'),
  } as unknown as FileSystemFileHandle
}

describe('useFile', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
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
    const handle = createMockHandle('test.md', '# Content')
    vi.stubGlobal('showOpenFilePicker', vi.fn(async () => [handle]))

    const { useFile } = await import('./useFile')
    const { filePath, content, isDirty, openFile } = useFile()
    await openFile()

    expect(filePath.value).toBe('test.md')
    expect(content.value).toBe('# Content')
    expect(isDirty.value).toBe(false)
  })

  it('saveFile writes to current handle', async () => {
    const handle = createMockHandle('test.md')
    vi.stubGlobal('showOpenFilePicker', vi.fn(async () => [handle]))

    const { useFile, setContent } = await import('./useFile')
    const { filePath, saveFile, openFile } = useFile()
    await openFile()
    setContent('# Updated')
    await saveFile()

    expect(filePath.value).toBe('test.md')
    expect(handle.createWritable).toHaveBeenCalled()
  })

  it('saveFile calls saveAs when no handle', async () => {
    const handle = createMockHandle('new.md')
    vi.stubGlobal('showSaveFilePicker', vi.fn(async () => handle))

    const { useFile, setContent } = await import('./useFile')
    const { filePath, saveFile } = useFile()
    setContent('# New')
    await saveFile()

    expect(filePath.value).toBe('new.md')
  })

  it('auto saves existing files every 10 seconds by default', async () => {
    vi.useFakeTimers()
    const handle = createMockHandle('auto.md')
    vi.stubGlobal('showOpenFilePicker', vi.fn(async () => [handle]))

    const { useFile, setContent } = await import('./useFile')
    const { openFile } = useFile()
    await openFile()

    setContent('# Auto')
    await vi.advanceTimersByTimeAsync(9999)
    expect(handle.createWritable).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(handle.createWritable).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('newFile resets all state', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { useFile, setContent } = await import('./useFile')
    const { filePath, content, isDirty, newFile } = useFile()
    filePath.value = 'old.md'
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

  it('captures the write error in saveError when write fails', async () => {
    const handle = createMockHandle('test.md')
    handle.createWritable = vi.fn(async () => { throw new Error('disk full') })
    vi.stubGlobal('showOpenFilePicker', vi.fn(async () => [handle]))

    const { useFile, setContent } = await import('./useFile')
    const { saveError, saveFile, openFile, isDirty } = useFile()
    await openFile()
    setContent('# data')
    isDirty.value = true

    await saveFile()

    expect(saveError.value).toBe('disk full')
    expect(isDirty.value).toBe(true)
  })

  it('clears saveError on the next successful save', async () => {
    const handle = createMockHandle('test.md')
    let fail = true
    handle.createWritable = vi.fn(async () => {
      if (fail) throw new Error('first try fails')
      return {
        write: vi.fn(async () => {}),
        close: vi.fn(async () => {}),
      }
    })
    vi.stubGlobal('showOpenFilePicker', vi.fn(async () => [handle]))

    const { useFile, setContent } = await import('./useFile')
    const { saveError, saveFile, openFile, isDirty } = useFile()
    await openFile()
    setContent('# data')
    isDirty.value = true

    await saveFile()
    expect(saveError.value).toBe('first try fails')

    fail = false
    isDirty.value = true
    await saveFile()
    expect(saveError.value).toBeNull()
    expect(isDirty.value).toBe(false)
  })
})
