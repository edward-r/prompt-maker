import type { Key } from 'ink'

import { isBackspaceKey } from '../../../../components/core/text-input-keys'
import type { PopupState } from '../../../../types'

import {
  applySuggestedSelectedListEffect,
  getSuggestedSelectedListPopupEffect,
  type SuggestedSelectedListPopupState,
  type SuggestedSelectedListPopupType,
} from './suggested-selected-list'

export type HandleSuggestedSelectedListPopupShortcutsOptions = {
  popupType: SuggestedSelectedListPopupType
  popupState: SuggestedSelectedListPopupState
  input: string
  key: Key
  itemsLength: number
  suggestions: readonly string[]

  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  closePopup: () => void
  onRemove: (index: number) => void
  onSelectSuggestion: (value: string) => void
}

export const handleSuggestedSelectedListPopupShortcuts = ({
  popupType,
  popupState,
  input,
  key,
  itemsLength,
  suggestions,
  setPopupState,
  closePopup,
  onRemove,
  onSelectSuggestion,
}: HandleSuggestedSelectedListPopupShortcutsOptions): void => {
  const effect = getSuggestedSelectedListPopupEffect({
    popupType,
    popupState,
    itemsLength,
    suggestions,
    key,
    isBackspace: isBackspaceKey(input, key),
  })

  applySuggestedSelectedListEffect(effect, setPopupState, closePopup, onRemove, onSelectSuggestion)
}
