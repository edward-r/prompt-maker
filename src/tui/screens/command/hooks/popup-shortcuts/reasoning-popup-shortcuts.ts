import type { Key } from 'ink'

import type { PopupState } from '../../../../types'

import { clamp } from './selection'
import { guardPopupUpdater } from './types'

export type HandleReasoningPopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'reasoning' }>
  key: Key
  lineCount: number
  visibleRows: number
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  closePopup: () => void
}

export const handleReasoningPopupShortcuts = ({
  key,
  lineCount,
  visibleRows,
  setPopupState,
  closePopup,
}: HandleReasoningPopupShortcutsOptions): void => {
  const maxOffset = Math.max(0, lineCount - visibleRows)

  if (key.upArrow) {
    setPopupState(
      guardPopupUpdater('reasoning', (prev) => ({
        ...prev,
        scrollOffset: clamp(prev.scrollOffset - 1, 0, maxOffset),
      })),
    )
    return
  }

  if (key.downArrow) {
    setPopupState(
      guardPopupUpdater('reasoning', (prev) => ({
        ...prev,
        scrollOffset: clamp(prev.scrollOffset + 1, 0, maxOffset),
      })),
    )
    return
  }

  if (key.pageUp) {
    setPopupState(
      guardPopupUpdater('reasoning', (prev) => ({
        ...prev,
        scrollOffset: clamp(prev.scrollOffset - visibleRows, 0, maxOffset),
      })),
    )
    return
  }

  if (key.pageDown) {
    setPopupState(
      guardPopupUpdater('reasoning', (prev) => ({
        ...prev,
        scrollOffset: clamp(prev.scrollOffset + visibleRows, 0, maxOffset),
      })),
    )
    return
  }

  if (key.escape) {
    closePopup()
  }
}
