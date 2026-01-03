import {
  clampSelectionIndex,
  ensureLeadingHeaderVisible,
  resolveWindowedValues,
} from '../../tui/components/popups/list-windowing'

describe('list-windowing helpers', () => {
  describe('clampSelectionIndex', () => {
    it('returns 0 for empty lists', () => {
      expect(clampSelectionIndex(0, 0)).toBe(0)
      expect(clampSelectionIndex(0, 10)).toBe(0)
      expect(clampSelectionIndex(0, -5)).toBe(0)
    })

    it('clamps within list bounds', () => {
      expect(clampSelectionIndex(3, -1)).toBe(0)
      expect(clampSelectionIndex(3, 0)).toBe(0)
      expect(clampSelectionIndex(3, 2)).toBe(2)
      expect(clampSelectionIndex(3, 3)).toBe(2)
    })
  })

  describe('resolveWindowedValues', () => {
    it('handles empty items', () => {
      expect(resolveWindowedValues([], 0, 3)).toEqual({
        start: 0,
        end: 0,
        values: [],
        showBefore: false,
        showAfter: false,
      })
    })

    it('shows a single item without indicators', () => {
      expect(resolveWindowedValues(['only'], 0, 3)).toEqual({
        start: 0,
        end: 1,
        values: ['only'],
        showBefore: false,
        showAfter: false,
      })
    })

    it('windows with small row counts and indicators', () => {
      const items = ['a', 'b', 'c', 'd', 'e']

      expect(resolveWindowedValues(items, 0, 3)).toEqual({
        start: 0,
        end: 2,
        values: ['a', 'b'],
        showBefore: false,
        showAfter: true,
      })

      expect(resolveWindowedValues(items, 2, 3)).toEqual({
        start: 2,
        end: 3,
        values: ['c'],
        showBefore: true,
        showAfter: true,
      })

      expect(resolveWindowedValues(items, 4, 3)).toEqual({
        start: 3,
        end: 5,
        values: ['d', 'e'],
        showBefore: true,
        showAfter: false,
      })
    })

    it('supports a custom lead', () => {
      const items = Array.from({ length: 10 }, (_, index) => String(index))

      expect(resolveWindowedValues(items, 5, 5, { lead: 1 })).toEqual({
        start: 4,
        end: 7,
        values: ['4', '5', '6'],
        showBefore: true,
        showAfter: true,
      })
    })

    it('moves the window as the selection changes', () => {
      const items = Array.from({ length: 10 }, (_, index) => String(index))

      expect(resolveWindowedValues(items, 0, 5).start).toBe(0)
      expect(resolveWindowedValues(items, 5, 5).start).toBe(3)
      expect(resolveWindowedValues(items, 9, 5)).toEqual({
        start: 6,
        end: 10,
        values: ['6', '7', '8', '9'],
        showBefore: true,
        showAfter: false,
      })
    })
  })

  describe('ensureLeadingHeaderVisible', () => {
    type Row =
      | { type: 'header'; title: string }
      | { type: 'spacer' }
      | { type: 'option'; id: string }

    it('pulls the header into view when there is slack', () => {
      const rows: Row[] = [
        { type: 'header', title: 'Recent' },
        { type: 'option', id: 'a' },
        { type: 'option', id: 'b' },
      ]

      expect(ensureLeadingHeaderVisible(rows, { start: 1, end: 3 }, 5, 'header', 'option')).toEqual(
        {
          start: 0,
          end: 3,
        },
      )
    })

    it('does not shift the window when already full', () => {
      const rows: Row[] = [
        { type: 'header', title: 'Recent' },
        { type: 'option', id: 'a' },
        { type: 'option', id: 'b' },
        { type: 'option', id: 'c' },
        { type: 'option', id: 'd' },
        { type: 'option', id: 'e' },
      ]

      expect(ensureLeadingHeaderVisible(rows, { start: 1, end: 6 }, 5, 'header', 'option')).toEqual(
        {
          start: 1,
          end: 6,
        },
      )
    })

    it('does not shift when the previous row is not a header', () => {
      const rows: Row[] = [
        { type: 'spacer' },
        { type: 'option', id: 'a' },
        { type: 'option', id: 'b' },
      ]

      expect(ensureLeadingHeaderVisible(rows, { start: 1, end: 3 }, 5, 'header', 'option')).toEqual(
        {
          start: 1,
          end: 3,
        },
      )
    })
  })
})
