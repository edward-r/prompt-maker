import { useCommandScreenBindings } from './useCommandScreenBindings'
import { useCommandScreenViewModel } from './useCommandScreenViewModel'

import type {
  UseCommandScreenPopupAndViewOptions,
  UseCommandScreenPopupAndViewResult,
} from './useCommandScreenPopupAndView.types'

export const useCommandScreenPopupAndView = (
  options: UseCommandScreenPopupAndViewOptions,
): UseCommandScreenPopupAndViewResult => {
  const { context, input, popup, history, generation } = options

  const { popupManager, shell, bindings, enhancedStatusChips } = useCommandScreenBindings(options)

  const viewModel = useCommandScreenViewModel({
    transport: { isAwaitingTransportInput: shell.isAwaitingTransportInput },
    panes: {
      history: {
        lines: shell.history,
        visibleRows: shell.historyRows,
        scrollOffset: shell.scrollOffset,
      },
      menu: {
        isActive: shell.isCommandMenuActive,
        height: shell.menuHeight,
        commands: shell.visibleCommands,
        selectedIndex: input.commandSelectionIndex,
      },
    },
    popup: {
      base: {
        popupState: popupManager.popupState,
        helpOpen: popup.helpOpen,
        overlayHeight: shell.overlayHeight,
      },
      model: {
        modelPopupOptions: bindings.popup.model.options,
        modelPopupSelection: bindings.popup.model.selection,
        modelPopupRecentCount: bindings.popup.model.recentCount,
        providerStatuses: generation.providerStatuses,
        onModelPopupQueryChange: bindings.popup.model.onQueryChange,
        onModelPopupSubmit: popupManager.actions.handleModelPopupSubmit,
      },
      context: {
        files: context.files,
        filePopupSuggestions: bindings.popup.context.file.suggestions,
        filePopupSuggestionSelectionIndex: bindings.popup.context.file.suggestionSelectionIndex,
        filePopupSuggestionsFocused: bindings.popup.context.file.suggestionsFocused,
        onFilePopupDraftChange: bindings.popup.context.file.onDraftChange,
        onAddFile: bindings.popup.context.file.onAdd,
        urls: context.urls,
        onUrlPopupDraftChange: bindings.popup.context.url.onDraftChange,
        onAddUrl: bindings.popup.context.url.onAdd,
        images: context.images,
        imagePopupSuggestions: bindings.popup.context.image.suggestions,
        imagePopupSuggestionSelectionIndex: bindings.popup.context.image.suggestionSelectionIndex,
        imagePopupSuggestionsFocused: bindings.popup.context.image.suggestionsFocused,
        onImagePopupDraftChange: bindings.popup.context.image.onDraftChange,
        onAddImage: bindings.popup.context.image.onAdd,
        videos: context.videos,
        videoPopupSuggestions: bindings.popup.context.video.suggestions,
        videoPopupSuggestionSelectionIndex: bindings.popup.context.video.suggestionSelectionIndex,
        videoPopupSuggestionsFocused: bindings.popup.context.video.suggestionsFocused,
        onVideoPopupDraftChange: bindings.popup.context.video.onDraftChange,
        onAddVideo: bindings.popup.context.video.onAdd,
        smartContextEnabled: context.smartContextEnabled,
        smartContextRoot: context.smartContextRoot,
        smartPopupSuggestions: bindings.popup.context.smart.suggestions,
        smartPopupSuggestionSelectionIndex: bindings.popup.context.smart.suggestionSelectionIndex,
        smartPopupSuggestionsFocused: bindings.popup.context.smart.suggestionsFocused,
        onSmartPopupDraftChange: bindings.popup.context.smart.onDraftChange,
        onSmartRootSubmit: bindings.popup.context.smart.onRootSubmit,
      },
      history: {
        historyPopupItems: bindings.popup.history.items,
        onHistoryPopupDraftChange: bindings.popup.history.onDraftChange,
        onHistoryPopupSubmit: bindings.popup.history.onSubmit,
      },
      resume: {
        onResumePayloadPathDraftChange: bindings.popup.misc.onResumePayloadPathDraftChange,
        onResumeSubmit: popupManager.actions.handleResumeSubmit,
      },
      intent: {
        intentPopupSuggestions: bindings.popup.intent.suggestions,
        intentPopupSuggestionSelectionIndex: bindings.popup.intent.suggestionSelectionIndex,
        intentPopupSuggestionsFocused: bindings.popup.intent.suggestionsFocused,
        onIntentPopupDraftChange: bindings.popup.intent.onDraftChange,
        onIntentFileSubmit: popupManager.actions.handleIntentFileSubmit,
      },
      instructions: {
        onInstructionsDraftChange: bindings.popup.misc.onInstructionsDraftChange,
        onInstructionsSubmit: popupManager.actions.handleInstructionsSubmit,
      },
      series: {
        isGenerating: generation.isGenerating,
        onSeriesDraftChange: bindings.popup.misc.onSeriesDraftChange,
        onSeriesSubmit: bindings.submit.onSeriesSubmit,
      },
      test: {
        isTestCommandRunning: history.isTestCommandRunning,
        onTestDraftChange: bindings.popup.misc.onTestDraftChange,
        onTestSubmit: history.onTestPopupSubmit,
      },
      tokens: {
        tokenUsageRun: generation.tokenUsageRun,
        tokenUsageBreakdown: generation.tokenUsageBreakdown,
        maxContextTokens: context.maxContextTokens,
        maxInputTokens: context.maxInputTokens,
        contextOverflowStrategy: context.contextOverflowStrategy,
        latestContextOverflow: generation.latestContextOverflow,
      },
      budgets: {
        onBudgetsMaxContextTokensDraftChange:
          bindings.popup.misc.onBudgetsMaxContextTokensDraftChange,
        onBudgetsMaxInputTokensDraftChange: bindings.popup.misc.onBudgetsMaxInputTokensDraftChange,
        onBudgetsSubmit: popupManager.actions.handleBudgetsSubmit,
      },
      settings: { statusChips: enhancedStatusChips },
      reasoning: {
        reasoningPopupLines: bindings.popup.reasoning.lines,
        reasoningPopupVisibleRows: bindings.popup.reasoning.visibleRows,
      },
    },
    input: {
      base: {
        value: input.inputValue,
        onChange: bindings.input.onChange,
        onSubmit: bindings.submit.onSubmit,
        isPasteActive: input.isPasteActive,
        hint: shell.inputBarHint,
        debugLine: shell.inputBarDebugLine,
        tokenLabel: bindings.input.tokenLabel,
        debugKeysEnabled: input.debugKeysEnabled,
        onDebugKeyEvent: input.onDebugKeyEvent,
      },
      state: {
        isPopupOpen: popupManager.isPopupOpen,
        helpOpen: popup.helpOpen,
        isAwaitingRefinement: generation.isAwaitingRefinement,
        isBusy: generation.isGenerating || history.isTestCommandRunning,
      },
      statusChips: enhancedStatusChips,
    },
  })

  return {
    transportMessage: viewModel.transportMessage,
    historyPaneProps: viewModel.historyPaneProps,
    popupAreaProps: viewModel.popupAreaProps,
    commandMenuPaneProps: viewModel.commandMenuPaneProps,
    commandInputProps: viewModel.commandInputProps,
  }
}
