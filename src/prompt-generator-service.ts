import { callLLM, type Message, type MessageContent } from '@prompt-maker/core'

import path from 'node:path'

import {
  GEN_SYSTEM_PROMPT,
  REFINE_SYSTEM_PROMPT,
  SERIES_REPAIR_SYSTEM_PROMPT,
  SERIES_SYSTEM_PROMPT,
} from './prompt-generator/prompts'
import {
  buildInitialUserMessage,
  buildRefinementMessage,
  buildRefinementMessageText,
  buildSeriesUserMessage,
  mergeResolvedMediaWithText,
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

type PdfGroundingAssessment =
  | { ok: true }
  | {
      ok: false
      reason: 'missing-pdf-filename' | 'asked-for-document' | 'missing-document-snapshot'
    }

const normalizeForHeuristic = (value: string): string => value.toLowerCase()

const getPdfBasenames = (pdfPaths: readonly string[]): string[] => {
  return pdfPaths.map((pdfPath) => path.basename(pdfPath)).filter((name) => name.length > 0)
}

const assessPdfGrounding = (
  prompt: string,
  pdfPaths: readonly string[],
): PdfGroundingAssessment => {
  if (pdfPaths.length === 0) {
    return { ok: true }
  }

  const lowered = normalizeForHeuristic(prompt)

  const forbiddenAsks = [
    'paste the',
    'paste the document',
    'paste document',
    'provide the document',
    'provide document',
    'upload the document',
    'upload the pdf',
    'provide as a file',
    'provide as file',
  ]

  if (forbiddenAsks.some((needle) => lowered.includes(needle))) {
    return { ok: false, reason: 'asked-for-document' }
  }

  const basenames = getPdfBasenames(pdfPaths)
  const mentionsAnyBasename = basenames.some((name) =>
    normalizeForHeuristic(prompt).includes(name.toLowerCase()),
  )
  if (!mentionsAnyBasename) {
    return { ok: false, reason: 'missing-pdf-filename' }
  }

  const hasSnapshot = lowered.includes('document snapshot') || lowered.includes('document outline')
  if (!hasSnapshot) {
    return { ok: false, reason: 'missing-document-snapshot' }
  }

  return { ok: true }
}

const buildPdfGroundingRepairInstruction = (pdfPaths: readonly string[]): string => {
  const basenames = getPdfBasenames(pdfPaths)

  return [
    'Make this prompt contract non-generic and explicitly grounded in the attached PDF(s).',
    '',
    'Hard requirements:',
    `- Mention the attached PDF filename(s) verbatim somewhere in the contract: ${
      basenames.join(', ') || '(unknown filename)'
    }.`,
    '- In "Inputs", do NOT ask the user to paste/upload/provide the PDF/path. The PDF is already attached and must be used directly.',
    '- Add a new section (in the contract) titled "Document Snapshot" that proves you read the attached PDF:',
    '  - 5-10 bullet points capturing the document’s specific topics/sections.',
    '  - 3 short verbatim quotes (10-25 words each) from the PDF (wrap each quote in double quotes).',
    '  - If the PDF appears image-only/scanned and you cannot quote text, state that explicitly and request OCR as the only missing input.',
    '',
    'Do not change the overall prompt-contract format requirements; just make it grounded and actionable.',
  ].join('\n')
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
        request.pdfs ?? [],
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
        request.pdfs ?? [],
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

    const attemptRepair = async (
      prompt: string,
      reasoning?: string,
    ): Promise<PromptGenerationResult> => {
      const pdfPaths = request.pdfs ?? []
      const assessment = assessPdfGrounding(prompt, pdfPaths)
      if (assessment.ok) {
        return { prompt, ...(reasoning ? { reasoning } : {}) }
      }

      // Avoid infinite repair loops.
      const MAX_PDF_GROUNDING_REPAIR_ATTEMPTS = 1
      for (let attempt = 0; attempt < MAX_PDF_GROUNDING_REPAIR_ATTEMPTS; attempt += 1) {
        const refinementInstruction = buildPdfGroundingRepairInstruction(pdfPaths)

        request.onPromptAutoRepairAttempt?.({
          kind: 'pdf-grounding',
          reason: assessment.reason,
          attempt: 1,
          maxAttempts: MAX_PDF_GROUNDING_REPAIR_ATTEMPTS,
          pdfs: [...pdfPaths],
        })

        const repairText = buildRefinementMessageText(
          prompt,
          refinementInstruction,
          request.intent,
          request.fileContext,
          pdfPaths,
          request.metaInstructions,
        )

        const repairUserContent = mergeResolvedMediaWithText(userContent, repairText)

        const repairMessages: Message[] = [
          { role: 'system', content: REFINE_SYSTEM_PROMPT },
          ...(targetGuidance ? [{ role: 'system' as const, content: targetGuidance }] : []),
          { role: 'user', content: repairUserContent },
        ]

        const repairedRaw = await callLLM(repairMessages, request.model)

        try {
          const repaired = parseLLMJson<CoTResponse>(repairedRaw)
          const repairedPrompt = sanitizePromptForTargetModelLeakage({
            prompt: repaired.prompt,
            intent: request.intent,
            targetModel: request.targetModel,
          })

          const repairedAssessment = assessPdfGrounding(repairedPrompt, pdfPaths)
          if (repairedAssessment.ok) {
            return {
              prompt: repairedPrompt,
              ...(repaired.reasoning ? { reasoning: repaired.reasoning } : {}),
            }
          }

          // If still failing, return the repaired prompt anyway (better than original).
          return {
            prompt: repairedPrompt,
            ...(repaired.reasoning ? { reasoning: repaired.reasoning } : {}),
          }
        } catch {
          // If JSON parse fails, fall back to raw repaired text.
          const repairedPrompt = sanitizePromptForTargetModelLeakage({
            prompt: repairedRaw,
            intent: request.intent,
            targetModel: request.targetModel,
          })
          return { prompt: repairedPrompt }
        }
      }

      return { prompt, ...(reasoning ? { reasoning } : {}) }
    }

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

      return await attemptRepair(sanitizedPrompt, result.reasoning)
    } catch {
      const sanitizedPrompt = sanitizePromptForTargetModelLeakage({
        prompt: rawResponse,
        intent: request.intent,
        targetModel: request.targetModel,
      })
      return await attemptRepair(sanitizedPrompt)
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
      request.pdfs ?? [],
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
