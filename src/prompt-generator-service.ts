import { callLLM, type Message, type MessageContent } from '@prompt-maker/core'

import {
  GEN_SYSTEM_PROMPT,
  REFINE_SYSTEM_PROMPT,
  SERIES_REPAIR_SYSTEM_PROMPT,
  SERIES_SYSTEM_PROMPT,
} from './prompt-generator/prompts'
import {
  buildInitialUserMessage,
  buildRefinementMessage,
  buildSeriesUserMessage,
} from './prompt-generator/message-builders'
import { ensureModelCredentials, isGemini } from './prompt-generator/model-credentials'
import { parseLLMJson } from './prompt-generator/parse-llm-json'
import {
  buildSeriesRepairUserMessage,
  isRepairableSeriesValidationError,
} from './prompt-generator/series-repair'
import { validateSeriesResponse } from './prompt-generator/series-validation'
import {
  buildTargetRuntimeModelGuidance,
  sanitizePromptForTargetModelLeakage,
} from './prompt-generator/target-model-guidance'
import type {
  PromptGenerationRequest,
  PromptGenerationResult,
  SeriesResponse,
} from './prompt-generator/types'

export {
  GEN_SYSTEM_PROMPT,
  REFINE_SYSTEM_PROMPT,
  SERIES_SYSTEM_PROMPT,
  SERIES_REPAIR_SYSTEM_PROMPT,
}

export { sanitizePromptForTargetModelLeakage }

export {
  ensureModelCredentials,
  isGemini,
  resolveDefaultGenerateModel,
} from './prompt-generator/model-credentials'

export type {
  PromptGenerationRequest,
  PromptGenerationResult,
  SeriesRepairAttemptDetail,
  SeriesResponse,
  UploadDetail,
  UploadState,
  UploadStateChange,
} from './prompt-generator/types'

type CoTResponse = {
  reasoning: string
  prompt: string
}

export class PromptGeneratorService {
  async generatePromptDetailed(request: PromptGenerationRequest): Promise<PromptGenerationResult> {
    await ensureModelCredentials(request.model)

    const isRefinement = Boolean(request.previousPrompt && request.refinementInstruction)
    const systemContent = isRefinement ? REFINE_SYSTEM_PROMPT : GEN_SYSTEM_PROMPT

    const geminiApiKey = isGemini(request.model) ? process.env.GEMINI_API_KEY?.trim() : undefined

    let userContent: MessageContent
    if (isRefinement) {
      const previousPrompt = request.previousPrompt
      const refinementInstruction = request.refinementInstruction
      if (!previousPrompt || !refinementInstruction) {
        throw new Error('Refinement requests require previousPrompt and refinementInstruction.')
      }

      userContent = await buildRefinementMessage(
        previousPrompt,
        refinementInstruction,
        request.intent,
        request.fileContext,
        request.images,
        request.videos,
        request.metaInstructions,
        request.onUploadStateChange,
        geminiApiKey,
      )
    } else {
      userContent = await buildInitialUserMessage(
        request.intent,
        request.fileContext,
        request.images,
        request.videos,
        request.metaInstructions,
        request.onUploadStateChange,
        geminiApiKey,
      )
    }

    const targetGuidance = buildTargetRuntimeModelGuidance(request.targetModel)

    const messages: Message[] = [
      { role: 'system', content: systemContent },
      ...(targetGuidance ? [{ role: 'system' as const, content: targetGuidance }] : []),
      { role: 'user', content: userContent },
    ]

    const rawResponse = await callLLM(messages, request.model)

    try {
      const result = parseLLMJson<CoTResponse>(rawResponse)

      if (process.env.DEBUG || process.env.VERBOSE) {
        console.error('\n--- AI Reasoning ---')
        console.error(result.reasoning)
        console.error('--------------------\n')
      }

      const sanitizedPrompt = sanitizePromptForTargetModelLeakage({
        prompt: result.prompt,
        intent: request.intent,
        targetModel: request.targetModel,
      })

      return {
        prompt: sanitizedPrompt,
        ...(result.reasoning ? { reasoning: result.reasoning } : {}),
      }
    } catch {
      return {
        prompt: sanitizePromptForTargetModelLeakage({
          prompt: rawResponse,
          intent: request.intent,
          targetModel: request.targetModel,
        }),
      }
    }
  }

  async generatePrompt(request: PromptGenerationRequest): Promise<string> {
    const result = await this.generatePromptDetailed(request)
    return result.prompt
  }

  async generatePromptSeries(request: PromptGenerationRequest): Promise<SeriesResponse> {
    await ensureModelCredentials(request.model)

    const geminiApiKey = isGemini(request.model) ? process.env.GEMINI_API_KEY?.trim() : undefined

    const userContent = await buildSeriesUserMessage(
      request.intent,
      request.fileContext,
      request.images,
      request.videos,
      request.metaInstructions,
      request.onUploadStateChange,
      geminiApiKey,
    )

    const targetGuidance = buildTargetRuntimeModelGuidance(request.targetModel)

    const messages: Message[] = [
      { role: 'system', content: SERIES_SYSTEM_PROMPT },
      ...(targetGuidance ? [{ role: 'system' as const, content: targetGuidance }] : []),
      { role: 'user', content: userContent },
    ]

    const MAX_SERIES_REPAIR_ATTEMPTS = 2

    let rawResponse = await callLLM(messages, request.model)

    let series: SeriesResponse
    try {
      series = parseLLMJson<SeriesResponse>(rawResponse)
    } catch {
      throw new Error('LLM did not return valid SeriesResponse JSON.')
    }

    for (let attempt = 0; attempt <= MAX_SERIES_REPAIR_ATTEMPTS; attempt++) {
      try {
        validateSeriesResponse(series)
        break
      } catch (error) {
        if (attempt === MAX_SERIES_REPAIR_ATTEMPTS || !isRepairableSeriesValidationError(error)) {
          throw error
        }

        const validationError = error instanceof Error ? error.message : String(error)

        request.onSeriesRepairAttempt?.({
          attempt: attempt + 1,
          maxAttempts: MAX_SERIES_REPAIR_ATTEMPTS,
          validationError,
        })

        const repairUserContent = buildSeriesRepairUserMessage({
          intent: request.intent,
          validationError,
          previousSeries: series,
        })

        const repairMessages: Message[] = [
          { role: 'system', content: SERIES_REPAIR_SYSTEM_PROMPT },
          ...(targetGuidance ? [{ role: 'system' as const, content: targetGuidance }] : []),
          { role: 'user', content: repairUserContent },
        ]

        rawResponse = await callLLM(repairMessages, request.model)

        try {
          series = parseLLMJson<SeriesResponse>(rawResponse)
        } catch {
          throw new Error('LLM did not return valid SeriesResponse JSON.')
        }
      }
    }

    const sanitizedOverviewPrompt = sanitizePromptForTargetModelLeakage({
      prompt: series.overviewPrompt,
      intent: request.intent,
      targetModel: request.targetModel,
    })

    const sanitizedAtomicPrompts = series.atomicPrompts.map((step) => ({
      ...step,
      content: sanitizePromptForTargetModelLeakage({
        prompt: step.content,
        intent: request.intent,
        targetModel: request.targetModel,
      }),
    }))

    if (process.env.DEBUG || process.env.VERBOSE) {
      console.error('\n--- Series Reasoning ---')
      console.error(series.reasoning)
      console.error('------------------------\n')
    }

    return {
      ...series,
      overviewPrompt: sanitizedOverviewPrompt,
      atomicPrompts: sanitizedAtomicPrompts,
    }
  }
}

export const createPromptGeneratorService = async (): Promise<PromptGeneratorService> => {
  return new PromptGeneratorService()
}

export const generatePromptSeries = async (
  request: PromptGenerationRequest,
): Promise<SeriesResponse> => {
  const service = await createPromptGeneratorService()
  return await service.generatePromptSeries(request)
}
