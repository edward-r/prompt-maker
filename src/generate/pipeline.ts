import fs from 'node:fs/promises'
import { stdin as input, stdout as output } from 'node:process'

import chalk from 'chalk'

import { loadCliConfig } from '../config'
import { resolveFileContext, type FileContext } from '../file-context'
import { appendToHistory, resolveHistoryFilePath } from '../history-logger'
import { resolveSmartContextFiles } from '../smart-context-service'
import type { ResolveUrlContextOptions } from '../url-context'
import { resolveUrlContext } from '../url-context'
import {
  createPromptGeneratorService,
  isGemini,
  resolveDefaultGenerateModel,
} from '../prompt-generator-service'

import { maybeCopyToClipboard, maybeOpenChatGpt } from './actions'
import { resolveContextTemplate, renderContextTemplate } from './context-templates'
import { evaluateContextBudget, type ContextEntry, type ContextEntrySource } from './context-budget'
import { displayContextFiles, writeContextFile } from './context-output'
import { displayContextTemplatePrompt, displayPolishedPrompt } from './display'
import { shouldTraceFlags } from './debug'
import { runGenerationWorkflow } from './interactive'
import { InteractiveTransport } from './interactive-transport'
import { resolveIntent } from './intent'
import { resolveGeminiVideoModel, resolveTargetModel } from './models'
import { polishPrompt } from './polish'
import { createUploadStateTracker, startProgress, type ProgressHandle } from './progress'
import { createStreamDispatcher, type StreamDispatcher } from './stream'
import { buildTokenTelemetry } from './token-telemetry'
import {
  GENERATE_JSON_PAYLOAD_SCHEMA_VERSION,
  type ContextPathMetadata,
  type GenerateArgs,
  type GenerateJsonPayload,
  type GeneratePipelineOptions,
  type GeneratePipelineResult,
  type InteractiveMode,
  type ProgressScope,
  type ResumeMode,
  type StreamEventInput,
} from './types'

type ResumePayload = GenerateJsonPayload & {
  metaInstructions?: string
}

type ResumeLoadResult = {
  payload: ResumePayload
  source: 'history' | 'file'
}

type HistorySelector = {
  fromEnd: number
  label: string
}

type ResumeContextResult = {
  fileContext: FileContext[]
  reusedContextPaths: GenerateJsonPayload['contextPaths']
  missingContextPaths: GenerateJsonPayload['contextPaths']
}

const parseHistorySelector = (selector: string): HistorySelector => {
  const trimmed = selector.trim()
  if (trimmed === 'last') {
    return { fromEnd: 1, label: 'last' }
  }

  const lastMatch = trimmed.match(/^last:(\d+)$/)
  if (lastMatch) {
    return { fromEnd: Number(lastMatch[1]), label: trimmed }
  }

  const numericMatch = trimmed.match(/^(\d+)$/)
  if (numericMatch) {
    return { fromEnd: Number(numericMatch[1]), label: trimmed }
  }

  throw new Error(
    `Invalid resume selector "${selector}". Use "last", "last:N", or "N" (N-th from end).`,
  )
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')

const isContextPaths = (value: unknown): value is GenerateJsonPayload['contextPaths'] =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      isRecord(entry) && typeof entry.path === 'string' && typeof entry.source === 'string',
  )

const isGenerateJsonPayload = (value: unknown): value is ResumePayload => {
  if (!isRecord(value)) {
    return false
  }

  if (value.schemaVersion !== GENERATE_JSON_PAYLOAD_SCHEMA_VERSION) {
    return false
  }

  return (
    typeof value.intent === 'string' &&
    typeof value.model === 'string' &&
    typeof value.targetModel === 'string' &&
    typeof value.prompt === 'string' &&
    isStringArray(value.refinements) &&
    typeof value.iterations === 'number' &&
    Number.isFinite(value.iterations) &&
    typeof value.interactive === 'boolean' &&
    typeof value.timestamp === 'string' &&
    isContextPaths(value.contextPaths)
  )
}

const selectFromEnd = <T>(entries: T[], fromEnd: number): T => {
  const index = entries.length - fromEnd
  if (index < 0 || index >= entries.length) {
    const noun = entries.length === 1 ? 'entry' : 'entries'
    throw new Error(
      `History selector is out of range. Requested ${fromEnd} from end but only ${entries.length} ${noun} available.`,
    )
  }

  const selected = entries[index]
  if (!selected) {
    throw new Error('Invariant violation: selected history entry is missing.')
  }

  return selected
}

const readJsonlPayloads = async (filePath: string): Promise<ResumePayload[]> => {
  let raw: string

  try {
    raw = await fs.readFile(filePath, 'utf8')
  } catch (error) {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : null

    if (code === 'ENOENT') {
      throw new Error(
        `History file not found at ${filePath}. Run a generate command first to create it.`,
      )
    }

    const message = error instanceof Error ? error.message : 'Unknown file error.'
    throw new Error(`Failed to read history file ${filePath}: ${message}`)
  }

  if (raw.trim().length === 0) {
    throw new Error(`History file ${filePath} is empty.`)
  }

  const entries: ResumePayload[] = []

  raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line) => {
      try {
        const parsed = JSON.parse(line) as unknown
        if (isGenerateJsonPayload(parsed)) {
          entries.push(parsed)
        }
      } catch {
        // ignore invalid json
      }
    })

  if (entries.length === 0) {
    throw new Error(`No valid generate payloads found in history file ${filePath}.`)
  }

  return entries
}

const loadResumePayload = async (args: GenerateArgs): Promise<ResumeLoadResult | null> => {
  if (!args.resume && !args.resumeLast && !args.resumeFrom) {
    return null
  }

  if (args.resumeFrom) {
    const filePath = args.resumeFrom
    const entries = await readJsonlPayloads(filePath)
    const payload = entries[entries.length - 1]
    if (!payload) {
      throw new Error(`No valid generate payloads found in resume file ${filePath}.`)
    }
    return { payload, source: 'file' }
  }

  const selector = args.resumeLast ? 'last' : (args.resume ?? 'last')
  const parsedSelector = parseHistorySelector(selector)
  const historyPath = resolveHistoryFilePath()
  const entries = await readJsonlPayloads(historyPath)
  const payload = selectFromEnd(entries, parsedSelector.fromEnd)
  return { payload, source: 'history' }
}

const resolveResumeContext = async (
  payload: ResumePayload,
  mode: ResumeMode,
): Promise<ResumeContextResult> => {
  const reused: GenerateJsonPayload['contextPaths'] = []
  const missing: GenerateJsonPayload['contextPaths'] = []
  const fileContext: FileContext[] = []

  const contextCandidates = payload.contextPaths.filter((entry) => entry.source !== 'intent')

  for (const entry of contextCandidates) {
    if (entry.source !== 'file') {
      missing.push(entry)
      continue
    }

    try {
      const content = await fs.readFile(entry.path, 'utf8')
      fileContext.push({ path: entry.path, content })
      reused.push(entry)
    } catch {
      missing.push(entry)
    }
  }

  if (missing.length > 0 && mode === 'best-effort') {
    const fileMissing = missing.filter((entry) => entry.source === 'file')
    if (fileMissing.length > 0) {
      const paths = fileMissing.map((entry) => entry.path).join(', ')
      console.warn(chalk.yellow(`Resume skipped missing context file(s): ${paths}`))
    }
  }

  return { fileContext, reusedContextPaths: reused, missingContextPaths: missing }
}

const isMissingIntentError = (error: unknown): boolean =>
  error instanceof Error && error.message.startsWith('Intent text is required.')

const logFlagSnapshot = (args: GenerateArgs): void => {
  if (!shouldTraceFlags()) {
    return
  }

  const snapshot = {
    copy: args.copy,
    polish: args.polish,
    openChatGpt: args.openChatGpt,
    json: args.json,
    quiet: args.quiet,
    stream: args.stream,
    interactive: args.interactive,
    showContext: args.showContext,
    contextTemplate: args.contextTemplate ?? null,
    contextFile: args.contextFile ?? null,
    smartContext: args.smartContext,
  }

  console.error(chalk.dim('[pmc:flags]'), JSON.stringify(snapshot, null, 2))
}

type ContextPathSource = ContextPathMetadata['source']

type TransportCleanupHandler = {
  event: NodeJS.Signals | 'exit'
  handler: () => void
}

export const runGeneratePipeline = async (
  args: GenerateArgs,
  options: GeneratePipelineOptions = {},
): Promise<GeneratePipelineResult> => {
  logFlagSnapshot(args)

  const interactiveTransportPath = args.interactiveTransport?.trim()

  if (args.interactiveTransport && !interactiveTransportPath) {
    throw new Error('--interactive-transport requires a non-empty path.')
  }

  const wantsInteractiveSession = args.interactive || Boolean(interactiveTransportPath)

  if (args.json && wantsInteractiveSession) {
    throw new Error('--json cannot be combined with --interactive.')
  }

  const contextTemplateName = args.contextTemplate?.trim()

  if (args.contextTemplate && !contextTemplateName) {
    throw new Error('--context-template requires a non-empty template name.')
  }

  const transportCleanupHandlers: TransportCleanupHandler[] = []
  const interactiveTransport = interactiveTransportPath
    ? new InteractiveTransport(interactiveTransportPath)
    : null

  try {
    const resume = await loadResumePayload(args)

    let intent: string
    let intentMetadataPath: string

    if (resume) {
      // Precedence: if the user provides a new intent (inline, --intent-file, or stdin), it wins.
      // Otherwise, fall back to the resumed payload intent.
      try {
        intent = await resolveIntent(args)
        intentMetadataPath = args.intentFile
          ? args.intentFile
          : args.intent?.trim()
            ? 'inline-intent'
            : 'stdin-intent'
      } catch (error) {
        if (!isMissingIntentError(error)) {
          throw error
        }

        intent = resume.payload.intent
        intentMetadataPath = resume.source === 'history' ? 'history-intent' : 'resume-file-intent'
      }
    } else {
      intent = await resolveIntent(args)
      intentMetadataPath = args.intentFile
        ? args.intentFile
        : args.intent?.trim()
          ? 'inline-intent'
          : 'stdin-intent'
    }

    const cliConfig = await loadCliConfig()

    let contextPaths: ContextPathMetadata[] = []
    const recordContextPaths = (entries: FileContext[], source: ContextPathSource): void => {
      entries.forEach((entry) => {
        contextPaths.push({ path: entry.path, source })
      })
    }

    const pruneContextPaths = (
      paths: ContextPathMetadata[],
      dropped: ContextPathMetadata[],
    ): ContextPathMetadata[] => {
      if (dropped.length === 0) {
        return paths
      }

      const remainingDrops = new Map<string, number>()
      dropped.forEach((entry) => {
        const key = `${entry.source}:${entry.path}`
        remainingDrops.set(key, (remainingDrops.get(key) ?? 0) + 1)
      })

      const next: ContextPathMetadata[] = []
      paths.forEach((entry) => {
        const key = `${entry.source}:${entry.path}`
        const remaining = remainingDrops.get(key)
        if (remaining !== undefined) {
          if (remaining <= 1) {
            remainingDrops.delete(key)
          } else {
            remainingDrops.set(key, remaining - 1)
          }
          return
        }
        next.push(entry)
      })

      return next
    }

    contextPaths.push({ path: intentMetadataPath, source: 'intent' })

    const resumeMode = args.resumeMode ?? 'best-effort'

    let resumeContext: ResumeContextResult | null = null

    let fileContext: FileContext[]

    if (args.context.length > 0 || !resume) {
      fileContext = await resolveFileContext(args.context)
      recordContextPaths(fileContext, 'file')
    } else {
      resumeContext = await resolveResumeContext(resume.payload, resumeMode)
      fileContext = resumeContext.fileContext
      recordContextPaths(fileContext, 'file')
    }

    let contextEntrySources: ContextEntrySource[] = fileContext.map(() => 'file')

    const service = await createPromptGeneratorService()
    const defaultGenerateModel = await resolveDefaultGenerateModel()

    let model = args.model ?? resume?.payload.model ?? defaultGenerateModel
    const targetModel = await resolveTargetModel({
      defaultTargetModel: resume?.payload.targetModel ?? defaultGenerateModel,
      ...(args.target !== undefined ? { explicitTarget: args.target } : {}),
    })

    if (args.video.length > 0 && !isGemini(model)) {
      const previousModel = model
      model = await resolveGeminiVideoModel()

      if (model !== previousModel) {
        console.warn(`Switching to ${model} to support video input.`)
      }
    }

    const contextTemplateDefinition = contextTemplateName
      ? await resolveContextTemplate(contextTemplateName)
      : null

    const refinements: string[] = resume ? [...resume.payload.refinements] : []
    // Precedence: explicit CLI meta instructions override resumed meta instructions.
    const trimmedMetaInstructions = (
      args.metaInstructions ??
      resume?.payload.metaInstructions ??
      ''
    ).trim()
    const streamDispatcher = createStreamDispatcher(args.stream, {
      ...(interactiveTransport ? { taps: [interactiveTransport.getEventWriter()] } : {}),
    })

    const emitEvent = (event: StreamEventInput): void => {
      if (options.onStreamEvent) {
        try {
          options.onStreamEvent(event)
        } catch {
          // ignore listener errors to avoid breaking pipeline
        }
      }
      streamDispatcher.emit(event)
    }

    const streamProxy: StreamDispatcher = {
      mode: streamDispatcher.mode,
      emit: emitEvent,
    }

    if (
      resumeContext &&
      (resumeContext.reusedContextPaths.length > 0 || resumeContext.missingContextPaths.length > 0)
    ) {
      emitEvent({
        event: 'resume.loaded',
        source: resume?.source ?? 'history',
        reusedContextPaths: resumeContext.reusedContextPaths,
        missingContextPaths: resumeContext.missingContextPaths,
      })

      if (
        resumeMode === 'strict' &&
        resumeContext.missingContextPaths.some((entry) => entry.source === 'file')
      ) {
        const missingFiles = resumeContext.missingContextPaths
          .filter((entry) => entry.source === 'file')
          .map((entry) => entry.path)
          .join(', ')
        throw new Error(`Missing required resumed context file(s): ${missingFiles}`)
      }
    }

    interactiveTransport?.setEventEmitter((event) => {
      emitEvent(event)
    })

    if (interactiveTransport) {
      await interactiveTransport.start()
      const signals: Array<NodeJS.Signals | 'exit'> = ['SIGINT', 'SIGTERM', 'exit']
      signals.forEach((signal) => {
        const handler = (): void => {
          void interactiveTransport.stop()
        }
        process.once(signal, handler)
        transportCleanupHandlers.push({ event: signal, handler })
      })
    }

    const interactiveMode: InteractiveMode = interactiveTransport
      ? 'transport'
      : args.interactive && input.isTTY && output.isTTY
        ? 'tty'
        : 'none'

    if (args.interactive && interactiveMode === 'none') {
      console.warn(
        'Interactive mode requested but no TTY detected; continuing non-interactive run.',
      )
    }

    const uiSuppressed = args.quiet || streamDispatcher.mode !== 'none'
    const shouldDisplay = !args.json && !args.quiet
    const progressSpinnersEnabled = args.progress && interactiveMode === 'none'
    const startSpinner = (label: string): ProgressHandle | null =>
      progressSpinnersEnabled ? startProgress(label, { showSpinner: !uiSuppressed }) : null

    const emitProgress = (
      label: string,
      state: 'start' | 'update' | 'stop',
      scope: ProgressScope = 'generic',
    ): void => {
      emitEvent({ event: 'progress.update', label, state, scope })
    }

    emitProgress('Resolving context', 'start', 'generic')

    if (args.urls.length > 0) {
      const label = 'Fetching URL context'
      emitProgress(label, 'start', 'url')
      const urlSpinner = startSpinner(label)
      const urlOptions: ResolveUrlContextOptions = {
        onProgress: (message: string) => {
          urlSpinner?.setLabel(message)
          emitProgress(message, 'update', 'url')
        },
      }

      try {
        const urlFiles = await resolveUrlContext(args.urls, urlOptions)
        if (urlFiles.length > 0) {
          fileContext = [...fileContext, ...urlFiles]
          contextEntrySources = [
            ...contextEntrySources,
            ...urlFiles.map((): ContextEntrySource => 'url'),
          ]
          recordContextPaths(urlFiles, 'url')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown URL fetch error.'
        console.warn(chalk.yellow(`Failed to fetch URL context: ${message}`))
        emitEvent({ event: 'progress.update', label: `URL error: ${message}`, state: 'update' })
      } finally {
        urlSpinner?.stop('URL context ready')
        emitProgress(label, 'stop', 'url')
      }
    }

    if (args.smartContext) {
      const label = 'Preparing smart context'
      emitProgress(label, 'start', 'smart')
      const smartSpinner = startSpinner(label)
      try {
        const smartFiles = await resolveSmartContextFiles(
          intent,
          fileContext,
          (message) => {
            smartSpinner?.setLabel(message)
            emitProgress(message, 'update', 'smart')
          },
          args.smartContextRoot,
        )

        if (smartFiles.length > 0) {
          fileContext = [...fileContext, ...smartFiles]
          contextEntrySources = [
            ...contextEntrySources,
            ...smartFiles.map((): ContextEntrySource => 'smart'),
          ]
          recordContextPaths(smartFiles, 'smart')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown smart context error.'
        console.warn(chalk.yellow(`Smart context failed: ${message}`))
        emitEvent({
          event: 'progress.update',
          label: `Smart context error: ${message}`,
          state: 'update',
        })
      } finally {
        smartSpinner?.stop('Smart context ready')
        emitProgress(label, 'stop', 'smart')
      }
    }

    emitProgress('Resolving context', 'stop', 'generic')

    const promptGeneratorConfig = cliConfig?.promptGenerator
    const maxInputTokens = args.maxInputTokens ?? promptGeneratorConfig?.maxInputTokens
    const maxContextTokens = args.maxContextTokens ?? promptGeneratorConfig?.maxContextTokens
    const overflowStrategy = args.contextOverflow ?? promptGeneratorConfig?.contextOverflowStrategy

    const contextEntries: ContextEntry[] = fileContext.map((entry, index) => {
      const source = contextEntrySources[index]
      if (!source) {
        throw new Error(`Invariant violation: missing source for context entry ${entry.path}.`)
      }
      return { ...entry, source }
    })

    const budgetEvaluation = evaluateContextBudget({
      intentText: intent,
      metaInstructions: trimmedMetaInstructions,
      contextEntries,
      ...(maxInputTokens !== undefined ? { maxInputTokens } : {}),
      ...(maxContextTokens !== undefined ? { maxContextTokens } : {}),
      ...(overflowStrategy ? { strategy: overflowStrategy } : {}),
      buildTelemetry: (intentText, files, metaInstructions) =>
        buildTokenTelemetry(intentText, files, metaInstructions),
    })

    if (budgetEvaluation.droppedEntries.length > 0) {
      fileContext = budgetEvaluation.keptEntries.map(({ path, content }) => ({ path, content }))
      contextEntrySources = budgetEvaluation.keptEntries.map((entry) => entry.source)
      contextPaths = pruneContextPaths(contextPaths, budgetEvaluation.droppedPaths)

      emitEvent({
        event: 'context.overflow',
        strategy: budgetEvaluation.strategy ?? 'fail',
        before: budgetEvaluation.before,
        after: budgetEvaluation.after,
        droppedPaths: budgetEvaluation.droppedPaths,
      })
    }

    const telemetry = budgetEvaluation.after
    emitEvent({ event: 'context.telemetry', telemetry })

    if (args.showContext) {
      const writeLine = args.json
        ? (value: string): void => {
            console.error(value)
          }
        : (value: string): void => {
            console.log(value)
          }
      displayContextFiles(fileContext, args.contextFormat, writeLine)
    }

    let outputPath: string | undefined

    if (args.contextFile) {
      await writeContextFile(args.contextFile, args.contextFormat, fileContext)
      outputPath = args.contextFile
    }

    emitProgress('Generating prompt', 'start', 'generate')
    const generationSpinner = startSpinner('Generating prompt')
    const handleUploadStateChange = createUploadStateTracker(
      generationSpinner,
      'Generating prompt',
      streamProxy,
    )

    const resumeState = resume
      ? {
          prompt: resume.payload.polishedPrompt ?? resume.payload.prompt,
          iterations: resume.payload.iterations,
        }
      : undefined

    const {
      prompt: generatedPrompt,
      reasoning: generationReasoning,
      iterations,
    } = await runGenerationWorkflow({
      service,
      context: {
        intent,
        refinements,
        model,
        targetModel,
        fileContext,
        images: args.images,
        videos: args.video,
        metaInstructions: trimmedMetaInstructions,
      },
      telemetry,
      interactiveMode,
      interactiveTransport,
      interactiveDelegate: options.interactiveDelegate,
      display: shouldDisplay,
      stream: streamProxy,
      onUploadStateChange: handleUploadStateChange,
      ...(resumeState ? { resume: resumeState } : {}),
    })

    generationSpinner?.stop('Generated prompt ✓')
    emitProgress('Generating prompt', 'stop', 'generate')

    const polishModel =
      args.polishModel ??
      resume?.payload.polishModel ??
      process.env.PROMPT_MAKER_POLISH_MODEL ??
      model
    let polishedPrompt: string | undefined

    if (args.polish) {
      const label = 'Polishing prompt'
      emitProgress(label, 'start', 'polish')
      const polishSpinner = startSpinner(label)
      try {
        polishedPrompt = await polishPrompt(intent, generatedPrompt, polishModel, targetModel)
      } finally {
        polishSpinner?.stop('Polished prompt ✓')
        emitProgress(label, 'stop', 'polish')
      }
    }

    const artifact = polishedPrompt ?? generatedPrompt
    const renderedPrompt = contextTemplateDefinition
      ? renderContextTemplate(contextTemplateDefinition, artifact)
      : undefined
    const finalArtifact = renderedPrompt ?? artifact

    await maybeCopyToClipboard(args.copy, finalArtifact, shouldDisplay)
    await maybeOpenChatGpt(args.openChatGpt, finalArtifact, shouldDisplay)

    const payload: GenerateJsonPayload = {
      schemaVersion: GENERATE_JSON_PAYLOAD_SCHEMA_VERSION,
      intent,
      model,
      targetModel,
      prompt: generatedPrompt,
      ...(typeof generationReasoning === 'string' ? { reasoning: generationReasoning } : {}),
      ...(trimmedMetaInstructions ? { metaInstructions: trimmedMetaInstructions } : {}),
      refinements: [...refinements],
      iterations,
      interactive: interactiveMode !== 'none',
      timestamp: new Date().toISOString(),
      contextPaths,
      ...(outputPath ? { outputPath } : {}),
    }

    if (polishedPrompt) {
      payload.polishedPrompt = polishedPrompt
      payload.polishModel = polishModel
    } else if (resume?.payload.polishedPrompt && resume?.payload.polishModel && !args.polish) {
      payload.polishedPrompt = resume.payload.polishedPrompt
      payload.polishModel = resume.payload.polishModel
    }

    if (contextTemplateName && renderedPrompt) {
      payload.contextTemplate = contextTemplateName
      payload.renderedPrompt = renderedPrompt
    }

    emitEvent({ event: 'generation.final', result: payload })

    const pipelineResult: GeneratePipelineResult = {
      payload,
      telemetry,
      generatedPrompt,
      ...(typeof generationReasoning === 'string' ? { reasoning: generationReasoning } : {}),
      finalPrompt: finalArtifact,
      iterations,
      model,
      contextPaths,
      ...(polishedPrompt ? { polishedPrompt } : {}),
    }

    if (args.json) {
      console.log(JSON.stringify(payload, null, 2))
      await appendToHistory(payload)
      return pipelineResult
    }

    if (renderedPrompt && shouldDisplay && contextTemplateName) {
      displayContextTemplatePrompt(renderedPrompt, contextTemplateName)
    } else if (polishedPrompt && shouldDisplay) {
      displayPolishedPrompt(polishedPrompt, polishModel)
    }

    await appendToHistory(payload)
    return pipelineResult
  } finally {
    transportCleanupHandlers.forEach(({ event, handler }) => {
      process.off(event, handler)
    })
    await interactiveTransport?.stop()
  }
}
