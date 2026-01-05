import type { FileContext } from '../file-context'

import type { ContextOverflowStrategy, ContextPathMetadata, TokenTelemetry } from './types'

export type ContextEntrySource = Exclude<ContextPathMetadata['source'], 'intent'>

export type ContextEntry = FileContext & {
  source: ContextEntrySource
}

export type BuildTelemetry = (
  intentText: string,
  files: FileContext[],
  metaInstructions: string,
) => TokenTelemetry

export type EvaluateContextBudgetParams = {
  intentText: string
  metaInstructions: string
  contextEntries: ContextEntry[]
  maxInputTokens?: number
  maxContextTokens?: number
  strategy?: ContextOverflowStrategy
  buildTelemetry: BuildTelemetry
}

export type ContextBudgetEvaluation = {
  keptEntries: ContextEntry[]
  droppedEntries: ContextEntry[]
  droppedPaths: ContextPathMetadata[]
  before: TokenTelemetry
  after: TokenTelemetry
  strategy?: ContextOverflowStrategy
}

const INFINITY = Number.POSITIVE_INFINITY

const min = (a: number, b: number): number => (a < b ? a : b)

const formatBudget = (budget: number | undefined): string =>
  typeof budget === 'number' ? String(budget) : 'unset'

// Token budgets apply only to text context entries (file/url/smart).
// Images/videos are not included in the token budget model, so they are never trimmed here.
export const evaluateContextBudget = (
  params: EvaluateContextBudgetParams,
): ContextBudgetEvaluation => {
  const {
    intentText,
    metaInstructions,
    contextEntries,
    maxInputTokens,
    maxContextTokens,
    strategy,
    buildTelemetry,
  } = params

  const before = buildTelemetry(intentText, contextEntries, metaInstructions)

  const budgetsEnabled = maxInputTokens !== undefined || maxContextTokens !== undefined
  if (!budgetsEnabled) {
    return {
      keptEntries: contextEntries,
      droppedEntries: [],
      droppedPaths: [],
      before,
      after: before,
      ...(strategy ? { strategy } : {}),
    }
  }

  const effectiveStrategy: ContextOverflowStrategy = strategy ?? 'fail'

  const maxFileTokensFromInputBudget =
    maxInputTokens !== undefined
      ? maxInputTokens - before.intentTokens - before.systemTokens
      : INFINITY

  const allowedFileTokens = min(maxContextTokens ?? INFINITY, maxFileTokensFromInputBudget)

  const isOverflow = before.fileTokens > allowedFileTokens

  if (!isOverflow) {
    return {
      keptEntries: contextEntries,
      droppedEntries: [],
      droppedPaths: [],
      before,
      after: before,
      strategy: effectiveStrategy,
    }
  }

  if (effectiveStrategy === 'fail') {
    throw new Error(
      `Context token budget exceeded (strategy=fail). ` +
        `totalTokens=${before.totalTokens} (maxInputTokens=${formatBudget(maxInputTokens)}), ` +
        `contextTokens=${before.fileTokens} (maxContextTokens=${formatBudget(maxContextTokens)}).`,
    )
  }

  const fileSummaries = before.files
  if (fileSummaries.length !== contextEntries.length) {
    throw new Error(
      `Invariant violation: telemetry entry count (${fileSummaries.length}) did not match context entry count (${contextEntries.length}).`,
    )
  }

  const entryTokens = fileSummaries.map((file) => file.tokens)
  let remainingFileTokens = before.fileTokens

  const dropOrder = buildDropOrder(effectiveStrategy, contextEntries, entryTokens)
  const droppedIndexSet = new Set<number>()
  const droppedEntries: ContextEntry[] = []

  for (const index of dropOrder) {
    if (remainingFileTokens <= allowedFileTokens) {
      break
    }
    if (droppedIndexSet.has(index)) {
      continue
    }

    droppedIndexSet.add(index)
    remainingFileTokens -= entryTokens[index] ?? 0
    const dropped = contextEntries[index]
    if (dropped) {
      droppedEntries.push(dropped)
    }
  }

  const keptEntries = contextEntries.filter((_, index) => !droppedIndexSet.has(index))
  const after = buildTelemetry(intentText, keptEntries, metaInstructions)

  const satisfiesContextBudget = after.fileTokens <= allowedFileTokens
  const satisfiesInputBudget =
    maxInputTokens !== undefined ? after.totalTokens <= maxInputTokens : true

  if (!satisfiesContextBudget || !satisfiesInputBudget) {
    throw new Error(
      `Unable to satisfy token budgets after trimming context. ` +
        `totalTokens=${after.totalTokens} (maxInputTokens=${formatBudget(maxInputTokens)}), ` +
        `contextTokens=${after.fileTokens} (maxContextTokens=${formatBudget(maxContextTokens)}).`,
    )
  }

  const droppedPaths: ContextPathMetadata[] = droppedEntries.map((entry) => ({
    path: entry.path,
    source: entry.source,
  }))

  return {
    keptEntries,
    droppedEntries,
    droppedPaths,
    before,
    after,
    strategy: effectiveStrategy,
  }
}

const buildDropOrder = (
  strategy: Exclude<ContextOverflowStrategy, 'fail'>,
  entries: ContextEntry[],
  entryTokens: number[],
): number[] => {
  const indices = entries.map((_, index) => index)

  switch (strategy) {
    case 'drop-oldest':
      return indices

    case 'drop-largest':
      return [...indices].sort((a, b) => {
        const tokenDelta = (entryTokens[b] ?? 0) - (entryTokens[a] ?? 0)
        if (tokenDelta !== 0) {
          return tokenDelta
        }
        return a - b
      })

    case 'drop-smart':
      return stableSourceFirst(indices, entries, 'smart')

    case 'drop-url':
      return stableSourceFirst(indices, entries, 'url')

    default: {
      const exhaustive: never = strategy
      return exhaustive
    }
  }
}

const stableSourceFirst = (
  indices: number[],
  entries: ContextEntry[],
  source: ContextEntrySource,
): number[] => {
  const matches: number[] = []
  const rest: number[] = []

  indices.forEach((index) => {
    const entry = entries[index]
    if (entry?.source === source) {
      matches.push(index)
    } else {
      rest.push(index)
    }
  })

  return [...matches, ...rest]
}
