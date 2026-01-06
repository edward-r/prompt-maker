import type { ContextOverflowStrategy } from '../config'
import type { ModelProvider } from '../model-providers'
import type { COMMAND_DESCRIPTORS, POPUP_HEIGHTS, TOGGLE_LABELS } from './config'
import type { ThemeMode } from './theme/theme-types'

export type CommandDescriptor = (typeof COMMAND_DESCRIPTORS)[number]
export type ToggleField = keyof typeof TOGGLE_LABELS
export type PopupKind = keyof typeof POPUP_HEIGHTS

export type ModelOption = {
  id: string
  label: string
  provider: ModelProvider
  description: string
  capabilities: string[]
  default?: boolean
  notes?: string
  source: 'builtin' | 'config' | 'discovered'
}

export type ProviderStatus = {
  provider: ModelProvider
  status: 'ok' | 'missing' | 'error'
  message: string
}

export type ProviderStatusMap = Record<ModelProvider, ProviderStatus>

export type ResumeSourceKind = 'history' | 'file'
export type ResumeMode = 'best-effort' | 'strict'

export type ResumeHistoryItem = {
  selector: string
  title: string
  detail: string
}

export type ExportHistoryItem = {
  selector: string
  title: string
  detail: string
  schemaVersion: string
  supported: boolean
}

export type PopupState =
  | {
      type: 'model'
      kind: 'generation' | 'polish' | 'target'
      query: string
      selectionIndex: number
    }
  | { type: 'toggle'; field: ToggleField; selectionIndex: number }
  | {
      type: 'file'
      draft: string
      selectionIndex: number
      selectedFocused: boolean
      suggestedItems: string[]
      suggestedSelectionIndex: number
      suggestedFocused: boolean
    }
  | {
      type: 'url'
      draft: string
      selectionIndex: number
      selectedFocused: boolean
      editingIndex: number | null
    }
  | {
      type: 'image'
      draft: string
      selectionIndex: number
      selectedFocused: boolean
      suggestedItems: string[]
      suggestedSelectionIndex: number
      suggestedFocused: boolean
    }
  | {
      type: 'video'
      draft: string
      selectionIndex: number
      selectedFocused: boolean
      suggestedItems: string[]
      suggestedSelectionIndex: number
      suggestedFocused: boolean
    }
  | { type: 'history'; draft: string; selectionIndex: number }
  | {
      type: 'resume'
      selectionIndex: number
      sourceKind: ResumeSourceKind
      mode: ResumeMode
      historyItems: ResumeHistoryItem[]
      historySelectionIndex: number
      historyErrorMessage: string | null
      payloadPathDraft: string
      suggestedItems: string[]
      suggestedSelectionIndex: number
      suggestedFocused: boolean
    }
  | {
      type: 'export'
      selectionIndex: number
      historyItems: ExportHistoryItem[]
      historySelectionIndex: number
      historyErrorMessage: string | null
      format: 'json' | 'yaml'
      outPathDraft: string
    }
  | {
      type: 'smart'
      draft: string
      suggestedItems: string[]
      suggestedSelectionIndex: number
      suggestedFocused: boolean
    }
  | { type: 'tokens' }
  | {
      type: 'budgets'
      selectionIndex: number
      maxContextTokensDraft: string
      maxInputTokensDraft: string
      contextOverflowStrategyDraft: ContextOverflowStrategy | ''
      errorMessage: string | null
    }
  | { type: 'settings' }
  | { type: 'theme'; selectionIndex: number; initialThemeName: string }
  | {
      type: 'themeMode'
      selectionIndex: number
      initialMode: ThemeMode
    }
  | { type: 'reasoning'; scrollOffset: number }
  | { type: 'test'; draft: string }
  | {
      type: 'intent'
      draft: string
      suggestedItems: string[]
      suggestedSelectionIndex: number
      suggestedFocused: boolean
    }
  | { type: 'instructions'; draft: string }
  | { type: 'series'; draft: string; hint?: string }
  | null

export type HistoryEntry = {
  id: string
  content: string
  kind: 'user' | 'system' | 'progress'
  format?: 'markdown'
}
