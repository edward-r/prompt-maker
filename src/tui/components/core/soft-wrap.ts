export type SoftWrapWidths = {
  readonly first: number
  readonly rest: number
}

export type SoftWrappedLine = {
  readonly segments: readonly string[]
  readonly segmentStarts: readonly number[]
  readonly segmentWidths: readonly number[]
}

export type SoftWrapCursorOffset = {
  readonly rowOffset: number
  readonly column: number
  readonly needsTrailingEmptyLine: boolean
}

const normalizeWrapWidth = (width: number): number => {
  if (!Number.isFinite(width)) {
    return 1
  }

  return Math.max(1, Math.floor(width))
}

export const softWrapLine = (displayLine: string, widths: SoftWrapWidths): SoftWrappedLine => {
  const firstWidth = normalizeWrapWidth(widths.first)
  const restWidth = normalizeWrapWidth(widths.rest)

  const segments: string[] = []
  const segmentStarts: number[] = []
  const segmentWidths: number[] = []

  if (!displayLine) {
    segments.push('')
    segmentStarts.push(0)
    segmentWidths.push(firstWidth)
    return { segments, segmentStarts, segmentWidths }
  }

  const whitespacePattern = /\s/

  let offset = 0
  let segmentIndex = 0
  while (offset < displayLine.length) {
    const segmentWidth = segmentIndex === 0 ? firstWidth : restWidth
    const window = displayLine.slice(offset, offset + segmentWidth)

    let breakIndex = window.length

    // Prefer breaking after the last whitespace that fits in the window.
    // Keep the whitespace on the previous segment to avoid trimming and to
    // preserve cursor-to-display mappings.
    const hasMoreContent = offset + window.length < displayLine.length
    if (hasMoreContent && window.length === segmentWidth) {
      for (let index = window.length - 1; index >= 0; index -= 1) {
        const character = window.charAt(index)
        if (whitespacePattern.test(character)) {
          breakIndex = index + 1
          break
        }
      }
    }

    const next = window.slice(0, breakIndex)

    segments.push(next)
    segmentStarts.push(offset)
    segmentWidths.push(segmentWidth)

    offset += next.length
    segmentIndex += 1
  }

  return { segments, segmentStarts, segmentWidths }
}

export const getSoftWrappedCursorOffset = (
  wrapped: SoftWrappedLine,
  displayColumn: number,
): SoftWrapCursorOffset => {
  const safeColumn = Math.max(0, Math.floor(displayColumn))
  const totalLength = wrapped.segments.reduce((sum, segment) => sum + segment.length, 0)
  const clampedColumn = Math.min(safeColumn, totalLength)

  if (totalLength === 0) {
    return { rowOffset: 0, column: 0, needsTrailingEmptyLine: false }
  }

  // Cursor is inside the rendered characters.
  if (clampedColumn < totalLength) {
    for (let index = 0; index < wrapped.segments.length; index += 1) {
      const segment = wrapped.segments[index]
      const segmentStart = wrapped.segmentStarts[index]

      if (segment === undefined || segmentStart === undefined) {
        continue
      }

      const segmentEnd = segmentStart + segment.length
      if (clampedColumn < segmentEnd) {
        return {
          rowOffset: index,
          column: clampedColumn - segmentStart,
          needsTrailingEmptyLine: false,
        }
      }
    }

    // Fallback to last segment if something unexpected happens.
    const lastIndex = Math.max(0, wrapped.segments.length - 1)
    const lastStart = wrapped.segmentStarts[lastIndex] ?? 0
    return {
      rowOffset: lastIndex,
      column: Math.max(0, clampedColumn - lastStart),
      needsTrailingEmptyLine: false,
    }
  }

  // Cursor is at end-of-line: place it after the last character.
  const lastIndex = Math.max(0, wrapped.segments.length - 1)
  const lastSegment = wrapped.segments[lastIndex] ?? ''
  const lastWidth = wrapped.segmentWidths[lastIndex] ?? 1

  if (lastSegment.length >= lastWidth) {
    // The last segment has no remaining cells to render the cursor.
    return { rowOffset: wrapped.segments.length, column: 0, needsTrailingEmptyLine: true }
  }

  return { rowOffset: lastIndex, column: lastSegment.length, needsTrailingEmptyLine: false }
}
