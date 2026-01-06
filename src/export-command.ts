import path from 'node:path'

import yargs from 'yargs'
import type { ArgumentsCamelCase } from 'yargs'

import type { PayloadFormat } from './generate/payload-io'
import { writeGeneratePayloadExport } from './export/export-generate-payload'
import { loadGeneratePayloadFromHistory } from './history/generate-history'

type ExportArgs = {
  fromHistory: string
  format: PayloadFormat
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
    format?: PayloadFormat
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

const exportHistoryEntry = async (args: ExportArgs): Promise<void> => {
  const payload = await loadGeneratePayloadFromHistory({ selector: args.fromHistory })

  const { absolutePath } = await writeGeneratePayloadExport({
    payload,
    format: args.format,
    outPath: args.out,
  })

  if (!args.quiet) {
    console.error(
      `Wrote ${args.format.toUpperCase()} export to ${formatDisplayPath(absolutePath)}.`,
    )
  }
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
