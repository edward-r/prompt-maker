import type { Key } from 'ink'

import type { PopupState } from '../../../../types'

import { wrapIndex } from './selection'
import { guardPopupUpdater } from './types'

export type HandleThemePopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'theme' }>
  key: Key
  themeCount: number
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  onThemeConfirm: () => void
  onThemeCancel: () => void
}

export const handleThemePopupShortcuts = ({
  key,
  themeCount,
  setPopupState,
  onThemeConfirm,
  onThemeCancel,
}: HandleThemePopupShortcutsOptions): void => {
  if (key.upArrow && themeCount > 0) {
    setPopupState(
      guardPopupUpdater('theme', (prev) => ({
        ...prev,
        selectionIndex: wrapIndex(prev.selectionIndex - 1, themeCount),
      })),
    )
    return
  }

  if (key.downArrow && themeCount > 0) {
    setPopupState(
      guardPopupUpdater('theme', (prev) => ({
        ...prev,
        selectionIndex: wrapIndex(prev.selectionIndex + 1, themeCount),
      })),
    )
    return
  }

  if (key.escape) {
    onThemeCancel()
    return
  }

  if (key.return) {
    onThemeConfirm()
  }
}

export type HandleThemeModePopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'themeMode' }>
  key: Key
  optionCount: number
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  onThemeModeConfirm: () => void
  onThemeModeCancel: () => void
}

export const handleThemeModePopupShortcuts = ({
  key,
  optionCount,
  setPopupState,
  onThemeModeConfirm,
  onThemeModeCancel,
}: HandleThemeModePopupShortcutsOptions): void => {
  if ((key.leftArrow || key.upArrow) && optionCount > 0) {
    setPopupState(
      guardPopupUpdater('themeMode', (prev) => ({
        ...prev,
        selectionIndex: wrapIndex(prev.selectionIndex - 1, optionCount),
      })),
    )
    return
  }

  if ((key.rightArrow || key.downArrow) && optionCount > 0) {
    setPopupState(
      guardPopupUpdater('themeMode', (prev) => ({
        ...prev,
        selectionIndex: wrapIndex(prev.selectionIndex + 1, optionCount),
      })),
    )
    return
  }

  if (key.escape) {
    onThemeModeCancel()
    return
  }

  if (key.return) {
    onThemeModeConfirm()
  }
}
