import { useApp, useStdout } from 'ink'
import { useCallback, useEffect, useState } from 'react'

import { loadCliConfig } from '../../../../config'

import { usePopupManager } from '../../../hooks/usePopupManager'
import type { NotifyOptions } from '../../../notifier'
import { useTheme } from '../../../theme/theme-provider'
import type {
  HistoryEntry,
  ModelOption,
  PopupState,
  ResumeMode,
  ResumeSourceKind,
} from '../../../types'

const DEFAULT_TEST_FILE = 'prompt-tests.yaml'

type PushHistory = (
  content: string,
  kind?: HistoryEntry['kind'],
  format?: HistoryEntry['format'],
) => void

type UseCommandScreenPopupManagerOptions = {
  currentModel: ModelOption['id']
  currentTargetModel: ModelOption['id']
  modelOptions: readonly ModelOption[]
  smartContextEnabled: boolean
  smartContextRoot: string | null
  toggleSmartContext: () => void
  setSmartRoot: (value: string) => void
  urls: string[]
  addUrl: (value: string) => void
  images: string[]
  videos: string[]
  pdfs: string[]
  addImage: (value: string) => void
  addVideo: (value: string) => void
  addPdf: (value: string) => void
  lastTestFile: string | null
  interactiveTransportPath?: string | undefined
  isGenerating: boolean
  lastUserIntentRef: import('react').MutableRefObject<string | null>
  lastTypedIntentRef: import('react').MutableRefObject<string>

  pushHistoryProxy: PushHistory
  notify: (message: string, options?: NotifyOptions) => void
  setInputValue: (value: string | ((prev: string) => string)) => void

  runGeneration: (payload: {
    intent?: string
    intentFile?: string
    resume?:
      | { kind: 'history'; selector: string; mode: ResumeMode }
      | { kind: 'file'; payloadPath: string; mode: ResumeMode }
  }) => Promise<void>
  runSeriesGeneration: (intent: string) => void
  runTestsFromCommandProxy: (value: string) => void

  setCurrentModel: (value: ModelOption['id']) => void
  setCurrentTargetModel: (value: ModelOption['id']) => void
  setPolishModelId: (value: ModelOption['id'] | null) => void
  setCopyEnabled: (value: boolean) => void
  setChatGptEnabled: (value: boolean) => void
  setJsonOutputEnabled: (value: boolean) => void

  intentFilePath: string
  setIntentFilePath: (value: string) => void

  metaInstructions: string
  setMetaInstructions: (value: string) => void
  budgets: {
    maxContextTokens: number | null
    maxInputTokens: number | null
    contextOverflowStrategy: import('../../../../config').ContextOverflowStrategy | null
  }
  setBudgets: (value: {
    maxContextTokens: number | null
    maxInputTokens: number | null
    contextOverflowStrategy: import('../../../../config').ContextOverflowStrategy | null
  }) => void

  polishModelId: ModelOption['id'] | null
  copyEnabled: boolean
  chatGptEnabled: boolean
  jsonOutputEnabled: boolean
}

export type UseCommandScreenPopupManagerResult = {
  popupState: PopupState
  setPopupState: import('react').Dispatch<import('react').SetStateAction<PopupState>>
  actions: ReturnType<typeof usePopupManager>['actions']
  isPopupOpen: boolean
}

export const useCommandScreenPopupManager = ({
  currentModel,
  currentTargetModel,
  modelOptions,
  smartContextEnabled,
  smartContextRoot,
  toggleSmartContext,
  setSmartRoot,
  urls,
  addUrl,
  images,
  videos,
  pdfs,
  addImage,
  addVideo,
  addPdf,
  lastTestFile,
  interactiveTransportPath,
  isGenerating,
  lastUserIntentRef,
  lastTypedIntentRef,
  pushHistoryProxy,
  notify,
  setInputValue,
  runGeneration,
  runSeriesGeneration,
  runTestsFromCommandProxy,
  setCurrentModel,
  setCurrentTargetModel,
  setPolishModelId,
  setCopyEnabled,
  setChatGptEnabled,
  setJsonOutputEnabled,
  intentFilePath,
  setIntentFilePath,
  metaInstructions,
  setMetaInstructions,
  budgets,
  setBudgets,
  polishModelId,
  copyEnabled,
  chatGptEnabled,
  jsonOutputEnabled,
}: UseCommandScreenPopupManagerOptions): UseCommandScreenPopupManagerResult => {
  const { exit } = useApp()
  const { stdout } = useStdout()

  const clearScreen = useCallback(() => {
    if (stdout && stdout.isTTY) {
      stdout.write('\u001b[2J\u001b[H')
    }
  }, [stdout])

  const getLatestTypedIntent = useCallback(() => {
    const trimmed = lastTypedIntentRef.current.trim()
    return trimmed.length > 0 ? trimmed : null
  }, [lastTypedIntentRef])

  const syncTypedIntentRef = useCallback(
    (intent: string) => {
      lastTypedIntentRef.current = intent
    },
    [lastTypedIntentRef],
  )

  const { activeThemeName, mode, themes } = useTheme()

  const [resumeDefaults, setResumeDefaults] = useState<{
    sourceKind: ResumeSourceKind
    mode: ResumeMode
  }>({
    sourceKind: 'history',
    mode: 'best-effort',
  })

  const [exportDefaults, setExportDefaults] = useState<{
    format: 'json' | 'yaml'
    outDir: string | null
  }>({
    format: 'json',
    outDir: null,
  })

  useEffect(() => {
    let cancelled = false

    const hydrate = async (): Promise<void> => {
      const config = await loadCliConfig().catch(() => null)
      if (cancelled) {
        return
      }

      const sourceKind = config?.resumeSourceKind === 'file' ? 'file' : 'history'
      const resumeMode = config?.resumeMode === 'strict' ? 'strict' : 'best-effort'
      setResumeDefaults({ sourceKind, mode: resumeMode })

      const exportFormat = config?.exportFormat === 'yaml' ? 'yaml' : 'json'
      const exportOutDir = config?.exportOutDir?.trim() || null
      setExportDefaults({ format: exportFormat, outDir: exportOutDir })
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [])

  const popupManager = usePopupManager({
    currentModel,
    currentTargetModel,
    modelOptions,
    activeThemeName,
    themeMode: mode,
    themes: themes.map((theme) => ({ name: theme.name, label: theme.label })),
    smartContextEnabled,
    smartContextRoot,
    toggleSmartContext,
    setSmartRoot,
    urls,
    addUrl,
    images,
    videos,
    pdfs,
    addImage,
    addVideo,
    addPdf,
    lastTestFile,
    defaultTestFile: DEFAULT_TEST_FILE,
    ...(interactiveTransportPath ? { interactiveTransportPath } : {}),
    isGenerating,
    lastUserIntentRef,
    pushHistory: pushHistoryProxy,
    notify,
    setInputValue,
    runGeneration,
    runSeriesGeneration,
    runTestsFromCommand: runTestsFromCommandProxy,
    clearScreen,
    exitApp: exit,
    setCurrentModel,
    setCurrentTargetModel,
    setPolishModelId,
    setCopyEnabled,
    setChatGptEnabled,
    setJsonOutputEnabled,
    setIntentFilePath,
    intentFilePath,
    metaInstructions,
    setMetaInstructions,
    budgets,
    setBudgets,
    polishModelId,
    copyEnabled,
    chatGptEnabled,
    jsonOutputEnabled,
    getLatestTypedIntent,
    syncTypedIntentRef,
    resumeDefaults,
    setResumeDefaults,
    exportDefaults,
    setExportDefaults,
  })

  return {
    popupState: popupManager.popupState,
    setPopupState: popupManager.setPopupState,
    actions: popupManager.actions,
    isPopupOpen: popupManager.popupState !== null,
  }
}
