import type { Key } from 'ink'

import { isBackspaceKey } from '../../../../components/core/text-input-keys'
import type { PopupState } from '../../../../types'

import { isControlKey } from '../../utils/control-key'

import { clampIndex } from './selection'
import { guardPopupUpdater } from './types'

export type HandleUrlPopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'url' }>
  input: string
  key: Key
  urls: readonly string[]
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  closePopup: () => void
  onRemoveUrl: (index: number) => void
}

export const handleUrlPopupShortcuts = ({
  popupState,
  input,
  key,
  urls,
  setPopupState,
  closePopup,
  onRemoveUrl,
}: HandleUrlPopupShortcutsOptions): void => {
  const draftIsEmpty = popupState.draft.trim().length === 0

  if (popupState.editingIndex !== null) {
    if (key.escape) {
      setPopupState(
        guardPopupUpdater('url', (prev) => ({
          ...prev,
          draft: '',
          editingIndex: null,
          selectedFocused: false,
        })),
      )
      return
    }

    if (draftIsEmpty && (key.delete || isBackspaceKey(input, key))) {
      if (urls.length > 0) {
        onRemoveUrl(popupState.selectionIndex)
      }
      return
    }

    return
  }

  if (key.escape) {
    closePopup()
    return
  }

  if (!popupState.selectedFocused && (key.upArrow || key.downArrow) && urls.length > 0) {
    setPopupState(
      guardPopupUpdater('url', (prev) => ({
        ...prev,
        selectedFocused: true,
        selectionIndex: clampIndex(prev.selectionIndex, urls.length),
      })),
    )
    return
  }

  if (popupState.selectedFocused) {
    if (key.upArrow) {
      setPopupState(
        guardPopupUpdater('url', (prev) => {
          if (prev.selectionIndex === 0) {
            return { ...prev, selectedFocused: false }
          }

          return { ...prev, selectionIndex: Math.max(prev.selectionIndex - 1, 0) }
        }),
      )
      return
    }

    if (key.downArrow) {
      if (popupState.selectionIndex >= urls.length - 1) {
        return
      }

      setPopupState(
        guardPopupUpdater('url', (prev) => ({
          ...prev,
          selectionIndex: Math.min(prev.selectionIndex + 1, urls.length - 1),
        })),
      )
      return
    }

    if (key.delete || isBackspaceKey(input, key)) {
      if (urls.length > 0) {
        onRemoveUrl(popupState.selectionIndex)
      }
      return
    }

    if (isControlKey(input, key, 'e')) {
      return
    }

    if (input.toLowerCase() === 'e' && urls.length > 0) {
      const selected = urls[popupState.selectionIndex]
      if (!selected) {
        return
      }

      setPopupState(
        guardPopupUpdater('url', (prev) => ({
          ...prev,
          draft: selected,
          editingIndex: prev.selectionIndex,
          selectedFocused: false,
        })),
      )
      return
    }

    return
  }

  if (draftIsEmpty && isBackspaceKey(input, key) && urls.length > 0) {
    onRemoveUrl(popupState.selectionIndex)
  }
}
