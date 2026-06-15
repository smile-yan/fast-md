<template>
  <aside
    class="sidebar"
    :class="{ collapsed: !isOpen }"
    :style="{ width: isOpen ? sidebarWidth + 'px' : '0' }"
  >
    <div class="sidebar-header">
      <span class="sidebar-dir-name" :title="currentDir">{{ dirName }}</span>
      <div style="display:flex;gap:2px">
        <button class="icon-btn" @click="handleOpenFolder" :title="t('menu.open')">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="sidebar-body">
      <p v-if="!currentDir" class="hint">{{ t('sidebar.openFolder') }}</p>
      <p v-else-if="topItems.length === 0" class="hint">{{ t('sidebar.noFiles') }}</p>
      <ul v-else class="tree">
        <li v-for="item in topItems" :key="item.path">
          <div
            class="tree-item"
            :class="{ active: item.path === currentFilePath }"
            @click="handleItemClick(item)"
          >
            <span class="icon">{{ item.isDir ? (expanded.has(item.path) ? '▾' : '▸') : '·' }}</span>
            <span class="label">{{ item.name }}</span>
          </div>
          <ul v-if="item.isDir && expanded.has(item.path)" class="tree nested">
            <li v-for="child in childItems.get(item.path) ?? []" :key="child.path">
              <div
                class="tree-item"
                :class="{ active: child.path === currentFilePath }"
                @click="handleItemClick(child)"
              >
                <span class="icon">·</span>
                <span class="label">{{ child.name }}</span>
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </div>

    <div class="resize-handle" @mousedown="startResize" />
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocale } from '../composables/useLocale'
import { ListDirectory, OpenFolderDialog } from '../../bindings/changeme/core/appservice'

const { t } = useLocale()

interface FileInfo { name: string; path: string; isDir: boolean }

const props = defineProps<{
  isOpen: boolean
  currentFilePath: string
}>()

const emit = defineEmits<{
  openFile: [path: string]
  folderOpened: [path: string]
}>()

const currentDir = ref('')
const topItems = ref<FileInfo[]>([])
const expanded = ref<Set<string>>(new Set())
const childItems = ref<Map<string, FileInfo[]>>(new Map())
const sidebarWidth = ref(240)

const dirName = computed(() =>
  currentDir.value ? (currentDir.value.split('/').pop() ?? currentDir.value) : t('sidebar.noFolder')
)

async function loadDirectory(path: string) {
  currentDir.value = path
  topItems.value = await ListDirectory(path)
  emit('folderOpened', path)
}

async function handleOpenFolder() {
  const path = await OpenFolderDialog()
  if (path) loadDirectory(path)
}

async function handleItemClick(item: FileInfo) {
  if (item.isDir) {
    if (expanded.value.has(item.path)) {
      expanded.value.delete(item.path)
    } else {
      expanded.value.add(item.path)
      const children = await ListDirectory(item.path)
      childItems.value.set(item.path, children)
    }
    expanded.value = new Set(expanded.value)
  } else {
    emit('openFile', item.path)
  }
}

function startResize(e: MouseEvent) {
  const startX = e.clientX
  const startW = sidebarWidth.value
  const onMove = (e: MouseEvent) => {
    sidebarWidth.value = Math.max(150, Math.min(500, startW + e.clientX - startX))
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

defineExpose({ loadDirectory })
</script>

<style scoped>
.sidebar {
  position: relative;
  height: 100%;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  flex-shrink: 0;
  transition: width 0.15s ease;
  display: flex;
  flex-direction: column;
}
.sidebar.collapsed { border: none; }

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* Left padding reserves space for traffic lights (close≈13, zoom≈53+9=62 → 78px safe zone) */
  padding: 0 10px 0 78px;
  height: 38px;
  border-bottom: 1px solid var(--border-color);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  -webkit-app-region: drag;
  user-select: none;
}
.sidebar-dir-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.icon-btn {
  background: none; border: none; cursor: pointer;
  color: var(--text-secondary); padding: 2px; border-radius: 3px;
  display: flex; align-items: center; flex-shrink: 0;
  -webkit-app-region: no-drag;
}
.icon-btn:hover { background: var(--border-color); }

.sidebar-body { overflow-y: auto; flex: 1; padding: 4px 0; }

.hint { padding: 12px 10px; font-size: 12px; color: var(--text-muted); }

.tree { list-style: none; }
.tree.nested { padding-left: 14px; }

.tree-item {
  display: flex; align-items: center; gap: 5px;
  padding: 3px 10px; cursor: pointer;
  font-size: 13px; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; user-select: none;
}
.tree-item:hover { background: var(--border-color); }
.tree-item.active { background: var(--accent-color); color: white; }

.icon { font-size: 10px; width: 12px; color: var(--text-muted); flex-shrink: 0; }
.label { overflow: hidden; text-overflow: ellipsis; }

.resize-handle {
  position: absolute; right: 0; top: 0; bottom: 0; width: 4px;
  cursor: col-resize; z-index: 10;
}
.resize-handle:hover { background: var(--accent-color); opacity: 0.4; }
</style>
