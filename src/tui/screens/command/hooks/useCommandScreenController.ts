import { useMemo } from 'react'

import { useStdout } from 'ink'

import type { NotifyOptions } from '../../../notifier'

import { useContextDispatch, useContextState } from '../../../context-store'

import { useCommandScreenHistoryAndTests } from './useCommandScreenHistoryAndTests'
import { useCommandScreenInputState } from './useCommandScreenInputState'
import {
  useCommandScreenModelGeneration,
  type UseCommandScreenModelGenerationResult,
} from './useCommandScreenModelGeneration'
import { useCommandScreenPopupAndView } from './useCommandScreenPopupAndView'
import type {
  UseCommandScreenPopupAndViewOptions,
  UseCommandScreenPopupAndViewResult,
} from './useCommandScreenPopupAndView.types'

export type UseCommandScreenControllerOptions = {
  transport?: {
    interactiveTransportPath?: string | undefined
  }
  popup: {
    onPopupVisibilityChange?: (isOpen: boolean) => void
    commandMenuSignal?: number
    helpOpen: boolean
    reservedRows: number
    onOpenHelp?: () => void
  }
  notify: (message: string, options?: NotifyOptions) => void
}

export type UseCommandScreenControllerResult = {
  view: UseCommandScreenPopupAndViewResult
  actions: {
    suppressNextInput: () => void
  }
}

export const useCommandScreenController = ({
  transport,
  popup,
  notify,
}: UseCommandScreenControllerOptions): UseCommandScreenControllerResult => {
  const { stdout } = useStdout()

  const interactiveTransportPath = transport?.interactiveTransportPath

  const { onPopupVisibilityChange, commandMenuSignal, helpOpen, reservedRows, onOpenHelp } = popup

  const {
    files,
    urls,
    images,
    videos,
    pdfs,
    smartContextEnabled,

    smartContextRoot,
    metaInstructions,
    maxContextTokens,
    maxInputTokens,
    contextOverflowStrategy,
    lastReasoning,
    lastGeneratedPrompt,
  } = useContextState()

  const {
    addFile,
    removeFile,
    addUrl,
    removeUrl,
    updateUrl,
    addImage,
    removeImage,
    addVideo,
    removeVideo,
    addPdf,
    removePdf,
    toggleSmartContext,

    setSmartRoot,
    setMetaInstructions,
    setBudgets,
    setLastReasoning,
    setLastGeneratedPrompt,
    resetContext,
  } = useContextDispatch()

  const historyAndTests = useCommandScreenHistoryAndTests()

  const inputState = useCommandScreenInputState({
    pushHistoryProxy: historyAndTests.pushHistoryProxy,
  })

  const modelAndGeneration: UseCommandScreenModelGenerationResult = useCommandScreenModelGeneration(
    {
      pushHistoryProxy: historyAndTests.pushHistoryProxy,
      notify,
      files,
      urls,
      images,
      videos,
      pdfs,
      smartContextEnabled,
      smartContextRoot,
      metaInstructions,
      budgets: { maxContextTokens, maxInputTokens, contextOverflowStrategy },
      ...(interactiveTransportPath ? { interactiveTransportPath } : {}),
      terminalColumns: inputState.terminalColumns,
      copyEnabled: inputState.copyEnabled,
      chatGptEnabled: inputState.chatGptEnabled,
      jsonOutputEnabled: inputState.jsonOutputEnabled,
      isTestCommandRunning: historyAndTests.isTestCommandRunning,
      setLastReasoning,
      setLastGeneratedPrompt,
    },
  )

  const contextOptions: UseCommandScreenPopupAndViewOptions['context'] = useMemo(
    () => ({
      interactiveTransportPath,
      notify,
      stdout,
      files,
      urls,
      images,
      videos,
      pdfs,
      smartContextEnabled,
      smartContextRoot,
      metaInstructions,
      maxContextTokens,
      maxInputTokens,
      contextOverflowStrategy,
      lastReasoning,
      lastGeneratedPrompt,
      addFile,
      removeFile,
      addUrl,
      removeUrl,
      updateUrl,
      addImage,
      removeImage,
      addVideo,
      removeVideo,
      addPdf,
      removePdf,
      toggleSmartContext,
      setSmartRoot,
      setMetaInstructions,
      setBudgets,
      resetContext,
    }),
    [
      interactiveTransportPath,
      notify,
      stdout,
      files,
      urls,
      images,
      videos,
      smartContextEnabled,
      smartContextRoot,
      metaInstructions,
      maxContextTokens,
      maxInputTokens,
      contextOverflowStrategy,
      lastReasoning,
      lastGeneratedPrompt,
      addFile,
      removeFile,
      addUrl,
      removeUrl,
      updateUrl,
      addImage,
      removeImage,
      addVideo,
      removeVideo,
      addPdf,
      removePdf,
      toggleSmartContext,
      setSmartRoot,
      setMetaInstructions,
      setBudgets,
      resetContext,
    ],
  )

  const inputOptions: UseCommandScreenPopupAndViewOptions['input'] = useMemo(
    () => ({
      terminalRows: inputState.terminalRows,
      terminalColumns: inputState.terminalColumns,
      inputValue: inputState.inputValue,
      isPasteActive: inputState.isPasteActive,
      commandSelectionIndex: inputState.commandSelectionIndex,
      debugKeyLine: inputState.debugKeyLine,
      debugKeysEnabled: inputState.debugKeysEnabled,
      setTerminalSize: inputState.setTerminalSize,
      setInputValue: inputState.setInputValue,
      setPasteActive: inputState.setPasteActive,
      setCommandSelectionIndex: inputState.setCommandSelectionIndex,
      intentFilePath: inputState.intentFilePath,
      setIntentFilePath: inputState.setIntentFilePath,
      copyEnabled: inputState.copyEnabled,
      setCopyEnabled: inputState.setCopyEnabled,
      chatGptEnabled: inputState.chatGptEnabled,
      setChatGptEnabled: inputState.setChatGptEnabled,
      jsonOutputEnabled: inputState.jsonOutputEnabled,
      setJsonOutputEnabled: inputState.setJsonOutputEnabled,
      lastUserIntentRef: inputState.lastUserIntentRef,
      lastTypedIntentRef: inputState.lastTypedIntentRef,
      consumeSuppressedTextInputChange: inputState.consumeSuppressedTextInputChange,
      suppressNextInput: inputState.suppressNextInput,
      updateLastTypedIntent: inputState.updateLastTypedIntent,
      onDebugKeyEvent: inputState.onDebugKeyEvent,
    }),
    [
      inputState.terminalRows,
      inputState.terminalColumns,
      inputState.inputValue,
      inputState.isPasteActive,
      inputState.commandSelectionIndex,
      inputState.debugKeyLine,
      inputState.debugKeysEnabled,
      inputState.setTerminalSize,
      inputState.setInputValue,
      inputState.setPasteActive,
      inputState.setCommandSelectionIndex,
      inputState.intentFilePath,
      inputState.setIntentFilePath,
      inputState.copyEnabled,
      inputState.setCopyEnabled,
      inputState.chatGptEnabled,
      inputState.setChatGptEnabled,
      inputState.jsonOutputEnabled,
      inputState.setJsonOutputEnabled,
      inputState.lastUserIntentRef,
      inputState.lastTypedIntentRef,
      inputState.consumeSuppressedTextInputChange,
      inputState.suppressNextInput,
      inputState.updateLastTypedIntent,
      inputState.onDebugKeyEvent,
    ],
  )

  const popupOptions: UseCommandScreenPopupAndViewOptions['popup'] = useMemo(
    () => ({
      onPopupVisibilityChange,
      commandMenuSignal,
      helpOpen,
      reservedRows,
      ...(onOpenHelp ? { onOpenHelp } : {}),
    }),
    [onPopupVisibilityChange, commandMenuSignal, helpOpen, reservedRows, onOpenHelp],
  )

  const historyOptions: UseCommandScreenPopupAndViewOptions['history'] = useMemo(
    () => ({
      pushHistoryRef: historyAndTests.pushHistoryRef,
      pushHistoryProxy: historyAndTests.pushHistoryProxy,
      clearHistoryRef: historyAndTests.clearHistoryRef,
      scrollToRef: historyAndTests.scrollToRef,
      scrollToProxy: historyAndTests.scrollToProxy,
      closeTestPopupRef: historyAndTests.closeTestPopupRef,
      commandHistoryValues: historyAndTests.commandHistoryValues,
      addCommandHistoryEntry: historyAndTests.addCommandHistoryEntry,
      isTestCommandRunning: historyAndTests.isTestCommandRunning,
      lastTestFile: historyAndTests.lastTestFile,
      runTestsFromCommandProxy: historyAndTests.runTestsFromCommandProxy,
      onTestPopupSubmit: historyAndTests.onTestPopupSubmit,
    }),
    [
      historyAndTests.pushHistoryRef,
      historyAndTests.pushHistoryProxy,
      historyAndTests.clearHistoryRef,
      historyAndTests.scrollToRef,
      historyAndTests.scrollToProxy,
      historyAndTests.closeTestPopupRef,
      historyAndTests.commandHistoryValues,
      historyAndTests.addCommandHistoryEntry,
      historyAndTests.isTestCommandRunning,
      historyAndTests.lastTestFile,
      historyAndTests.runTestsFromCommandProxy,
      historyAndTests.onTestPopupSubmit,
    ],
  )

  const generationOptions: UseCommandScreenPopupAndViewOptions['generation'] = useMemo(
    () => ({
      currentModel: modelAndGeneration.currentModel,
      polishModelId: modelAndGeneration.polishModelId,
      currentTargetModel: modelAndGeneration.currentTargetModel,
      modelOptions: modelAndGeneration.modelOptions,
      providerStatuses: modelAndGeneration.providerStatuses,
      selectModel: modelAndGeneration.selectModel,
      selectPolishModel: modelAndGeneration.selectPolishModel,
      selectTargetModel: modelAndGeneration.selectTargetModel,
      isGenerating: modelAndGeneration.pipeline.isGenerating,
      runGeneration: modelAndGeneration.pipeline.runGeneration,
      runSeriesGeneration: modelAndGeneration.pipeline.runSeriesGeneration,
      statusChips: modelAndGeneration.pipeline.statusChips,
      isAwaitingRefinement: modelAndGeneration.pipeline.isAwaitingRefinement,
      submitRefinement: modelAndGeneration.pipeline.submitRefinement,
      awaitingInteractiveMode: modelAndGeneration.pipeline.awaitingInteractiveMode,
      tokenUsageRun: modelAndGeneration.pipeline.tokenUsageRun,
      tokenUsageBreakdown: modelAndGeneration.pipeline.tokenUsageBreakdown,
      latestContextOverflow: modelAndGeneration.pipeline.latestContextOverflow,
    }),
    [
      modelAndGeneration.currentModel,
      modelAndGeneration.polishModelId,
      modelAndGeneration.currentTargetModel,
      modelAndGeneration.modelOptions,
      modelAndGeneration.providerStatuses,
      modelAndGeneration.selectModel,
      modelAndGeneration.selectPolishModel,
      modelAndGeneration.selectTargetModel,
      modelAndGeneration.pipeline.isGenerating,
      modelAndGeneration.pipeline.runGeneration,
      modelAndGeneration.pipeline.runSeriesGeneration,
      modelAndGeneration.pipeline.statusChips,
      modelAndGeneration.pipeline.isAwaitingRefinement,
      modelAndGeneration.pipeline.submitRefinement,
      modelAndGeneration.pipeline.awaitingInteractiveMode,
      modelAndGeneration.pipeline.tokenUsageRun,
      modelAndGeneration.pipeline.tokenUsageBreakdown,
      modelAndGeneration.pipeline.latestContextOverflow,
    ],
  )

  const view = useCommandScreenPopupAndView({
    context: contextOptions,
    input: inputOptions,
    popup: popupOptions,
    history: historyOptions,
    generation: generationOptions,
  })

  const actions = useMemo(
    () => ({
      suppressNextInput: inputState.suppressNextInput,
    }),
    [inputState.suppressNextInput],
  )

  return useMemo(
    () => ({
      view,
      actions,
    }),
    [view, actions],
  )
}
