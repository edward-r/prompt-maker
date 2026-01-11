import { useMemo } from 'react'

import type { CommandDescriptor, HistoryEntry, ModelOption, PopupState } from '../../../types'
import { useStableCallback } from '../../../hooks/useStableCallback'

import { useMiscPopupDraftHandlers } from './useMiscPopupDraftHandlers'
import { useModelPopupData } from './useModelPopupData'
import { usePopupKeyboardShortcuts } from './usePopupKeyboardShortcuts'
import { useReasoningPopup } from './useReasoningPopup'
import { useThemePopupGlue } from './useThemePopupGlue'
import { useThemeModePopupGlue } from './useThemeModePopupGlue'

import {
  useCommandScreenPasteBindings,
  type UseCommandScreenPasteBindingsOptions,
} from './useCommandScreenPasteBindings'
import {
  useCommandScreenContextPopupBindings,
  type UseCommandScreenContextPopupBindingsOptions,
} from './useCommandScreenContextPopupBindings'
import {
  useCommandScreenHistoryIntentPopupBindings,
  type UseCommandScreenHistoryIntentPopupBindingsOptions,
} from './useCommandScreenHistoryIntentPopupBindings'
import {
  useCommandScreenSubmitBindings,
  type UseCommandScreenSubmitBindingsOptions,
} from './useCommandScreenSubmitBindings'

type SetPopupState = import('react').Dispatch<import('react').SetStateAction<PopupState>>

export type UseCommandScreenPopupBindingsOptions = {
  input: {
    value: string
    setValue: (value: string | ((prev: string) => string)) => void
    setPasteActive: (active: boolean) => void

    consumeSuppressedTextInputChange: () => boolean
    suppressNextInput: () => void
    updateLastTypedIntent: (next: string) => void

    intentFilePath: string
    lastUserIntentRef: import('react').MutableRefObject<string | null>
  }

  popup: {
    state: PopupState
    setState: SetPopupState
    isOpen: boolean
    helpOpen: boolean
    openHelp?: () => void
    close: () => void

    actions: {
      handleCommandSelection: (commandId: CommandDescriptor['id'], argsRaw?: string) => void
      handleModelPopupSubmit: (option: ModelOption | null | undefined) => void
      applyToggleSelection: (field: 'copy' | 'chatgpt' | 'json', value: boolean) => void
      handleIntentFileSubmit: (value: string) => void
      handleResumeSubmit: () => void
      handleExportSubmit: () => void
      handleSeriesIntentSubmit: (value: string) => void
      handleBudgetsSubmit: () => void
    }
  }

  menu: {
    isActive: boolean
    selectedCommandId: CommandDescriptor['id'] | null
    argsRaw: string
    isCommandMode: boolean

    actions: {
      handleNewCommand: (argsRaw: string) => void
      handleReuseCommand: () => void
    }
  }

  generation: {
    isGenerating: boolean
    isAwaitingRefinement: boolean
    submitRefinement: (value: string) => void
    runGeneration: (payload: {
      intent?: string
      intentFile?: string
      resume?:
        | { kind: 'history'; selector: string; mode: import('../../../types').ResumeMode }
        | { kind: 'file'; payloadPath: string; mode: import('../../../types').ResumeMode }
    }) => Promise<void>
  }

  history: {
    pushHistory: (
      content: string,
      kind?: HistoryEntry['kind'],
      format?: HistoryEntry['format'],
    ) => void
    addCommandHistoryEntry: (value: string) => void
    commandHistoryValues: string[]
  }

  context: {
    droppedFilePath: string | null

    files: string[]
    urls: string[]
    images: string[]
    videos: string[]
    pdfs: string[]

    smartContextEnabled: boolean
    smartContextRoot: string | null

    addFile: (value: string) => void
    removeFile: (index: number) => void
    addUrl: (value: string) => void
    removeUrl: (index: number) => void
    updateUrl: (index: number, value: string) => void
    addImage: (value: string) => void
    removeImage: (index: number) => void
    addVideo: (value: string) => void
    removeVideo: (index: number) => void
    addPdf: (value: string) => void
    removePdf: (index: number) => void
    toggleSmartContext: () => void
    setSmartRoot: (value: string) => void

    notify: (message: string) => void

    modelOptions: ModelOption[]

    lastReasoning: string | null
    terminalColumns: number
    reasoningPopupHeight: number
  }
}

export type UseCommandScreenPopupBindingsResult = {
  input: {
    tokenLabel: (token: string) => string | null
    onChange: (next: string) => void
  }
  submit: {
    onSubmit: (value: string) => void
    onSeriesSubmit: (value: string) => void
  }
  popup: {
    model: {
      options: ModelOption[]
      recentCount: number
      selection: number
      onQueryChange: (next: string) => void
    }
    history: {
      items: string[]
      onDraftChange: (next: string) => void
      onSubmit: (value: string) => void
    }
    intent: {
      suggestions: string[]
      suggestionSelectionIndex: number
      suggestionsFocused: boolean
      onDraftChange: (next: string) => void
    }
    context: {
      file: {
        suggestions: string[]
        suggestionSelectionIndex: number
        suggestionsFocused: boolean
        onDraftChange: (next: string) => void
        onAdd: (value: string) => void
        onRemove: (index: number) => void
      }
      url: {
        onDraftChange: (next: string) => void
        onAdd: (value: string) => void
        onRemove: (index: number) => void
      }
      image: {
        suggestions: string[]
        suggestionSelectionIndex: number
        suggestionsFocused: boolean
        onDraftChange: (next: string) => void
        onAdd: (value: string) => void
        onRemove: (index: number) => void
      }
      video: {
        suggestions: string[]
        suggestionSelectionIndex: number
        suggestionsFocused: boolean
        onDraftChange: (next: string) => void
        onAdd: (value: string) => void
        onRemove: (index: number) => void
      }
      pdf: {
        suggestions: string[]
        suggestionSelectionIndex: number
        suggestionsFocused: boolean
        onDraftChange: (next: string) => void
        onAdd: (value: string) => void
        onRemove: (index: number) => void
      }
      smart: {
        suggestions: string[]
        suggestionSelectionIndex: number
        suggestionsFocused: boolean
        onDraftChange: (next: string) => void
        onRootSubmit: (value: string) => void
      }
    }
    misc: {
      onSeriesDraftChange: (next: string) => void
      onInstructionsDraftChange: (next: string) => void
      onTestDraftChange: (next: string) => void
      onBudgetsMaxContextTokensDraftChange: (next: string) => void
      onBudgetsMaxInputTokensDraftChange: (next: string) => void
      onResumePayloadPathDraftChange: (next: string) => void
      onExportOutPathDraftChange: (next: string) => void
    }
    reasoning: {
      lines: HistoryEntry[]
      visibleRows: number
    }
  }
}

export const useCommandScreenPopupBindings = (
  options: UseCommandScreenPopupBindingsOptions,
): UseCommandScreenPopupBindingsResult => {
  const notify = useStableCallback((message: string) => {
    options.context.notify(message)
  })

  const pushHistory = useStableCallback(
    (content: string, kind: HistoryEntry['kind'] = 'system', format?: HistoryEntry['format']) => {
      options.history.pushHistory(content, kind, format)
    },
  )

  const paste = useCommandScreenPasteBindings({
    inputValue: options.input.value,
    popupState: options.popup.state,
    helpOpen: options.popup.helpOpen,
    setInputValue: options.input.setValue,
    setPasteActive: options.input.setPasteActive,
    consumeSuppressedTextInputChange: options.input.consumeSuppressedTextInputChange,
    suppressNextInput: options.input.suppressNextInput,
    updateLastTypedIntent: options.input.updateLastTypedIntent,
  } satisfies UseCommandScreenPasteBindingsOptions)

  const context = useCommandScreenContextPopupBindings({
    inputValue: options.input.value,
    popupState: options.popup.state,
    helpOpen: options.popup.helpOpen,
    isPopupOpen: options.popup.isOpen,
    isCommandMode: options.menu.isCommandMode,
    isCommandMenuActive: options.menu.isActive,
    isGenerating: options.generation.isGenerating,
    droppedFilePath: options.context.droppedFilePath,
    files: options.context.files,
    urls: options.context.urls,
    images: options.context.images,
    videos: options.context.videos,
    pdfs: options.context.pdfs,
    smartContextEnabled: options.context.smartContextEnabled,
    smartContextRoot: options.context.smartContextRoot,
    addFile: options.context.addFile,
    removeFile: options.context.removeFile,
    addUrl: options.context.addUrl,
    removeUrl: options.context.removeUrl,
    updateUrl: options.context.updateUrl,
    addImage: options.context.addImage,
    removeImage: options.context.removeImage,
    addVideo: options.context.addVideo,
    removeVideo: options.context.removeVideo,
    addPdf: options.context.addPdf,
    removePdf: options.context.removePdf,
    toggleSmartContext: options.context.toggleSmartContext,
    setSmartRoot: options.context.setSmartRoot,
    setInputValue: options.input.setValue,
    setPopupState: options.popup.setState,
    suppressNextInput: options.input.suppressNextInput,
    notify,
    pushHistory,
    addCommandHistoryEntry: options.history.addCommandHistoryEntry,
    handleCommandSelection: options.popup.actions.handleCommandSelection,
    consumeSuppressedTextInputChange: options.input.consumeSuppressedTextInputChange,
  } satisfies UseCommandScreenContextPopupBindingsOptions)

  const historyAndIntent = useCommandScreenHistoryIntentPopupBindings({
    popupState: options.popup.state,
    setPopupState: options.popup.setState,
    closePopup: options.popup.close,
    setInputValue: options.input.setValue,
    consumeSuppressedTextInputChange: options.input.consumeSuppressedTextInputChange,
    suppressNextInput: options.input.suppressNextInput,
    commandHistoryValues: options.history.commandHistoryValues,
  } satisfies UseCommandScreenHistoryIntentPopupBindingsOptions)

  const { modelPopupOptions, modelPopupRecentCount, modelPopupSelection } = useModelPopupData({
    popupState: options.popup.state,
    modelOptions: options.context.modelOptions,
  })

  const { reasoningPopupVisibleRows, reasoningPopupLines } = useReasoningPopup({
    lastReasoning: options.context.lastReasoning,
    terminalColumns: options.context.terminalColumns,
    popupHeight: options.context.reasoningPopupHeight,
  })

  const themePopup = useThemePopupGlue({
    popupState: options.popup.state,
    setPopupState: options.popup.setState,
    closePopup: options.popup.close,
  })

  const themeModePopup = useThemeModePopupGlue({
    popupState: options.popup.state,
    setPopupState: options.popup.setState,
    closePopup: options.popup.close,
  })

  usePopupKeyboardShortcuts({
    popupState: options.popup.state,
    helpOpen: options.popup.helpOpen,
    setPopupState: options.popup.setState,
    closePopup: options.popup.close,

    model: {
      options: modelPopupOptions,
      onSubmit: options.popup.actions.handleModelPopupSubmit,
    },

    toggle: {
      applySelection: options.popup.actions.applyToggleSelection,
    },

    theme: {
      count: themePopup.themeCount,
      onConfirm: themePopup.onThemeConfirm,
      onCancel: themePopup.onThemeCancel,
    },

    themeMode: {
      count: themeModePopup.optionCount,
      onConfirm: themeModePopup.onConfirm,
      onCancel: themeModePopup.onCancel,
    },

    budgets: {
      onSubmit: options.popup.actions.handleBudgetsSubmit,
    },

    file: {
      items: options.context.files,
      suggestions: context.filePopupSuggestions,
      onAdd: context.onAddFile,
      onRemove: context.onRemoveFile,
    },

    url: {
      items: options.context.urls,
      onRemove: context.onRemoveUrl,
    },

    image: {
      items: options.context.images,
      suggestions: context.imagePopupSuggestions,
      onAdd: context.onAddImage,
      onRemove: context.onRemoveImage,
    },

    video: {
      items: options.context.videos,
      suggestions: context.videoPopupSuggestions,
      onAdd: context.onAddVideo,
      onRemove: context.onRemoveVideo,
    },

    pdf: {
      items: options.context.pdfs,
      suggestions: context.pdfPopupSuggestions,
      onAdd: context.onAddPdf,
      onRemove: context.onRemovePdf,
    },

    history: {
      items: historyAndIntent.history.historyPopupItems,
    },

    resume: {
      onSubmit: options.popup.actions.handleResumeSubmit,
    },

    export: {
      onSubmit: options.popup.actions.handleExportSubmit,
    },

    smart: {
      suggestions: context.smartPopupSuggestions,
      contextRoot: options.context.smartContextRoot,
      onRootSubmit: context.onSmartRootSubmit,
    },

    intent: {
      suggestions: historyAndIntent.intent.intentPopupSuggestions,
      onFileSubmit: options.popup.actions.handleIntentFileSubmit,
    },

    reasoning: {
      lines: reasoningPopupLines,
      visibleRows: reasoningPopupVisibleRows,
    },
  })

  const submit = useCommandScreenSubmitBindings({
    popupState: options.popup.state,
    isAwaitingRefinement: options.generation.isAwaitingRefinement,
    submitRefinement: options.generation.submitRefinement,
    isCommandMenuActive: options.menu.isActive,
    selectedCommandId: options.menu.selectedCommandId,
    commandMenuArgsRaw: options.menu.argsRaw,
    isCommandMode: options.menu.isCommandMode,
    intentFilePath: options.input.intentFilePath,
    isGenerating: options.generation.isGenerating,
    expandInputForSubmit: paste.expandInputForSubmit,
    setInputValue: options.input.setValue,
    pushHistory,
    addCommandHistoryEntry: options.history.addCommandHistoryEntry,
    runGeneration: options.generation.runGeneration,
    handleCommandSelection: options.popup.actions.handleCommandSelection,
    handleNewCommand: options.menu.actions.handleNewCommand,
    handleReuseCommand: options.menu.actions.handleReuseCommand,
    lastUserIntentRef: options.input.lastUserIntentRef,
    handleSeriesIntentSubmit: options.popup.actions.handleSeriesIntentSubmit,
    ...(options.popup.openHelp ? { openHelp: options.popup.openHelp } : {}),
  } satisfies UseCommandScreenSubmitBindingsOptions)

  const miscDraftHandlers = useMiscPopupDraftHandlers({
    setPopupState: options.popup.setState,
    consumeSuppressedTextInputChange: options.input.consumeSuppressedTextInputChange,
  })

  const input = useMemo(
    () => ({
      tokenLabel: paste.tokenLabel,
      onChange: paste.handleInputChange,
    }),
    [paste.tokenLabel, paste.handleInputChange],
  )

  const submitGroup = useMemo(
    () => ({
      onSubmit: submit.handleSubmit,
      onSeriesSubmit: submit.onSeriesSubmit,
    }),
    [submit.handleSubmit, submit.onSeriesSubmit],
  )

  const popup = useMemo(
    () => ({
      model: {
        options: modelPopupOptions,
        recentCount: modelPopupRecentCount,
        selection: modelPopupSelection,
        onQueryChange: miscDraftHandlers.onModelPopupQueryChange,
      },
      history: {
        items: historyAndIntent.history.historyPopupItems,
        onDraftChange: historyAndIntent.history.onHistoryPopupDraftChange,
        onSubmit: historyAndIntent.history.onHistoryPopupSubmit,
      },
      intent: {
        suggestions: historyAndIntent.intent.intentPopupSuggestions,
        suggestionSelectionIndex: historyAndIntent.intent.intentPopupSuggestionSelectionIndex,
        suggestionsFocused: historyAndIntent.intent.intentPopupSuggestionsFocused,
        onDraftChange: historyAndIntent.intent.onIntentPopupDraftChange,
      },
      context: {
        file: {
          suggestions: context.filePopupSuggestions,
          suggestionSelectionIndex: context.filePopupSuggestionSelectionIndex,
          suggestionsFocused: context.filePopupSuggestionsFocused,
          onDraftChange: context.onFilePopupDraftChange,
          onAdd: context.onAddFile,
          onRemove: context.onRemoveFile,
        },
        url: {
          onDraftChange: context.onUrlPopupDraftChange,
          onAdd: context.onAddUrl,
          onRemove: context.onRemoveUrl,
        },
        image: {
          suggestions: context.imagePopupSuggestions,
          suggestionSelectionIndex: context.imagePopupSuggestionSelectionIndex,
          suggestionsFocused: context.imagePopupSuggestionsFocused,
          onDraftChange: context.onImagePopupDraftChange,
          onAdd: context.onAddImage,
          onRemove: context.onRemoveImage,
        },
        video: {
          suggestions: context.videoPopupSuggestions,
          suggestionSelectionIndex: context.videoPopupSuggestionSelectionIndex,
          suggestionsFocused: context.videoPopupSuggestionsFocused,
          onDraftChange: context.onVideoPopupDraftChange,
          onAdd: context.onAddVideo,
          onRemove: context.onRemoveVideo,
        },
        pdf: {
          suggestions: context.pdfPopupSuggestions,
          suggestionSelectionIndex: context.pdfPopupSuggestionSelectionIndex,
          suggestionsFocused: context.pdfPopupSuggestionsFocused,
          onDraftChange: context.onPdfPopupDraftChange,
          onAdd: context.onAddPdf,
          onRemove: context.onRemovePdf,
        },
        smart: {
          suggestions: context.smartPopupSuggestions,
          suggestionSelectionIndex: context.smartPopupSuggestionSelectionIndex,
          suggestionsFocused: context.smartPopupSuggestionsFocused,
          onDraftChange: context.onSmartPopupDraftChange,
          onRootSubmit: context.onSmartRootSubmit,
        },
      },
      misc: {
        onSeriesDraftChange: miscDraftHandlers.onSeriesDraftChange,
        onInstructionsDraftChange: miscDraftHandlers.onInstructionsDraftChange,
        onTestDraftChange: miscDraftHandlers.onTestDraftChange,
        onBudgetsMaxContextTokensDraftChange:
          miscDraftHandlers.onBudgetsMaxContextTokensDraftChange,
        onBudgetsMaxInputTokensDraftChange: miscDraftHandlers.onBudgetsMaxInputTokensDraftChange,
        onResumePayloadPathDraftChange: miscDraftHandlers.onResumePayloadPathDraftChange,
        onExportOutPathDraftChange: miscDraftHandlers.onExportOutPathDraftChange,
      },
      reasoning: {
        lines: reasoningPopupLines,
        visibleRows: reasoningPopupVisibleRows,
      },
    }),
    [
      modelPopupOptions,
      modelPopupRecentCount,
      modelPopupSelection,
      miscDraftHandlers.onModelPopupQueryChange,
      historyAndIntent.history.historyPopupItems,
      historyAndIntent.history.onHistoryPopupDraftChange,
      historyAndIntent.history.onHistoryPopupSubmit,
      historyAndIntent.intent.intentPopupSuggestions,
      historyAndIntent.intent.intentPopupSuggestionSelectionIndex,
      historyAndIntent.intent.intentPopupSuggestionsFocused,
      historyAndIntent.intent.onIntentPopupDraftChange,
      context.filePopupSuggestions,
      context.filePopupSuggestionSelectionIndex,
      context.filePopupSuggestionsFocused,
      context.onFilePopupDraftChange,
      context.onAddFile,
      context.onRemoveFile,
      context.onUrlPopupDraftChange,
      context.onAddUrl,
      context.onRemoveUrl,
      context.imagePopupSuggestions,
      context.imagePopupSuggestionSelectionIndex,
      context.imagePopupSuggestionsFocused,
      context.onImagePopupDraftChange,
      context.onAddImage,
      context.onRemoveImage,
      context.videoPopupSuggestions,
      context.videoPopupSuggestionSelectionIndex,
      context.videoPopupSuggestionsFocused,
      context.onVideoPopupDraftChange,
      context.onAddVideo,
      context.onRemoveVideo,
      context.pdfPopupSuggestions,
      context.pdfPopupSuggestionSelectionIndex,
      context.pdfPopupSuggestionsFocused,
      context.onPdfPopupDraftChange,
      context.onAddPdf,
      context.onRemovePdf,
      context.smartPopupSuggestions,
      context.smartPopupSuggestionSelectionIndex,
      context.smartPopupSuggestionsFocused,
      context.onSmartPopupDraftChange,
      context.onSmartRootSubmit,
      miscDraftHandlers.onSeriesDraftChange,
      miscDraftHandlers.onInstructionsDraftChange,
      miscDraftHandlers.onTestDraftChange,
      miscDraftHandlers.onBudgetsMaxContextTokensDraftChange,
      miscDraftHandlers.onBudgetsMaxInputTokensDraftChange,
      reasoningPopupLines,
      reasoningPopupVisibleRows,
    ],
  )

  return useMemo(
    () => ({
      input,
      submit: submitGroup,
      popup,
    }),
    [input, submitGroup, popup],
  )
}
