import { stdin as input, stdout as output } from 'node:process'

import chalk from 'chalk'

import { resolveFileContext, type FileContext } from '../file-context'
import { appendToHistory } from '../history-logger'
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
import { displayContextFiles, writeContextFile } from './context-output'
import { displayContextTemplatePrompt, displayPolishedPrompt } from './display'
import { shouldTraceFlags } from './debug'
import { resolveIntent } from './intent'
import { runGenerationWorkflow } from './interactive'
import { InteractiveTransport } from './interactive-transport'
import { resolveGeminiVideoModel, resolveTargetModel } from './models'
import { polishPrompt } from './polish'
import { createUploadStateTracker, startProgress, type ProgressHandle } from './progress'
import { createStreamDispatcher, type StreamDispatcher } from './stream'
import { buildTokenTelemetry } from './token-telemetry'
import type {
  ContextPathMetadata,
  GenerateArgs,
  GenerateJsonPayload,
  GeneratePipelineOptions,
  GeneratePipelineResult,
  InteractiveMode,
  ProgressScope,
  StreamEventInput,
} from './types'

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
    const intent = await resolveIntent(args)

    const contextPaths: ContextPathMetadata[] = []
    const recordContextPaths = (entries: FileContext[], source: ContextPathSource): void => {
      entries.forEach((entry) => {
        contextPaths.push({ path: entry.path, source })
      })
    }

    const intentMetadataPath = args.intentFile
      ? args.intentFile
      : args.intent?.trim()
        ? 'inline-intent'
        : 'stdin-intent'
    contextPaths.push({ path: intentMetadataPath, source: 'intent' })

    let fileContext = await resolveFileContext(args.context)
    recordContextPaths(fileContext, 'file')

    const service = await createPromptGeneratorService()
    const defaultGenerateModel = await resolveDefaultGenerateModel()

    let model = args.model ?? defaultGenerateModel
    const targetModel = await resolveTargetModel({
      defaultTargetModel: defaultGenerateModel,
      ...(args.target !== undefined ? { explicitTarget: args.target } : {}),
    })

    if (args.video.length > 0 && !isGemini(model)) {
      model = await resolveGeminiVideoModel()
      console.warn('Switching to Gemini 3 Pro (Preview) to support video input.')
    }

    const contextTemplateDefinition = contextTemplateName
      ? await resolveContextTemplate(contextTemplateName)
      : null

    const refinements: string[] = []
    const trimmedMetaInstructions = args.metaInstructions?.trim() ?? ''
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

    emitProgress('Resolving context', 'stop', 'generic')

    const telemetry = buildTokenTelemetry(intent, fileContext, trimmedMetaInstructions)
    emitEvent({ event: 'context.telemetry', telemetry })

    emitProgress('Generating prompt', 'start', 'generate')
    const generationSpinner = startSpinner('Generating prompt')
    const handleUploadStateChange = createUploadStateTracker(
      generationSpinner,
      'Generating prompt',
      streamProxy,
    )

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
    })

    generationSpinner?.stop('Generated prompt ✓')
    emitProgress('Generating prompt', 'stop', 'generate')

    const polishModel = args.polishModel ?? process.env.PROMPT_MAKER_POLISH_MODEL ?? model
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
      intent,
      model,
      targetModel,
      prompt: generatedPrompt,
      ...(typeof generationReasoning === 'string' ? { reasoning: generationReasoning } : {}),
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
