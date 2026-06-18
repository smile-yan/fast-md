import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('StatusBar', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('renders the file path with a long-path ellipsis', async () => {
    const { default: StatusBar } = await import('./StatusBar.vue')
    const longPath = '/Users/me/some/really/long/nested/dir/note.md'
    const wrapper = mount(StatusBar, {
      props: {
        filePath: longPath,
        content: '',
        isDirty: false,
        saveStatus: '',
      },
    })

    // The component slices to the last 2 segments for paths longer than 3 parts.
    expect(wrapper.find('.path').text()).toBe('…/dir/note.md')
    expect(wrapper.find('.path').attributes('title')).toBe(longPath)
  })

  it('falls back to the localized "New" label when no path is set', async () => {
    const { default: StatusBar } = await import('./StatusBar.vue')
    const wrapper = mount(StatusBar, {
      props: {
        filePath: '',
        content: '',
        isDirty: false,
        saveStatus: '',
      },
    })

    expect(wrapper.find('.path').text()).toBe('新建')
  })

  it('shows the dirty dot only when isDirty is true', async () => {
    const { default: StatusBar } = await import('./StatusBar.vue')
    const clean = mount(StatusBar, {
      props: { filePath: '/tmp/n.md', content: '', isDirty: false, saveStatus: '' },
    })
    expect(clean.find('.dot').exists()).toBe(false)

    const dirty = mount(StatusBar, {
      props: { filePath: '/tmp/n.md', content: 'x', isDirty: true, saveStatus: '' },
    })
    expect(dirty.find('.dot').exists()).toBe(true)
  })

  it('shows saveStatus when there is no save error', async () => {
    const { default: StatusBar } = await import('./StatusBar.vue')
    const wrapper = mount(StatusBar, {
      props: {
        filePath: '/tmp/n.md',
        content: '',
        isDirty: true,
        saveStatus: '未保存的更改',
        saveError: null,
      },
    })

    const center = wrapper.find('.center')
    expect(center.text()).toBe('未保存的更改')
    expect(center.classes()).not.toContain('error')
    expect(center.attributes('title')).toBe('')
  })

  it('renders saveError with the warning icon and error styling, taking priority over saveStatus', async () => {
    const { default: StatusBar } = await import('./StatusBar.vue')
    const wrapper = mount(StatusBar, {
      props: {
        filePath: '/tmp/n.md',
        content: '',
        isDirty: true,
        saveStatus: '未保存的更改',
        saveError: '保存失败，请检查文件权限或磁盘空间后重试。',
      },
    })

    const center = wrapper.find('.center')
    // saveError wins, but the error icon and text are both rendered so the
    // user sees both 'saving state' (via isDirty dot) and the failure.
    expect(center.text()).toContain('保存失败，请检查文件权限或磁盘空间后重试。')
    expect(center.find('.error-icon').exists()).toBe(true)
    expect(center.text()).not.toContain('未保存的更改')
    expect(center.classes()).toContain('error')
    expect(center.attributes('title')).toBe('保存失败，请检查文件权限或磁盘空间后重试。')
  })

  it('shows char and line counts derived from content', async () => {
    const { default: StatusBar } = await import('./StatusBar.vue')
    const wrapper = mount(StatusBar, {
      props: {
        filePath: '/tmp/n.md',
        content: 'hello\nworld\n',
        isDirty: false,
        saveStatus: '',
      },
    })

    const text = wrapper.find('.right').text()
    expect(text).toContain('12')
    expect(text).toContain('字符')
    expect(text).toContain('3')
    expect(text).toContain('行')
  })

  it('treats empty content as zero lines, not one', async () => {
    const { default: StatusBar } = await import('./StatusBar.vue')
    const wrapper = mount(StatusBar, {
      props: { filePath: '/tmp/n.md', content: '', isDirty: false, saveStatus: '' },
    })

    const right = wrapper.find('.right').text()
    expect(right).toContain('0 行')
    expect(right).toContain('0 字符')
  })
})
