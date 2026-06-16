import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'


describe('Sidebar controls', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('does not render the header collapse button', async () => {
    const { default: Sidebar } = await import('./Sidebar.vue')
    const wrapper = mount(Sidebar, {
      props: {
        isOpen: true,
        currentFilePath: '',
      },
    })

    expect(wrapper.find('[title="切换侧边栏"]').exists()).toBe(false)
    expect(wrapper.findAll('.sidebar-header .icon-btn')).toHaveLength(1)
  })

  it('localizes the empty folder label', async () => {
    localStorage.setItem('fast-md-locale', 'en')

    const { default: Sidebar } = await import('./Sidebar.vue')
    const wrapper = mount(Sidebar, {
      props: {
        isOpen: true,
        currentFilePath: '',
      },
    })

    expect(wrapper.find('.sidebar-dir-name').text()).toBe('No folder')
  })
})
