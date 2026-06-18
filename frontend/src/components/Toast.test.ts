import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// The useToast composable uses module-level state. Each test needs a
// fresh module so singletons don't leak between test cases.
beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

// Helper: mount Toast with a freshly-imported useToast, return wrapper +
// show/dismiss helpers.
async function mountToast() {
  const { useToast } = await import('../composables/useToast')
  const toast = useToast()
  const { default: Toast } = await import('./Toast.vue')
  const wrapper = mount(Toast, {
    global: {
      stubs: {
        // Stub Transition so we don't need Vue transition CSS classes.
        Transition: false,
      },
    },
  })
  return { wrapper, toast, show: toast.show, dismiss: toast.dismiss }
}

describe('Toast.vue', () => {
  it('renders nothing when active is null', async () => {
    const { wrapper } = await mountToast()
    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('renders the message when a toast is shown', async () => {
    const { wrapper, show } = await mountToast()
    show({ message: 'hello world' })
    await nextTick()
    expect(wrapper.find('.toast-message').text()).toBe('hello world')
  })

  it('renders the action button when action is provided', async () => {
    const { wrapper, show } = await mountToast()
    show({ message: 'done', action: { label: 'Undo', onClick: () => {} } })
    await nextTick()
    const btn = wrapper.find('.toast-action')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Undo')
  })

  it('does not render an action button when action is omitted', async () => {
    const { wrapper, show } = await mountToast()
    show({ message: 'plain' })
    await nextTick()
    expect(wrapper.find('.toast-action').exists()).toBe(false)
  })

  it('action click calls onClick and dismisses', async () => {
    const onClick = vi.fn()
    const { wrapper, show } = await mountToast()
    show({ message: 'done', action: { label: 'Go', onClick } })
    await nextTick()

    await wrapper.find('.toast-action').trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    // Toast should be gone after action click.
    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('close button dismisses the toast', async () => {
    const { wrapper, show } = await mountToast()
    show({ message: 'close me' })
    await nextTick()
    expect(wrapper.find('.toast').exists()).toBe(true)

    await wrapper.find('.toast-close').trigger('click')
    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('auto-dismisses after the default duration (3500ms)', async () => {
    const { wrapper, show } = await mountToast()
    show({ message: 'timed' })
    await nextTick()
    expect(wrapper.find('.toast').exists()).toBe(true)

    vi.advanceTimersByTime(3499)
    expect(wrapper.find('.toast').exists()).toBe(true)

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('respects custom duration', async () => {
    const { wrapper, show } = await mountToast()
    show({ message: 'custom', duration: 1000 })
    await nextTick()

    vi.advanceTimersByTime(999)
    expect(wrapper.find('.toast').exists()).toBe(true)

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('does not auto-dismiss when duration is 0', async () => {
    const { wrapper, show } = await mountToast()
    show({ message: 'sticky', duration: 0 })
    await nextTick()

    vi.advanceTimersByTime(60_000)
    expect(wrapper.find('.toast').exists()).toBe(true)
  })

  it('replaces a visible toast and restarts the timer on a new toast', async () => {
    const { wrapper, show } = await mountToast()
    show({ message: 'first', duration: 5000 })
    await nextTick()
    expect(wrapper.find('.toast-message').text()).toBe('first')

    vi.advanceTimersByTime(3000) // 3s in, still alive

    show({ message: 'second', duration: 2000 })
    await nextTick()
    expect(wrapper.find('.toast-message').text()).toBe('second')

    // Should NOT dismiss at 5s (the first timer), only at 2s later.
    vi.advanceTimersByTime(1999)
    expect(wrapper.find('.toast').exists()).toBe(true)

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('shows the toast again after dismiss + new toast', async () => {
    const { wrapper, show, dismiss } = await mountToast()
    show({ message: 'first' })
    await nextTick()
    dismiss()
    await nextTick()
    expect(wrapper.find('.toast').exists()).toBe(false)

    show({ message: 'again' })
    await nextTick()
    expect(wrapper.find('.toast-message').text()).toBe('again')
    expect(wrapper.find('.toast').exists()).toBe(true)
  })
})
