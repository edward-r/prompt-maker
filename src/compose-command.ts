import fs from 'node:fs/promises'
import path from 'node:path'

import yargs from 'yargs'
import type { ArgumentsCamelCase } from 'yargs'

type ComposeArgs = {
  recipe: string
  input: string
  help: boolean
}

export const runComposeCommand = async (argv: string[]): Promise<void> => {
  try {
    const { args, showHelp } = parseComposeArgs(argv)

    if (args.help) {
      showHelp()
      return
    }

    const recipePath = path.resolve(process.cwd(), args.recipe)
    const recipeText = await readRecipeFile(recipePath)

    const composed = composeDeterministicPrompt(recipeText, args.input)
    process.stdout.write(composed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown compose error.'
    console.error(message)
    process.exitCode = 1
  }
}

const HELP_FLAGS = new Set(['--help', '-h'])

const COMPOSE_HELP_TEXT = `Usage:\n  prompt-maker-cli compose --recipe <path> --input <text>\n\nOptions:\n  --recipe  Path to a recipe file (text for now)\n  --input   Input text to compose into the recipe\n  --help,-h Show help\n`

const parseComposeArgs = (argv: string[]): { args: ComposeArgs; showHelp: () => void } => {
  const { optionArgs, helpRequested } = stripHelpFlags(argv)

  if (helpRequested) {
    return {
      args: {
        recipe: '',
        input: '',
        help: true,
      },
      showHelp: () => {
        process.stdout.write(COMPOSE_HELP_TEXT)
      },
    }
  }

  const parser = yargs(optionArgs)
    .scriptName('prompt-maker-cli compose')
    .usage('Usage:\n  prompt-maker-cli compose --recipe <path> --input <text>')
    .option('recipe', {
      type: 'string',
      describe: 'Path to a recipe file (text for now)',
    })
    .option('input', {
      type: 'string',
      describe: 'Input text to compose into the recipe',
    })
    .check((argv) => {
      const recipe = argv.recipe
      if (typeof recipe !== 'string' || recipe.trim().length === 0) {
        throw new Error('--recipe is required.')
      }

      const input = argv.input
      if (typeof input !== 'string' || input.trim().length === 0) {
        throw new Error('--input is required.')
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
    recipe?: string
    input?: string
    help?: boolean
  }>

  const recipe = parsed.recipe?.trim() ?? ''
  const input = parsed.input ?? ''

  return {
    args: {
      recipe,
      input,
      help: Boolean(parsed.help),
    },
    showHelp: () => {
      process.stdout.write(COMPOSE_HELP_TEXT)
    },
  }
}

const readRecipeFile = async (filePath: string): Promise<string> => {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown file error.'
    throw new Error(`Failed to read recipe file ${formatDisplayPath(filePath)}: ${message}`)
  }
}

export const composeDeterministicPrompt = (recipeText: string, input: string): string => {
  const normalizedRecipe = normalizeNewlines(recipeText).trimEnd()
  const normalizedInput = normalizeNewlines(input)
  return `${normalizedRecipe}\n---\n${normalizedInput}\n`
}

const normalizeNewlines = (value: string): string => value.replace(/\r\n/g, '\n')

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
