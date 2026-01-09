import chalk from 'chalk'
import enquirer from 'enquirer'

import type {
  createPromptGeneratorService,
  PromptGenerationRequest,
  UploadStateChange,
} from '../prompt-generator-service'
import { countTokens } from '../token-counter'

import { displayPrompt } from './display'
import type { StreamDispatcher } from './stream'
import { displayTokenSummary } from './token-telemetry'
import type { InteractiveDelegate, InteractiveMode, LoopContext, TokenTelemetry } from './types'
import type { InteractiveTransport } from './interactive-transport'

const { prompt } = enquirer as typeof import('enquirer')

type PromptGenerator = Awaited<ReturnType<typeof createPromptGeneratorService>>

type GenerateAndMaybeDisplayContext = LoopContext & {
  iteration: number
  previousPrompt?: string
  latestRefinement?: string
}

export const runGenerationWorkflow = async ({
  service,
  context,
  telemetry,
  interactiveMode,
  interactiveTransport,
  interactiveDelegate,
  display,
  stream,
  onUploadStateChange,
  resume,
}: {
  service: PromptGenerator
  context: LoopContext
  telemetry: TokenTelemetry
  interactiveMode: InteractiveMode
  interactiveTransport?: InteractiveTransport | null
  interactiveDelegate?: InteractiveDelegate | undefined
  display: boolean
  stream: StreamDispatcher
  onUploadStateChange?: UploadStateChange
  resume?: { prompt: string; iterations: number } | undefined
}): Promise<{ prompt: string; reasoning?: string; iterations: number }> => {
  let iteration = 0
  let currentPrompt = ''
  let currentReasoning: string | undefined

  if (display) {
    displayTokenSummary(telemetry)
  }

  const inputTokens = telemetry.totalTokens

  if (resume) {
    currentPrompt = resume.prompt
    iteration = Math.max(0, resume.iterations)

    if (display) {
      const displayedIteration = iteration > 0 ? iteration : 1
      displayPrompt(currentPrompt, displayedIteration, countTokens(currentPrompt))
    }
  } else {
    iteration += 1
    const initialGeneration = await generateAndMaybeDisplay(
      service,
      { ...context, iteration },
      display,
      stream,
      inputTokens,
      interactiveMode !== 'none',
      onUploadStateChange,
    )
    currentPrompt = initialGeneration.prompt
    currentReasoning = initialGeneration.reasoning
  }

  if (interactiveMode !== 'none') {
    stream.emit({ event: 'interactive.state', phase: 'start', iteration })
    stream.emit({ event: 'interactive.state', phase: 'prompt', iteration })

    if (interactiveMode === 'transport' && interactiveTransport) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        stream.emit({ event: 'interactive.awaiting', mode: interactiveMode })
        const command = await interactiveTransport.nextCommand()
        if (!command || command.type === 'finish') {
          break
        }
        const instruction = command.instruction.trim()
        if (!instruction) {
          continue
        }
        stream.emit({ event: 'interactive.state', phase: 'refine', iteration })
        context.refinements.push(instruction)
        iteration += 1
        const refinementGeneration = await generateAndMaybeDisplay(
          service,
          {
            ...context,
            iteration,
            previousPrompt: currentPrompt,
            latestRefinement: instruction,
          },
          display,
          stream,
          inputTokens,
          true,
          onUploadStateChange,
        )
        currentPrompt = refinementGeneration.prompt
        currentReasoning = refinementGeneration.reasoning

        stream.emit({ event: 'interactive.state', phase: 'prompt', iteration })
      }
    } else if (interactiveDelegate) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        stream.emit({ event: 'interactive.awaiting', mode: interactiveMode })
        const action = await interactiveDelegate.getNextAction({ iteration, currentPrompt })
        if (!action || action.type === 'finish') {
          break
        }
        const refinement = action.instruction.trim()
        if (!refinement) {
          continue
        }
        stream.emit({ event: 'interactive.state', phase: 'refine', iteration })
        context.refinements.push(refinement)
        iteration += 1
        const refinementGeneration = await generateAndMaybeDisplay(
          service,
          {
            ...context,
            iteration,
            previousPrompt: currentPrompt,
            latestRefinement: refinement,
          },
          display,
          stream,
          inputTokens,
          true,
          onUploadStateChange,
        )
        currentPrompt = refinementGeneration.prompt
        currentReasoning = refinementGeneration.reasoning

        stream.emit({ event: 'interactive.state', phase: 'prompt', iteration })
      }
    } else {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        stream.emit({ event: 'interactive.awaiting', mode: interactiveMode })
        const wantsRefine = await askShouldRefine()
        if (!wantsRefine) {
          break
        }

        stream.emit({ event: 'interactive.state', phase: 'refine', iteration })
        const refinement = await collectRefinementInstruction()
        if (!refinement) {
          console.log(chalk.dim('No refinement provided. Ending interactive session.'))
          break
        }

        context.refinements.push(refinement)
        iteration += 1
        const refinementGeneration = await generateAndMaybeDisplay(
          service,
          {
            ...context,
            iteration,
            previousPrompt: currentPrompt,
            latestRefinement: refinement,
          },
          display,
          stream,
          inputTokens,
          true,
          onUploadStateChange,
        )
        currentPrompt = refinementGeneration.prompt
        currentReasoning = refinementGeneration.reasoning

        stream.emit({ event: 'interactive.state', phase: 'prompt', iteration })
      }
    }

    stream.emit({ event: 'interactive.state', phase: 'complete', iteration })
  }

  return {
    prompt: currentPrompt,
    ...(typeof currentReasoning === 'string' ? { reasoning: currentReasoning } : {}),
    iterations: iteration,
  }
}

const generateAndMaybeDisplay = async (
  service: PromptGenerator,
  context: GenerateAndMaybeDisplayContext,
  display: boolean,
  stream: StreamDispatcher,
  inputTokens: number,
  interactive: boolean,
  onUploadStateChange?: UploadStateChange,
): Promise<{ prompt: string; reasoning?: string }> => {
  const request: PromptGenerationRequest = {
    intent: context.intent,
    model: context.model,
    targetModel: context.targetModel,
    fileContext: context.fileContext,
    images: context.images,
    videos: context.videos,
    pdfs: context.pdfs,
    onPromptAutoRepairAttempt: (detail) => {
      stream.emit({
        event: 'progress.update',
        scope: 'generate',
        state: 'update',
        label: `Auto-repair (${detail.kind}) ${detail.reason} (${detail.attempt}/${detail.maxAttempts})`,
      })
    },
  }

  if (context.metaInstructions) {
    request.metaInstructions = context.metaInstructions
  }

  if (onUploadStateChange) {
    request.onUploadStateChange = onUploadStateChange
  }

  if (context.previousPrompt && context.latestRefinement) {
    request.previousPrompt = context.previousPrompt
    request.refinementInstruction = context.latestRefinement
  }

  stream.emit({
    event: 'generation.iteration.start',
    iteration: context.iteration,
    intent: context.intent,
    model: context.model,
    interactive,
    inputTokens,
    refinements: [...context.refinements],
    ...(context.latestRefinement ? { latestRefinement: context.latestRefinement } : {}),
  })

  const generator = service as unknown as {
    generatePrompt: (request: PromptGenerationRequest) => Promise<string>
    generatePromptDetailed?: (request: PromptGenerationRequest) => Promise<{
      prompt: string
      reasoning?: string
    }>
  }

  const detailed =
    typeof generator.generatePromptDetailed === 'function'
      ? await generator.generatePromptDetailed(request)
      : { prompt: await generator.generatePrompt(request) }

  const outputTokens = countTokens(detailed.prompt)
  const reasoningTokens = detailed.reasoning ? countTokens(detailed.reasoning) : 0

  stream.emit({
    event: 'generation.iteration.complete',
    iteration: context.iteration,
    prompt: detailed.prompt,
    tokens: outputTokens,
    ...(reasoningTokens > 0 ? { reasoningTokens } : {}),
  })

  if (display) {
    displayPrompt(detailed.prompt, context.iteration, outputTokens)
  }

  return {
    prompt: detailed.prompt,
    ...(typeof detailed.reasoning === 'string' ? { reasoning: detailed.reasoning } : {}),
  }
}

const askShouldRefine = async (): Promise<boolean> => {
  try {
    const response = await prompt<{ refine: boolean }>({
      type: 'confirm',
      name: 'refine',
      message: chalk.cyan('Refine the generated prompt?'),
      initial: false,
    })

    return Boolean(response.refine)
  } catch (error) {
    if (isPromptCancellation(error)) {
      console.log(chalk.dim('\nInteractive session cancelled.'))
      return false
    }
    throw error
  }
}

const collectRefinementInstruction = async (): Promise<string | null> => {
  try {
    const response = await prompt<{ refinement: string }>({
      type: 'input',
      name: 'refinement',
      message: chalk.cyan('Describe the refinement (blank to finish):'),
      multiline: true,
    })

    const refinement = response.refinement?.trim()
    return refinement || null
  } catch (error) {
    if (isPromptCancellation(error)) {
      console.log(chalk.dim('\nRefinement input cancelled.'))
      return null
    }
    throw error
  }
}

const isPromptCancellation = (error: unknown): boolean => {
  if (typeof error === 'string') {
    return true
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes('cancel') || message.includes('abort')
  }

  return false
}
