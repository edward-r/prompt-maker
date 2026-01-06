import type { Key } from 'ink'

import type { PopupState } from '../../../../types'

import { guardPopupUpdater } from './types'

export type HandleResumePopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'resume' }>
  key: Key
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  closePopup: () => void
  onResumeSubmit: () => void
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max))

export const handleResumePopupShortcuts = ({
  popupState,
  key,
  setPopupState,
  closePopup,
  onResumeSubmit,
}: HandleResumePopupShortcutsOptions): void => {
  if (key.escape) {
    closePopup()
    return
  }

  const historyCount = popupState.historyItems.length
  const suggestionCount = popupState.suggestedItems.length

  if (
    key.tab &&
    popupState.selectionIndex === 2 &&
    popupState.sourceKind === 'file' &&
    suggestionCount
  ) {
    setPopupState(
      guardPopupUpdater('resume', (prev) => ({
        ...prev,
        suggestedFocused: !prev.suggestedFocused,
        suggestedSelectionIndex: 0,
      })),
    )
    return
  }

  if (popupState.selectionIndex === 2) {
    if (popupState.sourceKind === 'history') {
      if (key.upArrow && historyCount > 0) {
        if (popupState.historySelectionIndex === 0) {
          setPopupState(guardPopupUpdater('resume', (prev) => ({ ...prev, selectionIndex: 1 })))
          return
        }

        setPopupState(
          guardPopupUpdater('resume', (prev) => ({
            ...prev,
            historySelectionIndex: clamp(prev.historySelectionIndex - 1, 0, historyCount - 1),
          })),
        )
        return
      }

      if (key.downArrow && historyCount > 0) {
        setPopupState(
          guardPopupUpdater('resume', (prev) => ({
            ...prev,
            historySelectionIndex: clamp(prev.historySelectionIndex + 1, 0, historyCount - 1),
          })),
        )
        return
      }

      if (key.return) {
        onResumeSubmit()
        return
      }
    } else {
      if (popupState.suggestedFocused && suggestionCount > 0) {
        if (key.upArrow) {
          if (popupState.suggestedSelectionIndex === 0) {
            setPopupState(
              guardPopupUpdater('resume', (prev) => ({
                ...prev,
                suggestedFocused: false,
                suggestedSelectionIndex: 0,
              })),
            )
            return
          }

          setPopupState(
            guardPopupUpdater('resume', (prev) => ({
              ...prev,
              suggestedSelectionIndex: clamp(
                prev.suggestedSelectionIndex - 1,
                0,
                suggestionCount - 1,
              ),
            })),
          )
          return
        }

        if (key.downArrow) {
          setPopupState(
            guardPopupUpdater('resume', (prev) => ({
              ...prev,
              suggestedSelectionIndex: clamp(
                prev.suggestedSelectionIndex + 1,
                0,
                suggestionCount - 1,
              ),
            })),
          )
          return
        }

        if (key.return) {
          const selected = popupState.suggestedItems[popupState.suggestedSelectionIndex]
          if (!selected) {
            return
          }

          setPopupState(
            guardPopupUpdater('resume', (prev) => ({
              ...prev,
              payloadPathDraft: selected,
              suggestedFocused: false,
              suggestedSelectionIndex: 0,
            })),
          )
          return
        }
      }

      if (!popupState.suggestedFocused && key.downArrow && suggestionCount > 0) {
        setPopupState(
          guardPopupUpdater('resume', (prev) => ({
            ...prev,
            suggestedFocused: true,
            suggestedSelectionIndex: 0,
          })),
        )
        return
      }

      if (!popupState.suggestedFocused && key.upArrow) {
        setPopupState(guardPopupUpdater('resume', (prev) => ({ ...prev, selectionIndex: 1 })))
        return
      }

      if (!popupState.suggestedFocused && key.return) {
        onResumeSubmit()
        return
      }
    }
  }

  if (key.upArrow) {
    setPopupState(
      guardPopupUpdater('resume', (prev) => ({
        ...prev,
        selectionIndex: clamp(prev.selectionIndex - 1, 0, 2),
      })),
    )
    return
  }

  if (key.downArrow) {
    setPopupState(
      guardPopupUpdater('resume', (prev) => ({
        ...prev,
        selectionIndex: clamp(prev.selectionIndex + 1, 0, 2),
      })),
    )
    return
  }

  if (popupState.selectionIndex === 0 && (key.leftArrow || key.rightArrow)) {
    setPopupState(
      guardPopupUpdater('resume', (prev) => ({
        ...prev,
        sourceKind: prev.sourceKind === 'history' ? 'file' : 'history',
        suggestedFocused: false,
        suggestedSelectionIndex: 0,
      })),
    )
    return
  }

  if (popupState.selectionIndex === 1 && (key.leftArrow || key.rightArrow)) {
    setPopupState(
      guardPopupUpdater('resume', (prev) => ({
        ...prev,
        mode: prev.mode === 'strict' ? 'best-effort' : 'strict',
      })),
    )
    return
  }

  if (key.return && popupState.selectionIndex < 2) {
    setPopupState(guardPopupUpdater('resume', (prev) => ({ ...prev, selectionIndex: 2 })))
  }
}
