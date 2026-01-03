import {
  defocusSuggestionsIfEmpty,
  deriveSuggestionsViewModel,
  getAutoAddAbsolutePathCandidate,
} from '../../tui/screens/command/hooks/context-popup-glue/popup-state-mutations'

describe('context popup state mutations', () => {
  describe('deriveSuggestionsViewModel', () => {
    it('clamps suggested selection index and preserves focus when suggestions exist', () => {
      const model = deriveSuggestionsViewModel({
        draft: 'a',
        suggestedItems: ['a', 'b', 'c'],
        suggestedSelectionIndex: 99,
        suggestedFocused: true,
        filterSuggestions: (_query, suggestions) => suggestions,
      })

      expect(model.suggestions).toEqual(['a', 'b', 'c'])
      expect(model.selectionIndex).toBe(2)
      expect(model.focused).toBe(true)
      expect(model.shouldDefocus).toBe(false)
    })

    it('defocuses suggestions when the filtered list is empty', () => {
      const model = deriveSuggestionsViewModel({
        draft: 'a',
        suggestedItems: ['a', 'b'],
        suggestedSelectionIndex: 1,
        suggestedFocused: true,
        filterSuggestions: () => [],
      })

      expect(model.suggestions).toEqual([])
      expect(model.selectionIndex).toBe(0)
      expect(model.focused).toBe(false)
      expect(model.shouldDefocus).toBe(true)
    })
  })

  describe('defocusSuggestionsIfEmpty', () => {
    it('clears focus and resets selection when empty', () => {
      const prev = { suggestedFocused: true, suggestedSelectionIndex: 5, extra: 'x' }

      const next = defocusSuggestionsIfEmpty(prev, 0)

      expect(next).toEqual({
        suggestedFocused: false,
        suggestedSelectionIndex: 0,
        extra: 'x',
      })
    })

    it('does not change state when suggestions exist', () => {
      const prev = { suggestedFocused: true, suggestedSelectionIndex: 1 }

      expect(defocusSuggestionsIfEmpty(prev, 2)).toBe(prev)
    })

    it('does not change state when suggestions are already unfocused', () => {
      const prev = { suggestedFocused: false, suggestedSelectionIndex: 1 }

      expect(defocusSuggestionsIfEmpty(prev, 0)).toBe(prev)
    })
  })

  describe('getAutoAddAbsolutePathCandidate', () => {
    it('returns an absolute path candidate when it parses and is allowed', () => {
      expect(getAutoAddAbsolutePathCandidate('/Users/alice/file.txt', () => true)).toBe(
        '/Users/alice/file.txt',
      )
    })

    it('returns null when the candidate fails validation', () => {
      expect(getAutoAddAbsolutePathCandidate('/Users/alice/file.txt', () => false)).toBeNull()
    })

    it('returns null when the draft is not an absolute path', () => {
      expect(getAutoAddAbsolutePathCandidate('src/index.ts', () => true)).toBeNull()
    })

    it('strips quotes from paths and returns the normalized candidate', () => {
      expect(getAutoAddAbsolutePathCandidate('"/Users/alice/My File.md"', () => true)).toBe(
        '/Users/alice/My File.md',
      )
    })
  })
})
