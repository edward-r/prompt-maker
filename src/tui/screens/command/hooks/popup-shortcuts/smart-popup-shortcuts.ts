import type { Key } from 'ink'

import { isBackspaceKey } from '../../../../components/core/text-input-keys'
import type { PopupState } from '../../../../types'

import { guardPopupUpdater, type PopupShortcutEffect } from './types'
import { getSuggestedInputPopupEffect } from './suggested-input'

export type HandleSmartPopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'smart' }>
  input: string
  key: Key
  suggestions: readonly string[]
  smartContextRoot: string | null
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  closePopup: () => void
  onSmartRootSubmit: (value: string) => void
}

const applySmartPopupEffect = (
  effect: PopupShortcutEffect,
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void,
  closePopup: () => void,
): void => {
  if (effect.type === 'close') {
    closePopup()
    return
  }

  if (effect.type === 'set') {
    setPopupState(effect.updater)
  }
}

export const handleSmartPopupShortcuts = ({
  popupState,
  input,
  key,
  suggestions,
  smartContextRoot,
  setPopupState,
  closePopup,
  onSmartRootSubmit,
}: HandleSmartPopupShortcutsOptions): void => {
  const hasSuggestions = suggestions.length > 0

  if (popupState.suggestedFocused && hasSuggestions) {
    const effect = getSuggestedInputPopupEffect({
      popupType: 'smart',
      popupState,
      suggestions,
      key,
    })

    if (effect.type === 'selectSuggestion') {
      setPopupState(
        guardPopupUpdater('smart', (prev) => ({
          ...prev,
          draft: effect.value,
          suggestedFocused: false,
        })),
      )
      return
    }

    applySmartPopupEffect(effect, setPopupState, closePopup)
    return
  }

  const effect = getSuggestedInputPopupEffect({
    popupType: 'smart',
    popupState,
    suggestions,
    key,
  })

  if (effect.type === 'selectSuggestion') {
    setPopupState(
      guardPopupUpdater('smart', (prev) => ({
        ...prev,
        draft: effect.value,
        suggestedFocused: false,
      })),
    )
    return
  }

  applySmartPopupEffect(effect, setPopupState, closePopup)

  if (effect.type !== 'none') {
    return
  }

  const draftIsEmpty = popupState.draft.trim().length === 0

  if ((key.delete || (draftIsEmpty && isBackspaceKey(input, key))) && smartContextRoot) {
    onSmartRootSubmit('')
  }
}
