import path from 'node:path'

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'

import { createBufferedHistoryWriter } from './buffered-history-writer'
import {
  buildIterationCompleteHistoryMessages,
  buildJsonPayloadHistoryMessages,
  extractValidationSection,
  formatCompactTokens,
  getHistoryWrapWidth,
  wrapTextForHistory,
} from './generation-history-formatters'
import {
  prepareSeriesOutputDir,
  type WriteSeriesArtifactsResult,
  writeSeriesArtifacts,
} from './series-artifacts-io'
import { useLatestRef } from './useLatestRef'

import {
  INITIAL_GENERATION_PIPELINE_STATE,
  generationPipelineReducer,
  type InteractiveAwaitingMode,
} from '../generation-pipeline-reducer'

import {
  maybeCopyToClipboard,
  maybeOpenChatGpt,
  runGeneratePipeline,
  type GenerateArgs,
  type GeneratePipelineOptions,
  type GeneratePipelineResult,
  type InteractiveDelegate,
  type StreamEventInput,
} from '../../generate-command'
import { evaluateContextBudget, type ContextEntry } from '../../generate/context-budget'
import { resolveGeminiVideoModel } from '../../generate/models'
import { buildTokenTelemetry } from '../../generate/token-telemetry'
import { generatePromptSeries, isGemini } from '../../prompt-generator-service'
import type { PromptGenerationRequest, SeriesResponse } from '../../prompt-generator-service'
import { resolveFileContext } from '../../file-context'
import { resolveSmartContextFiles } from '../../smart-context-service'
import { resolveUrlContext } from '../../url-context'
import type { UploadStateChange } from '../../prompt-generator-service'
import { MODEL_PROVIDER_LABELS } from '../../model-providers'
import { checkModelProviderStatus } from '../provider-status'
import type { TokenUsageStore } from '../token-usage-store'
import type { BudgetSettings } from '../budget-settings'
import type { NotifyOptions } from '../notifier'
import type { HistoryEntry, ProviderStatus, ResumeMode } from '../types'

export type UseGenerationPipelineOptions = {
  pushHistory: (
    content: string,
    kind?: HistoryEntry['kind'],
    format?: HistoryEntry['format'],
  ) => void
  notify?: (message: string, options?: NotifyOptions) => void
  files: string[]
  urls: string[]
  images: string[]
  videos: string[]
  pdfs: string[]
  smartContextEnabled: boolean
  smartContextRoot: string | null
  metaInstructions: string
  budgets: BudgetSettings
  currentModel: string
  targetModel?: string
  interactiveTransportPath?: string | undefined
  terminalColumns: number
  polishModelId: string | null
  jsonOutputEnabled: boolean
  copyEnabled: boolean
  chatGptEnabled: boolean
  isTestCommandRunning: boolean
  onProviderStatusUpdate?: (status: ProviderStatus) => void
  tokenUsageStore?: TokenUsageStore
  onReasoningUpdate?: (reasoning: string | null) => void
  onLastGeneratedPromptUpdate?: (prompt: string) => void
}

export const useGenerationPipeline = ({
  pushHistory,
  notify,
  files,
  urls,
  images,
  videos,
  pdfs,
  smartContextEnabled,
  smartContextRoot,
  metaInstructions,
  budgets,
  currentModel,
  targetModel,
  interactiveTransportPath,
  terminalColumns,
  polishModelId,
  jsonOutputEnabled,
  copyEnabled,
  chatGptEnabled,
  isTestCommandRunning,
  onProviderStatusUpdate,
  tokenUsageStore,
  onReasoningUpdate,
  onLastGeneratedPromptUpdate,
}: UseGenerationPipelineOptions) => {
  const [pipelineState, dispatch] = useReducer(
    generationPipelineReducer,
    INITIAL_GENERATION_PIPELINE_STATE,
  )

  const {
    isGenerating,
    statusMessage,
    isAwaitingRefinement,
    awaitingInteractiveMode,
    latestTelemetry,
  } = pipelineState
  const normalizedMetaInstructions = metaInstructions.trim()

  // “Stale closure” explanation (plain-English):
  // React callbacks capture the variables that were in scope when they were created.
  // If we keep a callback stable (so we don’t recreate it every render), it would
  // otherwise keep using old values.
  //
  // Example: if `handleStreamEvent` closed over an old `terminalColumns`, it would
  // keep wrapping text to the wrong width after the terminal is resized.
  //
  // Solution used here: keep the callback stable, but read changing values from refs
  // (kept fresh via useLatestRef).
  const pushHistoryRef = useLatestRef(pushHistory)
  const tokenUsageStoreRef = useLatestRef(tokenUsageStore)
  const terminalColumnsRef = useLatestRef(terminalColumns)
  const interactiveTransportPathRef = useLatestRef(interactiveTransportPath)
  const notifyRef = useLatestRef(notify)

  const activeRunIdRef = useRef<string | null>(null)
  const lastGeneratedPromptUpdateRef = useLatestRef<((prompt: string) => void) | null>(
    onLastGeneratedPromptUpdate ?? null,
  )

  type PendingRefinement = {
    requestId: number
    resolveText: (text: string) => void
  }

  const pendingRefinementRef = useRef<PendingRefinement | null>(null)
  const refinementRequestIdRef = useRef(0)
  const isGeneratingRef = useLatestRef(isGenerating)
  const transportAwaitingHintShownRef = useRef(false)

  const setAwaitingInteractiveMode = useCallback(
    (nextMode: InteractiveAwaitingMode | null, nextStatusMessage?: string): void => {
      dispatch({
        type: 'set-awaiting-interactive',
        awaitingInteractiveMode: nextMode,
        ...(nextStatusMessage ? { statusMessage: nextStatusMessage } : {}),
      })
    },
    [],
  )

  const setAwaitingRefinement = useCallback((next: boolean): void => {
    dispatch({ type: 'set-awaiting-refinement', isAwaitingRefinement: next })
  }, [])

  const setLatestTelemetry = useCallback(
    (telemetry: GeneratePipelineResult['telemetry'] | null) => {
      dispatch({ type: 'set-telemetry', telemetry })
    },
    [],
  )

  const setStatusMessage = useCallback((message: string): void => {
    dispatch({ type: 'set-status', statusMessage: message })
  }, [])

  const submitRefinement = useCallback(
    (text: string): void => {
      const pending = pendingRefinementRef.current
      if (!pending) {
        return
      }
      pendingRefinementRef.current = null
      setAwaitingRefinement(false)
      pending.resolveText(text)
    },
    [setAwaitingRefinement],
  )

  useEffect(() => {
    if (isGenerating) {
      return
    }

    // Cleanup is important:
    // - Without it, a pending refinement promise could keep the UI in a “waiting” state.
    // - It also prevents “runaway updates” after generation stops.
    submitRefinement('')
    setAwaitingRefinement(false)
    setAwaitingInteractiveMode(null)
    transportAwaitingHintShownRef.current = false
  }, [isGenerating, setAwaitingInteractiveMode, setAwaitingRefinement, submitRefinement])

  useEffect(() => {
    return () => {
      submitRefinement('')
    }
  }, [submitRefinement])

  const bufferedHistory = useMemo(
    () =>
      createBufferedHistoryWriter({
        push: (content, kind, format) => {
          pushHistoryRef.current(content, kind, format)
        },
      }),
    [pushHistoryRef],
  )

  useEffect(() => {
    if (!isGenerating) {
      bufferedHistory.flush()
    }
  }, [bufferedHistory, isGenerating])

  useEffect(() => {
    return () => {
      bufferedHistory.flush()
    }
  }, [bufferedHistory])

  const handleStreamEvent = useCallback(
    (event: StreamEventInput) => {
      const tokenUsageStoreLatest = tokenUsageStoreRef.current
      const wrapWidth = getHistoryWrapWidth(terminalColumnsRef.current)

      switch (event.event) {
        case 'progress.update': {
          const scope = event.scope ? `[${event.scope}] ` : ''
          const message = `${scope}${event.label} (${event.state})`
          bufferedHistory.pushBuffered(message, 'progress')
          setStatusMessage(message)
          return
        }
        case 'upload.state': {
          const action = event.state === 'start' ? 'Uploading' : 'Uploaded'
          const message = `${action} ${event.detail.kind}: ${event.detail.filePath}`

          const notifyLatest = notifyRef.current
          if (notifyLatest) {
            notifyLatest(message, {
              kind: 'progress',
              autoDismissMs: event.state === 'start' ? 6000 : 2600,
            })
            return
          }

          bufferedHistory.pushBuffered(message, 'progress')
          return
        }
        case 'generation.iteration.start':
          bufferedHistory.pushBuffered(`Iteration ${event.iteration} started`, 'progress')
          return
        case 'generation.iteration.complete': {
          const reasoningTokens = event.reasoningTokens ?? 0

          const activeRunId = activeRunIdRef.current
          if (activeRunId && tokenUsageStoreLatest) {
            tokenUsageStoreLatest.recordIteration(activeRunId, {
              iteration: event.iteration,
              promptTokens: event.tokens,
              reasoningTokens,
            })
          }

          bufferedHistory.pushManyBuffered(
            buildIterationCompleteHistoryMessages({
              iteration: event.iteration,
              tokens: event.tokens,
              ...(event.reasoningTokens !== undefined
                ? { reasoningTokens: event.reasoningTokens }
                : {}),
              prompt: event.prompt,
              wrapWidth,
            }),
          )

          return
        }
        case 'resume.loaded': {
          dispatch({ type: 'set-resume-loaded', details: event })

          const reusedCount = event.reusedContextPaths.length
          const missingCount = event.missingContextPaths.length
          const message = `Resume loaded (${event.source}) · reused ${reusedCount} · missing ${missingCount}`

          bufferedHistory.pushBuffered(message, 'progress')

          const notifyLatest = notifyRef.current
          if (notifyLatest) {
            notifyLatest(message, { kind: missingCount > 0 ? 'warning' : 'info' })
          }

          return
        }

        case 'context.overflow': {
          dispatch({ type: 'set-context-overflow', details: event })

          const droppedCount = event.droppedPaths.length
          const message = `Context overflow (${event.strategy}) · dropped ${droppedCount}`

          bufferedHistory.pushBuffered(message, 'system')

          const notifyLatest = notifyRef.current
          if (notifyLatest) {
            notifyLatest(message, { kind: 'warning' })
          }

          return
        }

        case 'context.telemetry': {
          const telemetry = event.telemetry
          setLatestTelemetry(telemetry)
          const activeRunId = activeRunIdRef.current
          if (activeRunId && tokenUsageStoreLatest) {
            tokenUsageStoreLatest.recordTelemetry(activeRunId, telemetry)
          }
          bufferedHistory.pushBuffered(
            `Telemetry · total ${telemetry.totalTokens} · intent ${telemetry.intentTokens} · files ${telemetry.fileTokens} · system ${telemetry.systemTokens}`,
            'progress',
          )
          return
        }
        case 'generation.final':
          setAwaitingInteractiveMode(null)
          bufferedHistory.pushBuffered('Generation stream finalized.', 'progress')
          return

        case 'transport.listening':
          bufferedHistory.pushBuffered(`Transport listening on ${event.path}`, 'progress')
          return

        case 'transport.client.connected':
          bufferedHistory.pushBuffered('Transport client connected.', 'progress')
          return

        case 'transport.client.disconnected':
          bufferedHistory.pushBuffered('Transport client disconnected.', 'progress')
          return

        case 'interactive.awaiting': {
          const normalizedMode =
            event.mode === 'transport' || event.mode === 'tty' ? event.mode : null

          const waitingMessage =
            normalizedMode === 'transport'
              ? 'Waiting for interactive transport input…'
              : 'Waiting for interactive input…'

          // One dispatch updates both mode + message.
          setAwaitingInteractiveMode(normalizedMode, waitingMessage)
          bufferedHistory.pushBuffered(waitingMessage, 'progress')

          const transportPath = interactiveTransportPathRef.current
          if (
            normalizedMode === 'transport' &&
            transportPath &&
            !transportAwaitingHintShownRef.current
          ) {
            bufferedHistory.pushBuffered(
              'Tip: connect a client and send refine/finish to continue.',
              'system',
            )
            transportAwaitingHintShownRef.current = true
          }

          return
        }
        case 'interactive.state': {
          const message = `Interactive ${event.phase}`
          setAwaitingInteractiveMode(null, message)
          bufferedHistory.pushBuffered(
            `Interactive ${event.phase} (iteration ${event.iteration})`,
            'progress',
          )
          return
        }

        default:
          return
      }
    },
    [
      bufferedHistory,
      interactiveTransportPathRef,
      notifyRef,
      terminalColumnsRef,
      tokenUsageStoreRef,
      setAwaitingInteractiveMode,
      setLatestTelemetry,
      setStatusMessage,
    ],
  )

  const interactiveDelegate: InteractiveDelegate = useMemo(
    () => ({
      getNextAction: async ({ iteration }) => {
        if (!isGeneratingRef.current) {
          return { type: 'finish' }
        }

        refinementRequestIdRef.current += 1
        const requestId = refinementRequestIdRef.current

        if (pendingRefinementRef.current) {
          submitRefinement('')
        }

        setAwaitingRefinement(true)
        pushHistoryRef.current(
          `Refine the prompt above (iteration ${iteration}): describe changes or press Enter on empty line to finish.`,
          'system',
        )

        try {
          return await new Promise<{ type: 'refine'; instruction: string } | { type: 'finish' }>(
            (resolve) => {
              pendingRefinementRef.current = {
                requestId,
                resolveText: (submittedText: string) => {
                  const trimmed = submittedText.trim()
                  if (!isGeneratingRef.current) {
                    resolve({ type: 'finish' })
                    return
                  }
                  if (!trimmed) {
                    pushHistoryRef.current('Interactive refinement complete.', 'system')

                    resolve({ type: 'finish' })
                    return
                  }
                  pushHistoryRef.current(`> [refine] ${trimmed}`, 'user')

                  resolve({ type: 'refine', instruction: trimmed })
                },
              }
            },
          )
        } finally {
          if (pendingRefinementRef.current?.requestId === requestId) {
            pendingRefinementRef.current = null
          }
          if (refinementRequestIdRef.current === requestId) {
            setAwaitingRefinement(false)
          }
        }
      },
    }),
    [isGeneratingRef, pushHistoryRef, submitRefinement, setAwaitingRefinement],
  )

  const onProviderStatusUpdateRef = useLatestRef(onProviderStatusUpdate)

  const ensureProviderReady = useCallback(
    async (modelId: string): Promise<boolean> => {
      try {
        const status = await checkModelProviderStatus(modelId)
        onProviderStatusUpdateRef.current?.(status)
        if (status.status === 'ok') {
          return true
        }
        const providerLabel = MODEL_PROVIDER_LABELS[status.provider]
        pushHistoryRef.current(
          `Generation aborted: ${providerLabel} unavailable (${status.message}).`,
          'system',
        )
        return false
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown provider check error.'
        pushHistoryRef.current(`Generation aborted: provider check failed (${message}).`, 'system')
        return false
      }
    },
    [onProviderStatusUpdateRef, pushHistoryRef],
  )

  const runGeneration = useCallback(
    async (intentInput: {
      intent?: string
      intentFile?: string
      resume?:
        | { kind: 'history'; selector: string; mode: ResumeMode }
        | { kind: 'file'; payloadPath: string; mode: ResumeMode }
    }) => {
      const trimmedIntent = intentInput.intent?.trim() ?? ''
      const trimmedIntentFile = intentInput.intentFile?.trim() ?? ''
      const resume = intentInput.resume

      if (!trimmedIntent && !trimmedIntentFile && !resume) {
        pushHistoryRef.current('No intent provided. Enter text or set an intent file.', 'system')
        return
      }

      const normalizedModel = currentModel.trim() || 'gpt-4o-mini'

      const generationModel =
        videos.length > 0 && !isGemini(normalizedModel)
          ? await resolveGeminiVideoModel()
          : normalizedModel

      if (generationModel !== normalizedModel) {
        pushHistoryRef.current(
          `Switching to ${generationModel} to support video input.`,
          'progress',
        )
      }

      const normalizedTargetModel = (targetModel ?? '').trim() || generationModel
      const normalizedPolishModel = (polishModelId ?? '').trim()
      const polishEnabled = normalizedPolishModel.length > 0

      const providerReady = await ensureProviderReady(generationModel)
      if (!providerReady) {
        return
      }

      if (polishEnabled && normalizedPolishModel !== generationModel) {
        const polishProviderReady = await ensureProviderReady(normalizedPolishModel)
        if (!polishProviderReady) {
          return
        }
      }

      activeRunIdRef.current = tokenUsageStoreRef.current
        ? tokenUsageStoreRef.current.startRun(generationModel)
        : null
      setLatestTelemetry(null)
      onReasoningUpdate?.(null)

      dispatch({ type: 'generation-start', statusMessage: 'Preparing generation…' })
      transportAwaitingHintShownRef.current = false
      pushHistoryRef.current('Starting generation…')

      let stopStatusMessage: string | undefined

      try {
        const transportPath = interactiveTransportPathRef.current
        const usesTransportInteractive = Boolean(transportPath)

        const usesTuiInteractiveDelegate = !usesTransportInteractive && !jsonOutputEnabled

        const shouldIgnoreContextForResume = Boolean(resume)

        const args: GenerateArgs = {
          interactive: usesTransportInteractive || usesTuiInteractiveDelegate,
          copy: false,
          openChatGpt: false,
          polish: polishEnabled,
          json: jsonOutputEnabled,
          quiet: true,
          progress: false,
          stream: 'none',
          showContext: false,
          contextFormat: 'text',
          help: false,
          context: shouldIgnoreContextForResume ? [] : [...files],
          urls: shouldIgnoreContextForResume ? [] : [...urls],
          images: [...images],
          video: [...videos],
          pdf: [...pdfs],
          smartContext: shouldIgnoreContextForResume ? false : smartContextEnabled,
          model: generationModel,
          target: normalizedTargetModel,
          ...(budgets.maxInputTokens !== null ? { maxInputTokens: budgets.maxInputTokens } : {}),
          ...(budgets.maxContextTokens !== null
            ? { maxContextTokens: budgets.maxContextTokens }
            : {}),
          ...(budgets.contextOverflowStrategy !== null
            ? { contextOverflow: budgets.contextOverflowStrategy }
            : {}),
        }
        if (normalizedMetaInstructions) {
          args.metaInstructions = normalizedMetaInstructions
        }
        if (trimmedIntentFile) {
          args.intentFile = trimmedIntentFile
        } else if (trimmedIntent) {
          args.intent = trimmedIntent
        }

        if (resume) {
          args.resumeMode = resume.mode
          if (resume.kind === 'history') {
            args.resume = resume.selector
          } else {
            args.resumeFrom = resume.payloadPath
          }
        }
        if (polishEnabled) {
          args.polishModel = normalizedPolishModel
        }

        if (!shouldIgnoreContextForResume && smartContextEnabled && smartContextRoot) {
          args.smartContextRoot = smartContextRoot
        }
        if (transportPath) {
          args.interactiveTransport = transportPath
        }

        const options: GeneratePipelineOptions = {
          onStreamEvent: handleStreamEvent,
          ...(usesTuiInteractiveDelegate ? { interactiveDelegate } : {}),
        }

        const result: GeneratePipelineResult = await runGeneratePipeline(args, options)
        onReasoningUpdate?.(result.reasoning ?? null)
        setStatusMessage('Finalizing prompt…')
        const wrapWidth = getHistoryWrapWidth(terminalColumnsRef.current)
        const iterationLabel = result.iterations ? ` · ${result.iterations} iterations` : ''
        pushHistoryRef.current(`Final prompt (${result.model}${iterationLabel}):`, 'system')
        wrapTextForHistory(result.finalPrompt, wrapWidth).forEach((line) => {
          pushHistoryRef.current(line, 'system', 'markdown')
        })

        lastGeneratedPromptUpdateRef.current?.(result.finalPrompt)
        if (result.telemetry) {
          setLatestTelemetry(result.telemetry)
          const activeRunId = activeRunIdRef.current
          if (activeRunId && tokenUsageStoreRef.current) {
            tokenUsageStoreRef.current.recordTelemetry(activeRunId, result.telemetry)
          }
          pushHistoryRef.current(
            `Telemetry · total ${result.telemetry.totalTokens} · intent ${result.telemetry.intentTokens} · files ${result.telemetry.fileTokens} · system ${result.telemetry.systemTokens}`,
            'system',
          )
        }
        if (jsonOutputEnabled) {
          const wrapWidth = getHistoryWrapWidth(terminalColumnsRef.current)
          bufferedHistory.pushManyBuffered(
            buildJsonPayloadHistoryMessages(result.payload, wrapWidth),
          )
        }

        if (copyEnabled) {
          await maybeCopyToClipboard(true, result.finalPrompt, false)
          pushHistoryRef.current('Copied prompt to clipboard.', 'system')
        }

        if (chatGptEnabled) {
          await maybeOpenChatGpt(true, result.finalPrompt, false)
          pushHistoryRef.current('Opened ChatGPT with generated prompt.', 'system')
        }

        stopStatusMessage = 'Complete'
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown generation error.'
        pushHistoryRef.current(`Generation failed: ${message}`)
        onReasoningUpdate?.(null)
        stopStatusMessage = 'Failed'
      } finally {
        submitRefinement('')
        dispatch({
          type: 'generation-stop',
          ...(stopStatusMessage ? { statusMessage: stopStatusMessage } : {}),
        })
      }
    },
    [
      chatGptEnabled,
      copyEnabled,
      currentModel,
      targetModel,
      files,
      urls,
      images,
      videos,
      polishModelId,

      jsonOutputEnabled,
      smartContextEnabled,
      budgets,
      smartContextRoot,
      normalizedMetaInstructions,
      interactiveTransportPathRef,
      pushHistoryRef,
      bufferedHistory,
      terminalColumnsRef,
      tokenUsageStoreRef,
      handleStreamEvent,
      interactiveDelegate,
      submitRefinement,
      ensureProviderReady,
      lastGeneratedPromptUpdateRef,
      onReasoningUpdate,
      setLatestTelemetry,
      setStatusMessage,
    ],
  )

  const runSeriesGeneration = useCallback(
    async (intent: string) => {
      let generationModel = currentModel.trim() || 'gpt-4o-mini'
      if (videos.length > 0 && !isGemini(generationModel)) {
        generationModel = await resolveGeminiVideoModel()
        pushHistoryRef.current(
          `[series] Switching to ${generationModel} to support video input.`,
          'progress',
        )
      }

      const runtimeTargetModel = (targetModel ?? '').trim() || generationModel

      const providerReady = await ensureProviderReady(generationModel)
      if (!providerReady) {
        return
      }

      dispatch({ type: 'generation-start', statusMessage: 'Series: resolving context…' })
      pushHistoryRef.current('[series] Starting series generation…', 'progress')

      const prepareDirResult = await prepareSeriesOutputDir(intent)
      const seriesDir = prepareDirResult.seriesDir

      let canWriteFiles = prepareDirResult.canWriteFiles
      if (!canWriteFiles) {
        const message = prepareDirResult.errorMessage ?? 'Unknown filesystem error.'
        pushHistoryRef.current(
          `[series] Failed to prepare output directory: ${message}`,
          'progress',
        )
      }

      try {
        let contextEntries: ContextEntry[] = (
          await resolveFileContext(Array.from(files) as string[])
        ).map((entry) => ({ ...entry, source: 'file' }))

        if (contextEntries.length > 0) {
          pushHistoryRef.current(
            `[series] Added ${contextEntries.length} file context entr${contextEntries.length === 1 ? 'y' : 'ies'}.`,
            'progress',
          )
        }

        if (urls.length > 0) {
          pushHistoryRef.current(`[series] Fetching ${urls.length} URL source(s)…`, 'progress')

          try {
            const urlFiles = await resolveUrlContext(urls, {
              onProgress: (message: string) => {
                pushHistoryRef.current(`[series] ${message}`, 'progress')

                setStatusMessage(`Series: ${message}`)
              },
            })
            if (urlFiles.length > 0) {
              contextEntries = [
                ...contextEntries,
                ...urlFiles.map((entry) => ({ ...entry, source: 'url' as const })),
              ]
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown URL context error.'
            pushHistoryRef.current(`[series] URL context failed: ${message}`, 'progress')
          }
        }

        if (smartContextEnabled) {
          if (notify) {
            notify('Smart context: resolving…', { kind: 'progress' })
          } else {
            pushHistoryRef.current('[series] Resolving smart context…', 'progress')
          }

          try {
            const smartFiles = await resolveSmartContextFiles(
              intent,
              contextEntries.map(({ path, content }) => ({ path, content })),
              (message: string) => {
                if (notify) {
                  notify(`Smart context: ${message}`, { kind: 'progress' })
                } else {
                  pushHistoryRef.current(`[series] ${message}`, 'progress')
                }
                setStatusMessage(`Series: ${message}`)
              },
              smartContextRoot ?? undefined,
            )
            if (smartFiles.length > 0) {
              contextEntries = [
                ...contextEntries,
                ...smartFiles.map((entry) => ({ ...entry, source: 'smart' as const })),
              ]
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown smart context error.'
            pushHistoryRef.current(`[series] Smart context failed: ${message}`, 'progress')
          }
        }

        const budgetEvaluation = evaluateContextBudget({
          intentText: intent,
          metaInstructions: normalizedMetaInstructions,
          contextEntries,
          ...(budgets.maxInputTokens !== null ? { maxInputTokens: budgets.maxInputTokens } : {}),
          ...(budgets.maxContextTokens !== null
            ? { maxContextTokens: budgets.maxContextTokens }
            : {}),
          ...(budgets.contextOverflowStrategy !== null
            ? { strategy: budgets.contextOverflowStrategy }
            : {}),
          buildTelemetry: (intentText, files, metaInstructions) =>
            buildTokenTelemetry(intentText, files, metaInstructions),
        })

        setLatestTelemetry(budgetEvaluation.after)

        if (budgetEvaluation.droppedEntries.length > 0) {
          contextEntries = budgetEvaluation.keptEntries
          const droppedCount = budgetEvaluation.droppedEntries.length

          dispatch({
            type: 'set-context-overflow',
            details: {
              event: 'context.overflow',
              strategy: budgetEvaluation.strategy ?? 'fail',
              before: budgetEvaluation.before,
              after: budgetEvaluation.after,
              droppedPaths: budgetEvaluation.droppedPaths,
            },
          })

          pushHistoryRef.current(
            `[series] Context overflow (${budgetEvaluation.strategy ?? 'fail'}) · dropped ${droppedCount}`,
            'system',
          )
        }

        pushHistoryRef.current(
          `[series] Context ready (${contextEntries.length} file(s)).`,
          'progress',
        )

        const handleUploadState: UploadStateChange = (state, detail) => {
          const action = state === 'start' ? 'Uploading' : 'Uploaded'
          const message = `${action} ${detail.kind}: ${detail.filePath}`

          if (notify) {
            notify(message, { kind: 'progress', autoDismissMs: state === 'start' ? 6000 : 2600 })
            return
          }

          pushHistoryRef.current(`[series] ${message}`, 'progress')
        }

        const request: PromptGenerationRequest = {
          intent,
          model: generationModel,
          targetModel: runtimeTargetModel,
          fileContext: contextEntries.map(({ path, content }) => ({ path, content })),
          images: [...images],
          videos: [...videos],
          pdfs: [...pdfs],
          onUploadStateChange: handleUploadState,
          onSeriesRepairAttempt: ({ attempt, maxAttempts, validationError }) => {
            const normalizedError = validationError.replace(/\s+/g, ' ').trim()
            const shortError =
              normalizedError.length > 140 ? `${normalizedError.slice(0, 137)}…` : normalizedError

            pushHistoryRef.current(
              `[series] Validation failed; attempting automatic repair (${attempt}/${maxAttempts})… Reason: ${shortError}`,
              'progress',
            )

            if (process.env.DEBUG || process.env.VERBOSE) {
              pushHistoryRef.current(
                `[series][debug] Full validation error: ${normalizedError}`,
                'progress',
              )
            }
          },
          ...(normalizedMetaInstructions ? { metaInstructions: normalizedMetaInstructions } : {}),
        }

        setStatusMessage('Series: generating…')
        const series: SeriesResponse = await generatePromptSeries(request)

        const totalPrompts = 1 + series.atomicPrompts.length
        let writeResult: WriteSeriesArtifactsResult | null = null

        if (canWriteFiles) {
          try {
            writeResult = await writeSeriesArtifacts(seriesDir, series)
            writeResult.errors.forEach((entry) => {
              pushHistoryRef.current(
                `[series] Failed to write ${entry.fileName}: ${entry.message}`,
                'progress',
              )
            })
          } catch (error) {
            canWriteFiles = false
            const message = error instanceof Error ? error.message : 'Unknown filesystem error.'
            pushHistoryRef.current(
              `[series] Failed to write series artifacts: ${message}`,
              'progress',
            )
          }
        }

        pushHistoryRef.current('[series] Overview ready.', 'progress')

        series.atomicPrompts.forEach((step, index) => {
          const stepNumber = index + 1
          const validationSection = extractValidationSection(step.content)

          if (validationSection) {
            pushHistoryRef.current(
              `[Step ${stepNumber}: ${step.title}] Validation section:\n${validationSection}`,
              'system',
            )

            return
          }

          pushHistoryRef.current(
            `[Step ${stepNumber}: ${step.title}] (no Validation section found)`,
            'system',
          )
        })

        if (canWriteFiles) {
          const relativeDir = path.relative(process.cwd(), seriesDir) || seriesDir
          const writtenCount = writeResult?.writtenCount ?? 0
          pushHistoryRef.current(
            `[Series] Saved ${writtenCount}/${totalPrompts} prompts to ${relativeDir}`,
            'system',
          )
        } else {
          pushHistoryRef.current(`[Series] Generated ${totalPrompts} prompts (not saved)`, 'system')
        }

        dispatch({ type: 'generation-stop', statusMessage: 'Series complete' })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown series generation error.'
        pushHistoryRef.current(`[series] Failed: ${message}`, 'progress')
        dispatch({ type: 'generation-stop', statusMessage: 'Series failed' })
      } finally {
        dispatch({ type: 'generation-stop' })
      }
    },
    [
      currentModel,
      targetModel,
      files,

      urls,
      images,
      videos,
      smartContextEnabled,
      smartContextRoot,
      normalizedMetaInstructions,
      pushHistoryRef,
      notify,
      ensureProviderReady,
      setStatusMessage,
    ],
  )

  const statusChips = useMemo(() => {
    const effectiveStatusMessage = isGenerating
      ? statusMessage
      : isTestCommandRunning
        ? 'Running tests'
        : statusMessage

    const statusChip = `[status:${effectiveStatusMessage}]`
    const normalizedTarget = (targetModel ?? '').trim() || currentModel
    const chips = [statusChip, `[${currentModel}]`, `[target:${normalizedTarget}]`]
    if (latestTelemetry) {
      chips.push(`[tokens:${formatCompactTokens(latestTelemetry.totalTokens)}]`)
    }
    const normalizedPolishModel = (polishModelId ?? '').trim()
    if (normalizedPolishModel) {
      chips.push(`[polish:${normalizedPolishModel}]`)
    }

    chips.push(`[copy:${copyEnabled ? 'on' : 'off'}]`)
    chips.push(`[chatgpt:${chatGptEnabled ? 'on' : 'off'}]`)
    chips.push(`[json:${jsonOutputEnabled ? 'on' : 'off'}]`)
    chips.push(`[files:${files.length}]`)
    chips.push(`[urls:${urls.length}]`)
    chips.push(`[smart:${smartContextEnabled ? 'on' : 'off'}]`)
    chips.push(`[tests:${isTestCommandRunning ? 'running' : 'idle'}]`)
    if (smartContextRoot) {
      chips.push(`[root:${smartContextRoot}]`)
    }

    return chips
  }, [
    isGenerating,
    statusMessage,
    currentModel,
    targetModel,
    latestTelemetry,

    polishModelId,
    copyEnabled,

    chatGptEnabled,
    jsonOutputEnabled,
    files.length,
    urls.length,
    smartContextEnabled,
    smartContextRoot,
    isTestCommandRunning,
  ])

  return {
    isGenerating,
    statusMessage,
    runGeneration,
    runSeriesGeneration,
    statusChips,
    latestContextOverflow: pipelineState.latestContextOverflow,
    isAwaitingRefinement,
    submitRefinement,
    awaitingInteractiveMode,
  }
}
