import type { Key } from 'ink'

import { isBackspaceKey } from '../../../../components/core/text-input-keys'
import type { ModelOption, PopupState } from '../../../../types'

import { clampIndex, wrapIndex } from './selection'
import { guardPopupUpdater } from './types'

export type HandleModelPopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'model' }>
  input: string
  key: Key
  options: readonly ModelOption[]
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  closePopup: () => void
  onModelPopupSubmit: (option: ModelOption | null | undefined) => void
}

export const handleModelPopupShortcuts = ({
  popupState,
  input,
  key,
  options,
  setPopupState,
  closePopup,
  onModelPopupSubmit,
}: HandleModelPopupShortcutsOptions): void => {
  const modelSelectionIndex = clampIndex(popupState.selectionIndex, options.length)

  if (key.upArrow && options.length > 0) {
    setPopupState(
      guardPopupUpdater('model', (prev) => ({
        ...prev,
        selectionIndex: wrapIndex(prev.selectionIndex - 1, options.length),
      })),
    )
    return
  }

  if (key.downArrow && options.length > 0) {
    setPopupState(
      guardPopupUpdater('model', (prev) => ({
        ...prev,
        selectionIndex: wrapIndex(prev.selectionIndex + 1, options.length),
      })),
    )
    return
  }

  const draftIsEmpty = popupState.query.trim().length === 0

  if (
    popupState.kind === 'polish' &&
    (key.delete || (draftIsEmpty && isBackspaceKey(input, key)))
  ) {
    onModelPopupSubmit(null)
    return
  }

  if (key.escape) {
    closePopup()
    return
  }

  if (key.return) {
    onModelPopupSubmit(options[modelSelectionIndex])
  }
}
