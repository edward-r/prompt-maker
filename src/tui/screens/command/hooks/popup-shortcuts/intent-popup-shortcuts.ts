import type { Key } from 'ink'

import type { PopupState } from '../../../../types'

import { getSuggestedInputPopupEffect } from './suggested-input'

export type HandleIntentPopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'intent' }>
  key: Key
  suggestions: readonly string[]
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  closePopup: () => void
  onIntentFileSubmit: (value: string) => void
}

export const handleIntentPopupShortcuts = ({
  popupState,
  key,
  suggestions,
  setPopupState,
  closePopup,
  onIntentFileSubmit,
}: HandleIntentPopupShortcutsOptions): void => {
  const effect = getSuggestedInputPopupEffect({
    popupType: 'intent',
    popupState,
    suggestions,
    key,
  })

  switch (effect.type) {
    case 'close':
      closePopup()
      return

    case 'set':
      setPopupState(effect.updater)
      return

    case 'selectSuggestion':
      onIntentFileSubmit(effect.value)
      return

    case 'remove':
    case 'none':
      return

    default: {
      const exhaustive: never = effect
      return exhaustive
    }
  }
}
