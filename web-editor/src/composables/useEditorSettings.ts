const SETTINGS_STORAGE_KEY = 'fast-md-settings'

type FontFamilyKey = 'system' | 'serif' | 'sans-serif' | 'monospace'

interface EditorSettings {
  fontFamily: FontFamilyKey
  fontSize: number
}

const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontFamily: 'system',
  fontSize: 16,
}

const FONT_FAMILY_STACKS: Record<FontFamilyKey, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  'sans-serif': '"Open Sans", "Clear Sans", "Helvetica Neue", Helvetica, Arial, "Segoe UI Emoji", sans-serif',
  monospace: 'ui-monospace, "SF Mono", Menlo, Monaco, "Courier New", monospace',
}

function normalizeFontFamily(value: unknown): FontFamilyKey {
  return value === 'serif' || value === 'sans-serif' || value === 'monospace'
    ? value
    : DEFAULT_EDITOR_SETTINGS.fontFamily
}

function normalizeFontSize(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_EDITOR_SETTINGS.fontSize
  return Math.min(32, Math.max(10, parsed))
}

export function readEditorSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    const settings = raw ? JSON.parse(raw) : {}
    return {
      fontFamily: normalizeFontFamily(settings.fontFamily),
      fontSize: normalizeFontSize(settings.fontSize),
    }
  } catch {
    return DEFAULT_EDITOR_SETTINGS
  }
}

export function applyEditorSettingsVariables() {
  const settings = readEditorSettings()
  document.documentElement.style.setProperty('--editor-font-family', FONT_FAMILY_STACKS[settings.fontFamily])
  document.documentElement.style.setProperty('--editor-font-size', `${settings.fontSize}px`)
}
