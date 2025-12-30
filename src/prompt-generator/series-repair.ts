import type { SeriesResponse } from './types'

export const isRepairableSeriesValidationError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.startsWith('Atomic prompt ') &&
    (message.includes('missing required section(s)') ||
      message.includes('contains forbidden cross-reference phrase') ||
      message.includes('is missing a title') ||
      message.includes('is missing content'))
  )
}

export const buildSeriesRepairUserMessage = (options: {
  intent: string
  validationError: string
  previousSeries: SeriesResponse
}): string => {
  return [
    `User Intent:\n${options.intent.trim()}`,
    '',
    `Validation Error:\n${options.validationError.trim()}`,
    '',
    'Previous SeriesResponse JSON:',
    JSON.stringify(options.previousSeries, null, 2),
    '',
    'Return a corrected SeriesResponse JSON payload now.',
  ].join('\n')
}
