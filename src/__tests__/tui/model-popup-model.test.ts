import {
  buildModelPopupRows,
  resolveModelPopupVisibleRows,
} from '../../tui/components/popups/model-popup-model'
import type { ModelProvider } from '../../model-providers'
import type { ModelOption } from '../../tui/types'
import type { ModelPopupRow } from '../../tui/components/popups/model-popup-model'

const makeOption = (id: string, provider: ModelProvider): ModelOption => ({
  id,
  label: id,
  provider,
  description: '',
  capabilities: [],
  source: 'builtin',
})

const describeRows = (rows: readonly ModelPopupRow[]): string[] =>
  rows.map((row) => {
    if (row.type === 'header') {
      return `H:${row.title}`
    }
    if (row.type === 'spacer') {
      return 'S'
    }
    return `O:${row.option.id}:${row.optionIndex}`
  })

describe('model-popup-model', () => {
  describe('buildModelPopupRows', () => {
    it('groups recents separately from provider sections', () => {
      const options = [
        makeOption('o0', 'openai'),
        makeOption('o1', 'openai'),
        makeOption('g2', 'gemini'),
        makeOption('g3', 'gemini'),
        makeOption('c4', 'other'),
      ]

      const rows = buildModelPopupRows(options, 2)

      expect(describeRows(rows)).toEqual([
        'H:Recent',
        'O:o0:0',
        'O:o1:1',
        'S',
        'H:Gemini',
        'O:g2:2',
        'O:g3:3',
        'H:Custom',
        'O:c4:4',
      ])
    })

    it('clamps recentCount to the option length', () => {
      const options = [makeOption('o0', 'openai'), makeOption('o1', 'openai')]

      const rows = buildModelPopupRows(options, 99)

      expect(describeRows(rows)).toEqual(['H:Recent', 'O:o0:0', 'O:o1:1'])
    })
  })

  describe('resolveModelPopupVisibleRows', () => {
    const options = [
      makeOption('openai-0', 'openai'),
      makeOption('openai-1', 'openai'),
      makeOption('openai-2', 'openai'),
      makeOption('openai-3', 'openai'),
      makeOption('openai-4', 'openai'),
      makeOption('openai-5', 'openai'),
      makeOption('gemini-6', 'gemini'),
      makeOption('gemini-7', 'gemini'),
      makeOption('gemini-8', 'gemini'),
      makeOption('gemini-9', 'gemini'),
    ]

    const rows = buildModelPopupRows(options, 0)

    it('pulls a section header into view when there is slack', () => {
      const result = resolveModelPopupVisibleRows({
        rows,
        selectedOptionIndex: 9,
        maxVisibleRows: 5,
      })

      expect(result.slice.start).toBe(7)
      expect(describeRows(result.visibleRows)).toEqual([
        'H:Gemini',
        'O:gemini-6:6',
        'O:gemini-7:7',
        'O:gemini-8:8',
        'O:gemini-9:9',
      ])
    })

    it('moves the window as the selection changes', () => {
      const top = resolveModelPopupVisibleRows({
        rows,
        selectedOptionIndex: 0,
        maxVisibleRows: 5,
      })

      const middle = resolveModelPopupVisibleRows({
        rows,
        selectedOptionIndex: 5,
        maxVisibleRows: 5,
      })

      const end = resolveModelPopupVisibleRows({
        rows,
        selectedOptionIndex: 9,
        maxVisibleRows: 5,
      })

      expect(top.slice.start).toBe(0)
      expect(describeRows(top.visibleRows)).toEqual([
        'H:OpenAI',
        'O:openai-0:0',
        'O:openai-1:1',
        'O:openai-2:2',
        'S',
      ])

      expect(middle.slice.start).toBe(4)
      expect(describeRows(middle.visibleRows)).toEqual([
        'O:openai-3:3',
        'O:openai-4:4',
        'O:openai-5:5',
        'S',
        'S',
      ])

      expect(end.slice.start).toBe(7)
    })
  })
})
