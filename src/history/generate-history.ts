import fs from 'node:fs/promises'

import { validateGeneratePayloadObject } from '../generate/payload-io'
import { GENERATE_JSON_PAYLOAD_SCHEMA_VERSION, type GenerateJsonPayload } from '../generate/types'
import { resolveHistoryFilePath } from '../history-logger'

type JsonRecord = Record<string, unknown>

type GenerateHistoryEntry = {
  raw: JsonRecord
  schemaVersion: string
}

export type FromHistorySelector = {
  fromEnd: number
  label: string
}

export type GenerateHistoryPickerItem = {
  selector: string
  title: string
  detail: string
  schemaVersion: string
  supported: boolean
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

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

const readGenerateHistoryEntries = async (filePath: string): Promise<GenerateHistoryEntry[]> => {
  let raw: string
  try {
    raw = await fs.readFile(filePath, 'utf8')
  } catch (error) {
    if (isMissingFileError(error)) {
      throw new Error(
        `History file not found at ${filePath}. Run a generate command first to create it.`,
      )
    }

    const message = error instanceof Error ? error.message : 'Unknown file error.'
    throw new Error(`Failed to read history file ${filePath}: ${message}`)
  }

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    throw new Error(`History file ${filePath} is empty.`)
  }

  const entries: GenerateHistoryEntry[] = []

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as unknown
      if (!isRecord(parsed) || typeof parsed.schemaVersion !== 'string') {
        continue
      }

      entries.push({ raw: parsed, schemaVersion: parsed.schemaVersion })
    } catch {
      // ignore invalid json lines
    }
  }

  if (entries.length === 0) {
    throw new Error(`No generate payload entries found in history file ${filePath}.`)
  }

  return entries
}

export const parseFromHistorySelector = (raw: string | undefined): FromHistorySelector => {
  const selector = raw?.trim() ?? 'last'

  const parseOffset = (rawOffset: string | undefined): number => {
    if (!rawOffset) {
      throw new Error(
        `Invalid --from-history selector "${selector}". Offset must be a positive integer.`,
      )
    }

    const value = Number(rawOffset)
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(
        `Invalid --from-history selector "${selector}". Offset must be a positive integer.`,
      )
    }

    return value
  }

  if (selector === 'last') {
    return { fromEnd: 1, label: 'last' }
  }

  const lastMatch = selector.match(/^last:(\d+)$/)
  if (lastMatch) {
    return { fromEnd: parseOffset(lastMatch[1]), label: selector }
  }

  const numericMatch = selector.match(/^(\d+)$/)
  if (numericMatch) {
    return { fromEnd: parseOffset(numericMatch[1]), label: selector }
  }

  throw new Error(
    `Invalid --from-history selector "${selector}". Use "last", "last:N", or "N" (N-th from end).`,
  )
}

const selectFromEnd = <T>(entries: readonly T[], fromEnd: number): T => {
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

export const loadGeneratePayloadFromHistory = async (options?: {
  selector?: string | undefined
  historyPath?: string | undefined
}): Promise<GenerateJsonPayload> => {
  const historyPath = options?.historyPath ?? resolveHistoryFilePath()
  const selector = parseFromHistorySelector(options?.selector)

  const entries = await readGenerateHistoryEntries(historyPath)
  const selected = selectFromEnd(entries, selector.fromEnd)

  if (selected.schemaVersion !== GENERATE_JSON_PAYLOAD_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported history payload schemaVersion=${selected.schemaVersion} for selector "${selector.label}". ` +
        `This prompt-maker-cli supports schemaVersion=${GENERATE_JSON_PAYLOAD_SCHEMA_VERSION}; ` +
        'upgrade/downgrade prompt-maker-cli or regenerate the prompt to create a compatible history entry.',
    )
  }

  return validateGeneratePayloadObject(selected.raw, `history selector "${selector.label}"`)
}

export type LoadGenerateHistoryPickerItemsResult =
  | { ok: true; items: GenerateHistoryPickerItem[] }
  | { ok: false; errorMessage: string }

export const loadGenerateHistoryPickerItems = async (options?: {
  limit?: number
  historyPath?: string | undefined
}): Promise<LoadGenerateHistoryPickerItemsResult> => {
  const historyPath = options?.historyPath ?? resolveHistoryFilePath()
  const limit = options?.limit ?? 30

  let entries: GenerateHistoryEntry[]
  try {
    entries = await readGenerateHistoryEntries(historyPath)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown history error.'
    return { ok: false, errorMessage: message }
  }

  const newestFirst = entries.slice(-limit).reverse()

  const items: GenerateHistoryPickerItem[] = newestFirst.map((entry, index) => {
    const selector = index === 0 ? 'last' : `last:${index + 1}`

    const timestamp = typeof entry.raw.timestamp === 'string' ? entry.raw.timestamp : ''
    const model = typeof entry.raw.model === 'string' ? entry.raw.model : 'unknown-model'
    const iterations =
      typeof entry.raw.iterations === 'number' && Number.isFinite(entry.raw.iterations)
        ? entry.raw.iterations
        : null

    const intent = typeof entry.raw.intent === 'string' ? entry.raw.intent : ''

    const supported = entry.schemaVersion === GENERATE_JSON_PAYLOAD_SCHEMA_VERSION

    const contextPaths = Array.isArray(entry.raw.contextPaths) ? entry.raw.contextPaths : []
    const fileCount = contextPaths.filter((candidate) => {
      if (!isRecord(candidate)) {
        return false
      }
      return candidate.source === 'file'
    }).length

    const titleParts = [timestamp ? formatTimestamp(timestamp) : 'unknown-time', model]

    const detailParts = [
      supported ? null : `schema:${entry.schemaVersion} (unsupported)`,
      `files:${fileCount}`,
      iterations === null ? null : `iters:${iterations}`,
      intent ? summarizeIntent(intent, 60) : '(missing intent)',
    ].filter((part): part is string => Boolean(part))

    return {
      selector,
      title: titleParts.join(' · '),
      detail: detailParts.join(' · '),
      schemaVersion: entry.schemaVersion,
      supported,
    }
  })

  return { ok: true, items }
}
