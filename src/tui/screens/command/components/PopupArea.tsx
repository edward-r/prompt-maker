/*
 * PopupArea
 *
 * Presentational component: renders whichever popup is currently active.
 *
 * This keeps the large popup JSX switch out of `CommandScreen` so the main
 * screen file is mostly orchestration.
 */

import type { ComponentProps } from 'react'

import { ListPopup } from '../../../components/popups/ListPopup'
import { ModelPopup } from '../../../components/popups/ModelPopup'
import { SmartPopup } from '../../../components/popups/SmartPopup'
import { TokenUsagePopup } from '../../../components/popups/TokenUsagePopup'
import { SettingsPopup } from '../../../components/popups/SettingsPopup'
import { ReasoningPopup } from '../../../components/popups/ReasoningPopup'
import { TestPopup } from '../../../components/popups/TestPopup'
import { TogglePopup } from '../../../components/popups/TogglePopup'
import { IntentFilePopup } from '../../../components/popups/IntentFilePopup'
import { InstructionsPopup } from '../../../components/popups/InstructionsPopup'
import { SeriesIntentPopup } from '../../../components/popups/SeriesIntentPopup'
import { ThemePickerPopup } from '../../../components/popups/ThemePickerPopup'
import { ThemeModePopup } from '../../../components/popups/ThemeModePopup'
import type { HistoryEntry, ModelOption, PopupState, ProviderStatusMap } from '../../../types'
import type { TokenUsageBreakdown, TokenUsageRun } from '../../../token-usage-store'

export type PopupAreaProps = {
  popupState: PopupState
  helpOpen: boolean
  overlayHeight: number

  // Model popup
  modelPopupOptions: ModelOption[]
  modelPopupSelection: number
  modelPopupRecentCount: number
  providerStatuses: ProviderStatusMap
  onModelPopupQueryChange: (next: string) => void
  onModelPopupSubmit: (option: ModelOption | null | undefined) => void

  // Toggle popup
  // (toggle popup is self-contained; selection is stored in `popupState`)

  // File popup
  files: string[]
  filePopupSuggestions: string[]
  filePopupSuggestionSelectionIndex: number
  filePopupSuggestionsFocused: boolean
  onFilePopupDraftChange: (next: string) => void
  onAddFile: (value: string) => void

  // URL popup
  urls: string[]
  onUrlPopupDraftChange: (next: string) => void
  onAddUrl: (value: string) => void

  // Image popup
  images: string[]
  imagePopupSuggestions: string[]
  imagePopupSuggestionSelectionIndex: number
  imagePopupSuggestionsFocused: boolean
  onImagePopupDraftChange: (next: string) => void
  onAddImage: (value: string) => void

  // Video popup
  videos: string[]
  videoPopupSuggestions: string[]
  videoPopupSuggestionSelectionIndex: number
  videoPopupSuggestionsFocused: boolean
  onVideoPopupDraftChange: (next: string) => void
  onAddVideo: (value: string) => void

  // History popup
  historyPopupItems: string[]
  onHistoryPopupDraftChange: (next: string) => void
  onHistoryPopupSubmit: (value: string) => void

  // Intent popup
  intentPopupSuggestions: string[]
  intentPopupSuggestionSelectionIndex: number
  intentPopupSuggestionsFocused: boolean
  onIntentPopupDraftChange: (next: string) => void
  onIntentFileSubmit: (value: string) => void

  // Instructions
  onInstructionsDraftChange: (next: string) => void
  onInstructionsSubmit: (value: string) => void

  // Series
  isGenerating: boolean
  onSeriesDraftChange: (next: string) => void
  onSeriesSubmit: (value: string) => void

  // Test
  isTestCommandRunning: boolean
  onTestDraftChange: (next: string) => void
  onTestSubmit: (value: string) => void

  // Tokens
  tokenUsageRun: TokenUsageRun | null
  tokenUsageBreakdown: TokenUsageBreakdown | null

  // Settings
  statusChips: string[]

  // Reasoning
  reasoningPopupLines: HistoryEntry[]
  reasoningPopupVisibleRows: number

  // Smart context
  smartContextEnabled: boolean
  smartContextRoot: string | null
  smartPopupSuggestions: string[]
  smartPopupSuggestionSelectionIndex: number
  smartPopupSuggestionsFocused: boolean
  onSmartPopupDraftChange: (next: string) => void
  onSmartRootSubmit: (value: string) => void
}

type NonNullPopupState = Exclude<PopupState, null>

type PopupStateFor<T extends NonNullPopupState['type']> = Extract<NonNullPopupState, { type: T }>

const renderModelPopup = (props: PopupAreaProps, popupState: PopupStateFor<'model'>) => {
  const title =
    popupState.kind === 'target'
      ? 'Select target model'
      : popupState.kind === 'polish'
        ? 'Select polish model'
        : 'Select model'

  const viewModel = {
    title,
    query: popupState.query,
    options: props.modelPopupOptions,
    selectedIndex: props.modelPopupSelection,
    recentCount: props.modelPopupRecentCount,
    maxHeight: props.overlayHeight,
    providerStatuses: props.providerStatuses,
    onQueryChange: props.onModelPopupQueryChange,
    onSubmit: props.onModelPopupSubmit,
  } satisfies ComponentProps<typeof ModelPopup>

  return <ModelPopup {...viewModel} />
}

const renderTogglePopup = (_props: PopupAreaProps, popupState: PopupStateFor<'toggle'>) => {
  const viewModel = {
    field: popupState.field,
    selectionIndex: popupState.selectionIndex,
  } satisfies ComponentProps<typeof TogglePopup>

  return <TogglePopup {...viewModel} />
}

const renderFilePopup = (props: PopupAreaProps, popupState: PopupStateFor<'file'>) => {
  const viewModel = {
    title: 'File Context',
    placeholder: 'src/**/*.ts',
    draft: popupState.draft,
    items: props.files,
    selectedIndex: popupState.selectionIndex,
    selectedFocused: popupState.selectedFocused,
    layout: 'selected-first',
    emptyLabel: 'No file globs added',
    instructions:
      "Enter add · ↑/↓ focus list · Del/Backspace remove · Tab suggestions · Esc close\nfzf: ^start $end 'exact",
    suggestedItems: props.filePopupSuggestions,
    suggestedSelectionIndex: props.filePopupSuggestionSelectionIndex,
    suggestedFocused: props.filePopupSuggestionsFocused,
    maxHeight: props.overlayHeight,
    onDraftChange: props.onFilePopupDraftChange,
    onSubmitDraft: props.onAddFile,
  } satisfies ComponentProps<typeof ListPopup>

  return <ListPopup {...viewModel} />
}

const renderUrlPopup = (props: PopupAreaProps, popupState: PopupStateFor<'url'>) => {
  const viewModel = {
    title: 'URL Context',
    placeholder: 'https://github.com/...',
    draft: popupState.draft,
    items: props.urls,
    selectedIndex: popupState.selectionIndex,
    selectedFocused: popupState.selectedFocused,
    emptyLabel: 'No URLs added',
    instructions:
      popupState.editingIndex === null
        ? 'Enter add (space/comma ok) · ↑/↓ focus list · e edit · Del remove · Esc close'
        : 'Editing… Enter save · Esc cancel · Del remove',
    onDraftChange: props.onUrlPopupDraftChange,
    onSubmitDraft: props.onAddUrl,
  } satisfies ComponentProps<typeof ListPopup>

  return <ListPopup {...viewModel} />
}

const renderImagePopup = (props: PopupAreaProps, popupState: PopupStateFor<'image'>) => {
  const viewModel = {
    title: 'Images',
    placeholder: 'path/to/image.png',
    draft: popupState.draft,
    items: props.images,
    selectedIndex: popupState.selectionIndex,
    selectedFocused: popupState.selectedFocused,
    layout: 'selected-first',
    emptyLabel: 'No images attached',
    instructions:
      "Enter add · ↑/↓ focus list · Del/Backspace remove · Tab suggestions · Esc close\nfzf: ^start $end 'exact",
    suggestedItems: props.imagePopupSuggestions,
    suggestedSelectionIndex: props.imagePopupSuggestionSelectionIndex,
    suggestedFocused: props.imagePopupSuggestionsFocused,
    maxHeight: props.overlayHeight,
    onDraftChange: props.onImagePopupDraftChange,
    onSubmitDraft: props.onAddImage,
  } satisfies ComponentProps<typeof ListPopup>

  return <ListPopup {...viewModel} />
}

const renderVideoPopup = (props: PopupAreaProps, popupState: PopupStateFor<'video'>) => {
  const viewModel = {
    title: 'Videos',
    placeholder: 'path/to/video.mp4',
    draft: popupState.draft,
    items: props.videos,
    selectedIndex: popupState.selectionIndex,
    selectedFocused: popupState.selectedFocused,
    layout: 'selected-first',
    emptyLabel: 'No videos attached',
    instructions:
      "Enter add · ↑/↓ focus list · Del/Backspace remove · Tab suggestions · Esc close\nfzf: ^start $end 'exact",
    suggestedItems: props.videoPopupSuggestions,
    suggestedSelectionIndex: props.videoPopupSuggestionSelectionIndex,
    suggestedFocused: props.videoPopupSuggestionsFocused,
    maxHeight: props.overlayHeight,
    onDraftChange: props.onVideoPopupDraftChange,
    onSubmitDraft: props.onAddVideo,
  } satisfies ComponentProps<typeof ListPopup>

  return <ListPopup {...viewModel} />
}

const renderHistoryPopup = (props: PopupAreaProps, popupState: PopupStateFor<'history'>) => {
  const viewModel = {
    title: 'History',
    placeholder: 'Search commands & intents',
    draft: popupState.draft,
    items: props.historyPopupItems,
    selectedIndex: popupState.selectionIndex,
    emptyLabel: 'No history saved',
    instructions: 'Enter to reuse · ↑/↓ navigate · Esc to close',
    onDraftChange: props.onHistoryPopupDraftChange,
    onSubmitDraft: props.onHistoryPopupSubmit,
  } satisfies ComponentProps<typeof ListPopup>

  return <ListPopup {...viewModel} />
}

const renderIntentPopup = (props: PopupAreaProps, popupState: PopupStateFor<'intent'>) => {
  const viewModel = {
    draft: popupState.draft,
    suggestions: props.intentPopupSuggestions,
    suggestedSelectionIndex: props.intentPopupSuggestionSelectionIndex,
    suggestedFocused: props.intentPopupSuggestionsFocused,
    maxHeight: props.overlayHeight,
    onDraftChange: props.onIntentPopupDraftChange,
    onSubmitDraft: props.onIntentFileSubmit,
  } satisfies ComponentProps<typeof IntentFilePopup>

  return <IntentFilePopup {...viewModel} />
}

const renderInstructionsPopup = (
  props: PopupAreaProps,
  popupState: PopupStateFor<'instructions'>,
) => {
  const viewModel = {
    draft: popupState.draft,
    onDraftChange: props.onInstructionsDraftChange,
    onSubmitDraft: props.onInstructionsSubmit,
  } satisfies ComponentProps<typeof InstructionsPopup>

  return <InstructionsPopup {...viewModel} />
}

const renderSeriesPopup = (props: PopupAreaProps, popupState: PopupStateFor<'series'>) => {
  const viewModel = {
    draft: popupState.draft,
    hint: popupState.hint,
    isRunning: props.isGenerating,
    onDraftChange: props.onSeriesDraftChange,
    onSubmitDraft: props.onSeriesSubmit,
  } satisfies ComponentProps<typeof SeriesIntentPopup>

  return <SeriesIntentPopup {...viewModel} />
}

const renderTestPopup = (props: PopupAreaProps, popupState: PopupStateFor<'test'>) => {
  const viewModel = {
    draft: popupState.draft,
    isRunning: props.isTestCommandRunning,
    onDraftChange: props.onTestDraftChange,
    onSubmitDraft: props.onTestSubmit,
  } satisfies ComponentProps<typeof TestPopup>

  return <TestPopup {...viewModel} />
}

const renderTokenUsagePopup = (props: PopupAreaProps) => {
  const viewModel = {
    run: props.tokenUsageRun,
    breakdown: props.tokenUsageBreakdown,
  } satisfies ComponentProps<typeof TokenUsagePopup>

  return <TokenUsagePopup {...viewModel} />
}

const renderSettingsPopup = (props: PopupAreaProps) => {
  const viewModel = {
    chips: props.statusChips,
  } satisfies ComponentProps<typeof SettingsPopup>

  return <SettingsPopup {...viewModel} />
}

const renderThemePopup = (props: PopupAreaProps, popupState: PopupStateFor<'theme'>) => {
  const viewModel = {
    selectionIndex: popupState.selectionIndex,
    initialThemeName: popupState.initialThemeName,
    maxHeight: props.overlayHeight,
  } satisfies ComponentProps<typeof ThemePickerPopup>

  return <ThemePickerPopup {...viewModel} />
}

const renderThemeModePopup = (_props: PopupAreaProps, popupState: PopupStateFor<'themeMode'>) => {
  const viewModel = {
    selectionIndex: popupState.selectionIndex,
    initialMode: popupState.initialMode,
  } satisfies ComponentProps<typeof ThemeModePopup>

  return <ThemeModePopup {...viewModel} />
}

const renderReasoningPopup = (props: PopupAreaProps, popupState: PopupStateFor<'reasoning'>) => {
  const viewModel = {
    lines: props.reasoningPopupLines,
    visibleRows: props.reasoningPopupVisibleRows,
    scrollOffset: popupState.scrollOffset,
  } satisfies ComponentProps<typeof ReasoningPopup>

  return <ReasoningPopup {...viewModel} />
}

const renderSmartPopup = (props: PopupAreaProps, popupState: PopupStateFor<'smart'>) => {
  const viewModel = {
    savedRoot: props.smartContextRoot,
    draft: popupState.draft,
    suggestedItems: props.smartPopupSuggestions,
    suggestedSelectionIndex: props.smartPopupSuggestionSelectionIndex,
    suggestedFocused: props.smartPopupSuggestionsFocused,
    maxHeight: props.overlayHeight,
    onDraftChange: props.onSmartPopupDraftChange,
    onSubmitRoot: props.onSmartRootSubmit,
  } satisfies ComponentProps<typeof SmartPopup>

  return <SmartPopup {...viewModel} />
}

export const PopupArea = (props: PopupAreaProps) => {
  const { popupState, helpOpen } = props

  if (popupState === null || helpOpen) {
    return null
  }

  switch (popupState.type) {
    case 'model':
      return renderModelPopup(props, popupState)
    case 'toggle':
      return renderTogglePopup(props, popupState)
    case 'file':
      return renderFilePopup(props, popupState)
    case 'url':
      return renderUrlPopup(props, popupState)
    case 'image':
      return renderImagePopup(props, popupState)
    case 'video':
      return renderVideoPopup(props, popupState)
    case 'history':
      return renderHistoryPopup(props, popupState)
    case 'intent':
      return renderIntentPopup(props, popupState)
    case 'instructions':
      return renderInstructionsPopup(props, popupState)
    case 'series':
      return renderSeriesPopup(props, popupState)
    case 'test':
      return renderTestPopup(props, popupState)
    case 'tokens':
      return renderTokenUsagePopup(props)
    case 'settings':
      return renderSettingsPopup(props)
    case 'theme':
      return renderThemePopup(props, popupState)
    case 'themeMode':
      return renderThemeModePopup(props, popupState)
    case 'reasoning':
      return renderReasoningPopup(props, popupState)
    case 'smart':
      return renderSmartPopup(props, popupState)
    default: {
      const _exhaustive: never = popupState
      return null
    }
  }
}
