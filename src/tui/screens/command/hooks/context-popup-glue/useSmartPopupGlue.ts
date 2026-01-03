import { useCallback, useEffect, useMemo } from 'react'

import { stripTerminalPasteArtifacts } from '../../../../components/core/bracketed-paste'
import { filterDirectorySuggestions } from '../../../../file-suggestions'
import type { PopupState } from '../../../../types'

import {
  defocusSuggestionsIfEmpty,
  deriveSuggestionsViewModel,
  guardPopupUpdater,
  updateSuggestedInputDraft,
} from './popup-state-mutations'

const EMPTY_SUGGESTIONS: string[] = []

type SetPopupState = (next: PopupState | ((prev: PopupState) => PopupState)) => void

export type UseSmartPopupGlueOptions = {
  popupState: PopupState
  smartContextEnabled: boolean
  smartContextRoot: string | null
  setPopupState: SetPopupState
  notify: (message: string) => void
  toggleSmartContext: () => void
  setSmartRoot: (value: string) => void
  consumeSuppressedTextInputChange: () => boolean
}

export type UseSmartPopupGlueResult = {
  smartPopupSuggestions: string[]
  smartPopupSuggestionSelectionIndex: number
  smartPopupSuggestionsFocused: boolean
  onSmartPopupDraftChange: (next: string) => void
  onSmartToggle: (nextEnabled: boolean) => void
  onSmartRootSubmit: (value: string) => void
}

export const useSmartPopupGlue = ({
  popupState,
  smartContextEnabled,
  smartContextRoot,
  setPopupState,
  notify,
  toggleSmartContext,
  setSmartRoot,
  consumeSuppressedTextInputChange,
}: UseSmartPopupGlueOptions): UseSmartPopupGlueResult => {
  const onSmartToggle = useCallback(
    (nextEnabled: boolean) => {
      if (smartContextEnabled === nextEnabled) {
        return
      }

      const shouldClearRoot = !nextEnabled && Boolean(smartContextRoot)

      if (shouldClearRoot) {
        setSmartRoot('')
        setPopupState((prev) =>
          prev?.type === 'smart' && prev.draft === smartContextRoot
            ? updateSuggestedInputDraft(prev, '')
            : prev,
        )
      }

      toggleSmartContext()

      notify(
        nextEnabled
          ? 'Smart context enabled'
          : shouldClearRoot
            ? 'Smart context disabled; root cleared'
            : 'Smart context disabled',
      )
    },
    [
      notify,
      setPopupState,
      setSmartRoot,
      smartContextEnabled,
      smartContextRoot,
      toggleSmartContext,
    ],
  )

  const onSmartRootSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      const shouldEnable = Boolean(trimmed) && !smartContextEnabled

      setSmartRoot(trimmed)

      if (shouldEnable) {
        toggleSmartContext()
      }

      notify(
        trimmed
          ? shouldEnable
            ? `Smart context enabled; root set to ${trimmed}`
            : `Smart context root set to ${trimmed}`
          : 'Smart context root cleared',
      )

      if (trimmed) {
        setPopupState((prev) => (prev?.type === 'smart' ? null : prev))
        return
      }

      setPopupState(guardPopupUpdater('smart', (prev) => updateSuggestedInputDraft(prev, trimmed)))
    },
    [notify, setPopupState, setSmartRoot, smartContextEnabled, toggleSmartContext],
  )

  const smartPopupDraft = popupState?.type === 'smart' ? popupState.draft : ''
  const smartPopupSuggestedItems =
    popupState?.type === 'smart' ? popupState.suggestedItems : EMPTY_SUGGESTIONS
  const smartPopupSuggestedFocused =
    popupState?.type === 'smart' ? popupState.suggestedFocused : false
  const smartPopupSuggestedSelectionIndex =
    popupState?.type === 'smart' ? popupState.suggestedSelectionIndex : 0

  const suggestionsModel = useMemo(
    () =>
      deriveSuggestionsViewModel({
        draft: smartPopupDraft,
        suggestedItems: smartPopupSuggestedItems,
        suggestedSelectionIndex: smartPopupSuggestedSelectionIndex,
        suggestedFocused: smartPopupSuggestedFocused,
        filterSuggestions: (query, suggestions) => {
          const excluded = smartContextRoot ? [smartContextRoot] : []

          return filterDirectorySuggestions({ suggestions, query, exclude: excluded })
        },
      }),
    [
      smartContextRoot,
      smartPopupDraft,
      smartPopupSuggestedFocused,
      smartPopupSuggestedItems,
      smartPopupSuggestedSelectionIndex,
    ],
  )

  useEffect(() => {
    if (popupState?.type !== 'smart') {
      return
    }

    if (!suggestionsModel.shouldDefocus) {
      return
    }

    setPopupState(
      guardPopupUpdater('smart', (prev) =>
        defocusSuggestionsIfEmpty(prev, suggestionsModel.suggestions.length),
      ),
    )
  }, [
    popupState?.type,
    setPopupState,
    suggestionsModel.shouldDefocus,
    suggestionsModel.suggestions.length,
  ])

  const onSmartPopupDraftChange = useCallback(
    (next: string) => {
      if (consumeSuppressedTextInputChange()) {
        return
      }

      const sanitized = stripTerminalPasteArtifacts(next)

      setPopupState(
        guardPopupUpdater('smart', (prev) => updateSuggestedInputDraft(prev, sanitized)),
      )
    },
    [consumeSuppressedTextInputChange, setPopupState],
  )

  return {
    smartPopupSuggestions: suggestionsModel.suggestions,
    smartPopupSuggestionSelectionIndex: suggestionsModel.selectionIndex,
    smartPopupSuggestionsFocused: suggestionsModel.focused,
    onSmartPopupDraftChange,
    onSmartToggle,
    onSmartRootSubmit,
  }
}
