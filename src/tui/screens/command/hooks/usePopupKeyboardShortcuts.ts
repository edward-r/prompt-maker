import { useInput, type Key } from 'ink'
import type { Dispatch, SetStateAction } from 'react'

import { useStableCallback } from '../../../hooks/useStableCallback'

import type { HistoryEntry, ModelOption, PopupState } from '../../../types'

import { handleEscapeOnlyPopupShortcuts } from './popup-shortcuts/escape-only-popup-shortcuts'
import { handleHistoryPopupShortcuts } from './popup-shortcuts/history-popup-shortcuts'
import { handleIntentPopupShortcuts } from './popup-shortcuts/intent-popup-shortcuts'
import { handleResumePopupShortcuts } from './popup-shortcuts/resume-popup-shortcuts'
import { handleExportPopupShortcuts } from './popup-shortcuts/export-popup-shortcuts'
import { handleModelPopupShortcuts } from './popup-shortcuts/model-popup-shortcuts'
import { handleReasoningPopupShortcuts } from './popup-shortcuts/reasoning-popup-shortcuts'
import { handleSmartPopupShortcuts } from './popup-shortcuts/smart-popup-shortcuts'
import { handleBudgetsPopupShortcuts } from './popup-shortcuts/budgets-popup-shortcuts'
import { handleSuggestedSelectedListPopupShortcuts } from './popup-shortcuts/suggested-selected-list-popup-shortcuts'
import {
  handleThemeModePopupShortcuts,
  handleThemePopupShortcuts,
} from './popup-shortcuts/theme-popup-shortcuts'
import { handleTogglePopupShortcuts } from './popup-shortcuts/toggle-popup-shortcuts'
import { handleUrlPopupShortcuts } from './popup-shortcuts/url-popup-shortcuts'

export type UsePopupKeyboardShortcutsOptions = {
  popupState: PopupState
  helpOpen: boolean
  setPopupState: Dispatch<SetStateAction<PopupState>>
  closePopup: () => void

  model: {
    options: ModelOption[]
    onSubmit: (option: ModelOption | null | undefined) => void
  }

  toggle: {
    applySelection: (field: 'copy' | 'chatgpt' | 'json', value: boolean) => void
  }

  theme: {
    count: number
    onConfirm: () => void
    onCancel: () => void
  }

  themeMode: {
    count: number
    onConfirm: () => void
    onCancel: () => void
  }

  budgets: {
    onSubmit: () => void
  }

  file: {
    items: string[]
    suggestions: string[]
    onAdd: (value: string) => void
    onRemove: (index: number) => void
  }

  url: {
    items: string[]
    onRemove: (index: number) => void
  }

  image: {
    items: string[]
    suggestions: string[]
    onAdd: (value: string) => void
    onRemove: (index: number) => void
  }

  video: {
    items: string[]
    suggestions: string[]
    onAdd: (value: string) => void
    onRemove: (index: number) => void
  }

  history: {
    items: string[]
  }

  resume: {
    onSubmit: () => void
  }

  export: {
    onSubmit: () => void
  }

  smart: {
    suggestions: string[]
    contextRoot: string | null
    onRootSubmit: (value: string) => void
  }

  intent: {
    suggestions: string[]
    onFileSubmit: (value: string) => void
  }

  reasoning: {
    lines: HistoryEntry[]
    visibleRows: number
  }
}

export const usePopupKeyboardShortcuts = ({
  popupState,
  helpOpen,
  setPopupState,
  closePopup,
  model,
  toggle,
  theme,
  themeMode,
  budgets,
  file,
  url,
  image,
  video,
  history,
  resume,
  export: exportActions,
  smart,
  intent,
  reasoning,
}: UsePopupKeyboardShortcutsOptions): void => {
  const isActive = popupState !== null && !helpOpen

  const handlePopupKey = useStableCallback((input: string, key: Key) => {
    if (!popupState) {
      return
    }

    switch (popupState.type) {
      case 'model':
        handleModelPopupShortcuts({
          popupState,
          input,
          key,
          options: model.options,
          setPopupState,
          closePopup,
          onModelPopupSubmit: model.onSubmit,
        })
        return

      case 'toggle':
        handleTogglePopupShortcuts({
          popupState,
          key,
          setPopupState,
          closePopup,
          applyToggleSelection: toggle.applySelection,
        })
        return

      case 'theme':
        handleThemePopupShortcuts({
          popupState,
          key,
          themeCount: theme.count,
          setPopupState,
          onThemeConfirm: theme.onConfirm,
          onThemeCancel: theme.onCancel,
        })
        return

      case 'themeMode':
        handleThemeModePopupShortcuts({
          popupState,
          key,
          optionCount: themeMode.count,
          setPopupState,
          onThemeModeConfirm: themeMode.onConfirm,
          onThemeModeCancel: themeMode.onCancel,
        })
        return

      case 'budgets':
        handleBudgetsPopupShortcuts({
          popupState,
          key,
          setPopupState,
          closePopup,
          onBudgetsSubmit: budgets.onSubmit,
        })
        return

      case 'file':
        handleSuggestedSelectedListPopupShortcuts({
          popupType: 'file',
          popupState,
          input,
          key,
          itemsLength: file.items.length,
          suggestions: file.suggestions,
          setPopupState,
          closePopup,
          onRemove: file.onRemove,
          onSelectSuggestion: file.onAdd,
        })
        return

      case 'url':
        handleUrlPopupShortcuts({
          popupState,
          input,
          key,
          urls: url.items,
          setPopupState,
          closePopup,
          onRemoveUrl: url.onRemove,
        })
        return

      case 'image':
        handleSuggestedSelectedListPopupShortcuts({
          popupType: 'image',
          popupState,
          input,
          key,
          itemsLength: image.items.length,
          suggestions: image.suggestions,
          setPopupState,
          closePopup,
          onRemove: image.onRemove,
          onSelectSuggestion: image.onAdd,
        })
        return

      case 'video':
        handleSuggestedSelectedListPopupShortcuts({
          popupType: 'video',
          popupState,
          input,
          key,
          itemsLength: video.items.length,
          suggestions: video.suggestions,
          setPopupState,
          closePopup,
          onRemove: video.onRemove,
          onSelectSuggestion: video.onAdd,
        })
        return

      case 'history':
        handleHistoryPopupShortcuts({
          popupState,
          key,
          itemCount: history.items.length,
          setPopupState,
          closePopup,
        })
        return

      case 'resume':
        handleResumePopupShortcuts({
          popupState,
          key,
          setPopupState,
          closePopup,
          onResumeSubmit: resume.onSubmit,
        })
        return

      case 'export':
        handleExportPopupShortcuts({
          popupState,
          key,
          setPopupState,
          closePopup,
          onExportSubmit: exportActions.onSubmit,
        })
        return

      case 'smart':
        handleSmartPopupShortcuts({
          popupState,
          input,
          key,
          suggestions: smart.suggestions,
          smartContextRoot: smart.contextRoot,
          setPopupState,
          closePopup,
          onSmartRootSubmit: smart.onRootSubmit,
        })
        return

      case 'tokens':
      case 'settings':
      case 'instructions':
      case 'series':
      case 'test':
        handleEscapeOnlyPopupShortcuts(key, closePopup)
        return

      case 'reasoning':
        handleReasoningPopupShortcuts({
          popupState,
          key,
          lineCount: reasoning.lines.length,
          visibleRows: reasoning.visibleRows,
          setPopupState,
          closePopup,
        })
        return

      case 'intent':
        handleIntentPopupShortcuts({
          popupState,
          key,
          suggestions: intent.suggestions,
          setPopupState,
          closePopup,
          onIntentFileSubmit: intent.onFileSubmit,
        })
        return

      default: {
        const exhaustive: never = popupState
        return exhaustive
      }
    }
  })

  useInput(handlePopupKey, { isActive })
}
