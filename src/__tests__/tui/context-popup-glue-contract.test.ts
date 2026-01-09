import { renderHook } from '@testing-library/react'
import { JSDOM } from 'jsdom'

jest.mock('ink', () => ({
  useInput: jest.fn(),
}))

import {
  useContextPopupGlue,
  type UseContextPopupGlueOptions,
} from '../../tui/screens/command/hooks/useContextPopupGlue'

const dom = new JSDOM('<!doctype html><html><body></body></html>')

type GlobalDom = { window: Window; document: Document }

beforeAll(() => {
  const target = globalThis as unknown as GlobalDom
  target.window = dom.window as unknown as Window
  target.document = dom.window.document
})

afterAll(() => {
  const target = globalThis as unknown as Partial<GlobalDom>
  delete target.window
  delete target.document
})

describe('useContextPopupGlue (shape contract)', () => {
  it('returns stable keys and safe-to-call handlers', () => {
    const options: UseContextPopupGlueOptions = {
      inputValue: '',
      popupState: null,
      helpOpen: false,
      isPopupOpen: false,
      isCommandMode: false,
      isCommandMenuActive: false,
      isGenerating: false,
      droppedFilePath: null,
      files: [],
      urls: [],
      images: [],
      videos: [],
      pdfs: [],
      smartContextEnabled: false,
      smartContextRoot: null,
      addFile: jest.fn(),
      removeFile: jest.fn(),
      addUrl: jest.fn(),
      removeUrl: jest.fn(),
      updateUrl: jest.fn(),
      addImage: jest.fn(),
      removeImage: jest.fn(),
      addVideo: jest.fn(),
      removeVideo: jest.fn(),
      addPdf: jest.fn(),
      removePdf: jest.fn(),
      toggleSmartContext: jest.fn(),
      setSmartRoot: jest.fn(),
      setInputValue: jest.fn(),
      setPopupState: jest.fn(),
      suppressNextInput: jest.fn(),
      notify: jest.fn(),
      pushHistory: jest.fn(),
      addCommandHistoryEntry: jest.fn(),
      handleCommandSelection: jest.fn(),
      consumeSuppressedTextInputChange: jest.fn(() => false),
      isFilePath: jest.fn(() => true),
    }

    const { result } = renderHook(() => useContextPopupGlue(options))

    const expectedKeys = [
      'filePopupSuggestions',
      'filePopupSuggestionSelectionIndex',
      'filePopupSuggestionsFocused',
      'onFilePopupDraftChange',
      'onAddFile',
      'onRemoveFile',
      'onUrlPopupDraftChange',
      'onAddUrl',
      'onRemoveUrl',
      'imagePopupSuggestions',
      'imagePopupSuggestionSelectionIndex',
      'imagePopupSuggestionsFocused',
      'onImagePopupDraftChange',
      'onAddImage',
      'onRemoveImage',
      'videoPopupSuggestions',
      'videoPopupSuggestionSelectionIndex',
      'videoPopupSuggestionsFocused',
      'onVideoPopupDraftChange',
      'onAddVideo',
      'onRemoveVideo',
      'pdfPopupSuggestions',
      'pdfPopupSuggestionSelectionIndex',
      'pdfPopupSuggestionsFocused',
      'onPdfPopupDraftChange',
      'onAddPdf',
      'onRemovePdf',
      'smartPopupSuggestions',
      'smartPopupSuggestionSelectionIndex',
      'smartPopupSuggestionsFocused',
      'onSmartPopupDraftChange',
      'onSmartToggle',
      'onSmartRootSubmit',
    ].sort()

    expect(Object.keys(result.current).sort()).toEqual(expectedKeys)

    expect(() => result.current.onFilePopupDraftChange('x')).not.toThrow()
    expect(() => result.current.onAddFile('/tmp/file.txt')).not.toThrow()
    expect(() => result.current.onRemoveFile(0)).not.toThrow()

    expect(() => result.current.onUrlPopupDraftChange('https://example.com')).not.toThrow()
    expect(() => result.current.onAddUrl('https://example.com')).not.toThrow()
    expect(() => result.current.onRemoveUrl(0)).not.toThrow()

    expect(() => result.current.onImagePopupDraftChange('x')).not.toThrow()
    expect(() => result.current.onAddImage('/tmp/image.png')).not.toThrow()
    expect(() => result.current.onRemoveImage(0)).not.toThrow()

    expect(() => result.current.onVideoPopupDraftChange('x')).not.toThrow()
    expect(() => result.current.onAddVideo('/tmp/video.mp4')).not.toThrow()
    expect(() => result.current.onRemoveVideo(0)).not.toThrow()

    expect(() => result.current.onSmartPopupDraftChange('x')).not.toThrow()
    expect(() => result.current.onSmartToggle(true)).not.toThrow()
    expect(() => result.current.onSmartRootSubmit('/tmp')).not.toThrow()
  })
})
