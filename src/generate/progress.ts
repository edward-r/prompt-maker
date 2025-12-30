import chalk from 'chalk'
import ora from 'ora'

import type { UploadStateChange } from '../prompt-generator-service'

import type { StreamDispatcher } from './stream'

export type ProgressHandle = {
  stop: (finalMessage?: string) => void
  setLabel: (label: string) => void
}

export const startProgress = (label: string, options: { showSpinner: boolean }): ProgressHandle => {
  const spinner = options.showSpinner
    ? ora({
        text: chalk.dim(label),
        color: 'cyan',
        spinner: 'dots',
      }).start()
    : null
  let stopped = false

  const stop = (finalMessage?: string): void => {
    if (stopped) {
      return
    }
    stopped = true
    if (spinner) {
      if (finalMessage) {
        spinner.succeed(finalMessage)
      } else {
        spinner.succeed(chalk.green(`${label} ✓`))
      }
    }
  }

  const setLabel = (nextLabel: string): void => {
    if (stopped) {
      return
    }
    if (spinner) {
      spinner.text = chalk.dim(nextLabel)
    }
  }

  return { stop, setLabel }
}

export const createUploadStateTracker = (
  progress: ProgressHandle | null,
  defaultLabel: string,
  stream?: StreamDispatcher,
): UploadStateChange => {
  let uploadsInFlight = 0
  const uploadLabel = 'Uploading...'

  return (state, detail) => {
    if (state === 'start') {
      uploadsInFlight += 1
      if (uploadsInFlight === 1) {
        progress?.setLabel(uploadLabel)
      }
    } else {
      uploadsInFlight = Math.max(0, uploadsInFlight - 1)
      if (uploadsInFlight === 0) {
        progress?.setLabel(defaultLabel)
      }
    }

    if (stream) {
      stream.emit({ event: 'upload.state', state, detail })
    }
  }
}
