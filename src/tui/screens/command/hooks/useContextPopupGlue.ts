import { useInput, type Key } from 'ink'

import { useStableCallback } from '../../../hooks/useStableCallback'

import type { CommandDescriptor, PopupState } from '../../../types'

import { useFilePopupGlue } from './context-popup-glue/useFilePopupGlue'
import { useImagePopupGlue } from './context-popup-glue/useImagePopupGlue'
import { useSmartPopupGlue } from './context-popup-glue/useSmartPopupGlue'
import { useUrlPopupGlue } from './context-popup-glue/useUrlPopupGlue'
import { useVideoPopupGlue } from './context-popup-glue/useVideoPopupGlue'

export type UseContextPopupGlueOptions = {
  inputValue: string
  popupState: PopupState
  helpOpen: boolean
  isPopupOpen: boolean
  isCommandMode: boolean
  isCommandMenuActive: boolean
  isGenerating: boolean

  droppedFilePath: string | null

  files: string[]
  urls: string[]
  images: string[]
  videos: string[]
  smartContextEnabled: boolean
  smartContextRoot: string | null

  addFile: (value: string) => void
  removeFile: (index: number) => void
  addUrl: (value: string) => void
  removeUrl: (index: number) => void
  updateUrl: (index: number, value: string) => void
  addImage: (value: string) => void
  removeImage: (index: number) => void
  addVideo: (value: string) => void
  removeVideo: (index: number) => void

  toggleSmartContext: () => void
  setSmartRoot: (value: string) => void

  setInputValue: (value: string) => void
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  suppressNextInput: () => void

  notify: (message: string) => void
  pushHistory: (content: string, kind?: 'system' | 'user' | 'progress') => void

  addCommandHistoryEntry: (value: string) => void
  handleCommandSelection: (commandId: CommandDescriptor['id'], argsRaw?: string) => void

  consumeSuppressedTextInputChange: () => boolean

  isFilePath: (candidate: string) => boolean
}

export type UseContextPopupGlueResult = {
  // File
  filePopupSuggestions: string[]
  filePopupSuggestionSelectionIndex: number
  filePopupSuggestionsFocused: boolean
  onFilePopupDraftChange: (next: string) => void
  onAddFile: (value: string) => void
  onRemoveFile: (index: number) => void

  // URL
  onUrlPopupDraftChange: (next: string) => void
  onAddUrl: (value: string) => void
  onRemoveUrl: (index: number) => void

  // Image
  imagePopupSuggestions: string[]
  imagePopupSuggestionSelectionIndex: number
  imagePopupSuggestionsFocused: boolean
  onImagePopupDraftChange: (next: string) => void
  onAddImage: (value: string) => void
  onRemoveImage: (index: number) => void

  // Video
  videoPopupSuggestions: string[]
  videoPopupSuggestionSelectionIndex: number
  videoPopupSuggestionsFocused: boolean
  onVideoPopupDraftChange: (next: string) => void
  onAddVideo: (value: string) => void
  onRemoveVideo: (index: number) => void

  // Smart
  smartPopupSuggestions: string[]
  smartPopupSuggestionSelectionIndex: number
  smartPopupSuggestionsFocused: boolean
  onSmartPopupDraftChange: (next: string) => void
  onSmartToggle: (nextEnabled: boolean) => void
  onSmartRootSubmit: (value: string) => void
}

export const useContextPopupGlue = ({
  inputValue,
  popupState,
  helpOpen,
  isPopupOpen,
  isCommandMode,
  isCommandMenuActive,
  isGenerating,
  droppedFilePath,
  files,
  urls,
  images,
  videos,
  smartContextEnabled,
  smartContextRoot,
  addFile,
  removeFile,
  addUrl,
  removeUrl,
  updateUrl,
  addImage,
  removeImage,
  addVideo,
  removeVideo,
  toggleSmartContext,
  setSmartRoot,
  setInputValue,
  setPopupState,
  suppressNextInput,
  notify,
  pushHistory,
  addCommandHistoryEntry,
  handleCommandSelection,
  consumeSuppressedTextInputChange,
  isFilePath,
}: UseContextPopupGlueOptions): UseContextPopupGlueResult => {
  const fileGlue = useFilePopupGlue({
    popupState,
    files,
    setPopupState,
    pushHistory,
    addFile,
    removeFile,
    consumeSuppressedTextInputChange,
    isFilePath,
  })

  const urlGlue = useUrlPopupGlue({
    popupState,
    urls,
    setPopupState,
    pushHistory,
    addUrl,
    removeUrl,
    updateUrl,
    consumeSuppressedTextInputChange,
  })

  const imageGlue = useImagePopupGlue({
    popupState,
    images,
    setPopupState,
    pushHistory,
    addImage,
    removeImage,
    consumeSuppressedTextInputChange,
    isFilePath,
  })

  const videoGlue = useVideoPopupGlue({
    popupState,
    videos,
    setPopupState,
    pushHistory,
    addVideo,
    removeVideo,
    consumeSuppressedTextInputChange,
    isFilePath,
  })

  const smartGlue = useSmartPopupGlue({
    popupState,
    smartContextEnabled,
    smartContextRoot,
    setPopupState,
    notify,
    toggleSmartContext,
    setSmartRoot,
    consumeSuppressedTextInputChange,
  })

  const handleSeriesShortcut = useStableCallback((_input: string, key: Key) => {
    if (popupState || isCommandMenuActive || isCommandMode) {
      return
    }
    if (!key.tab || key.shift) {
      return
    }

    if (droppedFilePath) {
      fileGlue.onAddFile(droppedFilePath)
      suppressNextInput()
      setInputValue('')
      return
    }

    if (isGenerating) {
      pushHistory('Generation already running. Please wait.', 'system')
      return
    }

    const trimmedArgs = inputValue.trim()
    addCommandHistoryEntry(`/series${trimmedArgs ? ` ${trimmedArgs}` : ''}`)
    handleCommandSelection('series', inputValue)
  })

  useInput(handleSeriesShortcut, { isActive: !isPopupOpen && !helpOpen })

  return {
    ...fileGlue,
    ...urlGlue,
    ...imageGlue,
    ...videoGlue,
    ...smartGlue,
  }
}
