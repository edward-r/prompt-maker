import yargsParser from 'yargs-parser'

type PositionalOptions = {
  default?: unknown
}

type Builder = {
  positional: (name: string, opts: PositionalOptions) => Builder
}

type YargsApi = {
  scriptName: (...args: unknown[]) => YargsApi
  usage: (...args: unknown[]) => YargsApi
  option: (...args: unknown[]) => YargsApi
  alias: (...args: unknown[]) => YargsApi
  help: (...args: unknown[]) => YargsApi
  exitProcess: (...args: unknown[]) => YargsApi
  showHelpOnFail: (...args: unknown[]) => YargsApi
  parserConfiguration: (...args: unknown[]) => YargsApi
  strict: (...args: unknown[]) => YargsApi
  command: (_pattern: string, _desc: string, builder?: (cmd: Builder) => Builder) => YargsApi
  check: (handler: (argv: Record<string, unknown>) => boolean | void) => YargsApi
  fail: (handler: (msg?: string, err?: Error) => void) => YargsApi
  showHelp: () => void
  parseSync: () => Record<string, unknown>
}

const BOOLEAN_OPTIONS = [
  'interactive',
  'copy',
  'open-chatgpt',
  'polish',
  'json',
  'progress',
  'smart-context',
  'help',
]

const ARRAY_OPTIONS = ['context', 'image', 'video']

const NUMBER_OPTIONS = ['max-input-tokens', 'max-context-tokens']

const DEFAULTS: Record<string, unknown> = {
  context: [],
  image: [],
  video: [],
  progress: true,
}

const ALIASES: Record<string, string> = {
  c: 'context',
  f: 'intent-file',
  i: 'interactive',
  h: 'help',
}

const createYargs = (argv: string[]): YargsApi => {
  const positionalDefaults: Record<string, unknown> = {}
  const checkHandlers: Array<(argv: Record<string, unknown>) => boolean | void> = []
  let failHandler: ((msg?: string, err?: Error) => void) | undefined

  const api: YargsApi = {
    scriptName: () => api,
    usage: () => api,
    option: () => api,
    alias: () => api,
    help: () => api,
    exitProcess: () => api,
    showHelpOnFail: () => api,
    parserConfiguration: () => api,
    strict: () => api,
    check(handler: (argv: Record<string, unknown>) => boolean | void) {
      checkHandlers.push(handler)
      return api
    },
    command(_pattern: string, _desc: string, builder?: (cmd: Builder) => Builder) {
      if (builder) {
        builder({
          positional(name, opts) {
            if (opts && Object.prototype.hasOwnProperty.call(opts, 'default')) {
              positionalDefaults[name] = opts.default
            }
            return this
          },
        })
      }
      return api
    },
    fail(handler: (msg?: string, err?: Error) => void) {
      failHandler = handler
      return api
    },
    showHelp: () => undefined,
    parseSync() {
      try {
        const parsed = yargsParser(argv, {
          alias: ALIASES,
          array: ARRAY_OPTIONS,
          boolean: BOOLEAN_OPTIONS,
          number: NUMBER_OPTIONS,
          configuration: {
            'halt-at-non-option': true,
            'camel-case-expansion': true,
          },
          default: DEFAULTS,
        }) as Record<string, unknown>

        for (const [name, value] of Object.entries(positionalDefaults)) {
          if (parsed[name] === undefined || parsed[name] === '') {
            parsed[name] = value
          }
        }

        checkHandlers.forEach((handler) => {
          const result = handler(parsed)
          if (result === false) {
            throw new Error('Invalid CLI arguments.')
          }
        })

        return parsed
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        failHandler?.(err.message, err)
        throw err
      }
    },
  }

  return api
}

const yargs = (argv: string[]) => createYargs(argv)

export type ArgumentsCamelCase<T> = T

export default yargs
