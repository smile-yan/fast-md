<template>
  <div class="status-bar">
    <div class="left">
      <span class="path" :title="filePath">{{ displayPath }}</span>
      <span v-if="isDirty" class="dot" :title="t('dialog.unsavedTitle')">●</span>
    </div>
    <div class="center">{{ saveStatus }}</div>
    <div class="right">
      <span>{{ charCount }} {{ t('statusBar.characters') }}</span>
      <span class="sep">|</span>
      <span>{{ lineCount }} {{ t('statusBar.lines') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../composables/useLocale'

const props = defineProps<{
  filePath: string
  content: string
  isDirty: boolean
  saveStatus: string
}>()

const { t } = useLocale()

const displayPath = computed(() => {
  if (!props.filePath) return t('menu.new')
  const parts = props.filePath.split('/')
  return parts.length <= 3 ? props.filePath : '…/' + parts.slice(-2).join('/')
})

const charCount = computed(() => props.content.length)
const lineCount = computed(() => (!props.content ? 0 : props.content.split('\n').length))
</script>

<style scoped>
.status-bar {
  height: var(--statusbar-height);
  background: var(--bg-statusbar);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 12px;
  color: var(--text-secondary);
  user-select: none;
  flex-shrink: 0;
}
html.dark .status-bar { color: rgba(255,255,255,0.85); }

.left, .right { display: flex; align-items: center; gap: 6px; }
.path { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dot { color: var(--accent-color); font-size: 14px; line-height: 1; }
.center { font-size: 11px; opacity: 0.75; }
.sep { opacity: 0.4; }
</style>
