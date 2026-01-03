import wrapAnsi from 'wrap-ansi'

import type { HistoryEntry } from '../types'

export type HistoryMessage = {
  content: string
  kind: HistoryEntry['kind']
}

export const formatCompactTokens = (count: number): string => {
  if (count < 1000) {
    return String(count)
  }
  if (count < 10_000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  if (count < 1_000_000) {
    return `${Math.round(count / 1000)}k`
  }
  return `${(count / 1_000_000).toFixed(1)}m`
}

export const extractValidationSection = (content: string): string | null => {
  const markerRegex = /^(?:#{1,6}\s*Validation\b.*|Validation\s*:.*)$/im
  const match = markerRegex.exec(content)
  if (!match) {
    return null
  }

  return content.slice(match.index).trim()
}

export const getHistoryWrapWidth = (terminalColumns: number): number => {
  return Math.max(40, terminalColumns - 6)
}

export const wrapTextForHistory = (content: string, wrapWidth: number): string[] => {
  const output: string[] = []

  content.split('\n').forEach((line) => {
    const wrapped = wrapAnsi(line, wrapWidth, { trim: false, hard: true })
    wrapped.split('\n').forEach((wrappedLine) => {
      output.push(wrappedLine)
    })
  })

  return output
}

const formatIterationTokenLabel = (tokens: number, reasoningTokens?: number): string => {
  const normalizedReasoningTokens = reasoningTokens ?? 0

  if (normalizedReasoningTokens > 0) {
    return ` (${tokens} prompt tokens · ${normalizedReasoningTokens} reasoning tokens)`
  }

  return ` (${tokens} tokens)`
}

export const buildIterationCompleteHistoryMessages = (options: {
  iteration: number
  tokens: number
  reasoningTokens?: number
  prompt: string
  wrapWidth: number
}): HistoryMessage[] => {
  const tokenLabel = formatIterationTokenLabel(options.tokens, options.reasoningTokens)

  const messages: HistoryMessage[] = [
    {
      content: `Iteration ${options.iteration} complete${tokenLabel}`,
      kind: 'progress',
    },
    {
      content: `Prompt (iteration ${options.iteration}):`,
      kind: 'system',
    },
  ]

  wrapTextForHistory(options.prompt, options.wrapWidth).forEach((line) => {
    messages.push({ content: line, kind: 'system' })
  })

  return messages
}

export const buildJsonPayloadHistoryMessages = (
  payload: unknown,
  wrapWidth: number,
): HistoryMessage[] => {
  const prettyPayload = JSON.stringify(payload, null, 2)

  const messages: HistoryMessage[] = [{ content: 'JSON payload:', kind: 'system' }]

  wrapTextForHistory(prettyPayload, wrapWidth).forEach((line) => {
    messages.push({ content: line, kind: 'system' })
  })

  return messages
}
