import fs from 'node:fs/promises'
import path from 'node:path'
import { useCallback, useMemo, useReducer, useRef } from 'react'

import {
  JSON_INTERACTIVE_ERROR,
  mapPopupCommandSelection,
  type PopupManagerCommandStep,
} from './popup-manager/command-mapping'
import { createPopupScanOrchestrator } from './popup-manager/scan-orchestrator'

import {
  INITIAL_POPUP_MANAGER_STATE,
  popupReducer,
  type PopupAction,
  type SetStateAction,
} from '../popup-reducer'

import {
  updateCliExportSettings,
  updateCliPromptGeneratorSettings,
  updateCliResumeSettings,
} from '../../config'

import { TOGGLE_LABELS } from '../config'
import { parseBudgetSettingsDraft } from '../budget-settings'
import {
  scanFileSuggestions,
  scanImageSuggestions,
  scanIntentSuggestions,
  scanSmartSuggestions,
  scanVideoSuggestions,
} from './popup-scans'
import type { NotifyOptions } from '../notifier'
import type { ThemeMode } from '../theme/theme-types'
import { loadGeneratePayloadFromFile } from '../../generate/payload-io'
import { GENERATE_JSON_PAYLOAD_SCHEMA_VERSION } from '../../generate/types'
import { writeGeneratePayloadExport } from '../../export/export-generate-payload'
import {
  loadGenerateHistoryPickerItems,
  loadGeneratePayloadFromHistory,
} from '../../history/generate-history'

import { buildModelPopupOptions } from '../model-popup-options'
import { loadResumeHistoryItems } from '../resume-history'
import { getRecentSessionModels, recordRecentSessionModel } from '../model-session'
import type {
  CommandDescriptor,
  HistoryEntry,
  ModelOption,
  PopupState,
  ResumeMode,
  ResumeSourceKind,
  ToggleField,
} from '../types'

export type PopupManagerActions = {
  openModelPopup: () => void
  openPolishModelPopup: () => void
  openTargetModelPopup: () => void
  openTogglePopup: (field: ToggleField) => void
  openFilePopup: () => void
  openUrlPopup: () => void
  openImagePopup: () => void
  openVideoPopup: () => void
  openHistoryPopup: () => void
  openResumePopup: () => void
  openExportPopup: () => void
  openSmartRootPopup: () => void
  openTokensPopup: () => void
  openBudgetsPopup: () => void
  openSettingsPopup: () => void
  openThemePopup: () => void
  openThemeModePopup: () => void
  openReasoningPopup: () => void
  openTestPopup: () => void
  openIntentPopup: () => void
  openInstructionsPopup: () => void
  openSeriesPopup: (initialDraft?: string, hintOverride?: string) => void
  closePopup: () => void
  handleCommandSelection: (commandId: CommandDescriptor['id'], argsRaw?: string) => void
  handleModelPopupSubmit: (option: ModelOption | null | undefined) => void
  applyToggleSelection: (field: ToggleField, value: boolean) => void
  handleIntentFileSubmit: (value: string) => void
  handleInstructionsSubmit: (value: string) => void
  handleBudgetsSubmit: () => void
  handleResumeSubmit: () => void
  handleExportSubmit: () => void
  handleSeriesIntentSubmit: (value: string) => void
}

export type ThemeOption = {
  name: string
  label: string
}

export type UsePopupManagerOptions = {
  currentModel: ModelOption['id']
  currentTargetModel: ModelOption['id']
  modelOptions: readonly ModelOption[]
  activeThemeName: string
  themeMode: ThemeMode
  themes: readonly ThemeOption[]
  smartContextEnabled: boolean
  smartContextRoot: string | null
  toggleSmartContext: () => void
  setSmartRoot: (value: string) => void
  urls: string[]
  addUrl: (value: string) => void
  images: string[]
  videos: string[]
  addImage: (value: string) => void
  addVideo: (value: string) => void
  lastTestFile: string | null
  defaultTestFile: string
  interactiveTransportPath?: string | undefined
  isGenerating: boolean
  lastUserIntentRef: React.MutableRefObject<string | null>
  pushHistory: (content: string, kind?: HistoryEntry['kind']) => void
  notify: (message: string, options?: NotifyOptions) => void
  setInputValue: (value: string) => void
  runGeneration: (payload: {
    intent?: string
    intentFile?: string
    resume?:
      | { kind: 'history'; selector: string; mode: ResumeMode }
      | { kind: 'file'; payloadPath: string; mode: ResumeMode }
  }) => Promise<void>
  runSeriesGeneration: (intent: string) => void
  runTestsFromCommand: (value: string) => void
  clearScreen?: () => void
  exitApp: () => void
  setCurrentModel: (value: ModelOption['id']) => void
  setCurrentTargetModel: (value: ModelOption['id']) => void
  setPolishModelId: (value: ModelOption['id'] | null) => void
  setCopyEnabled: (value: boolean) => void
  setChatGptEnabled: (value: boolean) => void
  setJsonOutputEnabled: (value: boolean) => void
  setIntentFilePath: (value: string) => void
  intentFilePath: string
  metaInstructions: string
  setMetaInstructions: (value: string) => void
  budgets: {
    maxContextTokens: number | null
    maxInputTokens: number | null
    contextOverflowStrategy: import('../../config').ContextOverflowStrategy | null
  }
  setBudgets: (value: {
    maxContextTokens: number | null
    maxInputTokens: number | null
    contextOverflowStrategy: import('../../config').ContextOverflowStrategy | null
  }) => void
  polishModelId: ModelOption['id'] | null
  copyEnabled: boolean
  chatGptEnabled: boolean
  jsonOutputEnabled: boolean
  getLatestTypedIntent: () => string | null
  syncTypedIntentRef: (intent: string) => void
  resumeDefaults: {
    sourceKind: ResumeSourceKind
    mode: ResumeMode
  }
  setResumeDefaults: (value: { sourceKind: ResumeSourceKind; mode: ResumeMode }) => void
  exportDefaults: {
    format: 'json' | 'yaml'
    outDir: string | null
  }
  setExportDefaults: (value: { format: 'json' | 'yaml'; outDir: string | null }) => void
}

/*
 * Popup state management for the Ink TUI.
 *
 * This hook wires UI actions (open/close/submit) to a pure reducer:
 * `apps/prompt-maker-cli/src/tui/popup-reducer.ts`.
 *
 * Keeping the reducer in a separate module lets us unit test popup transitions
 * without a TTY and keeps this hook focused on effects (async scans, commands).
 */

const POPUP_SUGGESTION_SCAN_LIMIT = 5000

export const usePopupManager = ({
  currentModel,
  currentTargetModel,
  modelOptions,
  activeThemeName,
  themeMode,
  themes,
  smartContextEnabled,
  smartContextRoot,
  toggleSmartContext,
  setSmartRoot,
  urls,
  addUrl,
  images,
  videos,
  addImage,
  addVideo,
  lastTestFile,
  defaultTestFile,
  interactiveTransportPath,
  isGenerating,
  lastUserIntentRef,
  pushHistory,
  notify,
  setInputValue,
  runGeneration,
  runSeriesGeneration,
  runTestsFromCommand,

  clearScreen,
  exitApp,
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
}: UsePopupManagerOptions): {
  popupState: PopupState
  setPopupState: React.Dispatch<React.SetStateAction<PopupState>>
  actions: PopupManagerActions
} => {
  const scanIdRef = useRef(0)

  const [popupManagerState, dispatch] = useReducer(popupReducer, INITIAL_POPUP_MANAGER_STATE)

  const popupState = popupManagerState.popupState

  const { runSuggestionScan } = useMemo(
    () => createPopupScanOrchestrator({ scanIdRef, dispatch, pushHistory }),
    [dispatch, pushHistory],
  )

  // Compatibility shim: keeps the existing `setPopupState(prev => ...)` call sites working.
  // Internally we treat it as a reducer action.
  const setPopupState = useCallback<React.Dispatch<SetStateAction<PopupState>>>((next) => {
    dispatch({ type: 'set', next } satisfies PopupAction)
  }, [])

  const closePopup = useCallback(() => {
    dispatch({ type: 'close' })
  }, [])

  const openModelPopup = useCallback(() => {
    const recentModelIds = getRecentSessionModels()
    const { options } = buildModelPopupOptions({ query: '', modelOptions, recentModelIds })
    const defaultIndex = Math.max(
      0,
      options.findIndex((option) => option.id === currentModel),
    )

    dispatch({ type: 'open-model', kind: 'generation', query: '', selectionIndex: defaultIndex })
  }, [currentModel, modelOptions])

  const openPolishModelPopup = useCallback(() => {
    const recentModelIds = getRecentSessionModels()
    const { options } = buildModelPopupOptions({ query: '', modelOptions, recentModelIds })

    const selectedId = polishModelId ?? currentModel
    const defaultIndex = Math.max(
      0,
      options.findIndex((option) => option.id === selectedId),
    )

    dispatch({ type: 'open-model', kind: 'polish', query: '', selectionIndex: defaultIndex })
  }, [currentModel, modelOptions, polishModelId])

  const openTargetModelPopup = useCallback(() => {
    const recentModelIds = getRecentSessionModels()
    const { options } = buildModelPopupOptions({ query: '', modelOptions, recentModelIds })
    const defaultIndex = Math.max(
      0,
      options.findIndex((option) => option.id === currentTargetModel),
    )

    dispatch({ type: 'open-model', kind: 'target', query: '', selectionIndex: defaultIndex })
  }, [currentTargetModel, modelOptions])

  const openTogglePopup = useCallback(
    (field: ToggleField) => {
      const currentValue =
        field === 'copy' ? copyEnabled : field === 'chatgpt' ? chatGptEnabled : jsonOutputEnabled

      dispatch({
        type: 'open-toggle',
        field,
        selectionIndex: currentValue ? 0 : 1,
      })
    },
    [copyEnabled, chatGptEnabled, jsonOutputEnabled],
  )

  const openFilePopup = useCallback(() => {
    runSuggestionScan({
      kind: 'file',
      open: (scanId) => ({ type: 'open-file', scanId }),
      scan: () => scanFileSuggestions({ cwd: process.cwd(), limit: POPUP_SUGGESTION_SCAN_LIMIT }),
    })
  }, [runSuggestionScan])

  const openUrlPopup = useCallback(() => {
    dispatch({ type: 'open-url' })
  }, [])

  const openImagePopup = useCallback(() => {
    runSuggestionScan({
      kind: 'image',
      open: (scanId) => ({ type: 'open-image', scanId }),
      scan: () => scanImageSuggestions({ cwd: process.cwd(), limit: POPUP_SUGGESTION_SCAN_LIMIT }),
    })
  }, [runSuggestionScan])

  const openVideoPopup = useCallback(() => {
    runSuggestionScan({
      kind: 'video',
      open: (scanId) => ({ type: 'open-video', scanId }),
      scan: () => scanVideoSuggestions({ cwd: process.cwd(), limit: POPUP_SUGGESTION_SCAN_LIMIT }),
    })
  }, [runSuggestionScan])

  const openHistoryPopup = useCallback(() => {
    dispatch({ type: 'open-history' })
  }, [])

  const openResumePopup = useCallback(() => {
    const resumeDefaultsSnapshot = resumeDefaults

    runSuggestionScan({
      kind: 'resume',
      open: (scanId) => ({
        type: 'open-resume',
        scanId,
        sourceKind: resumeDefaultsSnapshot.sourceKind,
        mode: resumeDefaultsSnapshot.mode,
        payloadPathDraft: '',
        historyItems: [],
        historySelectionIndex: 0,
        historyErrorMessage: null,
      }),
      scan: () => scanFileSuggestions({ cwd: process.cwd(), limit: POPUP_SUGGESTION_SCAN_LIMIT }),
    })

    const hydrate = async (): Promise<void> => {
      const historyResult = await loadResumeHistoryItems({ limit: 30 })

      setPopupState((prev) => {
        if (prev?.type !== 'resume') {
          return prev
        }

        return {
          ...prev,
          historyItems: historyResult.ok ? historyResult.items : [],
          historyErrorMessage: historyResult.ok ? null : historyResult.errorMessage,
        }
      })
    }

    void hydrate()
  }, [resumeDefaults, runSuggestionScan, setPopupState])

  const openExportPopup = useCallback(() => {
    const exportDefaultsSnapshot = exportDefaults

    const fileName = `prompt-export.${exportDefaultsSnapshot.format}`
    const outPathDraft = exportDefaultsSnapshot.outDir
      ? path.join(exportDefaultsSnapshot.outDir, fileName)
      : fileName

    dispatch({
      type: 'open-export',
      format: exportDefaultsSnapshot.format,
      outPathDraft,
      historyItems: [],
      historySelectionIndex: 0,
      historyErrorMessage: null,
    })

    const hydrate = async (): Promise<void> => {
      const historyResult = await loadGenerateHistoryPickerItems({ limit: 30 })

      setPopupState((prev) => {
        if (prev?.type !== 'export') {
          return prev
        }

        return {
          ...prev,
          historyItems: historyResult.ok ? historyResult.items : [],
          historyErrorMessage: historyResult.ok ? null : historyResult.errorMessage,
        }
      })
    }

    void hydrate()
  }, [exportDefaults, setPopupState])

  const openSmartRootPopup = useCallback(() => {
    const draft = smartContextRoot ?? ''

    runSuggestionScan({
      kind: 'smart',
      open: (scanId) => ({ type: 'open-smart', scanId, draft }),
      scan: () => scanSmartSuggestions({ cwd: process.cwd(), limit: POPUP_SUGGESTION_SCAN_LIMIT }),
    })
  }, [runSuggestionScan, smartContextRoot])

  const openTokensPopup = useCallback(() => {
    dispatch({ type: 'open-tokens' })
  }, [])

  const openBudgetsPopup = useCallback(() => {
    dispatch({
      type: 'open-budgets',
      maxContextTokens: budgets.maxContextTokens,
      maxInputTokens: budgets.maxInputTokens,
      contextOverflowStrategy: budgets.contextOverflowStrategy,
    })
  }, [budgets.contextOverflowStrategy, budgets.maxContextTokens, budgets.maxInputTokens])

  const openSettingsPopup = useCallback(() => {
    dispatch({ type: 'open-settings' })
  }, [])

  const openThemePopup = useCallback(() => {
    const selectionIndex = Math.max(
      0,
      themes.findIndex((theme) => theme.name === activeThemeName),
    )

    dispatch({ type: 'open-theme', selectionIndex, initialThemeName: activeThemeName })
  }, [activeThemeName, themes])

  const openThemeModePopup = useCallback(() => {
    const selectionIndex = themeMode === 'system' ? 0 : themeMode === 'dark' ? 1 : 2

    dispatch({ type: 'open-theme-mode', selectionIndex, initialMode: themeMode })
  }, [themeMode])

  const openReasoningPopup = useCallback(() => {
    dispatch({ type: 'open-reasoning', scrollOffset: 0 })
  }, [])

  const openTestPopup = useCallback(() => {
    dispatch({ type: 'open-test', draft: lastTestFile ?? defaultTestFile })
  }, [defaultTestFile, lastTestFile])

  const openIntentPopup = useCallback(() => {
    runSuggestionScan({
      kind: 'intent',
      open: (scanId) => ({ type: 'open-intent', scanId, draft: intentFilePath }),
      scan: () => scanIntentSuggestions({ cwd: process.cwd(), limit: POPUP_SUGGESTION_SCAN_LIMIT }),
    })
  }, [intentFilePath, runSuggestionScan])

  const openInstructionsPopup = useCallback(() => {
    dispatch({ type: 'open-instructions', draft: metaInstructions })
  }, [metaInstructions])

  const openSeriesPopup = useCallback(
    (initialDraft?: string, hintOverride?: string) => {
      const trimmedIntentFile = intentFilePath.trim()
      const defaultHint = trimmedIntentFile
        ? 'Draft prefills from typed/last intent; if empty, loads the intent file.'
        : 'Draft prefills from typed/last intent (or pass /series <intent>).'

      dispatch({
        type: 'open-series',
        draft: initialDraft ?? '',
        hint: hintOverride ?? defaultHint,
      })
    },
    [intentFilePath],
  )

  const applyModelSelection = useCallback(
    (option?: ModelOption) => {
      if (!option) {
        return
      }
      recordRecentSessionModel(option.id)
      setCurrentModel(option.id)
      notify(`Selected model: ${option.label} (${option.id})`, { kind: 'info' })
      setInputValue('')
      closePopup()
    },
    [closePopup, notify, setCurrentModel, setInputValue],
  )

  const applyTargetModelSelection = useCallback(
    (option?: ModelOption) => {
      if (!option) {
        return
      }
      recordRecentSessionModel(option.id)
      setCurrentTargetModel(option.id)
      notify(`Selected target model: ${option.label} (${option.id})`, { kind: 'info' })
      setInputValue('')
      closePopup()
    },
    [closePopup, notify, setCurrentTargetModel, setInputValue],
  )

  const applyPolishModelSelection = useCallback(
    (option: ModelOption | null | undefined) => {
      if (option === null) {
        setPolishModelId(null)
        notify('Polish disabled', { kind: 'warning' })
        setInputValue('')
        closePopup()
        return
      }

      if (!option) {
        return
      }

      recordRecentSessionModel(option.id)
      setPolishModelId(option.id)
      notify(`Selected polish model: ${option.label} (${option.id})`, { kind: 'info' })
      setInputValue('')
      closePopup()
    },
    [closePopup, notify, setInputValue, setPolishModelId],
  )

  const handleModelPopupSubmit = useCallback(
    (option: ModelOption | null | undefined) => {
      if (popupState?.type === 'model') {
        if (popupState.kind === 'target') {
          applyTargetModelSelection(option ?? undefined)
          return
        }
        if (popupState.kind === 'polish') {
          applyPolishModelSelection(option)
          return
        }
      }

      applyModelSelection(option ?? undefined)
    },
    [applyModelSelection, applyPolishModelSelection, applyTargetModelSelection, popupState],
  )

  const applyToggleSelection = useCallback(
    (field: ToggleField, value: boolean) => {
      // Guardrail: JSON output and interactive transport both want to “own” stdout.
      if (field === 'json' && value && interactiveTransportPath) {
        pushHistory(JSON_INTERACTIVE_ERROR, 'system')
        setInputValue('')
        closePopup()
        return
      }

      if (field === 'json') {
        setJsonOutputEnabled(value)
        notify(
          value
            ? 'JSON output is ON (payload shown in history)'
            : 'JSON output is OFF (payload hidden)',
          { kind: value ? 'info' : 'warning' },
        )
        setInputValue('')
        closePopup()
        return
      }

      const message = `${TOGGLE_LABELS[field]} ${value ? 'enabled' : 'disabled'}`

      if (field === 'copy') {
        setCopyEnabled(value)
      } else {
        setChatGptEnabled(value)
      }

      pushHistory(message)
      setInputValue('')
      closePopup()
    },
    [
      closePopup,
      interactiveTransportPath,
      notify,
      pushHistory,
      setChatGptEnabled,
      setCopyEnabled,
      setInputValue,
      setJsonOutputEnabled,
    ],
  )

  const handleIntentFileSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      setIntentFilePath(trimmed)
      pushHistory(
        trimmed ? `Intent file set to ${trimmed}` : 'Intent file cleared; using typed intent.',
      )
      setInputValue('')
      closePopup()
    },
    [closePopup, pushHistory, setInputValue, setIntentFilePath],
  )

  const handleInstructionsSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      setMetaInstructions(trimmed)
      pushHistory(trimmed ? `[instr] ${trimmed}` : '[instr] cleared')
      setInputValue('')
      closePopup()
    },
    [closePopup, pushHistory, setInputValue, setMetaInstructions],
  )

  const handleBudgetsSubmit = useCallback(() => {
    if (popupState?.type !== 'budgets') {
      return
    }

    const parsed = parseBudgetSettingsDraft({
      maxContextTokensDraft: popupState.maxContextTokensDraft,
      maxInputTokensDraft: popupState.maxInputTokensDraft,
      contextOverflowStrategyDraft: popupState.contextOverflowStrategyDraft,
    })

    if (!parsed.ok) {
      setPopupState((prev) =>
        prev?.type === 'budgets' ? { ...prev, errorMessage: parsed.errorMessage } : prev,
      )
      return
    }

    const persist = async (): Promise<void> => {
      try {
        await updateCliPromptGeneratorSettings({
          maxContextTokens: parsed.settings.maxContextTokens,
          maxInputTokens: parsed.settings.maxInputTokens,
          contextOverflowStrategy: parsed.settings.contextOverflowStrategy,
        })

        setBudgets(parsed.settings)

        const enabled =
          parsed.settings.maxContextTokens !== null || parsed.settings.maxInputTokens !== null

        const summary = enabled
          ? `Budgets saved · input=${parsed.settings.maxInputTokens ?? 'unset'} · context=${parsed.settings.maxContextTokens ?? 'unset'} · overflow=${parsed.settings.contextOverflowStrategy ?? 'fail'}`
          : 'Budgets cleared'

        pushHistory(`[budgets] ${summary}`, 'system')
        notify(summary, { kind: enabled ? 'info' : 'warning' })
        setInputValue('')
        closePopup()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown config write error.'
        setPopupState((prev) =>
          prev?.type === 'budgets'
            ? { ...prev, errorMessage: `Failed to save budgets: ${message}` }
            : prev,
        )
        notify(`Failed to save budgets: ${message}`, { kind: 'error' })
      }
    }

    void persist()
  }, [closePopup, notify, popupState, pushHistory, setBudgets, setInputValue, setPopupState])

  const handleResumeSubmit = useCallback(() => {
    if (popupState?.type !== 'resume') {
      return
    }

    const sourceKind = popupState.sourceKind
    const mode = popupState.mode

    const persistDefaults = async (): Promise<void> => {
      try {
        await updateCliResumeSettings({ resumeMode: mode, resumeSourceKind: sourceKind })
        setResumeDefaults({ sourceKind, mode })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown config write error.'
        notify(`Failed to save resume defaults: ${message}`, { kind: 'error' })
      }
    }

    void persistDefaults()

    if (sourceKind === 'history') {
      const selected = popupState.historyItems[popupState.historySelectionIndex]
      if (!selected) {
        const message = popupState.historyErrorMessage ?? 'No resumable history entries found.'
        pushHistory(`[resume] ${message}`, 'system')
        notify(message, { kind: 'warning' })
        return
      }

      pushHistory(`> /resume ${selected.selector} (${mode})`, 'user')
      setInputValue('')
      closePopup()

      const intentFileOverride = intentFilePath.trim()

      void runGeneration({
        ...(intentFileOverride ? { intentFile: intentFileOverride } : {}),
        resume: { kind: 'history', selector: selected.selector, mode },
      })
      return
    }

    const payloadPath = popupState.payloadPathDraft.trim()
    if (!payloadPath) {
      const message = 'Resume-from file path is required.'
      pushHistory(`[resume] ${message}`, 'system')
      notify(message, { kind: 'warning' })
      return
    }

    const validateAndRun = async (): Promise<void> => {
      try {
        await loadGeneratePayloadFromFile(payloadPath)
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : 'Unknown payload error.'
        const schemaHint = rawMessage.includes('schemaVersion')
          ? ` This prompt-maker-cli supports schemaVersion=${GENERATE_JSON_PAYLOAD_SCHEMA_VERSION}; try upgrading/downgrading prompt-maker-cli or re-exporting/regenerating the payload with a matching version.`
          : ''
        const message = `${rawMessage}${schemaHint}`
        pushHistory(`[resume] ${message}`, 'system')
        notify(message, { kind: 'error' })
        return
      }

      pushHistory(`> /resume-from ${payloadPath} (${mode})`, 'user')
      setInputValue('')
      closePopup()

      const intentFileOverride = intentFilePath.trim()

      await runGeneration({
        ...(intentFileOverride ? { intentFile: intentFileOverride } : {}),
        resume: { kind: 'file', payloadPath, mode },
      })
    }

    void validateAndRun()
  }, [
    closePopup,
    intentFilePath,
    notify,
    popupState,
    pushHistory,
    runGeneration,
    setInputValue,
    setResumeDefaults,
  ])

  const handleExportSubmit = useCallback(() => {
    if (popupState?.type !== 'export') {
      return
    }

    const format = popupState.format
    const outPath = popupState.outPathDraft.trim()
    const selected = popupState.historyItems[popupState.historySelectionIndex]

    if (!selected) {
      const message = popupState.historyErrorMessage ?? 'No history entries available for export.'
      pushHistory(`[export] ${message}`, 'system')
      notify(message, { kind: 'warning' })
      return
    }

    if (!outPath) {
      const message = 'Export output path is required.'
      pushHistory(`[export] ${message}`, 'system')
      notify(message, { kind: 'warning' })
      return
    }

    const persistDefaults = async (): Promise<void> => {
      try {
        const resolvedOutPath = path.resolve(process.cwd(), outPath)
        const outDir = path.dirname(resolvedOutPath)

        await updateCliExportSettings({ exportFormat: format, exportOutDir: outDir })
        setExportDefaults({ format, outDir })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown config write error.'
        notify(`Failed to save export defaults: ${message}`, { kind: 'error' })
      }
    }

    void persistDefaults()

    const exportFromHistory = async (): Promise<void> => {
      try {
        const payload = await loadGeneratePayloadFromHistory({ selector: selected.selector })

        const { absolutePath } = await writeGeneratePayloadExport({
          payload,
          format,
          outPath,
        })

        const relative = path.relative(process.cwd(), absolutePath)
        const displayPath = relative && !relative.startsWith('..') ? relative : absolutePath

        pushHistory(`> /export ${selected.selector} (${format})`, 'user')
        pushHistory(`[export] Exported ${format.toUpperCase()} → ${displayPath}`, 'system')
        notify(`Exported ${format.toUpperCase()} → ${displayPath}`, { kind: 'info' })
        setInputValue('')
        closePopup()
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : 'Unknown export error.'
        const normalized = rawMessage.replace(/\s+/g, ' ').trim()
        const shortMessage = normalized.length > 220 ? `${normalized.slice(0, 217)}…` : normalized
        pushHistory(`[export] Export failed: ${shortMessage}`, 'system')
        notify(`Export failed: ${shortMessage}`, { kind: 'error' })
      }
    }

    void exportFromHistory()
  }, [closePopup, notify, popupState, pushHistory, setExportDefaults, setInputValue])

  const handleSeriesIntentSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) {
        pushHistory('Series intent cannot be empty.', 'system')
        return
      }
      lastUserIntentRef.current = trimmed
      syncTypedIntentRef(trimmed)
      pushHistory(`> /series ${trimmed}`, 'user')
      setInputValue('')
      closePopup()
      void runSeriesGeneration(trimmed)
    },
    [
      closePopup,
      lastUserIntentRef,
      pushHistory,
      runSeriesGeneration,
      setInputValue,
      syncTypedIntentRef,
    ],
  )

  const runCommandSteps = useCallback(
    (steps: readonly PopupManagerCommandStep[]): void => {
      const pushHistoryEntry = (
        step: Extract<PopupManagerCommandStep, { type: 'push-history' }>,
      ): void => {
        if (step.kind) {
          pushHistory(step.message, step.kind)
          return
        }

        pushHistory(step.message)
      }

      for (const step of steps) {
        switch (step.type) {
          case 'open-popup':
            switch (step.popup) {
              case 'model':
                openModelPopup()
                break
              case 'target':
                openTargetModelPopup()
                break
              case 'polish':
                openPolishModelPopup()
                break
              case 'toggle': {
                const field = step.field
                if (!field) {
                  throw new Error('Expected toggle field in command mapping.')
                }
                openTogglePopup(field)
                break
              }
              case 'file':
                openFilePopup()
                break
              case 'url':
                openUrlPopup()
                break
              case 'image':
                openImagePopup()
                break
              case 'video':
                openVideoPopup()
                break
              case 'history':
                openHistoryPopup()
                break
              case 'resume':
                openResumePopup()
                break
              case 'export':
                openExportPopup()
                break
              case 'smart-root':
                openSmartRootPopup()
                break
              case 'tokens':
                openTokensPopup()
                break
              case 'budgets':
                openBudgetsPopup()
                break
              case 'settings':
                openSettingsPopup()
                break
              case 'theme':
                openThemePopup()
                break
              case 'theme-mode':
                openThemeModePopup()
                break
              case 'reasoning':
                openReasoningPopup()
                break
              case 'test':
                openTestPopup()
                break
              case 'intent':
                openIntentPopup()
                break
              case 'instructions':
                openInstructionsPopup()
                break
            }
            break

          case 'apply-toggle':
            applyToggleSelection(step.field, step.value)
            break

          case 'clear-polish':
            applyPolishModelSelection(null)
            break

          case 'add-url':
            addUrl(step.value)
            break

          case 'add-image':
            addImage(step.value)
            break

          case 'add-video':
            addVideo(step.value)
            break

          case 'toggle-smart-context':
            toggleSmartContext()
            break

          case 'set-smart-root':
            setSmartRoot(step.value)
            break

          case 'set-intent-file':
            setIntentFilePath(step.value)
            break

          case 'set-meta-instructions':
            setMetaInstructions(step.value)
            break

          case 'push-history':
            pushHistoryEntry(step)
            break

          case 'notify':
            notify(step.message, { kind: step.kind })
            break

          case 'set-input':
            setInputValue(step.value)
            break

          case 'close-popup':
            closePopup()
            break

          case 'clear-screen':
            clearScreen?.()
            break

          case 'exit-app':
            exitApp()
            break

          case 'run-tests':
            void runTestsFromCommand(step.value)
            break
        }
      }
    },
    [
      addImage,
      addUrl,
      addVideo,
      applyPolishModelSelection,
      applyToggleSelection,
      clearScreen,
      closePopup,
      exitApp,
      notify,
      openFilePopup,
      openHistoryPopup,
      openResumePopup,
      openExportPopup,
      openImagePopup,
      openInstructionsPopup,
      openIntentPopup,
      openModelPopup,
      openPolishModelPopup,
      openReasoningPopup,
      openSettingsPopup,
      openSmartRootPopup,
      openTargetModelPopup,
      openTestPopup,
      openThemeModePopup,
      openThemePopup,
      openTogglePopup,
      openTokensPopup,
      openUrlPopup,
      openVideoPopup,
      pushHistory,
      runTestsFromCommand,
      setInputValue,
      setIntentFilePath,
      setMetaInstructions,
      setSmartRoot,
      toggleSmartContext,
    ],
  )

  const runSeriesCommand = useCallback(
    (trimmedArgs: string): void => {
      const handle = async (): Promise<void> => {
        if (isGenerating) {
          pushHistory('Generation already running. Please wait.', 'system')
          return
        }

        const latestTypedIntent = getLatestTypedIntent()
        const typedDraft = latestTypedIntent?.trim() ?? ''

        let initialDraft = trimmedArgs || typedDraft || lastUserIntentRef.current || ''
        let hintOverride: string | undefined

        if (trimmedArgs) {
          pushHistory('[series] Using provided text as intent draft.', 'system')
        } else if (typedDraft) {
          pushHistory('[series] Using typed intent as draft.', 'system')
        } else if (lastUserIntentRef.current) {
          pushHistory('[series] Reusing last intent as draft.', 'system')
        }

        if (!initialDraft) {
          const trimmedIntentFile = intentFilePath.trim()
          if (trimmedIntentFile) {
            try {
              const raw = await fs.readFile(trimmedIntentFile, 'utf8')
              const fileIntent = raw.trim()
              if (fileIntent) {
                initialDraft = fileIntent
                const fileLabel = path.basename(trimmedIntentFile)
                pushHistory(`[series] Loaded draft from intent file ${fileLabel}.`, 'system')
                hintOverride = `Loaded from intent file ${fileLabel}`
                syncTypedIntentRef(fileIntent)
              } else {
                pushHistory(
                  `[series] Intent file ${trimmedIntentFile} is empty; please add content.`,
                  'system',
                )
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unknown intent file error.'
              pushHistory(
                `[series] Failed to read intent file ${trimmedIntentFile}: ${message}`,
                'system',
              )
            }
          }
        }

        if (!initialDraft) {
          pushHistory('[series] No intent found; enter one in the popup.', 'system')
        }

        openSeriesPopup(initialDraft, hintOverride)
        setInputValue('')
      }

      void handle()
    },
    [
      getLatestTypedIntent,
      intentFilePath,
      isGenerating,
      lastUserIntentRef,
      openSeriesPopup,
      pushHistory,
      setInputValue,
      syncTypedIntentRef,
    ],
  )

  const handleCommandSelection = useCallback(
    (commandId: CommandDescriptor['id'], argsRaw?: string) => {
      const result = mapPopupCommandSelection({
        commandId,
        argsRaw,
        context: {
          copyEnabled,
          chatGptEnabled,
          jsonOutputEnabled,
          interactiveTransportPath,
          urls,
          images,
          videos,
          smartContextEnabled,
          smartContextRoot,
        },
      })

      if (result.kind === 'series') {
        runSeriesCommand(result.trimmedArgs)
        return
      }

      runCommandSteps(result.steps)
    },
    [
      chatGptEnabled,
      copyEnabled,
      images,
      interactiveTransportPath,
      jsonOutputEnabled,
      runCommandSteps,
      runSeriesCommand,
      smartContextEnabled,
      smartContextRoot,
      urls,
      videos,
    ],
  )

  // Memoizing the actions object keeps `actions` referentially stable.
  // This reduces avoidable rerenders in components that receive `actions`.
  const actions = useMemo<PopupManagerActions>(
    () => ({
      openModelPopup,
      openPolishModelPopup,
      openTargetModelPopup,
      openTogglePopup,
      openFilePopup,
      openUrlPopup,
      openImagePopup,
      openVideoPopup,
      openHistoryPopup,
      openResumePopup,
      openExportPopup,
      openSmartRootPopup,
      openTokensPopup,
      openBudgetsPopup,
      openSettingsPopup,
      openThemePopup,
      openThemeModePopup,
      openReasoningPopup,
      openTestPopup,
      openIntentPopup,
      openInstructionsPopup,
      openSeriesPopup,
      closePopup,
      handleCommandSelection,
      handleModelPopupSubmit,
      applyToggleSelection,
      handleIntentFileSubmit,
      handleInstructionsSubmit,
      handleBudgetsSubmit,
      handleResumeSubmit,
      handleExportSubmit,
      handleSeriesIntentSubmit,
    }),
    [
      openModelPopup,
      openPolishModelPopup,
      openTargetModelPopup,
      openTogglePopup,
      openFilePopup,
      openUrlPopup,
      openImagePopup,
      openVideoPopup,
      openHistoryPopup,
      openResumePopup,
      openExportPopup,
      openSmartRootPopup,
      openTokensPopup,
      openBudgetsPopup,
      openSettingsPopup,
      openThemePopup,
      openThemeModePopup,
      openReasoningPopup,
      openTestPopup,
      openIntentPopup,
      openInstructionsPopup,
      openSeriesPopup,
      closePopup,
      handleCommandSelection,
      handleModelPopupSubmit,
      applyToggleSelection,
      handleIntentFileSubmit,
      handleInstructionsSubmit,
      handleBudgetsSubmit,
      handleResumeSubmit,
      handleExportSubmit,
      handleSeriesIntentSubmit,
    ],
  )

  return {
    popupState,
    setPopupState,
    actions,
  }
}
