import { DEFAULT_MAX_VISIBLE_LIST_ITEMS, resolveListPopupHeights } from './list-popup-layout'
import { resolveCursorWindow } from './list-window'
import { clampSelectionIndex, resolveWindowedValues } from './list-windowing'

export type ListPopupLayout = 'input-first' | 'selected-first'

export type ListPopupRowTone = 'text' | 'muted'
export type ListPopupRowSelection = 'none' | 'focused' | 'unfocused'

export type ListPopupRowModel = {
  key: string
  label: string
  tone: ListPopupRowTone
  selection: ListPopupRowSelection
}

export type ListPopupSectionId = 'selected' | 'suggestions'

export type ListPopupSectionModel = {
  id: ListPopupSectionId
  header: string
  rows: readonly ListPopupRowModel[]
  fixedRowCount?: number
}

export type ListPopupInputModel =
  | {
      variant: 'inline'
      label: string
      focus: boolean
    }
  | {
      variant: 'titled'
      title: string
      focus: boolean
    }

export type ListPopupInstructionsModel = {
  normalizedLines: readonly string[]
  renderLines: readonly string[]
  rowCount: number
}

export type ListPopupBlockModel =
  | {
      type: 'spacer'
      key: string
    }
  | {
      type: 'input'
      input: ListPopupInputModel
    }
  | {
      type: 'section'
      section: ListPopupSectionModel
    }
  | {
      type: 'instructions'
      lines: readonly string[]
    }

export type ListPopupModel = {
  hasSuggestions: boolean
  safeSuggestedSelection: number
  effectiveSuggestedFocused: boolean
  effectiveSelectedFocused: boolean
  shouldHighlightSelectedAsFocused: boolean
  input: ListPopupInputModel
  selectedSection: ListPopupSectionModel
  suggestionsSection?: ListPopupSectionModel
  instructions: ListPopupInstructionsModel
  blocks: readonly ListPopupBlockModel[]
}

export type BuildListPopupModelOptions = {
  items: readonly string[]
  selectedIndex: number
  emptyLabel: string
  instructions: string
  layout: ListPopupLayout
  popupHeight: number
  suggestedItems?: readonly string[]
  suggestedSelectionIndex?: number
  suggestedFocused?: boolean
  selectedFocused?: boolean
}

export const parseListPopupInstructions = (instructions: string): ListPopupInstructionsModel => {
  const normalized = instructions.replaceAll('\\n', '\n')

  const normalizedLines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return {
    normalizedLines,
    renderLines: normalizedLines.length > 0 ? normalizedLines : [instructions],
    rowCount: Math.max(1, normalizedLines.length),
  }
}

const buildSelectedRowsFixedHeight = ({
  items,
  selectedIndex,
  emptyLabel,
  maxRows,
  shouldHighlightSelectedAsFocused,
}: {
  items: readonly string[]
  selectedIndex: number
  emptyLabel: string
  maxRows: number
  shouldHighlightSelectedAsFocused: boolean
}): readonly ListPopupRowModel[] => {
  const rows: Array<ListPopupRowModel> = []

  if (items.length === 0) {
    rows.push({ key: 'empty', label: emptyLabel, tone: 'muted', selection: 'none' })
  } else {
    const window = resolveWindowedValues(items, selectedIndex, maxRows)

    if (window.showBefore) {
      rows.push({
        key: 'before',
        label: '… earlier entries …',
        tone: 'muted',
        selection: 'none',
      })
    }

    window.values.forEach((value, index) => {
      const actualIndex = window.start + index
      const isSelected = actualIndex === selectedIndex

      rows.push({
        key: `${value}-${actualIndex}`,
        label: `${actualIndex + 1}. ${value}`,
        tone: 'text',
        selection: isSelected
          ? shouldHighlightSelectedAsFocused
            ? 'focused'
            : 'unfocused'
          : 'none',
      })
    })

    if (window.showAfter) {
      rows.push({
        key: 'after',
        label: '… later entries …',
        tone: 'muted',
        selection: 'none',
      })
    }
  }

  while (rows.length < maxRows) {
    rows.push({ key: `pad-${rows.length}`, label: '', tone: 'text', selection: 'none' })
  }

  return rows
}

const buildSelectedRowsFreeHeight = ({
  items,
  selectedIndex,
  emptyLabel,
  shouldHighlightSelectedAsFocused,
}: {
  items: readonly string[]
  selectedIndex: number
  emptyLabel: string
  shouldHighlightSelectedAsFocused: boolean
}): readonly ListPopupRowModel[] => {
  const rows: Array<ListPopupRowModel> = []

  if (items.length === 0) {
    rows.push({ key: 'empty', label: emptyLabel, tone: 'muted', selection: 'none' })
    return rows
  }

  const range = resolveCursorWindow(items.length, selectedIndex, DEFAULT_MAX_VISIBLE_LIST_ITEMS)
  const start = range.startIndex
  const end = range.endIndexExclusive

  if (start > 0) {
    rows.push({ key: 'before', label: '… earlier entries …', tone: 'muted', selection: 'none' })
  }

  items.slice(start, end).forEach((value, index) => {
    const actualIndex = start + index
    const isSelected = actualIndex === selectedIndex

    rows.push({
      key: `${value}-${actualIndex}`,
      label: `${actualIndex + 1}. ${value}`,
      tone: 'text',
      selection: isSelected ? (shouldHighlightSelectedAsFocused ? 'focused' : 'unfocused') : 'none',
    })
  })

  if (end < items.length) {
    rows.push({ key: 'after', label: '… later entries …', tone: 'muted', selection: 'none' })
  }

  return rows
}

const buildSuggestionRows = ({
  suggestedItems,
  safeSuggestedSelection,
  maxRows,
  effectiveSuggestedFocused,
}: {
  suggestedItems: readonly string[]
  safeSuggestedSelection: number
  maxRows: number
  effectiveSuggestedFocused: boolean
}): readonly ListPopupRowModel[] => {
  const rows: Array<ListPopupRowModel> = []

  if (maxRows <= 0) {
    return rows
  }

  const window = resolveWindowedValues(suggestedItems, safeSuggestedSelection, maxRows, { lead: 1 })

  if (window.showBefore) {
    rows.push({
      key: 'before',
      label: '… earlier suggestions …',
      tone: 'muted',
      selection: 'none',
    })
  }

  window.values.forEach((value, index) => {
    const actualIndex = window.start + index
    const isSelected = actualIndex === safeSuggestedSelection

    rows.push({
      key: `${value}-${actualIndex}`,
      label: value,
      tone: 'text',
      selection: isSelected ? (effectiveSuggestedFocused ? 'focused' : 'unfocused') : 'none',
    })
  })

  if (window.showAfter) {
    rows.push({
      key: 'after',
      label: '… later suggestions …',
      tone: 'muted',
      selection: 'none',
    })
  }

  while (rows.length < maxRows) {
    rows.push({ key: `pad-${rows.length}`, label: '', tone: 'text', selection: 'none' })
  }

  return rows
}

export const buildListPopupModel = (options: BuildListPopupModelOptions): ListPopupModel => {
  const {
    items,
    selectedIndex,
    emptyLabel,
    instructions,
    suggestedItems,
    suggestedSelectionIndex,
    suggestedFocused,
    selectedFocused,
    layout,
    popupHeight,
  } = options

  const safeSuggestedItems = suggestedItems ?? []
  const hasSuggestions = safeSuggestedItems.length > 0

  const safeSuggestedSelection = clampSelectionIndex(
    safeSuggestedItems.length,
    suggestedSelectionIndex ?? 0,
  )

  const effectiveSuggestedFocused = Boolean(hasSuggestions && suggestedFocused)
  const effectiveSelectedFocused = Boolean(selectedFocused)
  const shouldHighlightSelectedAsFocused = selectedFocused ?? true

  const instructionsModel = parseListPopupInstructions(instructions)

  const heights = resolveListPopupHeights({
    maxHeight: popupHeight,
    hasSuggestions,
    instructionRows: instructionsModel.rowCount,
  })

  const selectedRows = hasSuggestions
    ? buildSelectedRowsFixedHeight({
        items,
        selectedIndex,
        emptyLabel,
        maxRows: heights.selectedRows,
        shouldHighlightSelectedAsFocused,
      })
    : buildSelectedRowsFreeHeight({
        items,
        selectedIndex,
        emptyLabel,
        shouldHighlightSelectedAsFocused,
      })

  const selectedSection: ListPopupSectionModel = {
    id: 'selected',
    header: 'Selected',
    rows: selectedRows,
    ...(hasSuggestions ? { fixedRowCount: heights.selectedRows } : {}),
  }

  const suggestionsSection: ListPopupSectionModel | undefined =
    hasSuggestions && heights.suggestionRows > 0
      ? {
          id: 'suggestions',
          header: 'Suggestions',
          rows: buildSuggestionRows({
            suggestedItems: safeSuggestedItems,
            safeSuggestedSelection,
            maxRows: heights.suggestionRows,
            effectiveSuggestedFocused,
          }),
          fixedRowCount: heights.suggestionRows,
        }
      : undefined

  const input: ListPopupInputModel = hasSuggestions
    ? {
        variant: 'inline',
        label: 'Add:',
        focus: !effectiveSuggestedFocused && !effectiveSelectedFocused,
      }
    : {
        variant: 'titled',
        title: 'Add new',
        focus: !effectiveSelectedFocused,
      }

  const blocks: Array<ListPopupBlockModel> = []

  if (!hasSuggestions) {
    blocks.push({ type: 'spacer', key: 'after-title' })
  }

  const pushInputAndSelected = (): void => {
    if (layout === 'selected-first') {
      blocks.push({ type: 'section', section: selectedSection })
      if (!hasSuggestions) {
        blocks.push({ type: 'spacer', key: 'between-selected-and-input' })
      }
      blocks.push({ type: 'input', input })
      return
    }

    blocks.push({ type: 'input', input })
    if (!hasSuggestions) {
      blocks.push({ type: 'spacer', key: 'between-input-and-selected' })
    }
    blocks.push({ type: 'section', section: selectedSection })
  }

  pushInputAndSelected()

  if (suggestionsSection) {
    blocks.push({ type: 'section', section: suggestionsSection })
  }

  if (!hasSuggestions && instructionsModel.rowCount <= 1) {
    blocks.push({ type: 'spacer', key: 'before-instructions' })
  }

  blocks.push({ type: 'instructions', lines: instructionsModel.renderLines })

  return {
    hasSuggestions,
    safeSuggestedSelection,
    effectiveSuggestedFocused,
    effectiveSelectedFocused,
    shouldHighlightSelectedAsFocused,
    input,
    selectedSection,
    ...(suggestionsSection ? { suggestionsSection } : {}),
    instructions: instructionsModel,
    blocks,
  }
}
