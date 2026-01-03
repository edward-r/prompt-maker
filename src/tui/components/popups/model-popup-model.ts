import { MODEL_PROVIDER_LABELS } from '../../../model-providers'
import { ensureLeadingHeaderVisible, resolveWindowedValues } from './list-windowing'
import type { WindowBounds } from './list-windowing'
import type { ModelOption } from '../../types'

export type ModelPopupRow =
  | { type: 'header'; title: string }
  | { type: 'spacer' }
  | { type: 'option'; option: ModelOption; optionIndex: number }

export const buildModelPopupRows = (
  options: readonly ModelOption[],
  recentCount: number,
): ModelPopupRow[] => {
  if (options.length === 0) {
    return []
  }

  const rows: ModelPopupRow[] = []

  const safeRecentCount = Math.max(0, Math.min(recentCount, options.length))
  if (safeRecentCount > 0) {
    rows.push({ type: 'header', title: 'Recent' })
    for (let index = 0; index < safeRecentCount; index += 1) {
      const option = options[index]
      if (!option) {
        continue
      }
      rows.push({ type: 'option', option, optionIndex: index })
    }
    if (safeRecentCount < options.length) {
      rows.push({ type: 'spacer' })
    }
  }

  let lastProvider: string | null = null
  for (let index = safeRecentCount; index < options.length; index += 1) {
    const option = options[index]
    if (!option) {
      continue
    }

    const providerLabel = MODEL_PROVIDER_LABELS[option.provider]
    if (providerLabel !== lastProvider) {
      rows.push({ type: 'header', title: providerLabel })
      lastProvider = providerLabel
    }

    rows.push({ type: 'option', option, optionIndex: index })
  }

  return rows
}

export const resolveModelPopupSelectedRowIndex = (
  rows: readonly ModelPopupRow[],
  selectedOptionIndex: number,
): number => {
  if (rows.length === 0) {
    return 0
  }

  const index = rows.findIndex(
    (row) => row.type === 'option' && row.optionIndex === selectedOptionIndex,
  )

  return index >= 0 ? index : 0
}

export type ModelPopupVisibleRows = {
  slice: WindowBounds
  selectedRowIndex: number
  visibleRows: readonly ModelPopupRow[]
}

export const resolveModelPopupVisibleRows = ({
  rows,
  selectedOptionIndex,
  maxVisibleRows,
}: {
  rows: readonly ModelPopupRow[]
  selectedOptionIndex: number
  maxVisibleRows: number
}): ModelPopupVisibleRows => {
  const selectedRowIndex = resolveModelPopupSelectedRowIndex(rows, selectedOptionIndex)

  const window = resolveWindowedValues(rows, selectedRowIndex, maxVisibleRows)

  const slice = ensureLeadingHeaderVisible(
    rows,
    { start: window.start, end: window.end },
    maxVisibleRows,
    'header',
    'option',
  )

  const base = rows.slice(slice.start, slice.end)
  if (base.length >= maxVisibleRows) {
    return { slice, selectedRowIndex, visibleRows: base }
  }

  const padded: ModelPopupRow[] = [...base]
  while (padded.length < maxVisibleRows) {
    padded.push({ type: 'spacer' })
  }

  return { slice, selectedRowIndex, visibleRows: padded }
}
