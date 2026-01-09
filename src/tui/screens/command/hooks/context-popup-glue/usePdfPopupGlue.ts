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

export type UsePdfPopupGlueOptions = {
  popupState: PopupState
  pdfs: string[]
  setPopupState: SetPopupState
  pushHistory: (content: string, kind?: 'system' | 'user' | 'progress') => void
  addPdf: (value: string) => void
  removePdf: (index: number) => void
  consumeSuppressedTextInputChange: () => boolean
  isFilePath: (candidate: string) => boolean
}

export type UsePdfPopupGlueResult = {
  pdfPopupSuggestions: string[]
  pdfPopupSuggestionSelectionIndex: number
  pdfPopupSuggestionsFocused: boolean
  onPdfPopupDraftChange: (next: string) => void
  onAddPdf: (value: string) => void
  onRemovePdf: (index: number) => void
}

export const usePdfPopupGlue = ({
  popupState,
  pdfs,
  setPopupState,
  pushHistory,
  addPdf,
  removePdf,
  consumeSuppressedTextInputChange,
  isFilePath,
}: UsePdfPopupGlueOptions): UsePdfPopupGlueResult => {
  const addPdfToContext = useCallback(
    (value: string): void => {
      const trimmed = value.trim()
      if (!trimmed) {
        return
      }
      if (pdfs.includes(trimmed)) {
        pushHistory(`[pdf] Already attached: ${trimmed}`)
        return
      }
      addPdf(trimmed)
      pushHistory(`[pdf] Attached: ${trimmed}`)
    },
    [addPdf, pdfs, pushHistory],
  )

  const onAddPdf = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) {
        return
      }

      addPdfToContext(trimmed)

      setPopupState(
        guardPopupUpdater('pdf', (prev) =>
          resetSuggestedSelectedListAfterAdd(prev, Math.max(pdfs.length, 0)),
        ),
      )
    },
    [addPdfToContext, pdfs.length, setPopupState],
  )

  useEffect(() => {
    if (popupState?.type !== 'pdf') {
      return
    }

    const candidate = getAutoAddAbsolutePathCandidate(popupState.draft, isFilePath)
    if (!candidate) {
      return
    }

    onAddPdf(candidate)
  }, [isFilePath, onAddPdf, popupState])

  const onRemovePdf = useCallback(
    (index: number) => {
      if (index < 0 || index >= pdfs.length) {
        return
      }
      const target = pdfs[index]
      removePdf(index)
      pushHistory(`[pdf] Removed: ${target}`)
    },
    [pdfs, pushHistory, removePdf],
  )

  const pdfPopupDraft = popupState?.type === 'pdf' ? popupState.draft : ''
  const pdfPopupSuggestedItems =
    popupState?.type === 'pdf' ? popupState.suggestedItems : EMPTY_SUGGESTIONS
  const pdfPopupSuggestedFocused = popupState?.type === 'pdf' ? popupState.suggestedFocused : false
  const pdfPopupSuggestedSelectionIndex =
    popupState?.type === 'pdf' ? popupState.suggestedSelectionIndex : 0

  const suggestionsModel = useMemo(
    () =>
      deriveSuggestionsViewModel({
        draft: pdfPopupDraft,
        suggestedItems: pdfPopupSuggestedItems,
        suggestedSelectionIndex: pdfPopupSuggestedSelectionIndex,
        suggestedFocused: pdfPopupSuggestedFocused,
        filterSuggestions: (query, suggestions) =>
          filterFileSuggestions({ suggestions, query, exclude: pdfs }),
      }),
    [
      pdfPopupDraft,
      pdfPopupSuggestedFocused,
      pdfPopupSuggestedItems,
      pdfPopupSuggestedSelectionIndex,
      pdfs,
    ],
  )

  useEffect(() => {
    if (popupState?.type !== 'pdf') {
      return
    }

    if (!suggestionsModel.shouldDefocus) {
      return
    }

    setPopupState(
      guardPopupUpdater('pdf', (prev) =>
        defocusSuggestionsIfEmpty(prev, suggestionsModel.suggestions.length),
      ),
    )
  }, [
    popupState?.type,
    setPopupState,
    suggestionsModel.shouldDefocus,
    suggestionsModel.suggestions.length,
  ])

  const onPdfPopupDraftChange = useCallback(
    (next: string) => {
      if (consumeSuppressedTextInputChange()) {
        return
      }

      const sanitized = stripTerminalPasteArtifacts(next)

      setPopupState(
        guardPopupUpdater('pdf', (prev) => updateSuggestedSelectedListDraft(prev, sanitized)),
      )
    },
    [consumeSuppressedTextInputChange, setPopupState],
  )

  return {
    pdfPopupSuggestions: suggestionsModel.suggestions,
    pdfPopupSuggestionSelectionIndex: suggestionsModel.selectionIndex,
    pdfPopupSuggestionsFocused: suggestionsModel.focused,
    onPdfPopupDraftChange,
    onAddPdf,
    onRemovePdf,
  }
}
