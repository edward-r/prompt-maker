import { useCallback } from 'react'

import { parseUrlArgs, validateHttpUrlCandidate } from '../../utils/url-args'
import type { PopupState } from '../../../../types'

type SetPopupState = (next: PopupState | ((prev: PopupState) => PopupState)) => void

export type UseUrlPopupGlueOptions = {
  popupState: PopupState
  urls: string[]
  setPopupState: SetPopupState
  pushHistory: (content: string, kind?: 'system' | 'user' | 'progress') => void
  addUrl: (value: string) => void
  removeUrl: (index: number) => void
  updateUrl: (index: number, value: string) => void
  consumeSuppressedTextInputChange: () => boolean
}

export type UseUrlPopupGlueResult = {
  onUrlPopupDraftChange: (next: string) => void
  onAddUrl: (value: string) => void
  onRemoveUrl: (index: number) => void
}

export const useUrlPopupGlue = ({
  popupState,
  urls,
  setPopupState,
  pushHistory,
  addUrl,
  removeUrl,
  updateUrl,
  consumeSuppressedTextInputChange,
}: UseUrlPopupGlueOptions): UseUrlPopupGlueResult => {
  const onAddUrl = useCallback(
    (value: string) => {
      const currentPopup = popupState?.type === 'url' ? popupState : null
      const editingIndex = currentPopup?.editingIndex ?? null

      if (editingIndex !== null) {
        if (editingIndex < 0 || editingIndex >= urls.length) {
          setPopupState((prev) =>
            prev?.type === 'url'
              ? { ...prev, draft: '', editingIndex: null, selectedFocused: false }
              : prev,
          )
          return
        }

        const trimmed = value.trim()
        if (!trimmed) {
          pushHistory('Warning: URL cannot be empty.', 'system')
          return
        }

        const validation = validateHttpUrlCandidate(trimmed)
        if (!validation.ok) {
          pushHistory(`Warning: ${validation.message}`, 'system')
          return
        }

        const duplicateIndex = urls.findIndex(
          (existing, idx) => idx !== editingIndex && existing === trimmed,
        )
        if (duplicateIndex !== -1) {
          pushHistory(`Context URL already added: ${trimmed}`, 'system')
          return
        }

        const previous = urls[editingIndex]
        if (!previous) {
          return
        }

        if (previous === trimmed) {
          setPopupState((prev) =>
            prev?.type === 'url'
              ? { ...prev, draft: '', editingIndex: null, selectedFocused: false }
              : prev,
          )
          return
        }

        updateUrl(editingIndex, trimmed)
        pushHistory(`Context URL updated: ${previous} → ${trimmed}`)
        setPopupState((prev) =>
          prev?.type === 'url'
            ? { ...prev, draft: '', editingIndex: null, selectedFocused: false }
            : prev,
        )
        return
      }

      const candidates = parseUrlArgs(value)
      if (candidates.length === 0) {
        return
      }

      const seen = new Set<string>()
      const baseIndex = urls.length
      let addedCount = 0

      for (const candidate of candidates) {
        if (seen.has(candidate)) {
          continue
        }
        seen.add(candidate)

        const validation = validateHttpUrlCandidate(candidate)
        if (!validation.ok) {
          pushHistory(`Warning: ${validation.message}`, 'system')
          continue
        }

        if (urls.includes(candidate)) {
          pushHistory(`Context URL already added: ${candidate}`, 'system')
          continue
        }

        addUrl(candidate)
        addedCount += 1
        pushHistory(`Context URL added: ${candidate}`)
      }

      if (addedCount === 0) {
        return
      }

      setPopupState((prev) =>
        prev?.type === 'url'
          ? {
              ...prev,
              draft: '',
              selectionIndex: Math.max(baseIndex + addedCount - 1, 0),
              selectedFocused: false,
              editingIndex: null,
            }
          : prev,
      )
    },
    [addUrl, popupState, pushHistory, setPopupState, updateUrl, urls],
  )

  const onRemoveUrl = useCallback(
    (index: number) => {
      if (index < 0 || index >= urls.length) {
        return
      }
      const target = urls[index]
      if (!target) {
        return
      }
      removeUrl(index)
      pushHistory(`Context URL removed: ${target}`)

      setPopupState((prev) => {
        if (prev?.type !== 'url') {
          return prev
        }

        const nextMaxIndex = Math.max(urls.length - 2, 0)
        const selectionIndexBefore = prev.selectionIndex

        const nextSelectionIndexUnclamped =
          selectionIndexBefore > index
            ? selectionIndexBefore - 1
            : selectionIndexBefore === index
              ? Math.min(index, nextMaxIndex)
              : selectionIndexBefore

        const nextEditingIndex =
          prev.editingIndex === null
            ? null
            : index === prev.editingIndex
              ? null
              : index < prev.editingIndex
                ? prev.editingIndex - 1
                : prev.editingIndex

        const nextDraft = index === prev.editingIndex ? '' : prev.draft

        return {
          ...prev,
          selectionIndex: Math.min(nextSelectionIndexUnclamped, nextMaxIndex),
          selectedFocused: urls.length > 1 ? prev.selectedFocused : false,
          editingIndex: nextEditingIndex,
          draft: nextDraft,
        }
      })
    },
    [pushHistory, removeUrl, setPopupState, urls],
  )

  const onUrlPopupDraftChange = useCallback(
    (next: string) => {
      if (consumeSuppressedTextInputChange()) {
        return
      }
      setPopupState((prev) => (prev?.type === 'url' ? { ...prev, draft: next } : prev))
    },
    [consumeSuppressedTextInputChange, setPopupState],
  )

  return {
    onUrlPopupDraftChange,
    onAddUrl,
    onRemoveUrl,
  }
}
