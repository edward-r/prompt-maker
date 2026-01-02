import type { Key } from 'ink'

import type { PopupState } from '../../../../types'

import { guardPopupUpdater } from './types'

export type HandleHistoryPopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'history' }>
  key: Key
  itemCount: number
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  closePopup: () => void
}

export const handleHistoryPopupShortcuts = ({
  key,
  itemCount,
  setPopupState,
  closePopup,
}: HandleHistoryPopupShortcutsOptions): void => {
  if (key.upArrow && itemCount > 0) {
    setPopupState(
      guardPopupUpdater('history', (prev) => ({
        ...prev,
        selectionIndex: Math.max(prev.selectionIndex - 1, 0),
      })),
    )
    return
  }

  if (key.downArrow && itemCount > 0) {
    setPopupState(
      guardPopupUpdater('history', (prev) => ({
        ...prev,
        selectionIndex: Math.min(prev.selectionIndex + 1, itemCount - 1),
      })),
    )
    return
  }

  if (key.escape) {
    closePopup()
  }
}
