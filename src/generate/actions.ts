import chalk from 'chalk'
import clipboard from 'clipboardy'
import open from 'open'

import { shouldTraceCopy } from './debug'

export const maybeCopyToClipboard = async (
  shouldCopy: boolean,
  prompt: string,
  showFeedback: boolean,
): Promise<void> => {
  const traceEnabled = shouldTraceCopy()
  const trace = (message: string): void => {
    if (traceEnabled) {
      console.error(chalk.dim(`[pmc:copy] ${message}`))
    }
  }

  if (!shouldCopy) {
    trace('Skipping clipboard write (flag not provided).')
    return
  }

  trace(`Attempting clipboard write (${prompt.length.toLocaleString()} chars).`)

  try {
    await clipboard.write(prompt)
    if (showFeedback) {
      console.log(chalk.green('✓ Copied prompt to clipboard.'))
    } else {
      trace('Copied prompt to clipboard (feedback suppressed).')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown clipboard error.'
    trace(`Clipboard write failed: ${message}`)
    console.warn(chalk.yellow(`Failed to copy prompt to clipboard: ${message}`))
  }
}

export const maybeOpenChatGpt = async (
  shouldOpen: boolean,
  prompt: string,
  showFeedback: boolean,
): Promise<void> => {
  if (!shouldOpen) {
    return
  }

  const url = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`

  try {
    await open(url)
    if (showFeedback) {
      console.log(chalk.green('✓ Opened ChatGPT with the generated prompt.'))
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown browser error.'
    console.warn(chalk.yellow(`Failed to open ChatGPT: ${message}`))
  }
}
