import type { Key } from 'ink'

import type { PopupState, ToggleField } from '../../../../types'

import { wrapIndex } from './selection'
import { guardPopupUpdater } from './types'

const TOGGLE_OPTION_COUNT = 2

export type HandleTogglePopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'toggle' }>
  key: Key
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  closePopup: () => void
  applyToggleSelection: (field: ToggleField, value: boolean) => void
}

export const handleTogglePopupShortcuts = ({
  popupState,
  key,
  setPopupState,
  closePopup,
  applyToggleSelection,
}: HandleTogglePopupShortcutsOptions): void => {
  if (key.leftArrow || key.upArrow) {
    setPopupState(
      guardPopupUpdater('toggle', (prev) => ({
        ...prev,
        selectionIndex: wrapIndex(prev.selectionIndex - 1, TOGGLE_OPTION_COUNT),
      })),
    )
    return
  }

  if (key.rightArrow || key.downArrow) {
    setPopupState(
      guardPopupUpdater('toggle', (prev) => ({
        ...prev,
        selectionIndex: wrapIndex(prev.selectionIndex + 1, TOGGLE_OPTION_COUNT),
      })),
    )
    return
  }

  if (key.escape) {
    closePopup()
    return
  }

  if (key.return) {
    applyToggleSelection(popupState.field, popupState.selectionIndex === 0)
  }
}
