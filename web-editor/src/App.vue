<template>
  <div class="layout">
    <div class="main-area">
      <Sidebar
        ref="sidebarRef"
        :is-open="sidebarOpen"
        :current-file-path="filePath"
        @open-file="handleOpenFile"
        @folder-opened="() => {}"
      />
      <div class="editor-area" data-file-drop-target>
        <div class="editor-titlebar">
          <div class="titlebar-title">
            {{ titlebarTitle }}<span v-if="isDirty" class="titlebar-edited"> — {{ t('edited') }}</span>
          </div>
        </div>
        <div class="editor-scroll">
          <Editor
            :key="editorKey"
            :model-value="content"
            @update:model-value="handleEditorChange"
          />
          <textarea
            v-show="sourceMode"
            ref="sourceTextarea"
            :value="sourceContent"
            @input="handleSourceInput"
            class="source-textarea"
          />
        </div>
      </div>
    </div>
    <StatusBar
      :file-path="filePath"
      :content="content"
      :is-dirty="isDirty"
      :save-status="saveStatus"
      :save-error="saveError"
    />
    <Settings
      v-if="showSettings"
      @close="showSettings = false"
      @theme-change="handleThemeChange"
      @content-theme-change="applyContentTheme"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Editor from './components/Editor.vue'
import Sidebar from './components/Sidebar.vue'
import StatusBar from './components/StatusBar.vue'
import Settings from './components/Settings.vue'
import { useFile, setContent } from './composables/useFile'
import { useTheme } from './composables/useTheme'
import { useContentTheme } from './composables/useContentTheme'
import { useLocale } from './composables/useLocale'
import { buildMarkdownExportHtml } from './exportHtml'

const { filePath, content, isDirty, saveStatus, saveError, newFile, openFile, saveFile, saveAs, resetFile } = useFile()
const { t } = useLocale()
const titlebarTitle = computed(() =>
  filePath.value ? filePath.value.split('/').pop()! : t('menu.new')
)
const { toggleTheme } = useTheme()
const { applyContentTheme } = useContentTheme()

const sidebarOpen = ref(false)
const sidebarRef = ref<InstanceType<typeof Sidebar> | null>(null)
const showSettings = ref(false)
const sourceMode = ref(false)
const sourceContent = ref('')
const sourceTextarea = ref<HTMLTextAreaElement | null>(null)
const editorKey = ref(0)
let isToggling = false

function toggleSourceMode() {
  if (isToggling) return
  isToggling = true
  setTimeout(() => { isToggling = false }, 200)

  if (sourceMode.value) {
    commitSourceModeEdits()
    sourceMode.value = false
    nextTick(() => {
      editorKey.value++
    })
  } else {
    sourceContent.value = content.value
    sourceMode.value = true
    nextTick(() => {
      sourceTextarea.value?.focus()
      sourceTextarea.value?.select()
    })
  }
}

function handleSourceInput(event: Event) {
  const nextContent = (event.target as HTMLTextAreaElement).value
  sourceContent.value = nextContent
  setContent(nextContent)
}

function commitSourceModeEdits() {
  if (sourceMode.value && sourceContent.value !== content.value) {
    setContent(sourceContent.value)
  }
}

function handleEditorChange(val: string) {
  setContent(val)
}

async function handleOpenFile(path: string) {
  await openFile(path)
}

function handleThemeChange(theme: string) {
  if (theme === 'light' || theme === 'dark') {
    setTheme(theme as 'light' | 'dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
  }
}

async function handleExportHTML() {
  commitSourceModeEdits()
  await nextTick()
  const proseMirror = document.querySelector('.milkdown .ProseMirror')
  const html = buildMarkdownExportHtml({
    title: filePath.value || t('untitled'),
    bodyHtml: proseMirror?.innerHTML ?? '',
  })
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (filePath.value?.split('/').pop()?.replace(/\.md$/, '') ?? 'export') + '.html'
  a.click()
  URL.revokeObjectURL(url)
}

async function beforeUnloadHandler(e: BeforeUnloadEvent) {
  if (isDirty.value || (content.value.trim() !== '' && !filePath.value)) {
    e.preventDefault()
    e.returnValue = ''
  }
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  const item = Array.from(e.dataTransfer?.items || []).find(
    (it) => it.kind === 'file' && (it.type === 'text/markdown' || it.type === 'text/x-markdown')
  )
  if (item) {
    const file = item.getAsFile()
    if (file) {
      const text = await file.text()
      if (!confirmDiscardIfDirty()) return
      filePath.value = file.name
      content.value = text
      isDirty.value = false
    }
  }
}

function confirmDiscardIfDirty(): boolean {
  if (!isDirty.value) return true
  const name = filePath.value ? filePath.value.split('/').pop() : t('untitled')
  return window.confirm(t('dialog.discardUnsavedFile').replace('{name}', name ?? t('untitled')))
}

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
  window.addEventListener('dragover', (e) => e.preventDefault())
  window.addEventListener('drop', handleDrop)

  window.addEventListener('keydown', (e) => {
    const isCommandOnly = e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey
    const isCtrlOnly = e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey
    const modifier = isCommandOnly || isCtrlOnly

    if (modifier && e.key.toLowerCase() === 'n') {
      e.preventDefault()
      commitSourceModeEdits()
      newFile()
      sourceMode.value = false
      editorKey.value++
    }
    if (modifier && e.key.toLowerCase() === 'o') {
      e.preventDefault()
      openFile()
    }
    if (modifier && e.key.toLowerCase() === 's') {
      e.preventDefault()
      commitSourceModeEdits()
      if (e.shiftKey) {
        saveAs()
      } else {
        saveFile()
      }
    }
    if (modifier && e.key.toLowerCase() === '/') {
      e.preventDefault()
      toggleSourceMode()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

const { setTheme } = useTheme()
</script>

<style>
.layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
.main-area {
  display: flex;
  flex: 1;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}
.editor-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
}
.editor-titlebar {
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  position: relative;
  border-bottom: 1px solid var(--border-color);
}
.titlebar-title {
  font-size: 13px;
  color: var(--text-primary);
  pointer-events: none;
  white-space: nowrap;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.titlebar-edited { color: var(--text-muted); }
.editor-scroll {
  flex: 1;
  overflow-y: auto;
  position: relative;
}
.source-textarea {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  resize: none;
  outline: none;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--editor-font-family);
  font-size: var(--editor-font-size, 16px);
  line-height: 1.7;
  z-index: 10;
  max-width: 1060px;
  margin: 0 auto;
  padding: 24px 40px;
  box-sizing: border-box;
}

@media (max-width: 1160px) {
  .source-textarea {
    max-width: none;
    padding: 24px 32px;
  }
}

@media (max-width: 680px) {
  .source-textarea {
    padding: 16px 20px;
  }
}
</style>
