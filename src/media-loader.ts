import fs from 'node:fs/promises'
import path from 'node:path'

import { GoogleAIFileManager } from '@google/generative-ai/server'

const POLL_INTERVAL_MS = 3_000
const PROCESSING_TIMEOUT_MS = 5 * 60_000

const VIDEO_MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.webm': 'video/webm',
  '.avi': 'video/x-msvideo',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg',
  '.gif': 'image/gif',
}

const PDF_MIME_TYPE = 'application/pdf'

type GeminiFile = Awaited<ReturnType<GoogleAIFileManager['getFile']>>

type FileState = 'STATE_UNSPECIFIED' | 'PROCESSING' | 'ACTIVE' | 'FAILED'

export const uploadFileForGeminiWithMimeType = async (
  filePath: string,
  mimeType: string,
  apiKey?: string,
): Promise<string> => {
  await assertReadableFile(filePath)

  const manager = createFileManager(apiKey)

  const uploadResponse = await manager.uploadFile(filePath, {
    mimeType,
    displayName: path.basename(filePath),
  })

  const uploadedFile = uploadResponse.file
  if (!uploadedFile?.name) {
    throw new Error('Gemini Files API did not return a file name.')
  }

  const readyFile = await waitForActiveFile(manager, uploadedFile.name)
  if (!readyFile.uri) {
    throw new Error(`Gemini file ${uploadedFile.name} became active without a URI.`)
  }

  return readyFile.uri
}

export const uploadFileForGemini = async (filePath: string, apiKey?: string): Promise<string> => {
  const mimeType = inferVideoMimeType(filePath)
  return await uploadFileForGeminiWithMimeType(filePath, mimeType, apiKey)
}

const assertReadableFile = async (filePath: string): Promise<void> => {
  try {
    await fs.access(filePath)
  } catch {
    throw new Error(`Media file ${filePath} is not readable.`)
  }
}

export const inferVideoMimeType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase()
  const mimeType = VIDEO_MIME_TYPES[ext]
  if (!mimeType) {
    throw new Error(`Unsupported media type for ${filePath}.`)
  }
  return mimeType
}

export const inferPdfMimeType = (filePath: string): 'application/pdf' => {
  const ext = path.extname(filePath).toLowerCase()
  if (ext !== '.pdf') {
    throw new Error(`Unsupported PDF type for ${filePath}.`)
  }
  return PDF_MIME_TYPE
}

const createFileManager = (apiKey?: string): GoogleAIFileManager => {
  const resolvedApiKey = apiKey?.trim() || process.env.GEMINI_API_KEY?.trim()
  if (!resolvedApiKey) {
    throw new Error(
      'Gemini API key is required to upload media files. Pass apiKey or set GEMINI_API_KEY.',
    )
  }

  return new GoogleAIFileManager(resolvedApiKey)
}

const waitForActiveFile = async (
  manager: GoogleAIFileManager,
  fileName: string,
  timeoutMs = PROCESSING_TIMEOUT_MS,
): Promise<GeminiFile> => {
  const start = Date.now()

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const file = await manager.getFile(fileName)
    const state = normalizeState(file.state)

    if (state === 'ACTIVE') {
      return file
    }

    if (state === 'FAILED') {
      const message = file.error?.message ?? 'The Gemini Files API reported a failure.'
      throw new Error(`Failed to process media file ${fileName}: ${message}`)
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out while waiting for Gemini to process file ${fileName}.`)
    }

    await delay(POLL_INTERVAL_MS)
  }
}

const normalizeState = (state: GeminiFile['state']): FileState => {
  if (!state) {
    return 'STATE_UNSPECIFIED'
  }
  const normalized = state.toUpperCase() as FileState
  if (normalized === 'ACTIVE' || normalized === 'FAILED' || normalized === 'PROCESSING') {
    return normalized
  }
  return 'STATE_UNSPECIFIED'
}

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
