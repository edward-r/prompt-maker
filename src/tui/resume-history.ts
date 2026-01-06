import fs from 'node:fs/promises'

import { GENERATE_JSON_PAYLOAD_SCHEMA_VERSION, type GenerateJsonPayload } from '../generate/types'
import { resolveHistoryFilePath } from '../history-logger'

import type { ResumeHistoryItem } from './types'

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')

const isContextPaths = (value: unknown): value is GenerateJsonPayload['contextPaths'] =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      isRecord(entry) && typeof entry.path === 'string' && typeof entry.source === 'string',
  )

const isSupportedGeneratePayload = (value: unknown): value is GenerateJsonPayload => {
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

const isMissingFileError = (error: unknown): error is { code: string } =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof (error as { code?: unknown }).code === 'string' &&
  (error as { code: string }).code === 'ENOENT'

const formatTimestamp = (raw: string): string => {
  const date = new Date(raw)
  if (!Number.isFinite(date.getTime())) {
    return raw
  }

  return date.toISOString().replace('T', ' ').replace(/\..*$/, '')
}

const summarizeIntent = (intent: string, limit: number): string => {
  const normalized = intent.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return '(empty intent)'
  }
  if (normalized.length <= limit) {
    return normalized
  }
  return `${normalized.slice(0, Math.max(0, limit - 1))}…`
}

export type ResumeHistoryLoadResult =
  | { ok: true; items: ResumeHistoryItem[] }
  | { ok: false; errorMessage: string }

export const loadResumeHistoryItems = async (options?: {
  limit?: number
}): Promise<ResumeHistoryLoadResult> => {
  const filePath = resolveHistoryFilePath()

  let raw: string
  try {
    raw = await fs.readFile(filePath, 'utf8')
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        ok: false,
        errorMessage: `No prompt history found at ${filePath}. Run a generation first to create it.`,
      }
    }

    const message = error instanceof Error ? error.message : 'Unknown file error.'
    return { ok: false, errorMessage: `Failed to read history file ${filePath}: ${message}` }
  }

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    return { ok: false, errorMessage: `History file ${filePath} is empty.` }
  }

  const supported: GenerateJsonPayload[] = []
  const schemaVersions = new Set<string>()

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as unknown
      if (isRecord(parsed) && typeof parsed.schemaVersion === 'string') {
        schemaVersions.add(parsed.schemaVersion)
      }
      if (isSupportedGeneratePayload(parsed)) {
        supported.push(parsed)
      }
    } catch {
      // ignore invalid json lines
    }
  }

  if (supported.length === 0) {
    const versions = Array.from(schemaVersions).sort().join(', ') || '(unknown)'
    return {
      ok: false,
      errorMessage:
        `No resumable history entries found. ` +
        `This version supports schemaVersion=${GENERATE_JSON_PAYLOAD_SCHEMA_VERSION}, but history contains: ${versions}. ` +
        'Upgrade/downgrade prompt-maker-cli to match, or generate a new prompt to create a compatible history entry.',
    }
  }

  const limit = options?.limit ?? 30
  const newestFirst = supported.slice(-limit).reverse()

  const items: ResumeHistoryItem[] = newestFirst.map((payload, index) => {
    const selector = index === 0 ? 'last' : `last:${index + 1}`
    const fileCount = payload.contextPaths.filter((entry) => entry.source === 'file').length

    return {
      selector,
      title: `${formatTimestamp(payload.timestamp)} · ${payload.model}`,
      detail: `files:${fileCount} · iters:${payload.iterations} · ${summarizeIntent(payload.intent, 60)}`,
    }
  })

  return { ok: true, items }
}
