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

export type SuggestedInputPopupType = Extract<PopupType, 'smart' | 'intent'>
export type SuggestedInputPopupState = PopupStateFor<'smart'> | PopupStateFor<'intent'>

export type GetSuggestedInputPopupEffectOptions = {
  popupType: SuggestedInputPopupType
  popupState: SuggestedInputPopupState
  suggestions: readonly string[]
  key: PopupKey
}

const guardSuggestedInputUpdater = (
  popupType: SuggestedInputPopupType,
  updater: (prev: SuggestedInputPopupState) => SuggestedInputPopupState,
): ((prev: PopupState) => PopupState) => {
  return guardPopupUpdater(
    popupType,
    updater as (prev: PopupStateFor<typeof popupType>) => PopupStateFor<typeof popupType>,
  )
}

export const getSuggestedInputPopupEffect = ({
  popupType,
  popupState,
  suggestions,
  key,
}: GetSuggestedInputPopupEffectOptions): PopupShortcutEffect => {
  const hasSuggestions = suggestions.length > 0
  const maxSuggestedIndex = Math.max(suggestions.length - 1, 0)

  if (key.escape) {
    return { type: 'close' }
  }

  if (popupState.suggestedFocused && hasSuggestions) {
    if (key.tab) {
      return {
        type: 'set',
        updater: guardSuggestedInputUpdater(popupType, (prev) => ({
          ...prev,
          suggestedFocused: false,
        })),
      }
    }

    if (key.upArrow) {
      return {
        type: 'set',
        updater: guardSuggestedInputUpdater(popupType, (prev) => {
          const effectiveIndex = clampIndex(prev.suggestedSelectionIndex, suggestions.length)

          if (effectiveIndex === 0) {
            return { ...prev, suggestedFocused: false }
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
        updater: guardSuggestedInputUpdater(popupType, (prev) => ({
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
      updater: guardSuggestedInputUpdater(popupType, (prev) => ({
        ...prev,
        suggestedFocused: true,
        suggestedSelectionIndex: 0,
      })),
    }
  }

  if (key.downArrow && hasSuggestions) {
    return {
      type: 'set',
      updater: guardSuggestedInputUpdater(popupType, (prev) => ({
        ...prev,
        suggestedFocused: true,
        suggestedSelectionIndex: 0,
      })),
    }
  }

  return NO_EFFECT
}
