import fs from 'node:fs/promises'
import path from 'node:path'

import yaml from 'js-yaml'

import { GENERATE_JSON_PAYLOAD_SCHEMA_VERSION, type GenerateJsonPayload } from './types'

type PayloadFormat = 'json' | 'yaml'

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

const isGenerateJsonPayload = (value: unknown): value is GenerateJsonPayload => {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.schemaVersion === GENERATE_JSON_PAYLOAD_SCHEMA_VERSION &&
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

const getPayloadFormatForPath = (filePath: string): PayloadFormat => {
  const ext = path.extname(filePath).toLowerCase()

  if (ext === '.json') {
    return 'json'
  }

  if (ext === '.yaml' || ext === '.yml') {
    return 'yaml'
  }

  throw new Error(
    `Unsupported payload file extension for ${formatDisplayPath(filePath)}. Expected .json, .yaml, or .yml.`,
  )
}

const isMissingFileError = (error: unknown): error is { code: string } =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === 'ENOENT'

const formatDisplayPath = (filePath: string): string => {
  const relative = path.relative(process.cwd(), filePath)
  return relative && !relative.startsWith('..') ? relative : filePath
}

const parseGeneratePayload = (raw: string, format: PayloadFormat, filePath: string): unknown => {
  if (format === 'json') {
    try {
      return JSON.parse(raw) as unknown
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown JSON error.'
      throw new Error(`Failed to parse JSON in ${formatDisplayPath(filePath)}: ${message}`)
    }
  }

  try {
    return yaml.load(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown YAML error.'
    throw new Error(`Failed to parse YAML in ${formatDisplayPath(filePath)}: ${message}`)
  }
}

const validateGeneratePayload = (value: unknown, filePath: string): GenerateJsonPayload => {
  if (!isGenerateJsonPayload(value)) {
    throw new Error(
      `Invalid generate payload in ${formatDisplayPath(filePath)}. Expected schemaVersion=${GENERATE_JSON_PAYLOAD_SCHEMA_VERSION} and required fields (intent, model, targetModel, prompt, refinements, iterations, interactive, timestamp, contextPaths).`,
    )
  }

  return value
}

export const loadGeneratePayloadFromFile = async (
  filePath: string,
): Promise<GenerateJsonPayload> => {
  let raw: string
  try {
    raw = await fs.readFile(filePath, 'utf8')
  } catch (error) {
    if (isMissingFileError(error)) {
      throw new Error(`Payload file not found: ${formatDisplayPath(filePath)}`)
    }

    const message = error instanceof Error ? error.message : 'Unknown file read error.'
    throw new Error(`Failed to read payload file ${formatDisplayPath(filePath)}: ${message}`)
  }

  const format = getPayloadFormatForPath(filePath)
  const parsed = parseGeneratePayload(raw, format, filePath)
  return validateGeneratePayload(parsed, filePath)
}

export const serializeGeneratePayload = (
  payload: GenerateJsonPayload,
  format: PayloadFormat,
): string => {
  if (format === 'json') {
    return `${JSON.stringify(payload, null, 2)}\n`
  }

  const dumped = yaml.dump(payload, {
    sortKeys: true,
    noRefs: true,
  })

  return dumped.endsWith('\n') ? dumped : `${dumped}\n`
}
