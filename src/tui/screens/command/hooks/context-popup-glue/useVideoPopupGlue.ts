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

export type UseVideoPopupGlueOptions = {
  popupState: PopupState
  videos: string[]
  setPopupState: SetPopupState
  pushHistory: (content: string, kind?: 'system' | 'user' | 'progress') => void
  addVideo: (value: string) => void
  removeVideo: (index: number) => void
  consumeSuppressedTextInputChange: () => boolean
  isFilePath: (candidate: string) => boolean
}

export type UseVideoPopupGlueResult = {
  videoPopupSuggestions: string[]
  videoPopupSuggestionSelectionIndex: number
  videoPopupSuggestionsFocused: boolean
  onVideoPopupDraftChange: (next: string) => void
  onAddVideo: (value: string) => void
  onRemoveVideo: (index: number) => void
}

export const useVideoPopupGlue = ({
  popupState,
  videos,
  setPopupState,
  pushHistory,
  addVideo,
  removeVideo,
  consumeSuppressedTextInputChange,
  isFilePath,
}: UseVideoPopupGlueOptions): UseVideoPopupGlueResult => {
  const addVideoToContext = useCallback(
    (value: string): void => {
      const trimmed = value.trim()
      if (!trimmed) {
        return
      }
      if (videos.includes(trimmed)) {
        pushHistory(`[video] Already attached: ${trimmed}`)
        return
      }
      addVideo(trimmed)
      pushHistory(`[video] Attached: ${trimmed}`)
    },
    [addVideo, pushHistory, videos],
  )

  const onAddVideo = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) {
        return
      }

      addVideoToContext(trimmed)

      setPopupState(
        guardPopupUpdater('video', (prev) =>
          resetSuggestedSelectedListAfterAdd(prev, Math.max(videos.length, 0)),
        ),
      )
    },
    [addVideoToContext, setPopupState, videos.length],
  )

  useEffect(() => {
    if (popupState?.type !== 'video') {
      return
    }

    const candidate = getAutoAddAbsolutePathCandidate(popupState.draft, isFilePath)
    if (!candidate) {
      return
    }

    onAddVideo(candidate)
  }, [isFilePath, onAddVideo, popupState])

  const onRemoveVideo = useCallback(
    (index: number) => {
      if (index < 0 || index >= videos.length) {
        return
      }
      const target = videos[index]
      removeVideo(index)
      pushHistory(`[video] Removed: ${target}`)
    },
    [pushHistory, removeVideo, videos],
  )

  const videoPopupDraft = popupState?.type === 'video' ? popupState.draft : ''
  const videoPopupSuggestedItems =
    popupState?.type === 'video' ? popupState.suggestedItems : EMPTY_SUGGESTIONS
  const videoPopupSuggestedFocused =
    popupState?.type === 'video' ? popupState.suggestedFocused : false
  const videoPopupSuggestedSelectionIndex =
    popupState?.type === 'video' ? popupState.suggestedSelectionIndex : 0

  const suggestionsModel = useMemo(
    () =>
      deriveSuggestionsViewModel({
        draft: videoPopupDraft,
        suggestedItems: videoPopupSuggestedItems,
        suggestedSelectionIndex: videoPopupSuggestedSelectionIndex,
        suggestedFocused: videoPopupSuggestedFocused,
        filterSuggestions: (query, suggestions) =>
          filterFileSuggestions({ suggestions, query, exclude: videos }),
      }),
    [
      videoPopupDraft,
      videoPopupSuggestedFocused,
      videoPopupSuggestedItems,
      videoPopupSuggestedSelectionIndex,
      videos,
    ],
  )

  useEffect(() => {
    if (popupState?.type !== 'video') {
      return
    }

    if (!suggestionsModel.shouldDefocus) {
      return
    }

    setPopupState(
      guardPopupUpdater('video', (prev) =>
        defocusSuggestionsIfEmpty(prev, suggestionsModel.suggestions.length),
      ),
    )
  }, [
    popupState?.type,
    setPopupState,
    suggestionsModel.shouldDefocus,
    suggestionsModel.suggestions.length,
  ])

  const onVideoPopupDraftChange = useCallback(
    (next: string) => {
      if (consumeSuppressedTextInputChange()) {
        return
      }

      const sanitized = stripTerminalPasteArtifacts(next)

      setPopupState(
        guardPopupUpdater('video', (prev) => updateSuggestedSelectedListDraft(prev, sanitized)),
      )
    },
    [consumeSuppressedTextInputChange, setPopupState],
  )

  return {
    videoPopupSuggestions: suggestionsModel.suggestions,
    videoPopupSuggestionSelectionIndex: suggestionsModel.selectionIndex,
    videoPopupSuggestionsFocused: suggestionsModel.focused,
    onVideoPopupDraftChange,
    onAddVideo,
    onRemoveVideo,
  }
}
