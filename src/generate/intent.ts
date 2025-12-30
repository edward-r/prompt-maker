import fs from 'node:fs/promises'

import chalk from 'chalk'

import type { GenerateArgs } from './types'
import { readFromStdin } from '../io'

import { isFsNotFoundError } from './fs-utils'

const MAX_INTENT_FILE_BYTES = 512 * 1024

export const resolveIntent = async (args: GenerateArgs): Promise<string> => {
  if (args.intent && args.intentFile) {
    throw new Error('Provide either an inline intent argument or --intent-file, not both.')
  }

  if (args.intentFile) {
    return await readIntentFile(args.intentFile)
  }

  const inlineIntentFromInteractiveFlag = await maybeResolveInlineIntentFile(args)
  if (inlineIntentFromInteractiveFlag) {
    return inlineIntentFromInteractiveFlag
  }

  if (args.intent?.trim()) {
    return args.intent.trim()
  }

  const piped = await readFromStdin()
  if (piped?.trim()) {
    return piped.trim()
  }

  throw new Error(
    'Intent text is required. Provide a quoted argument, use --intent-file, or pipe text via stdin.',
  )
}

const maybeResolveInlineIntentFile = async (args: GenerateArgs): Promise<string | null> => {
  if (!args.inlineIntentAfterInteractive || !args.intent) {
    return null
  }

  const candidatePath = args.intent.trim()
  if (!candidatePath) {
    return null
  }

  try {
    const content = await readIntentFile(candidatePath)
    console.warn(
      chalk.yellow(
        [
          `Detected "${candidatePath}" immediately after -i/--interactive.`,
          'Treating it as an intent file. Use -f/--intent-file (optionally alongside --interactive) for clearer commands and restored progress feedback.',
        ].join(' '),
      ),
    )
    return content
  } catch (error) {
    if (isFsNotFoundError(error)) {
      return null
    }
    throw error
  }
}

const readIntentFile = async (filePath: string): Promise<string> => {
  const stats = await fs.stat(filePath)
  if (stats.size > MAX_INTENT_FILE_BYTES) {
    const sizeKb = (stats.size / 1024).toFixed(1)
    throw new Error(`Intent file ${filePath} is too large (${sizeKb} KB).`)
  }

  const buffer = await fs.readFile(filePath)
  if (buffer.includes(0)) {
    throw new Error(`Intent file ${filePath} appears to be binary. Provide a UTF-8 text file.`)
  }

  const trimmed = buffer.toString('utf8').trim()
  if (!trimmed) {
    throw new Error(`Intent file ${filePath} is empty.`)
  }

  return trimmed
}
