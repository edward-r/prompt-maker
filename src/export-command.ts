import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import yaml from 'js-yaml'
import yargs from 'yargs'
import type { ArgumentsCamelCase } from 'yargs'

import { GENERATE_JSON_PAYLOAD_SCHEMA_VERSION, type GenerateJsonPayload } from './generate/types'

type ExportFormat = 'json' | 'yaml'

type ExportArgs = {
  fromHistory: string
  format: ExportFormat
  out: string
  quiet: boolean
  help: boolean
}

export const runExportCommand = async (argv: string[]): Promise<void> => {
  try {
    const { args, showHelp } = parseExportArgs(argv)

    if (args.help) {
      showHelp()
      return
    }

    await exportHistoryEntry(args)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown export error.'
    console.error(message)
    process.exitCode = 1
  }
}

const HELP_FLAGS = new Set(['--help', '-h'])

const parseExportArgs = (argv: string[]): { args: ExportArgs; showHelp: () => void } => {
  const { optionArgs, helpRequested } = stripHelpFlags(argv)

  const parser = yargs(optionArgs)
    .scriptName('prompt-maker-cli export')
    .usage(
      'Usage:\n  prompt-maker-cli export [--from-history <selector>] --format json|yaml --out <path>',
    )
    .option('from-history', {
      type: 'string',
      default: 'last',
      describe: 'History selector (last, last:N, or N-th from end)',
    })
    .option('format', {
      alias: 'f',
      type: 'string',
      choices: ['json', 'yaml'] as const,
      describe: 'Output format',
    })
    .option('out', {
      alias: 'o',
      type: 'string',
      describe: 'Output file path',
    })
    .option('quiet', {
      type: 'boolean',
      default: false,
      describe: 'Suppress human-readable stderr logs',
    })
    .check((argv) => {
      if (helpRequested) {
        return true
      }

      const format = argv.format
      if (format !== 'json' && format !== 'yaml') {
        throw new Error('--format is required (json|yaml).')
      }

      const outPath = argv.out
      if (typeof outPath !== 'string' || outPath.trim().length === 0) {
        throw new Error('--out is required.')
      }

      return true
    })
    .help('help')
    .alias('help', 'h')
    .exitProcess(false)
    .showHelpOnFail(false)
    .parserConfiguration({ 'halt-at-non-option': true })
    .strict(false)
    .fail((msg, err) => {
      throw err ?? new Error(msg ?? 'Invalid CLI arguments.')
    })

  const parsed = parser.parseSync() as ArgumentsCamelCase<{
    fromHistory?: unknown
    format?: ExportFormat
    out?: string
    quiet: boolean
    help?: boolean
  }>

  const fromHistoryValue = parsed.fromHistory
  const fromHistory =
    typeof fromHistoryValue === 'string'
      ? fromHistoryValue.trim() || 'last'
      : typeof fromHistoryValue === 'number'
        ? String(fromHistoryValue)
        : 'last'

  const help = helpRequested || Boolean(parsed.help)

  const format = parsed.format ?? 'json'
  const out = parsed.out?.trim() ?? ''

  if (!help && !out) {
    throw new Error('--out is required.')
  }

  return {
    args: {
      fromHistory,
      format,
      out,
      quiet: parsed.quiet ?? false,
      help,
    },
    showHelp: () => parser.showHelp(),
  }
}

export const resolveHistoryFilePath = (): string => {
  const envHome = process.env.HOME?.trim()
  const homeDir = envHome && envHome.length > 0 ? envHome : os.homedir()
  return path.join(homeDir, '.config', 'prompt-maker-cli', 'history.jsonl')
}

export const parseFromHistorySelector = (
  raw: string | undefined,
): { fromEnd: number; label: string } => {
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

const exportHistoryEntry = async (args: ExportArgs): Promise<void> => {
  const historyPath = resolveHistoryFilePath()
  const entries = await readGeneratePayloadHistory(historyPath)

  const selector = parseFromHistorySelector(args.fromHistory)
  const payload = selectFromEnd(entries, selector.fromEnd)

  const outPath = path.resolve(process.cwd(), args.out)
  await fs.mkdir(path.dirname(outPath), { recursive: true })

  const serialized = serializePayload(payload, args.format)
  await fs.writeFile(outPath, serialized, 'utf8')

  if (!args.quiet) {
    console.error(`Wrote ${args.format.toUpperCase()} export to ${formatDisplayPath(outPath)}.`)
  }
}

const readGeneratePayloadHistory = async (filePath: string): Promise<GenerateJsonPayload[]> => {
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

  if (raw.trim().length === 0) {
    throw new Error(`History file ${filePath} is empty.`)
  }

  const entries: GenerateJsonPayload[] = []

  raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line) => {
      try {
        const parsed = JSON.parse(line) as unknown
        if (isGenerateJsonPayload(parsed)) {
          entries.push(parsed)
        }
      } catch {
        // ignore invalid JSON lines
      }
    })

  if (entries.length === 0) {
    throw new Error(`No valid generate payloads found in history file ${filePath}.`)
  }

  return entries
}

const isMissingFileError = (error: unknown): error is { code: string } =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === 'ENOENT'

const selectFromEnd = <T>(entries: T[], fromEnd: number): T => {
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

const serializePayload = (payload: GenerateJsonPayload, format: ExportFormat): string => {
  if (format === 'json') {
    return `${JSON.stringify(payload, null, 2)}\n`
  }

  const dumped = yaml.dump(payload, {
    sortKeys: true,
    noRefs: true,
  })

  return dumped.endsWith('\n') ? dumped : `${dumped}\n`
}

const formatDisplayPath = (absolutePath: string): string => {
  const relative = path.relative(process.cwd(), absolutePath)
  return relative && !relative.startsWith('..') ? relative : absolutePath
}

const stripHelpFlags = (tokens: string[]): { optionArgs: string[]; helpRequested: boolean } => {
  const optionArgs: string[] = []
  let helpRequested = false
  let passthrough = false

  tokens.forEach((token) => {
    if (passthrough) {
      optionArgs.push(token)
      return
    }

    if (token === '--') {
      optionArgs.push(token)
      passthrough = true
      return
    }

    if (HELP_FLAGS.has(token)) {
      helpRequested = true
      return
    }

    optionArgs.push(token)
  })

  return { optionArgs, helpRequested }
}

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
