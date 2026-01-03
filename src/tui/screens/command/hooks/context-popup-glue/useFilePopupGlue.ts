import { useCallback, useEffect, useMemo } from 'react'

import { stripTerminalPasteArtifacts } from '../../../../components/core/bracketed-paste'
import { filterFileSuggestions } from '../../../../file-suggestions'
import type { PopupState } from '../../../../types'

import {
  defocusSuggestionsIfEmpty,
  deriveSuggestionsViewModel,
  getAutoAddAbsolutePathCandidate,
  guardPopupUpdater,
  resetSuggestedSelectedListAfterAdd,
  updateSuggestedSelectedListDraft,
} from './popup-state-mutations'

const EMPTY_SUGGESTIONS: string[] = []

type SetPopupState = (next: PopupState | ((prev: PopupState) => PopupState)) => void

export type UseFilePopupGlueOptions = {
  popupState: PopupState
  files: string[]
  setPopupState: SetPopupState
  pushHistory: (content: string, kind?: 'system' | 'user' | 'progress') => void
  addFile: (value: string) => void
  removeFile: (index: number) => void
  consumeSuppressedTextInputChange: () => boolean
  isFilePath: (candidate: string) => boolean
}

export type UseFilePopupGlueResult = {
  filePopupSuggestions: string[]
  filePopupSuggestionSelectionIndex: number
  filePopupSuggestionsFocused: boolean
  onFilePopupDraftChange: (next: string) => void
  onAddFile: (value: string) => void
  onRemoveFile: (index: number) => void
}

export const useFilePopupGlue = ({
  popupState,
  files,
  setPopupState,
  pushHistory,
  addFile,
  removeFile,
  consumeSuppressedTextInputChange,
  isFilePath,
}: UseFilePopupGlueOptions): UseFilePopupGlueResult => {
  const addFileToContext = useCallback(
    (value: string): void => {
      const trimmed = value.trim()
      if (!trimmed) {
        return
      }
      if (files.includes(trimmed)) {
        pushHistory(`Context file already added: ${trimmed}`)
        return
      }
      addFile(trimmed)
      pushHistory(`Context file added: ${trimmed}`)
    },
    [addFile, files, pushHistory],
  )

  const onAddFile = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) {
        return
      }

      addFileToContext(trimmed)

      setPopupState(
        guardPopupUpdater('file', (prev) =>
          resetSuggestedSelectedListAfterAdd(prev, Math.max(files.length, 0)),
        ),
      )
    },
    [addFileToContext, files.length, setPopupState],
  )

  useEffect(() => {
    if (popupState?.type !== 'file') {
      return
    }

    const candidate = getAutoAddAbsolutePathCandidate(popupState.draft, isFilePath)
    if (!candidate) {
      return
    }

    onAddFile(candidate)
  }, [isFilePath, onAddFile, popupState])

  const onRemoveFile = useCallback(
    (index: number) => {
      if (index < 0 || index >= files.length) {
        return
      }
      const target = files[index]
      removeFile(index)
      pushHistory(`Context file removed: ${target}`)
    },
    [files, pushHistory, removeFile],
  )

  const filePopupDraft = popupState?.type === 'file' ? popupState.draft : ''
  const filePopupSuggestedItems =
    popupState?.type === 'file' ? popupState.suggestedItems : EMPTY_SUGGESTIONS
  const filePopupSuggestedFocused =
    popupState?.type === 'file' ? popupState.suggestedFocused : false
  const filePopupSuggestedSelectionIndex =
    popupState?.type === 'file' ? popupState.suggestedSelectionIndex : 0

  const suggestionsModel = useMemo(
    () =>
      deriveSuggestionsViewModel({
        draft: filePopupDraft,
        suggestedItems: filePopupSuggestedItems,
        suggestedSelectionIndex: filePopupSuggestedSelectionIndex,
        suggestedFocused: filePopupSuggestedFocused,
        filterSuggestions: (query, suggestions) =>
          filterFileSuggestions({ suggestions, query, exclude: files }),
      }),
    [
      filePopupDraft,
      filePopupSuggestedFocused,
      filePopupSuggestedItems,
      filePopupSuggestedSelectionIndex,
      files,
    ],
  )

  useEffect(() => {
    if (popupState?.type !== 'file') {
      return
    }

    if (!suggestionsModel.shouldDefocus) {
      return
    }

    setPopupState(
      guardPopupUpdater('file', (prev) =>
        defocusSuggestionsIfEmpty(prev, suggestionsModel.suggestions.length),
      ),
    )
  }, [
    popupState?.type,
    setPopupState,
    suggestionsModel.shouldDefocus,
    suggestionsModel.suggestions.length,
  ])

  const onFilePopupDraftChange = useCallback(
    (next: string) => {
      if (consumeSuppressedTextInputChange()) {
        return
      }

      const sanitized = stripTerminalPasteArtifacts(next)

      setPopupState(
        guardPopupUpdater('file', (prev) => updateSuggestedSelectedListDraft(prev, sanitized)),
      )
    },
    [consumeSuppressedTextInputChange, setPopupState],
  )

  return {
    filePopupSuggestions: suggestionsModel.suggestions,
    filePopupSuggestionSelectionIndex: suggestionsModel.selectionIndex,
    filePopupSuggestionsFocused: suggestionsModel.focused,
    onFilePopupDraftChange,
    onAddFile,
    onRemoveFile,
  }
}
