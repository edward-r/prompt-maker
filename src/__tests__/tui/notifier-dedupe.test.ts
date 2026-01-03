import React from 'react'
import { act, renderHook } from '@testing-library/react'
import { JSDOM } from 'jsdom'

import { ToastProvider, useNotifier } from '../../tui/notifier'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
const globalEnv = globalThis as typeof globalThis & {
  window: Window & typeof globalThis
  document: Document
  navigator: Navigator
}

globalEnv.window = dom.window as typeof globalEnv.window
globalEnv.document = dom.window.document as Document
globalEnv.navigator = dom.window.navigator

const createWrapper = (options: Omit<React.ComponentProps<typeof ToastProvider>, 'children'>) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(ToastProvider, { ...options, children })

  return Wrapper
}

describe('toast provider notifier dedupe', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('reuses latest active toast when message+kind match', () => {
    const wrapper = createWrapper({ exitAnimationMs: 10 })
    const { result } = renderHook(() => useNotifier({ autoDismissMs: 1_000 }), { wrapper })

    let firstId: number | null = null
    let secondId: number | null = null

    act(() => {
      firstId = result.current.showToast('Same', { kind: 'info', autoDismissMs: 100 })
    })

    act(() => {
      jest.advanceTimersByTime(60)
    })

    act(() => {
      secondId = result.current.showToast('Same', { kind: 'info', autoDismissMs: 500 })
    })

    expect(firstId).not.toBeNull()
    expect(secondId).toBe(firstId)

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]?.message).toBe('Same')

    // NOTE: the toast item is not updated on reuse.
    expect(result.current.toasts[0]?.autoDismissMs).toBe(100)

    act(() => {
      jest.advanceTimersByTime(100)
    })

    // The dismiss timer is reset on reuse.
    expect(result.current.toasts[0]?.isExiting).toBe(false)

    act(() => {
      jest.advanceTimersByTime(400)
    })

    expect(result.current.toasts[0]?.isExiting).toBe(true)

    act(() => {
      jest.advanceTimersByTime(10)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('does not reuse a toast that is already exiting', () => {
    const wrapper = createWrapper({ exitAnimationMs: 10 })
    const { result } = renderHook(() => useNotifier({ autoDismissMs: 100_000 }), { wrapper })

    let firstId: number | null = null
    let secondId: number | null = null

    act(() => {
      firstId = result.current.showToast('Same', { kind: 'info', autoDismissMs: 100_000 })
    })

    if (firstId === null) {
      throw new Error('Expected toast id')
    }

    const firstToastId = firstId

    act(() => {
      result.current.dismissToast(firstToastId)
    })

    expect(result.current.toasts[0]?.isExiting).toBe(true)

    act(() => {
      secondId = result.current.showToast('Same', { kind: 'info', autoDismissMs: 100_000 })
    })

    expect(secondId).not.toBeNull()
    expect(secondId).not.toBe(firstToastId)

    expect(result.current.toasts).toHaveLength(2)
    expect(result.current.toasts[0]?.isExiting).toBe(true)
    expect(result.current.toasts[1]?.isExiting).toBe(false)
  })

  it('only reuses the latest active toast (not an older matching one)', () => {
    const wrapper = createWrapper({ exitAnimationMs: 10 })
    const { result } = renderHook(() => useNotifier({ autoDismissMs: 100_000 }), { wrapper })

    let firstId: number | null = null
    let thirdId: number | null = null

    act(() => {
      firstId = result.current.showToast('A', { kind: 'info', autoDismissMs: 100_000 })
      result.current.showToast('B', { kind: 'info', autoDismissMs: 100_000 })
    })

    act(() => {
      thirdId = result.current.showToast('A', { kind: 'info', autoDismissMs: 100_000 })
    })

    expect(firstId).not.toBeNull()
    expect(thirdId).not.toBeNull()
    expect(thirdId).not.toBe(firstId)

    expect(result.current.toasts.map((toast) => toast.message)).toEqual(['A', 'B', 'A'])
  })
})
