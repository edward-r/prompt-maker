import { parseAbsolutePathFromInput } from '../../../../drag-drop-path'
import type { PopupState } from '../../../../types'

export const clampSelectionIndex = (selectionIndex: number, itemsLength: number): number =>
  Math.min(selectionIndex, Math.max(itemsLength - 1, 0))

type DeriveSuggestionsViewModelOptions = {
  draft: string
  suggestedItems: string[]
  suggestedSelectionIndex: number
  suggestedFocused: boolean
  filterSuggestions: (query: string, suggestions: string[]) => string[]
}

export type SuggestionsViewModel = {
  suggestions: string[]
  selectionIndex: number
  focused: boolean
  shouldDefocus: boolean
}

export const deriveSuggestionsViewModel = ({
  draft,
  suggestedItems,
  suggestedSelectionIndex,
  suggestedFocused,
  filterSuggestions,
}: DeriveSuggestionsViewModelOptions): SuggestionsViewModel => {
  if (suggestedItems.length === 0) {
    return {
      suggestions: [],
      selectionIndex: 0,
      focused: false,
      shouldDefocus: suggestedFocused,
    }
  }

  if (!draft.trim()) {
    return {
      suggestions: [],
      selectionIndex: 0,
      focused: false,
      shouldDefocus: suggestedFocused,
    }
  }

  const suggestions = filterSuggestions(draft, suggestedItems)
  const selectionIndex = clampSelectionIndex(suggestedSelectionIndex, suggestions.length)

  return {
    suggestions,
    selectionIndex,
    focused: suggestedFocused && suggestions.length > 0,
    shouldDefocus: suggestedFocused && suggestions.length === 0,
  }
}

type SuggestionFocusState = {
  suggestedFocused: boolean
  suggestedSelectionIndex: number
}

export const defocusSuggestionsIfEmpty = <T extends SuggestionFocusState>(
  prev: T,
  suggestionsLength: number,
): T => {
  if (!prev.suggestedFocused) {
    return prev
  }

  if (suggestionsLength > 0) {
    return prev
  }

  return { ...prev, suggestedFocused: false, suggestedSelectionIndex: 0 }
}

type SuggestedInputPopupState = {
  draft: string
  suggestedSelectionIndex: number
  suggestedFocused: boolean
}

export const updateSuggestedInputDraft = <T extends SuggestedInputPopupState>(
  prev: T,
  nextDraft: string,
): T => ({ ...prev, draft: nextDraft, suggestedSelectionIndex: 0, suggestedFocused: false })

type SuggestedSelectedListPopupState = {
  draft: string
  selectionIndex: number
  selectedFocused: boolean
  suggestedSelectionIndex: number
  suggestedFocused: boolean
}

export const updateSuggestedSelectedListDraft = <T extends SuggestedSelectedListPopupState>(
  prev: T,
  nextDraft: string,
): T => ({
  ...prev,
  draft: nextDraft,
  selectedFocused: false,
  suggestedSelectionIndex: 0,
  suggestedFocused: false,
})

export const resetSuggestedSelectedListAfterAdd = <T extends SuggestedSelectedListPopupState>(
  prev: T,
  nextSelectionIndex: number,
): T => ({
  ...prev,
  draft: '',
  selectionIndex: nextSelectionIndex,
  selectedFocused: false,
  suggestedFocused: false,
  suggestedSelectionIndex: 0,
})

export const getAutoAddAbsolutePathCandidate = (
  draft: string,
  isFilePath: (candidate: string) => boolean,
): string | null => {
  const candidate = parseAbsolutePathFromInput(draft)
  if (!candidate) {
    return null
  }

  return isFilePath(candidate) ? candidate : null
}

export const guardPopupUpdater = <T extends NonNullable<PopupState>['type']>(
  popupType: T,
  updater: (prev: Extract<NonNullable<PopupState>, { type: T }>) => PopupState,
): ((prev: PopupState) => PopupState) => {
  return (prev) => {
    if (!prev || prev.type !== popupType) {
      return prev
    }

    return updater(prev as Extract<NonNullable<PopupState>, { type: T }>)
  }
}
