import type { PopupAction } from '../../tui/popup-reducer'

import { INITIAL_POPUP_MANAGER_STATE, popupReducer } from '../../tui/popup-reducer'
import { createPopupScanOrchestrator } from '../../tui/hooks/popup-manager/scan-orchestrator'

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

const createDeferred = <T>(): Deferred<T> => {
  let resolve: (value: T) => void = (_value) => undefined
  let reject: (reason?: unknown) => void = (_reason) => undefined

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

describe('popup scan orchestrator', () => {
  it('keeps scanId monotonic and ignores stale results', async () => {
    const scanIdRef = { current: 0 }
    const actions: PopupAction[] = []

    const dispatch = (action: PopupAction): void => {
      actions.push(action)
    }

    const pushHistory = jest.fn()

    const orchestrator = createPopupScanOrchestrator({ scanIdRef, dispatch, pushHistory })

    const firstScan = createDeferred<string[]>()
    const secondScan = createDeferred<string[]>()

    orchestrator.runSuggestionScan({
      kind: 'file',
      open: (scanId) => ({ type: 'open-file', scanId }),
      scan: () => firstScan.promise,
    })

    orchestrator.runSuggestionScan({
      kind: 'file',
      open: (scanId) => ({ type: 'open-file', scanId }),
      scan: () => secondScan.promise,
    })

    expect(actions[0]).toEqual({ type: 'open-file', scanId: 1 })
    expect(actions[1]).toEqual({ type: 'open-file', scanId: 2 })

    firstScan.resolve(['stale'])
    await firstScan.promise
    await Promise.resolve()

    let state = INITIAL_POPUP_MANAGER_STATE
    for (const action of actions) {
      state = popupReducer(state, action)
    }

    if (state.popupState?.type !== 'file') {
      throw new Error('Expected file popup')
    }

    expect(state.popupState.suggestedItems).toEqual([])

    secondScan.resolve(['fresh'])
    await secondScan.promise
    await Promise.resolve()

    state = INITIAL_POPUP_MANAGER_STATE
    for (const action of actions) {
      state = popupReducer(state, action)
    }

    if (state.popupState?.type !== 'file') {
      throw new Error('Expected file popup')
    }

    expect(state.popupState.suggestedItems).toEqual(['fresh'])
  })

  it('does not apply file suggestions after switching popup types', async () => {
    const scanIdRef = { current: 0 }
    const actions: PopupAction[] = []

    const dispatch = (action: PopupAction): void => {
      actions.push(action)
    }

    const pushHistory = jest.fn()

    const orchestrator = createPopupScanOrchestrator({ scanIdRef, dispatch, pushHistory })

    const fileScan = createDeferred<string[]>()
    const imageScan = createDeferred<string[]>()

    orchestrator.runSuggestionScan({
      kind: 'file',
      open: (scanId) => ({ type: 'open-file', scanId }),
      scan: () => fileScan.promise,
    })

    orchestrator.runSuggestionScan({
      kind: 'image',
      open: (scanId) => ({ type: 'open-image', scanId }),
      scan: () => imageScan.promise,
    })

    fileScan.resolve(['file.txt'])
    await fileScan.promise
    await Promise.resolve()

    let state = INITIAL_POPUP_MANAGER_STATE
    for (const action of actions) {
      state = popupReducer(state, action)
    }

    expect(state.popupState?.type).toBe('image')

    imageScan.resolve(['img.png'])
    await imageScan.promise
    await Promise.resolve()

    state = INITIAL_POPUP_MANAGER_STATE
    for (const action of actions) {
      state = popupReducer(state, action)
    }

    if (state.popupState?.type !== 'image') {
      throw new Error('Expected image popup')
    }

    expect(state.popupState.suggestedItems).toEqual(['img.png'])
  })
})
