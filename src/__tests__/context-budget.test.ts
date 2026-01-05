import { evaluateContextBudget, type ContextEntry } from '../generate/context-budget'
import type { TokenTelemetry } from '../generate/types'

const buildTelemetryFromNumericContent = (
  intentText: string,
  entries: Array<{ path: string; content: string }>,
  metaInstructions: string,
): TokenTelemetry => {
  const toInt = (value: string): number => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) {
      return 0
    }
    return Math.trunc(parsed)
  }

  const files = entries.map((entry) => ({
    path: entry.path,
    tokens: toInt(entry.content),
  }))

  const fileTokens = files.reduce((acc, file) => acc + file.tokens, 0)
  const intentTokens = toInt(intentText)
  const systemTokens = toInt(metaInstructions)

  return {
    files,
    intentTokens,
    fileTokens,
    systemTokens,
    totalTokens: intentTokens + systemTokens + fileTokens,
  }
}

describe('evaluateContextBudget', () => {
  it('returns entries unchanged when budgets are not set', () => {
    const entries: ContextEntry[] = [
      { path: 'a', content: '3', source: 'file' },
      { path: 'b', content: '5', source: 'smart' },
    ]

    const result = evaluateContextBudget({
      intentText: '0',
      metaInstructions: '0',
      contextEntries: entries,
      buildTelemetry: buildTelemetryFromNumericContent,
    })

    expect(result.keptEntries).toEqual(entries)
    expect(result.droppedEntries).toEqual([])
    expect(result.after).toEqual(result.before)
  })

  it('throws with strategy=fail when over budget', () => {
    const entries: ContextEntry[] = [
      { path: 'a', content: '3', source: 'file' },
      { path: 'b', content: '5', source: 'smart' },
    ]

    expect(() =>
      evaluateContextBudget({
        intentText: '0',
        metaInstructions: '0',
        contextEntries: entries,
        maxContextTokens: 4,
        buildTelemetry: buildTelemetryFromNumericContent,
      }),
    ).toThrow(/Context token budget exceeded/)
  })

  it('drops smart entries first with drop-smart', () => {
    const entries: ContextEntry[] = [
      { path: 'file.md', content: '3', source: 'file' },
      { path: 'smart.md', content: '5', source: 'smart' },
      { path: 'url.md', content: '4', source: 'url' },
    ]

    const result = evaluateContextBudget({
      intentText: '0',
      metaInstructions: '0',
      contextEntries: entries,
      maxContextTokens: 7,
      strategy: 'drop-smart',
      buildTelemetry: buildTelemetryFromNumericContent,
    })

    expect(result.droppedPaths).toEqual([{ path: 'smart.md', source: 'smart' }])
    expect(result.keptEntries.map((entry) => entry.path)).toEqual(['file.md', 'url.md'])
    expect(result.after.fileTokens).toBe(7)
  })

  it('falls back to dropping oldest remaining after exhausting smart entries', () => {
    const entries: ContextEntry[] = [
      { path: 'file.md', content: '3', source: 'file' },
      { path: 'smart.md', content: '5', source: 'smart' },
    ]

    const result = evaluateContextBudget({
      intentText: '0',
      metaInstructions: '0',
      contextEntries: entries,
      maxContextTokens: 2,
      strategy: 'drop-smart',
      buildTelemetry: buildTelemetryFromNumericContent,
    })

    expect(result.droppedPaths).toEqual([
      { path: 'smart.md', source: 'smart' },
      { path: 'file.md', source: 'file' },
    ])
    expect(result.keptEntries).toEqual([])
    expect(result.after.fileTokens).toBe(0)
  })

  it('drops url entries first with drop-url', () => {
    const entries: ContextEntry[] = [
      { path: 'a', content: '4', source: 'file' },
      { path: 'b', content: '4', source: 'url' },
      { path: 'c', content: '4', source: 'file' },
    ]

    const result = evaluateContextBudget({
      intentText: '0',
      metaInstructions: '0',
      contextEntries: entries,
      maxContextTokens: 8,
      strategy: 'drop-url',
      buildTelemetry: buildTelemetryFromNumericContent,
    })

    expect(result.droppedPaths).toEqual([{ path: 'b', source: 'url' }])
    expect(result.keptEntries.map((entry) => entry.path)).toEqual(['a', 'c'])
  })

  it('drops largest token entries first with drop-largest', () => {
    const entries: ContextEntry[] = [
      { path: 'small', content: '2', source: 'file' },
      { path: 'big', content: '10', source: 'file' },
      { path: 'mid', content: '5', source: 'file' },
    ]

    const result = evaluateContextBudget({
      intentText: '0',
      metaInstructions: '0',
      contextEntries: entries,
      maxContextTokens: 6,
      strategy: 'drop-largest',
      buildTelemetry: buildTelemetryFromNumericContent,
    })

    expect(result.droppedPaths).toEqual([
      { path: 'big', source: 'file' },
      { path: 'mid', source: 'file' },
    ])
    expect(result.keptEntries.map((entry) => entry.path)).toEqual(['small'])
    expect(result.after.fileTokens).toBe(2)
  })

  it('drops oldest entries first with drop-oldest', () => {
    const entries: ContextEntry[] = [
      { path: 'first', content: '4', source: 'file' },
      { path: 'second', content: '4', source: 'file' },
      { path: 'third', content: '4', source: 'file' },
    ]

    const result = evaluateContextBudget({
      intentText: '0',
      metaInstructions: '0',
      contextEntries: entries,
      maxContextTokens: 8,
      strategy: 'drop-oldest',
      buildTelemetry: buildTelemetryFromNumericContent,
    })

    expect(result.droppedPaths).toEqual([{ path: 'first', source: 'file' }])
    expect(result.keptEntries.map((entry) => entry.path)).toEqual(['second', 'third'])
  })

  it('enforces maxInputTokens using remaining file token allowance', () => {
    const entries: ContextEntry[] = [
      { path: 'a', content: '2', source: 'file' },
      { path: 'b', content: '2', source: 'file' },
    ]

    const result = evaluateContextBudget({
      intentText: '4',
      metaInstructions: '3',
      contextEntries: entries,
      maxInputTokens: 10,
      strategy: 'drop-oldest',
      buildTelemetry: buildTelemetryFromNumericContent,
    })

    expect(result.keptEntries.map((entry) => entry.path)).toEqual(['b'])
    expect(result.after.totalTokens).toBe(9)
  })

  it('throws when maxInputTokens is below fixed overhead', () => {
    const entries: ContextEntry[] = [{ path: 'a', content: '1', source: 'file' }]

    expect(() =>
      evaluateContextBudget({
        intentText: '7',
        metaInstructions: '6',
        contextEntries: entries,
        maxInputTokens: 10,
        strategy: 'drop-oldest',
        buildTelemetry: buildTelemetryFromNumericContent,
      }),
    ).toThrow(/Unable to satisfy token budgets/)
  })
})
