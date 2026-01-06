import path from 'node:path'

import type { Key } from 'ink'

import type { PopupState } from '../../../../types'

import { guardPopupUpdater } from './types'

export type HandleExportPopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'export' }>
  key: Key
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  closePopup: () => void
  onExportSubmit: () => void
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max))

const replaceExtension = (filePath: string, nextExt: string): string => {
  const ext = path.extname(filePath)
  if (!ext) {
    return filePath
  }

  const lowered = ext.toLowerCase()
  if (lowered === '.json' || lowered === '.yaml' || lowered === '.yml') {
    return filePath.slice(0, Math.max(0, filePath.length - ext.length)).concat(nextExt)
  }

  return filePath
}

export const handleExportPopupShortcuts = ({
  popupState,
  key,
  setPopupState,
  closePopup,
  onExportSubmit,
}: HandleExportPopupShortcutsOptions): void => {
  if (key.escape) {
    closePopup()
    return
  }

  const historyCount = popupState.historyItems.length

  if (popupState.selectionIndex === 2) {
    if (key.upArrow && historyCount > 0) {
      if (popupState.historySelectionIndex === 0) {
        setPopupState(guardPopupUpdater('export', (prev) => ({ ...prev, selectionIndex: 1 })))
        return
      }

      setPopupState(
        guardPopupUpdater('export', (prev) => ({
          ...prev,
          historySelectionIndex: clamp(prev.historySelectionIndex - 1, 0, historyCount - 1),
        })),
      )
      return
    }

    if (key.downArrow && historyCount > 0) {
      setPopupState(
        guardPopupUpdater('export', (prev) => ({
          ...prev,
          historySelectionIndex: clamp(prev.historySelectionIndex + 1, 0, historyCount - 1),
        })),
      )
      return
    }

    if (key.return) {
      onExportSubmit()
      return
    }
  }

  if (key.upArrow) {
    setPopupState(
      guardPopupUpdater('export', (prev) => ({
        ...prev,
        selectionIndex: clamp(prev.selectionIndex - 1, 0, 2),
      })),
    )
    return
  }

  if (key.downArrow) {
    setPopupState(
      guardPopupUpdater('export', (prev) => ({
        ...prev,
        selectionIndex: clamp(prev.selectionIndex + 1, 0, 2),
      })),
    )
    return
  }

  if (popupState.selectionIndex === 0 && (key.leftArrow || key.rightArrow)) {
    setPopupState(
      guardPopupUpdater('export', (prev) => {
        const format = prev.format === 'json' ? 'yaml' : 'json'
        const nextExt = format === 'json' ? '.json' : '.yaml'

        return {
          ...prev,
          format,
          outPathDraft: replaceExtension(prev.outPathDraft, nextExt),
        }
      }),
    )
    return
  }

  if (key.return && popupState.selectionIndex < 2) {
    setPopupState(
      guardPopupUpdater('export', (prev) => ({
        ...prev,
        selectionIndex: clamp(prev.selectionIndex + 1, 0, 2),
      })),
    )
  }
}
