import type { PopupState } from '../../tui/types'

import {
  getSuggestedSelectedListPopupEffect,
  type SuggestedSelectedListPopupState,
} from '../../tui/screens/command/hooks/popup-shortcuts/suggested-selected-list'
import {
  getSuggestedInputPopupEffect,
  type SuggestedInputPopupState,
} from '../../tui/screens/command/hooks/popup-shortcuts/suggested-input'

describe('popup shortcut reducers', () => {
  describe('getSuggestedSelectedListPopupEffect', () => {
    const createFileState = (overrides: Partial<SuggestedSelectedListPopupState> = {}) =>
      ({
        type: 'file',
        draft: '',
        selectionIndex: 0,
        selectedFocused: false,
        suggestedItems: [],
        suggestedSelectionIndex: 0,
        suggestedFocused: false,
        ...overrides,
      }) satisfies PopupState

    it('moves focus from suggestions to selected list on Up at top', () => {
      const state = createFileState({ suggestedFocused: true, suggestedSelectionIndex: 0 })

      const effect = getSuggestedSelectedListPopupEffect({
        popupType: 'file',
        popupState: state,
        itemsLength: 2,
        suggestions: ['a', 'b'],
        key: { upArrow: true },
        isBackspace: false,
      })

      expect(effect.type).toBe('set')
      if (effect.type !== 'set') {
        throw new Error('Expected set effect')
      }

      const next = effect.updater(state as PopupState)
      expect(next).toMatchObject({
        type: 'file',
        suggestedFocused: false,
        selectedFocused: true,
      })
    })

    it('moves focus from selected list to suggestions at bottom', () => {
      const state = createFileState({ selectedFocused: true, selectionIndex: 1 })

      const effect = getSuggestedSelectedListPopupEffect({
        popupType: 'file',
        popupState: state,
        itemsLength: 2,
        suggestions: ['a', 'b'],
        key: { downArrow: true },
        isBackspace: false,
      })

      expect(effect.type).toBe('set')
      if (effect.type !== 'set') {
        throw new Error('Expected set effect')
      }

      const next = effect.updater(state as PopupState)
      expect(next).toMatchObject({
        type: 'file',
        suggestedFocused: true,
        selectedFocused: false,
        suggestedSelectionIndex: 0,
      })
    })

    it('selects the current suggestion on Enter', () => {
      const state = createFileState({ suggestedFocused: true, suggestedSelectionIndex: 1 })

      const effect = getSuggestedSelectedListPopupEffect({
        popupType: 'file',
        popupState: state,
        itemsLength: 0,
        suggestions: ['a', 'b'],
        key: { return: true },
        isBackspace: false,
      })

      expect(effect).toEqual({ type: 'selectSuggestion', value: 'b' })
    })

    it('allows backspace-remove when draft is empty', () => {
      const state = createFileState({ draft: '', selectionIndex: 3 })

      const effect = getSuggestedSelectedListPopupEffect({
        popupType: 'file',
        popupState: state,
        itemsLength: 5,
        suggestions: [],
        key: {},
        isBackspace: true,
      })

      expect(effect).toEqual({ type: 'remove', index: 3 })
    })
  })

  describe('getSuggestedInputPopupEffect', () => {
    const createIntentState = (overrides: Partial<SuggestedInputPopupState> = {}) =>
      ({
        type: 'intent',
        draft: '',
        suggestedItems: [],
        suggestedSelectionIndex: 0,
        suggestedFocused: false,
        ...overrides,
      }) satisfies PopupState

    it('does not focus suggestions on Shift+Tab', () => {
      const state = createIntentState()

      const effect = getSuggestedInputPopupEffect({
        popupType: 'intent',
        popupState: state,
        suggestions: ['a'],
        key: { tab: true, shift: true },
      })

      expect(effect.type).toBe('none')
    })

    it('focuses suggestions on Down', () => {
      const state = createIntentState({ suggestedFocused: false })

      const effect = getSuggestedInputPopupEffect({
        popupType: 'intent',
        popupState: state,
        suggestions: ['a', 'b'],
        key: { downArrow: true },
      })

      expect(effect.type).toBe('set')
      if (effect.type !== 'set') {
        throw new Error('Expected set effect')
      }

      const next = effect.updater(state as PopupState)
      expect(next).toMatchObject({
        type: 'intent',
        suggestedFocused: true,
        suggestedSelectionIndex: 0,
      })
    })

    it('selects suggestion on Enter when suggestions focused', () => {
      const state = createIntentState({ suggestedFocused: true, suggestedSelectionIndex: 0 })

      const effect = getSuggestedInputPopupEffect({
        popupType: 'intent',
        popupState: state,
        suggestions: ['a', 'b'],
        key: { return: true },
      })

      expect(effect).toEqual({ type: 'selectSuggestion', value: 'a' })
    })
  })
})
