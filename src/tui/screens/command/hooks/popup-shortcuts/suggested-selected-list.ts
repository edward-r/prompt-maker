import type { PopupState } from '../../../../types'

import { clampIndex } from './selection'
import {
  NO_EFFECT,
  guardPopupUpdater,
  type PopupKey,
  type PopupShortcutEffect,
  type PopupStateFor,
  type PopupType,
} from './types'

export type SuggestedSelectedListPopupType = Extract<PopupType, 'file' | 'image' | 'video' | 'pdf'>
export type SuggestedSelectedListPopupState =
  | PopupStateFor<'file'>
  | PopupStateFor<'image'>
  | PopupStateFor<'video'>
  | PopupStateFor<'pdf'>

export type GetSuggestedSelectedListEffectOptions = {
  popupType: SuggestedSelectedListPopupType
  popupState: SuggestedSelectedListPopupState
  itemsLength: number
  suggestions: readonly string[]
  key: PopupKey
  isBackspace: boolean
}

const guardSuggestedSelectedListUpdater = (
  popupType: SuggestedSelectedListPopupType,
  updater: (prev: SuggestedSelectedListPopupState) => SuggestedSelectedListPopupState,
): ((prev: PopupState) => PopupState) => {
  return guardPopupUpdater(
    popupType,
    updater as (prev: PopupStateFor<typeof popupType>) => PopupStateFor<typeof popupType>,
  )
}

export const getSuggestedSelectedListPopupEffect = ({
  popupType,
  popupState,
  itemsLength,
  suggestions,
  key,
  isBackspace,
}: GetSuggestedSelectedListEffectOptions): PopupShortcutEffect => {
  const hasSuggestions = suggestions.length > 0
  const maxSuggestedIndex = Math.max(suggestions.length - 1, 0)
  const draftIsEmpty = popupState.draft.trim().length === 0

  if (key.escape) {
    return { type: 'close' }
  }

  if (popupState.suggestedFocused && hasSuggestions) {
    if (key.tab) {
      return {
        type: 'set',
        updater: guardSuggestedSelectedListUpdater(popupType, (prev) => ({
          ...prev,
          suggestedFocused: false,
        })),
      }
    }

    if (key.upArrow) {
      return {
        type: 'set',
        updater: guardSuggestedSelectedListUpdater(popupType, (prev) => {
          const effectiveIndex = clampIndex(prev.suggestedSelectionIndex, suggestions.length)

          if (effectiveIndex === 0) {
            return {
              ...prev,
              suggestedFocused: false,
              selectedFocused: itemsLength > 0,
            }
          }

          return {
            ...prev,
            suggestedSelectionIndex: Math.max(prev.suggestedSelectionIndex - 1, 0),
          }
        }),
      }
    }

    if (key.downArrow) {
      return {
        type: 'set',
        updater: guardSuggestedSelectedListUpdater(popupType, (prev) => ({
          ...prev,
          suggestedSelectionIndex: Math.min(prev.suggestedSelectionIndex + 1, maxSuggestedIndex),
        })),
      }
    }

    if (key.return) {
      const effectiveIndex = clampIndex(popupState.suggestedSelectionIndex, suggestions.length)
      const selection = suggestions[effectiveIndex]
      return selection ? { type: 'selectSuggestion', value: selection } : NO_EFFECT
    }

    return NO_EFFECT
  }

  if (key.tab && !key.shift && hasSuggestions) {
    return {
      type: 'set',
      updater: guardSuggestedSelectedListUpdater(popupType, (prev) => ({
        ...prev,
        suggestedFocused: true,
        selectedFocused: false,
        suggestedSelectionIndex: 0,
      })),
    }
  }

  if (!popupState.selectedFocused && (key.upArrow || key.downArrow) && itemsLength > 0) {
    return {
      type: 'set',
      updater: guardSuggestedSelectedListUpdater(popupType, (prev) => ({
        ...prev,
        selectedFocused: true,
        selectionIndex: clampIndex(prev.selectionIndex, itemsLength),
      })),
    }
  }

  if (popupState.selectedFocused) {
    if (key.upArrow) {
      return {
        type: 'set',
        updater: guardSuggestedSelectedListUpdater(popupType, (prev) => {
          if (prev.selectionIndex === 0) {
            return { ...prev, selectedFocused: false }
          }

          return { ...prev, selectionIndex: Math.max(prev.selectionIndex - 1, 0) }
        }),
      }
    }

    if (key.downArrow) {
      return {
        type: 'set',
        updater: guardSuggestedSelectedListUpdater(popupType, (prev) => {
          if (itemsLength === 0) {
            return { ...prev, selectedFocused: false }
          }

          if (prev.selectionIndex >= itemsLength - 1) {
            return hasSuggestions
              ? {
                  ...prev,
                  suggestedFocused: true,
                  selectedFocused: false,
                  suggestedSelectionIndex: 0,
                }
              : prev
          }

          return {
            ...prev,
            selectionIndex: Math.min(prev.selectionIndex + 1, itemsLength - 1),
          }
        }),
      }
    }

    if (key.delete || isBackspace) {
      return itemsLength > 0 ? { type: 'remove', index: popupState.selectionIndex } : NO_EFFECT
    }

    return NO_EFFECT
  }

  if (key.downArrow && itemsLength === 0 && hasSuggestions) {
    return {
      type: 'set',
      updater: guardSuggestedSelectedListUpdater(popupType, (prev) => ({
        ...prev,
        suggestedFocused: true,
        selectedFocused: false,
        suggestedSelectionIndex: 0,
      })),
    }
  }

  // Backspace-remove remains available when the input is empty.
  if (draftIsEmpty && isBackspace && itemsLength > 0) {
    return { type: 'remove', index: popupState.selectionIndex }
  }

  return NO_EFFECT
}

export const applySuggestedSelectedListEffect = (
  effect: PopupShortcutEffect,
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void,
  closePopup: () => void,
  onRemove: (index: number) => void,
  onSelectSuggestion: (value: string) => void,
): void => {
  switch (effect.type) {
    case 'close':
      closePopup()
      return

    case 'set':
      setPopupState(effect.updater)
      return

    case 'remove':
      onRemove(effect.index)
      return

    case 'selectSuggestion':
      onSelectSuggestion(effect.value)
      return

    case 'none':
      return

    default: {
      const exhaustive: never = effect
      return exhaustive
    }
  }
}
