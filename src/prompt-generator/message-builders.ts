import type { MessageContent } from '@prompt-maker/core'

import { formatContextForPrompt, type FileContext } from '../file-context'
import { resolveImageParts } from '../image-loader'

import type { UploadStateChange } from './types'
import { resolveVideoParts } from './video-parts'

export const buildInitialUserMessage = async (
  intent: string,
  files: FileContext[],
  imagePaths: string[],
  videoPaths: string[],
  metaInstructions?: string,
  onUploadStateChange?: UploadStateChange,
  apiKey?: string,
): Promise<MessageContent> => {
  const sections: string[] = []

  if (files.length > 0) {
    sections.push('Context Files:\n' + formatContextForPrompt(files))
  }

  sections.push(`User Intent:\n${intent.trim()}`)

  const trimmedInstructions = metaInstructions?.trim()
  if (trimmedInstructions) {
    sections.push(`Meta-Instructions:\n${trimmedInstructions}`)
  }

  sections.push(
    [
      'Return the final structured prompt contract now.',
      'Do NOT perform the task yourself; only craft instructions for another assistant using the required sections.',
    ].join(' '),
  )

  const text = sections.join('\n\n')
  return await mergeMediaWithText(text, imagePaths, videoPaths, onUploadStateChange, apiKey)
}

export const buildRefinementMessage = async (
  previousPrompt: string,
  refinementInstruction: string,
  intent: string,
  files: FileContext[],
  imagePaths: string[],
  videoPaths: string[],
  metaInstructions?: string,
  onUploadStateChange?: UploadStateChange,
  apiKey?: string,
): Promise<MessageContent> => {
  const sections: string[] = []

  if (files.length > 0) {
    sections.push('Context Files:\n' + formatContextForPrompt(files))
  }

  sections.push(`Original Intent (for reference):\n${intent.trim()}`)
  sections.push(`Current Prompt Draft:\n${previousPrompt}`)
  sections.push(`Refinement Instruction:\n${refinementInstruction.trim()}`)

  const trimmedInstructions = metaInstructions?.trim()
  if (trimmedInstructions) {
    sections.push(`Meta-Instructions:\n${trimmedInstructions}`)
  }

  sections.push(
    [
      'Return the fully updated prompt contract.',
      'Maintain the required sections and continue to avoid performing the task yourself.',
    ].join(' '),
  )

  const text = sections.join('\n\n')
  return await mergeMediaWithText(text, imagePaths, videoPaths, onUploadStateChange, apiKey)
}

export const buildSeriesUserMessage = async (
  intent: string,
  files: FileContext[],
  imagePaths: string[],
  videoPaths: string[],
  metaInstructions?: string,
  onUploadStateChange?: UploadStateChange,
  apiKey?: string,
): Promise<MessageContent> => {
  const sections: string[] = []

  if (files.length > 0) {
    sections.push('Context Files:\n' + formatContextForPrompt(files))
  }

  sections.push(`User Intent:\n${intent.trim()}`)

  const trimmedInstructions = metaInstructions?.trim()
  if (trimmedInstructions) {
    sections.push(`Meta-Instructions:\n${trimmedInstructions}`)
  }

  sections.push(
    [
      'Task:',
      'Design a planning artifact consisting of one overview prompt plus a set of atomic prompts.',
      'Each atomic prompt must be self-contained, target a specific verifiable state change, and include a "Validation" section describing how a human can confirm completion.',
      'Do not perform the tasks; only describe them.',
    ].join(' '),
  )
  sections.push(
    [
      'Output Requirements:',
      'Return strict JSON matching the schema { "reasoning": string, "overviewPrompt": string, "atomicPrompts": Array<{ "title": string; "content": string }> }.',
      'Never wrap the JSON in markdown code fences and never add extra keys.',
    ].join(' '),
  )

  const text = sections.join('\n\n')
  return await mergeMediaWithText(text, imagePaths, videoPaths, onUploadStateChange, apiKey)
}

const mergeMediaWithText = async (
  text: string,
  imagePaths: string[],
  videoPaths: string[],
  onUploadStateChange?: UploadStateChange,
  apiKey?: string,
): Promise<MessageContent> => {
  const [imageParts, videoParts] = await Promise.all([
    resolveImageParts(imagePaths, onUploadStateChange),
    resolveVideoParts(videoPaths, onUploadStateChange, apiKey),
  ])

  if (imageParts.length === 0 && videoParts.length === 0) {
    return text
  }

  return [...imageParts, ...videoParts, { type: 'text', text }]
}
