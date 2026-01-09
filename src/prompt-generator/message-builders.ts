import type { MessageContent, TextPart } from '@prompt-maker/core'

import { formatContextForPrompt, type FileContext } from '../file-context'
import { resolveImageParts } from '../image-loader'

import { resolvePdfParts } from './pdf-parts'
import type { UploadStateChange } from './types'
import { resolveVideoParts } from './video-parts'

const buildPdfAttachmentSection = (pdfPaths: string[]): string | null => {
  if (pdfPaths.length === 0) {
    return null
  }

  return [
    'PDF Attachments (already provided as context):',
    pdfPaths.join('\n'),
    '',
    'Non-negotiable requirements for the prompt contract you will generate:',
    '- Treat the attached PDF as the source document and as already-available input.',
    '- In the contract "Inputs" section, do NOT ask the user to paste the document or provide a file/path.',
    '- Proceed assuming the executing assistant has the PDF attached.',
    '- Only request OCR / extracted text if you cannot access readable text from the PDF and you explicitly say so.',
  ].join('\n')
}

export const buildInitialUserMessageText = (
  intent: string,
  files: FileContext[],
  pdfPaths: string[],
  metaInstructions?: string,
): string => {
  const sections: string[] = []

  if (files.length > 0) {
    sections.push('Context Files:\n' + formatContextForPrompt(files))
  }

  const pdfSection = buildPdfAttachmentSection(pdfPaths)
  if (pdfSection) {
    sections.push(pdfSection)
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

  return sections.join('\n\n')
}

export const buildInitialUserMessage = async (
  intent: string,
  files: FileContext[],
  imagePaths: string[],
  videoPaths: string[],
  pdfPaths: string[],
  metaInstructions?: string,
  onUploadStateChange?: UploadStateChange,
  apiKey?: string,
): Promise<MessageContent> => {
  const text = buildInitialUserMessageText(intent, files, pdfPaths, metaInstructions)
  return await mergeMediaWithText(
    text,
    imagePaths,
    videoPaths,
    pdfPaths,
    onUploadStateChange,
    apiKey,
  )
}

export const buildRefinementMessageText = (
  previousPrompt: string,
  refinementInstruction: string,
  intent: string,
  files: FileContext[],
  pdfPaths: string[],
  metaInstructions?: string,
): string => {
  const sections: string[] = []

  if (files.length > 0) {
    sections.push('Context Files:\n' + formatContextForPrompt(files))
  }

  const pdfSection = buildPdfAttachmentSection(pdfPaths)
  if (pdfSection) {
    sections.push(pdfSection)
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

  return sections.join('\n\n')
}

export const buildRefinementMessage = async (
  previousPrompt: string,
  refinementInstruction: string,
  intent: string,
  files: FileContext[],
  imagePaths: string[],
  videoPaths: string[],
  pdfPaths: string[],
  metaInstructions?: string,
  onUploadStateChange?: UploadStateChange,
  apiKey?: string,
): Promise<MessageContent> => {
  const text = buildRefinementMessageText(
    previousPrompt,
    refinementInstruction,
    intent,
    files,
    pdfPaths,
    metaInstructions,
  )

  return await mergeMediaWithText(
    text,
    imagePaths,
    videoPaths,
    pdfPaths,
    onUploadStateChange,
    apiKey,
  )
}

export const buildSeriesUserMessageText = (
  intent: string,
  files: FileContext[],
  pdfPaths: string[],
  metaInstructions?: string,
): string => {
  const sections: string[] = []

  if (files.length > 0) {
    sections.push('Context Files:\n' + formatContextForPrompt(files))
  }

  const pdfSection = buildPdfAttachmentSection(pdfPaths)
  if (pdfSection) {
    sections.push(pdfSection)
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

  return sections.join('\n\n')
}

export const buildSeriesUserMessage = async (
  intent: string,
  files: FileContext[],
  imagePaths: string[],
  videoPaths: string[],
  pdfPaths: string[],
  metaInstructions?: string,
  onUploadStateChange?: UploadStateChange,
  apiKey?: string,
): Promise<MessageContent> => {
  const text = buildSeriesUserMessageText(intent, files, pdfPaths, metaInstructions)
  return await mergeMediaWithText(
    text,
    imagePaths,
    videoPaths,
    pdfPaths,
    onUploadStateChange,
    apiKey,
  )
}

const isTextPart = (part: Exclude<MessageContent, string>[number]): part is TextPart => {
  return part.type === 'text'
}

export const mergeResolvedMediaWithText = (
  content: MessageContent,
  text: string,
): MessageContent => {
  if (typeof content === 'string') {
    return text
  }

  const mediaParts = content.filter((part) => !isTextPart(part))
  if (mediaParts.length === 0) {
    return text
  }

  return [...mediaParts, { type: 'text', text }]
}

const mergeMediaWithText = async (
  text: string,
  imagePaths: string[],
  videoPaths: string[],
  pdfPaths: string[],
  onUploadStateChange?: UploadStateChange,
  apiKey?: string,
): Promise<MessageContent> => {
  const [imageParts, videoParts, pdfParts] = await Promise.all([
    resolveImageParts(imagePaths, onUploadStateChange),
    resolveVideoParts(videoPaths, onUploadStateChange, apiKey),
    resolvePdfParts(pdfPaths, onUploadStateChange, apiKey),
  ])

  if (imageParts.length === 0 && videoParts.length === 0 && pdfParts.length === 0) {
    return text
  }

  // Deterministic ordering: images → videos → PDFs → text.
  return [...imageParts, ...videoParts, ...pdfParts, { type: 'text', text }]
}
