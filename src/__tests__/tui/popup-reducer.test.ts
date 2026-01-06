import type { PopupState } from '../../tui/types'

import { INITIAL_POPUP_MANAGER_STATE, popupReducer } from '../../tui/popup-reducer'

describe('popupReducer', () => {
  it('opens budgets popup with seeded drafts', () => {
    const next = popupReducer(INITIAL_POPUP_MANAGER_STATE, {
      type: 'open-budgets',
      maxContextTokens: 120,
      maxInputTokens: null,
      contextOverflowStrategy: 'drop-oldest',
    })

    expect(next.popupState).toEqual({
      type: 'budgets',
      selectionIndex: 0,
      maxContextTokensDraft: '120',
      maxInputTokensDraft: '',
      contextOverflowStrategyDraft: 'drop-oldest',
      errorMessage: null,
    })
    expect(next.activeScan).toBeNull()
  })

  it('opens resume popup with seeded defaults', () => {
    const next = popupReducer(INITIAL_POPUP_MANAGER_STATE, {
      type: 'open-resume',
      scanId: 123,
      sourceKind: 'history',
      mode: 'best-effort',
      payloadPathDraft: '',
      historyItems: [{ selector: 'last', title: 't', detail: 'd' }],
      historySelectionIndex: 0,
      historyErrorMessage: null,
    })

    expect(next.popupState).toEqual({
      type: 'resume',
      selectionIndex: 0,
      sourceKind: 'history',
      mode: 'best-effort',
      historyItems: [{ selector: 'last', title: 't', detail: 'd' }],
      historySelectionIndex: 0,
      historyErrorMessage: null,
      payloadPathDraft: '',
      suggestedItems: [],
      suggestedSelectionIndex: 0,
      suggestedFocused: false,
    })

    expect(next.activeScan).toEqual({ kind: 'resume', id: 123 })
  })

  describe('scan-suggestions-success staleness gating', () => {
    it('does not apply suggestions when kind mismatches', () => {
      const state = popupReducer(INITIAL_POPUP_MANAGER_STATE, { type: 'open-file', scanId: 123 })

      const next = popupReducer(state, {
        type: 'scan-suggestions-success',
        kind: 'image',
        scanId: 123,
        suggestions: ['a'],
      })

      expect(next).toBe(state)
    })

    it('does not apply suggestions when scanId mismatches', () => {
      const state = popupReducer(INITIAL_POPUP_MANAGER_STATE, { type: 'open-file', scanId: 123 })

      const next = popupReducer(state, {
        type: 'scan-suggestions-success',
        kind: 'file',
        scanId: 999,
        suggestions: ['a'],
      })

      expect(next).toBe(state)
    })

    it('does not apply suggestions when activeScan is null', () => {
      const popupState = {
        type: 'file',
        draft: '',
        selectionIndex: 0,
        selectedFocused: false,
        suggestedItems: [],
        suggestedSelectionIndex: 0,
        suggestedFocused: false,
      } satisfies PopupState

      const state = { popupState, activeScan: null }

      const next = popupReducer(state, {
        type: 'scan-suggestions-success',
        kind: 'file',
        scanId: 123,
        suggestions: ['a'],
      })

      expect(next).toBe(state)
    })
  })

  describe('scan-suggestions-success applies suggestions and clears activeScan', () => {
    it('applies file suggestions, resets suggestion selection/focus, and clears activeScan', () => {
      const opened = popupReducer(INITIAL_POPUP_MANAGER_STATE, { type: 'open-file', scanId: 123 })

      const prepared = popupReducer(opened, {
        type: 'set',
        next: (prev) => {
          if (prev?.type !== 'file') {
            throw new Error('Expected file popup')
          }

          return {
            ...prev,
            selectionIndex: 1,
            selectedFocused: true,
            suggestedItems: ['old'],
            suggestedSelectionIndex: 2,
            suggestedFocused: true,
          }
        },
      })

      const next = popupReducer(prepared, {
        type: 'scan-suggestions-success',
        kind: 'file',
        scanId: 123,
        suggestions: ['a', 'b'],
      })

      expect(next.activeScan).toBeNull()
      expect(next.popupState?.type).toBe('file')
      if (next.popupState?.type !== 'file') {
        throw new Error('Expected file popup')
      }

      expect(next.popupState.suggestedItems).toEqual(['a', 'b'])
      expect(next.popupState.suggestedSelectionIndex).toBe(0)
      expect(next.popupState.suggestedFocused).toBe(false)

      // Ensure unrelated fields are preserved.
      expect(next.popupState.selectionIndex).toBe(1)
      expect(next.popupState.selectedFocused).toBe(true)
    })
  })

  describe("'set' preserves scan only when popup type does not change", () => {
    it('preserves activeScan when popup type stays the same', () => {
      const opened = popupReducer(INITIAL_POPUP_MANAGER_STATE, { type: 'open-file', scanId: 123 })

      const next = popupReducer(opened, {
        type: 'set',
        next: (prev) => {
          if (prev?.type !== 'file') {
            throw new Error('Expected file popup')
          }

          return { ...prev, draft: 'abc' }
        },
      })

      expect(next.activeScan).toEqual({ kind: 'file', id: 123 })
      expect(next.popupState?.type).toBe('file')
      if (next.popupState?.type !== 'file') {
        throw new Error('Expected file popup')
      }
      expect(next.popupState.draft).toBe('abc')
    })

    it('clears activeScan when popup type changes', () => {
      const opened = popupReducer(INITIAL_POPUP_MANAGER_STATE, { type: 'open-file', scanId: 123 })

      const next = popupReducer(opened, {
        type: 'set',
        next: {
          type: 'smart',
          draft: 'hi',
          suggestedItems: [],
          suggestedSelectionIndex: 0,
          suggestedFocused: false,
        },
      })

      expect(next.activeScan).toBeNull()
      expect(next.popupState?.type).toBe('smart')
    })
  })
})
