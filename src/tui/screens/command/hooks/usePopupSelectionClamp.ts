import { useEffect } from 'react'

import type { PopupState } from '../../../types'

type SetPopupState = (next: PopupState | ((prev: PopupState) => PopupState)) => void

export type UsePopupSelectionClampOptions = {
  setPopupState: SetPopupState
  filesLength: number
  urlsLength: number
}

export const usePopupSelectionClamp = ({
  setPopupState,
  filesLength,
  urlsLength,
}: UsePopupSelectionClampOptions): void => {
  useEffect(() => {
    setPopupState((prev) => {
      if (!prev) {
        return prev
      }
      if (prev.type === 'file') {
        const maxIndex = Math.max(filesLength - 1, 0)
        const nextIndex = Math.min(prev.selectionIndex, maxIndex)
        return prev.selectionIndex === nextIndex ? prev : { ...prev, selectionIndex: nextIndex }
      }
      if (prev.type === 'url') {
        const maxIndex = Math.max(urlsLength - 1, 0)
        const nextIndex = Math.min(prev.selectionIndex, maxIndex)

        const shouldResetFocus =
          urlsLength === 0 && (prev.selectedFocused || prev.editingIndex !== null)

        if (!shouldResetFocus && prev.selectionIndex === nextIndex) {
          return prev
        }

        return {
          ...prev,
          selectionIndex: nextIndex,
          selectedFocused: urlsLength === 0 ? false : prev.selectedFocused,
          editingIndex: urlsLength === 0 ? null : prev.editingIndex,
          draft: urlsLength === 0 && prev.editingIndex !== null ? '' : prev.draft,
        }
      }
      return prev
    })
  }, [filesLength, setPopupState, urlsLength])
}
