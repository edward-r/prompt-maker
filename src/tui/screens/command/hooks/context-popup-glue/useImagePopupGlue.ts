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

export type UseImagePopupGlueOptions = {
  popupState: PopupState
  images: string[]
  setPopupState: SetPopupState
  pushHistory: (content: string, kind?: 'system' | 'user' | 'progress') => void
  addImage: (value: string) => void
  removeImage: (index: number) => void
  consumeSuppressedTextInputChange: () => boolean
  isFilePath: (candidate: string) => boolean
}

export type UseImagePopupGlueResult = {
  imagePopupSuggestions: string[]
  imagePopupSuggestionSelectionIndex: number
  imagePopupSuggestionsFocused: boolean
  onImagePopupDraftChange: (next: string) => void
  onAddImage: (value: string) => void
  onRemoveImage: (index: number) => void
}

export const useImagePopupGlue = ({
  popupState,
  images,
  setPopupState,
  pushHistory,
  addImage,
  removeImage,
  consumeSuppressedTextInputChange,
  isFilePath,
}: UseImagePopupGlueOptions): UseImagePopupGlueResult => {
  const addImageToContext = useCallback(
    (value: string): void => {
      const trimmed = value.trim()
      if (!trimmed) {
        return
      }
      if (images.includes(trimmed)) {
        pushHistory(`[image] Already attached: ${trimmed}`)
        return
      }
      addImage(trimmed)
      pushHistory(`[image] Attached: ${trimmed}`)
    },
    [addImage, images, pushHistory],
  )

  const onAddImage = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) {
        return
      }

      addImageToContext(trimmed)

      setPopupState(
        guardPopupUpdater('image', (prev) =>
          resetSuggestedSelectedListAfterAdd(prev, Math.max(images.length, 0)),
        ),
      )
    },
    [addImageToContext, images.length, setPopupState],
  )

  useEffect(() => {
    if (popupState?.type !== 'image') {
      return
    }

    const candidate = getAutoAddAbsolutePathCandidate(popupState.draft, isFilePath)
    if (!candidate) {
      return
    }

    onAddImage(candidate)
  }, [isFilePath, onAddImage, popupState])

  const onRemoveImage = useCallback(
    (index: number) => {
      if (index < 0 || index >= images.length) {
        return
      }
      const target = images[index]
      removeImage(index)
      pushHistory(`[image] Removed: ${target}`)
    },
    [images, pushHistory, removeImage],
  )

  const imagePopupDraft = popupState?.type === 'image' ? popupState.draft : ''
  const imagePopupSuggestedItems =
    popupState?.type === 'image' ? popupState.suggestedItems : EMPTY_SUGGESTIONS
  const imagePopupSuggestedFocused =
    popupState?.type === 'image' ? popupState.suggestedFocused : false
  const imagePopupSuggestedSelectionIndex =
    popupState?.type === 'image' ? popupState.suggestedSelectionIndex : 0

  const suggestionsModel = useMemo(
    () =>
      deriveSuggestionsViewModel({
        draft: imagePopupDraft,
        suggestedItems: imagePopupSuggestedItems,
        suggestedSelectionIndex: imagePopupSuggestedSelectionIndex,
        suggestedFocused: imagePopupSuggestedFocused,
        filterSuggestions: (query, suggestions) =>
          filterFileSuggestions({ suggestions, query, exclude: images }),
      }),
    [
      imagePopupDraft,
      imagePopupSuggestedFocused,
      imagePopupSuggestedItems,
      imagePopupSuggestedSelectionIndex,
      images,
    ],
  )

  useEffect(() => {
    if (popupState?.type !== 'image') {
      return
    }

    if (!suggestionsModel.shouldDefocus) {
      return
    }

    setPopupState(
      guardPopupUpdater('image', (prev) =>
        defocusSuggestionsIfEmpty(prev, suggestionsModel.suggestions.length),
      ),
    )
  }, [
    popupState?.type,
    setPopupState,
    suggestionsModel.shouldDefocus,
    suggestionsModel.suggestions.length,
  ])

  const onImagePopupDraftChange = useCallback(
    (next: string) => {
      if (consumeSuppressedTextInputChange()) {
        return
      }

      const sanitized = stripTerminalPasteArtifacts(next)

      setPopupState(
        guardPopupUpdater('image', (prev) => updateSuggestedSelectedListDraft(prev, sanitized)),
      )
    },
    [consumeSuppressedTextInputChange, setPopupState],
  )

  return {
    imagePopupSuggestions: suggestionsModel.suggestions,
    imagePopupSuggestionSelectionIndex: suggestionsModel.selectionIndex,
    imagePopupSuggestionsFocused: suggestionsModel.focused,
    onImagePopupDraftChange,
    onAddImage,
    onRemoveImage,
  }
}
