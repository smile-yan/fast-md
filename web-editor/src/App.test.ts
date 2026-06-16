import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import App from './App.vue'
import * as useFileModule from './composables/useFile'

vi.mock('./composables/useFile', () => ({
  useFile: vi.fn(),
  setContent: vi.fn(),
}))

vi.mock('./composables/useTheme', () => ({
  useTheme: vi.fn(() => ({
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  })),
}))

vi.mock('./composables/useContentTheme', () => ({
  useContentTheme: vi.fn(() => ({
    applyContentTheme: vi.fn(),
  })),
}))

vi.mock('./composables/useLocale', () => ({
  useLocale: vi.fn(() => ({
    t: vi.fn((key: string) => key),
  })),
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the editor and status bar', async () => {
    vi.mocked(useFileModule.useFile).mockReturnValue({
      filePath: ref(''),
      content: ref(''),
      isDirty: ref(false),
      saveStatus: ref(''),
      saveError: ref(null),
      newFile: vi.fn(),
      openFile: vi.fn(),
      saveFile: vi.fn(),
      saveAs: vi.fn(),
      resetFile: vi.fn(),
    } as unknown as ReturnType<typeof useFileModule.useFile>)

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.find('.editor-area').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'StatusBar' }).exists()).toBe(true)
  })
})
