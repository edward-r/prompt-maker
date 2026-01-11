import { act, renderHook } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import type { MutableRefObject } from 'react'

import { useIntentSubmitHandler } from '../../tui/screens/command/hooks/useIntentSubmitHandler'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
const globalScope = globalThis as typeof globalThis & {
  window: Window & typeof globalThis
  document: Document
  navigator: Navigator
}

globalScope.window = dom.window
globalScope.document = dom.window.document
globalScope.navigator = dom.window.navigator

describe('/help command', () => {
  it('opens the help overlay instead of running a popup command', () => {
    const openHelp = jest.fn()
    const handleCommandSelection = jest.fn()

    const lastUserIntentRef: MutableRefObject<string | null> = { current: null }

    const { result } = renderHook(() =>
      useIntentSubmitHandler({
        popupState: null,
        isAwaitingRefinement: false,
        submitRefinement: jest.fn(),
        isCommandMenuActive: true,
        selectedCommandId: 'help',
        commandMenuArgsRaw: '',
        isCommandMode: true,
        intentFilePath: '',
        isGenerating: false,
        expandInputForSubmit: (value) => value,
        setInputValue: jest.fn(),
        pushHistory: jest.fn(),
        addCommandHistoryEntry: jest.fn(),
        runGeneration: jest.fn(async () => {}),
        handleCommandSelection,
        handleNewCommand: jest.fn(),
        handleReuseCommand: jest.fn(),
        lastUserIntentRef,
        openHelp,
      }),
    )

    act(() => {
      result.current('/help')
    })

    expect(openHelp).toHaveBeenCalledTimes(1)
    expect(handleCommandSelection).not.toHaveBeenCalled()
  })
})
