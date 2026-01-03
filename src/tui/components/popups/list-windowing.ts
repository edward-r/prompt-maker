import { resolveWindowedList } from './list-window'

export type WindowedValues<T> = {
  start: number
  end: number
  values: readonly T[]
  showBefore: boolean
  showAfter: boolean
}

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

export const clampSelectionIndex = (itemCount: number, selectedIndex: number): number => {
  if (itemCount <= 0) {
    return 0
  }

  return clamp(selectedIndex, 0, itemCount - 1)
}

export type ResolveWindowedValuesOptions = {
  lead?: number
}

export const resolveWindowedValues = <T>(
  items: readonly T[],
  selectedIndex: number,
  maxVisibleRows: number,
  options: ResolveWindowedValuesOptions = {},
): WindowedValues<T> => {
  if (items.length === 0 || maxVisibleRows <= 0) {
    return {
      start: 0,
      end: 0,
      values: [],
      showBefore: false,
      showAfter: false,
    }
  }

  const window = resolveWindowedList({
    itemCount: items.length,
    selectedIndex,
    maxVisibleRows,
    ...(options.lead === undefined ? {} : { lead: options.lead }),
  })

  return {
    start: window.start,
    end: window.end,
    values: items.slice(window.start, window.end),
    showBefore: window.showBefore,
    showAfter: window.showAfter,
  }
}

export type WindowBounds = {
  start: number
  end: number
}

export const ensureLeadingHeaderVisible = <Row extends { type: string }>(
  rows: readonly Row[],
  bounds: WindowBounds,
  maxRows: number,
  headerType: Row['type'],
  itemType: Row['type'],
): WindowBounds => {
  const { start, end } = bounds

  if (start <= 0 || end - start >= maxRows) {
    return bounds
  }

  const first = rows[start]
  const previous = rows[start - 1]

  if (first?.type === itemType && previous?.type === headerType) {
    const nextStart = start - 1
    const nextEnd = Math.min(rows.length, nextStart + maxRows)
    return { start: nextStart, end: nextEnd }
  }

  return bounds
}
