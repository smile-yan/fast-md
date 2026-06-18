import { ref, computed } from 'vue'
import { useLocale } from './useLocale'

const filePath = ref<string>('')
const fileHandle = ref<FileSystemFileHandle | null>(null)
const content = ref<string>('')
const isDirty = ref<boolean>(false)
const lastSaved = ref<Date | null>(null)
const isSaving = ref<boolean>(false)
const saveError = ref<string | null>(null)
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

const defaultSettings = {
  autoSave: true,
  autoSaveInterval: 10,
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

export function setContent(newContent: string) {
  content.value = newContent
  isDirty.value = true
  scheduleAutoSave()
}

function getSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem('fast-md-settings') || '{}') }
  } catch {
    return defaultSettings
  }
}

async function writeHandle(handle: FileSystemFileHandle, text: string) {
  const writable = await handle.createWritable()
  try {
    await writable.write(text)
  } finally {
    await writable.close()
  }
}

async function tryRequestWritePermission(handle: FileSystemFileHandle): Promise<boolean> {
  const options: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' }
  const state = await handle.requestPermission(options)
  return state === 'granted'
}

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (!fileHandle.value) return

  const settings = getSettings()
  if (!settings.autoSave) return

  const interval = settings.autoSaveInterval * 1000
  autoSaveTimer = setTimeout(async () => {
    if (isDirty.value && fileHandle.value) {
      isSaving.value = true
      try {
        await writeHandle(fileHandle.value, content.value)
        isDirty.value = false
        lastSaved.value = new Date()
        saveError.value = null
      } catch (err) {
        saveError.value = toErrorMessage(err)
      } finally {
        isSaving.value = false
      }
    }
  }, interval)
}

export function useFile() {
  const { t } = useLocale()

  function confirmDiscardIfDirty(): boolean {
    if (!isDirty.value) return true
    const name = filePath.value ? filePath.value.split('/').pop() : t('untitled')
    return window.confirm(t('dialog.discardUnsavedFile').replace('{name}', name ?? t('untitled')))
  }

  function resetFile() {
    content.value = ''
    filePath.value = ''
    fileHandle.value = null
    isDirty.value = false
    lastSaved.value = null
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  function newFile() {
    if (!confirmDiscardIfDirty()) return
    resetFile()
  }

  async function openFile(path?: string) {
    if (!confirmDiscardIfDirty()) return
    if (path) {
      // URL query param fallback: fetch via HTTP when served from a server.
      try {
        const response = await fetch(path)
        const text = await response.text()
        filePath.value = path
        fileHandle.value = null
        content.value = text
        isDirty.value = false
        lastSaved.value = new Date()
      } catch (err) {
        saveError.value = toErrorMessage(err)
      }
      return
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Markdown Files',
            accept: { 'text/markdown': ['.md', '.markdown'] },
          },
        ],
      })
      const file = await handle.getFile()
      const text = await file.text()
      filePath.value = file.name
      fileHandle.value = handle
      content.value = text
      isDirty.value = false
      lastSaved.value = new Date()
      saveError.value = null
    } catch (err) {
      // User cancellation is expected and should not surface as an error.
      if (err instanceof DOMException && err.name === 'AbortError') return
      saveError.value = toErrorMessage(err)
    }
  }

  async function saveFile() {
    if (isSaving.value) return
    if (!fileHandle.value) {
      await saveAs()
      return
    }
    isSaving.value = true
    try {
      if (!(await tryRequestWritePermission(fileHandle.value))) {
        throw new Error('Write permission denied')
      }
      await writeHandle(fileHandle.value, content.value)
      isDirty.value = false
      lastSaved.value = new Date()
      saveError.value = null
    } catch (err) {
      saveError.value = toErrorMessage(err)
    } finally {
      isSaving.value = false
    }
  }

  async function saveAs() {
    if (isSaving.value) return
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filePath.value || 'untitled.md',
        types: [
          {
            description: 'Markdown Files',
            accept: { 'text/markdown': ['.md', '.markdown'] },
          },
        ],
      })
      isSaving.value = true
      await writeHandle(handle, content.value)
      filePath.value = handle.name
      fileHandle.value = handle
      isDirty.value = false
      lastSaved.value = new Date()
      saveError.value = null
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      saveError.value = toErrorMessage(err)
    } finally {
      isSaving.value = false
    }
  }

  async function saveToPath(path: string) {
    // Not used in the web build, but kept for API compatibility.
    console.warn('saveToPath is not supported in the web build; use saveAs instead')
    path
  }

  async function openFolder(): Promise<string> {
    // Folder browsing is not supported by File System Access API in all browsers.
    return ''
  }

  const fileName = computed(() => {
    if (!filePath.value) return t('untitled')
    return filePath.value.split('/').pop() ?? t('untitled')
  })

  const saveStatus = computed(() => {
    if (isSaving.value) return t('file.saving')
    if (!isDirty.value && lastSaved.value) return t('file.saved')
    if (isDirty.value) return t('file.unsavedChanges')
    return ''
  })

  return {
    filePath,
    fileHandle,
    content,
    isDirty,
    lastSaved,
    isSaving,
    saveError,
    saveStatus,
    fileName,
    setContent,
    resetFile,
    newFile,
    openFile,
    saveFile,
    saveAs,
    saveToPath,
    openFolder,
  }
}
