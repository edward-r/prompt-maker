import type { FileContext } from '../file-context'

export type UploadState = 'start' | 'finish'
export type UploadDetail = { kind: 'image' | 'video' | 'pdf'; filePath: string }
export type UploadStateChange = (state: UploadState, detail: UploadDetail) => void

export type SeriesRepairAttemptDetail = {
  attempt: number
  maxAttempts: number
  validationError: string
}

export type PromptAutoRepairKind = 'pdf-grounding'

export type PromptAutoRepairAttemptDetail = {
  kind: PromptAutoRepairKind
  reason: 'missing-pdf-filename' | 'asked-for-document' | 'missing-document-snapshot'
  attempt: number
  maxAttempts: number
  pdfs: string[]
}

export type PromptGenerationRequest = {
  intent: string
  model: string
  targetModel: string
  fileContext: FileContext[]
  images: string[]
  videos: string[]
  pdfs?: string[]
  metaInstructions?: string
  previousPrompt?: string
  refinementInstruction?: string
  onUploadStateChange?: UploadStateChange
  onSeriesRepairAttempt?: (detail: SeriesRepairAttemptDetail) => void
  onPromptAutoRepairAttempt?: (detail: PromptAutoRepairAttemptDetail) => void
}

export type SeriesResponse = {
  reasoning: string
  overviewPrompt: string
  atomicPrompts: Array<{ title: string; content: string }>
}

export type PromptGenerationResult = {
  prompt: string
  reasoning?: string
}
