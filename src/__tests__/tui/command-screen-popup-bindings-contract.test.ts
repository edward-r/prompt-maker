import { renderHook } from '@testing-library/react'
import { JSDOM } from 'jsdom'

import {
  useCommandScreenPopupBindings,
  type UseCommandScreenPopupBindingsOptions,
} from '../../tui/screens/command/hooks/useCommandScreenPopupBindings'

const dom = new JSDOM('<!doctype html><html><body></body></html>')

type GlobalDom = { window: Window; document: Document }

beforeAll(() => {
  const target = globalThis as unknown as GlobalDom
  target.window = dom.window as unknown as Window
  target.document = dom.window.document
})

afterAll(() => {
  const target = globalThis as unknown as Partial<GlobalDom>
  delete target.window
  delete target.document
})

jest.mock('../../tui/screens/command/hooks/useCommandScreenPasteBindings', () => {
  const tokenLabel = jest.fn(() => null)
  const handleInputChange = jest.fn(() => undefined)
  const expandInputForSubmit = jest.fn((value: string) => value)

  return {
    useCommandScreenPasteBindings: jest.fn(() => ({
      tokenLabel,
      handleInputChange,
      expandInputForSubmit,
    })),
  }
})

jest.mock('../../tui/screens/command/hooks/useCommandScreenContextPopupBindings', () => {
  const onFilePopupDraftChange = jest.fn(() => undefined)
  const onAddFile = jest.fn(() => undefined)
  const onRemoveFile = jest.fn(() => undefined)

  const onUrlPopupDraftChange = jest.fn(() => undefined)
  const onAddUrl = jest.fn(() => undefined)
  const onRemoveUrl = jest.fn(() => undefined)

  const onImagePopupDraftChange = jest.fn(() => undefined)
  const onAddImage = jest.fn(() => undefined)
  const onRemoveImage = jest.fn(() => undefined)

  const onVideoPopupDraftChange = jest.fn(() => undefined)
  const onAddVideo = jest.fn(() => undefined)
  const onRemoveVideo = jest.fn(() => undefined)

  const onSmartPopupDraftChange = jest.fn(() => undefined)
  const onSmartRootSubmit = jest.fn(() => undefined)

  return {
    useCommandScreenContextPopupBindings: jest.fn(() => ({
      filePopupSuggestions: [],
      filePopupSuggestionSelectionIndex: 0,
      filePopupSuggestionsFocused: false,
      onFilePopupDraftChange,
      onAddFile,
      onRemoveFile,
      onUrlPopupDraftChange,
      onAddUrl,
      onRemoveUrl,
      imagePopupSuggestions: [],
      imagePopupSuggestionSelectionIndex: 0,
      imagePopupSuggestionsFocused: false,
      onImagePopupDraftChange,
      onAddImage,
      onRemoveImage,
      videoPopupSuggestions: [],
      videoPopupSuggestionSelectionIndex: 0,
      videoPopupSuggestionsFocused: false,
      onVideoPopupDraftChange,
      onAddVideo,
      onRemoveVideo,
      smartPopupSuggestions: [],
      smartPopupSuggestionSelectionIndex: 0,
      smartPopupSuggestionsFocused: false,
      onSmartPopupDraftChange,
      onSmartRootSubmit,
    })),
  }
})

jest.mock('../../tui/screens/command/hooks/useCommandScreenHistoryIntentPopupBindings', () => {
  const onHistoryPopupDraftChange = jest.fn(() => undefined)
  const onHistoryPopupSubmit = jest.fn(() => undefined)

  const onIntentPopupDraftChange = jest.fn(() => undefined)

  return {
    useCommandScreenHistoryIntentPopupBindings: jest.fn(() => ({
      history: {
        historyPopupItems: [],
        onHistoryPopupDraftChange,
        onHistoryPopupSubmit,
      },
      intent: {
        intentPopupSuggestions: [],
        intentPopupSuggestionSelectionIndex: 0,
        intentPopupSuggestionsFocused: false,
        onIntentPopupDraftChange,
      },
    })),
  }
})

jest.mock('../../tui/screens/command/hooks/useModelPopupData', () => ({
  useModelPopupData: jest.fn(() => ({
    modelPopupOptions: [],
    modelPopupRecentCount: 0,
    modelPopupSelection: 0,
  })),
}))

jest.mock('../../tui/screens/command/hooks/useReasoningPopup', () => ({
  useReasoningPopup: jest.fn(() => ({
    reasoningPopupVisibleRows: 0,
    reasoningPopupLines: [],
  })),
}))

jest.mock('../../tui/screens/command/hooks/useThemePopupGlue', () => ({
  useThemePopupGlue: jest.fn(() => ({
    themeCount: 0,
    onThemeConfirm: jest.fn(),
    onThemeCancel: jest.fn(),
  })),
}))

jest.mock('../../tui/screens/command/hooks/useThemeModePopupGlue', () => ({
  useThemeModePopupGlue: jest.fn(() => ({
    optionCount: 0,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  })),
}))

jest.mock('../../tui/screens/command/hooks/usePopupKeyboardShortcuts', () => ({
  usePopupKeyboardShortcuts: jest.fn(),
}))

jest.mock('../../tui/screens/command/hooks/useCommandScreenSubmitBindings', () => {
  const handleSubmit = jest.fn(() => undefined)
  const onSeriesSubmit = jest.fn(() => undefined)

  return {
    useCommandScreenSubmitBindings: jest.fn(() => ({
      handleSubmit,
      onSeriesSubmit,
    })),
  }
})

jest.mock('../../tui/screens/command/hooks/useMiscPopupDraftHandlers', () => {
  const onModelPopupQueryChange = jest.fn(() => undefined)
  const onSeriesDraftChange = jest.fn(() => undefined)
  const onInstructionsDraftChange = jest.fn(() => undefined)
  const onTestDraftChange = jest.fn(() => undefined)
  const onBudgetsMaxContextTokensDraftChange = jest.fn(() => undefined)
  const onBudgetsMaxInputTokensDraftChange = jest.fn(() => undefined)

  return {
    useMiscPopupDraftHandlers: jest.fn(() => ({
      onModelPopupQueryChange,
      onSeriesDraftChange,
      onInstructionsDraftChange,
      onTestDraftChange,
      onBudgetsMaxContextTokensDraftChange,
      onBudgetsMaxInputTokensDraftChange,
    })),
  }
})

describe('useCommandScreenPopupBindings (shape contract)', () => {
  it('returns grouped handlers that are safe to call', () => {
    const setState =
      jest.fn() as unknown as UseCommandScreenPopupBindingsOptions['popup']['setState']

    const options: UseCommandScreenPopupBindingsOptions = {
      input: {
        value: '',
        setValue: jest.fn(),
        setPasteActive: jest.fn(),
        consumeSuppressedTextInputChange: jest.fn(() => false),
        suppressNextInput: jest.fn(),
        updateLastTypedIntent: jest.fn(),
        intentFilePath: '',
        lastUserIntentRef: { current: null },
      },
      popup: {
        state: null,
        setState,
        isOpen: false,
        helpOpen: false,
        close: jest.fn(),
        actions: {
          handleCommandSelection: jest.fn(),
          handleModelPopupSubmit: jest.fn(),
          applyToggleSelection: jest.fn(),
          handleIntentFileSubmit: jest.fn(),
          handleBudgetsSubmit: jest.fn(),
          handleSeriesIntentSubmit: jest.fn(),
        },
      },
      menu: {
        isActive: false,
        selectedCommandId: null,
        argsRaw: '',
        isCommandMode: false,
        actions: {
          handleNewCommand: jest.fn(),
          handleReuseCommand: jest.fn(),
        },
      },
      generation: {
        isGenerating: false,
        isAwaitingRefinement: false,
        submitRefinement: jest.fn(),
        runGeneration: jest.fn(async () => undefined),
      },
      history: {
        pushHistory: jest.fn(),
        addCommandHistoryEntry: jest.fn(),
        commandHistoryValues: [],
      },
      context: {
        droppedFilePath: null,
        files: [],
        urls: [],
        images: [],
        videos: [],
        smartContextEnabled: false,
        smartContextRoot: null,
        addFile: jest.fn(),
        removeFile: jest.fn(),
        addUrl: jest.fn(),
        removeUrl: jest.fn(),
        updateUrl: jest.fn(),
        addImage: jest.fn(),
        removeImage: jest.fn(),
        addVideo: jest.fn(),
        removeVideo: jest.fn(),
        toggleSmartContext: jest.fn(),
        setSmartRoot: jest.fn(),
        notify: jest.fn(),
        modelOptions: [],
        lastReasoning: null,
        terminalColumns: 80,
        reasoningPopupHeight: 10,
      },
    }

    const { result, rerender } = renderHook((props) => useCommandScreenPopupBindings(props), {
      initialProps: options,
    })

    expect(result.current).toEqual(
      expect.objectContaining({
        input: expect.objectContaining({
          tokenLabel: expect.any(Function),
          onChange: expect.any(Function),
        }),
        submit: expect.objectContaining({
          onSubmit: expect.any(Function),
          onSeriesSubmit: expect.any(Function),
        }),
        popup: expect.any(Object),
      }),
    )

    expect(() => result.current.input.onChange('next')).not.toThrow()
    expect(() => result.current.submit.onSubmit('run')).not.toThrow()
    expect(() => result.current.popup.misc.onInstructionsDraftChange('draft')).not.toThrow()
    expect(() => result.current.popup.context.file.onAdd('README.md')).not.toThrow()

    const firstInputChange = result.current.input.onChange
    const firstSubmit = result.current.submit.onSubmit
    const firstInstructionsDraftChange = result.current.popup.misc.onInstructionsDraftChange

    rerender(options)

    expect(result.current.input.onChange).toBe(firstInputChange)
    expect(result.current.submit.onSubmit).toBe(firstSubmit)
    expect(result.current.popup.misc.onInstructionsDraftChange).toBe(firstInstructionsDraftChange)
  })
})
