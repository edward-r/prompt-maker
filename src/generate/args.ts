import yargs from 'yargs'
import type { ArgumentsCamelCase } from 'yargs'

import type { ContextOverflowStrategy, GenerateArgs, StreamMode } from './types'

const VALUE_FLAGS = new Set([
  '--intent-file',
  '-f',
  '--model',
  '--target',
  '--polish-model',
  '--context',
  '-c',
  '--image',
  '--video',
  '--url',
  '--context-file',
  '--context-format',
  '--context-template',
  '--smart-context-root',
  '--max-input-tokens',
  '--max-context-tokens',
  '--context-overflow',
  '--interactive-transport',
])

const HELP_FLAGS = new Set(['--help', '-h'])

const CONTEXT_OVERFLOW_STRATEGIES = [
  'fail',
  'drop-smart',
  'drop-url',
  'drop-largest',
  'drop-oldest',
] as const satisfies ReadonlyArray<ContextOverflowStrategy>

type ParsedArgs = {
  args: GenerateArgs
  showHelp: () => void
}

export const parseGenerateArgs = (argv: string[]): ParsedArgs => {
  const {
    optionArgs: rawOptionArgs,
    positionalIntent,
    positionalIntentAfterInteractive,
  } = extractIntentArg(argv)

  const { optionArgs, helpRequested } = stripHelpFlags(rawOptionArgs)

  const parser = yargs(optionArgs)
    .scriptName('prompt-maker-cli')
    .usage('Prompt Maker CLI (generate-only)\n\nUsage:\n  prompt-maker-cli [intent] [options]')
    .option('intent-file', {
      alias: 'f',
      type: 'string',
      describe: 'Read intent from file',
    })
    .option('model', {
      type: 'string',
      describe: 'Override model for generation',
    })
    .option('target', {
      type: 'string',
      describe:
        'Target/runtime model used for optimization (not included in the generated prompt text)',
    })
    .option('polish-model', {
      type: 'string',
      describe: 'Override the model used for polishing',
    })
    .option('interactive', {
      alias: 'i',
      type: 'boolean',
      default: false,
      describe: 'Enable interactive refinement loop',
    })
    .option('copy', {
      type: 'boolean',
      default: false,
      describe: 'Copy the final prompt to the clipboard',
    })
    .option('open-chatgpt', {
      type: 'boolean',
      default: false,
      describe: 'Open ChatGPT with the final prompt',
    })
    .option('polish', {
      type: 'boolean',
      default: false,
      describe: 'Run the polish pass after generation',
    })
    .option('json', {
      type: 'boolean',
      default: false,
      describe: 'Emit machine-readable JSON (non-interactive only)',
    })
    .option('quiet', {
      type: 'boolean',
      default: false,
      describe: 'Suppress interactive UI output (telemetry, banners)',
    })
    .option('progress', {
      type: 'boolean',
      default: true,
      describe: 'Show progress indicator',
    })
    .option('stream', {
      type: 'string',
      choices: ['none', 'jsonl'] as const,
      default: 'none',
      describe: 'Emit structured events via stdout',
    })
    .option('context-template', {
      type: 'string',
      describe: 'Wrap the final prompt using a named template',
    })
    .option('interactive-transport', {
      type: 'string',
      describe: 'Listen on a local socket/pipe for interactive commands',
    })
    .option('show-context', {
      type: 'boolean',
      default: false,
      describe: 'Print resolved context files before generation',
    })
    .option('context', {
      alias: 'c',
      type: 'string',
      array: true,
      default: [],
      describe: 'Add file context via glob (repeatable)',
    })
    .option('url', {
      type: 'string',
      array: true,
      default: [],
      describe: 'Add URL context (repeatable)',
    })
    .option('image', {
      type: 'string',
      array: true,
      default: [],
      describe: 'Attach an image (repeatable)',
    })
    .option('video', {
      type: 'string',
      array: true,
      default: [],
      describe: 'Attach a video file (repeatable)',
    })
    .option('context-file', {
      type: 'string',
      describe: 'Write resolved context to the specified file',
    })
    .option('context-format', {
      type: 'string',
      choices: ['text', 'json'] as const,
      default: 'text',
      describe: 'Format for --show-context or --context-file output',
    })
    .option('smart-context', {
      type: 'boolean',
      default: false,
      describe: 'Automatically attach relevant files via local embeddings',
    })
    .option('smart-context-root', {
      type: 'string',
      describe: 'Override the base directory scanned when --smart-context is enabled',
    })
    .option('max-input-tokens', {
      type: 'number',
      describe: 'Maximum allowed input tokens (intent + system + context)',
      coerce: (value: unknown) => parsePositiveIntegerFlag('--max-input-tokens', value),
    })
    .option('max-context-tokens', {
      type: 'number',
      describe: 'Maximum allowed tokens reserved for context attachments',
      coerce: (value: unknown) => parsePositiveIntegerFlag('--max-context-tokens', value),
    })
    .option('context-overflow', {
      type: 'string',
      choices: CONTEXT_OVERFLOW_STRATEGIES,
      describe: 'Strategy for resolving context token overflows',
    })
    .check((argv) => {
      if (argv.maxInputTokens !== undefined) {
        argv.maxInputTokens = parsePositiveIntegerFlag('--max-input-tokens', argv.maxInputTokens)
      }

      if (argv.maxContextTokens !== undefined) {
        argv.maxContextTokens = parsePositiveIntegerFlag(
          '--max-context-tokens',
          argv.maxContextTokens,
        )
      }

      if (argv.contextOverflow !== undefined && !isContextOverflowStrategy(argv.contextOverflow)) {
        throw new Error(
          `--context-overflow must be one of: ${CONTEXT_OVERFLOW_STRATEGIES.join(', ')}.`,
        )
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
    intentFile?: string
    model?: string
    target?: string
    polishModel?: string
    interactive: boolean
    copy: boolean
    openChatgpt: boolean
    polish: boolean
    json: boolean
    quiet: boolean
    progress: boolean
    help?: boolean
    context: string | string[]
    contextFile?: string
    contextFormat?: 'text' | 'json'
    url: string | string[]
    image: string | string[]
    video: string | string[]
    smartContext: boolean
    smartContextRoot?: string
    showContext: boolean
    contextTemplate?: string
    interactiveTransport?: string
    stream?: StreamMode
    maxInputTokens?: number
    maxContextTokens?: number
    contextOverflow?: ContextOverflowStrategy
    _?: (string | number)[]
  }>

  const intent = positionalIntent ?? (typeof parsed._?.[0] === 'string' ? parsed._?.[0] : undefined)

  const args: GenerateArgs = {
    interactive: parsed.interactive ?? false,
    copy: parsed.copy ?? false,
    openChatGpt: parsed.openChatgpt ?? false,
    polish: parsed.polish ?? false,
    json: parsed.json ?? false,
    quiet: parsed.quiet ?? false,
    progress: parsed.progress ?? true,
    stream: parsed.stream ?? 'none',
    showContext: parsed.showContext ?? false,
    contextFormat: parsed.contextFormat ?? 'text',
    help: helpRequested || Boolean(parsed.help),
    ...(parsed.maxInputTokens !== undefined ? { maxInputTokens: parsed.maxInputTokens } : {}),
    ...(parsed.maxContextTokens !== undefined ? { maxContextTokens: parsed.maxContextTokens } : {}),
    ...(parsed.contextOverflow !== undefined ? { contextOverflow: parsed.contextOverflow } : {}),
    context: normalizeListArg(parsed.context),
    urls: normalizeListArg(parsed.url),
    images: normalizeListArg(parsed.image),
    video: normalizeListArg(parsed.video),
    smartContext: parsed.smartContext ?? false,
    ...(parsed.contextTemplate ? { contextTemplate: parsed.contextTemplate } : {}),
    ...(parsed.interactiveTransport ? { interactiveTransport: parsed.interactiveTransport } : {}),
    ...(parsed.contextFile ? { contextFile: parsed.contextFile } : {}),
    ...(parsed.smartContextRoot ? { smartContextRoot: parsed.smartContextRoot } : {}),
  }

  if (intent) {
    args.intent = intent
    if (positionalIntentAfterInteractive) {
      args.inlineIntentAfterInteractive = true
    }
  }

  if (parsed.intentFile) {
    args.intentFile = parsed.intentFile
  }

  if (parsed.model) {
    args.model = parsed.model
  }

  if (parsed.target) {
    args.target = parsed.target
  }

  if (parsed.polishModel) {
    args.polishModel = parsed.polishModel
  }

  return {
    args,
    showHelp: () => parser.showHelp(),
  }
}

export const extractIntentArg = (
  argv: string[],
): {
  optionArgs: string[]
  positionalIntent?: string
  positionalIntentAfterInteractive?: boolean
} => {
  const optionArgs: string[] = []
  let positionalIntent: string | undefined
  let positionalIntentAfterInteractive = false
  let awaitingInteractiveIntent = false

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === undefined) {
      continue
    }

    if (token === '--') {
      optionArgs.push(...argv.slice(i))
      break
    }

    if (token.startsWith('-')) {
      optionArgs.push(token)
      awaitingInteractiveIntent = token === '-i' || token === '--interactive'

      if (VALUE_FLAGS.has(token)) {
        const next = argv[i + 1]
        if (next !== undefined) {
          optionArgs.push(next)
          i += 1
        }
        awaitingInteractiveIntent = false
      }

      continue
    }

    if (!positionalIntent) {
      positionalIntent = token
      positionalIntentAfterInteractive = awaitingInteractiveIntent
      awaitingInteractiveIntent = false
      continue
    }

    awaitingInteractiveIntent = false
    optionArgs.push(token)
  }

  return positionalIntent
    ? { optionArgs, positionalIntent, positionalIntentAfterInteractive }
    : { optionArgs }
}

export const stripHelpFlags = (
  tokens: string[],
): { optionArgs: string[]; helpRequested: boolean } => {
  if (tokens.length === 0) {
    return { optionArgs: tokens, helpRequested: false }
  }

  const sanitized: string[] = []
  let helpRequested = false
  let passthrough = false

  tokens.forEach((token) => {
    if (passthrough) {
      sanitized.push(token)
      return
    }

    if (token === '--') {
      sanitized.push(token)
      passthrough = true
      return
    }

    if (HELP_FLAGS.has(token)) {
      helpRequested = true
      return
    }

    sanitized.push(token)
  })

  return { optionArgs: sanitized, helpRequested }
}

const normalizeListArg = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => entry.toString())
  }
  if (value === undefined || value === null) {
    return []
  }
  return [value.toString()]
}

const isContextOverflowStrategy = (value: unknown): value is ContextOverflowStrategy =>
  typeof value === 'string' &&
  CONTEXT_OVERFLOW_STRATEGIES.includes(value as ContextOverflowStrategy)

const parsePositiveIntegerFlag = (flagName: string, value: unknown): number => {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN

  if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`${flagName} must be a positive integer.`)
  }

  return numeric
}
