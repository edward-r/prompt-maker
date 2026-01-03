import { buildListPopupModel } from '../../tui/components/popups/list-popup-model'

const makeItems = (count: number, prefix = 'item'): string[] =>
  Array.from({ length: count }, (_, index) => `${prefix}${index}`)

const getBlockTypes = (model: ReturnType<typeof buildListPopupModel>): string[] =>
  model.blocks.map((block) => block.type)

describe('buildListPopupModel', () => {
  it('builds a free-height selected section when suggestions are absent', () => {
    const model = buildListPopupModel({
      items: makeItems(10),
      selectedIndex: 5,
      emptyLabel: '(none)',
      instructions: 'Use arrows',
      layout: 'input-first',
      popupHeight: 16,
    })

    expect(model.hasSuggestions).toBe(false)
    expect(model.input).toEqual({ variant: 'titled', title: 'Add new', focus: true })

    expect(model.selectedSection.fixedRowCount).toBeUndefined()
    expect(model.selectedSection.rows.map((row) => row.label)).toEqual([
      '… earlier entries …',
      '4. item3',
      '5. item4',
      '6. item5',
      '7. item6',
      '8. item7',
      '9. item8',
      '… later entries …',
    ])

    const selectedRow = model.selectedSection.rows.find((row) => row.selection !== 'none')
    expect(selectedRow).toBeDefined()
    expect(selectedRow?.label).toBe('6. item5')
    expect(selectedRow?.selection).toBe('focused')

    expect(getBlockTypes(model)).toEqual([
      'spacer',
      'input',
      'spacer',
      'section',
      'spacer',
      'instructions',
    ])
  })

  it('builds fixed-height selected/suggestion sections when suggestions are present', () => {
    const model = buildListPopupModel({
      items: makeItems(10),
      selectedIndex: 5,
      emptyLabel: '(none)',
      instructions: 'Use arrows',
      layout: 'input-first',
      popupHeight: 16,
      suggestedItems: makeItems(10, 's'),
      suggestedSelectionIndex: 5,
      suggestedFocused: true,
    })

    expect(model.hasSuggestions).toBe(true)
    expect(model.input).toEqual({ variant: 'inline', label: 'Add:', focus: false })

    expect(model.selectedSection.fixedRowCount).toBe(3)
    expect(model.selectedSection.rows.map((row) => row.label)).toEqual([
      '… earlier entries …',
      '6. item5',
      '… later entries …',
    ])

    expect(model.suggestionsSection?.fixedRowCount).toBe(4)
    expect(model.suggestionsSection?.rows.map((row) => row.label)).toEqual([
      '… earlier suggestions …',
      's4',
      's5',
      '… later suggestions …',
    ])

    const suggestedRow = model.suggestionsSection?.rows.find((row) => row.selection !== 'none')
    expect(suggestedRow?.label).toBe('s5')
    expect(suggestedRow?.selection).toBe('focused')

    expect(getBlockTypes(model)).toEqual(['input', 'section', 'section', 'instructions'])
  })

  it('clamps the suggested selection index', () => {
    const model = buildListPopupModel({
      items: [],
      selectedIndex: 0,
      emptyLabel: '(none)',
      instructions: 'Use arrows',
      layout: 'input-first',
      popupHeight: 16,
      suggestedItems: ['a', 'b', 'c'],
      suggestedSelectionIndex: 99,
    })

    expect(model.safeSuggestedSelection).toBe(2)

    const selectedSuggestion = model.suggestionsSection?.rows.find(
      (row) => row.selection !== 'none',
    )
    expect(selectedSuggestion?.label).toBe('c')
  })

  it('reflects focus switching between suggested and selected lists', () => {
    const model = buildListPopupModel({
      items: makeItems(10),
      selectedIndex: 5,
      emptyLabel: '(none)',
      instructions: 'Use arrows',
      layout: 'input-first',
      popupHeight: 16,
      suggestedItems: makeItems(10, 's'),
      suggestedSelectionIndex: 5,
      suggestedFocused: true,
      selectedFocused: false,
    })

    expect(model.input).toEqual({ variant: 'inline', label: 'Add:', focus: false })

    const selectedRow = model.selectedSection.rows.find((row) => row.selection !== 'none')
    expect(selectedRow?.label).toBe('6. item5')
    expect(selectedRow?.selection).toBe('unfocused')

    const suggestedRow = model.suggestionsSection?.rows.find((row) => row.selection !== 'none')
    expect(suggestedRow?.label).toBe('s5')
    expect(suggestedRow?.selection).toBe('focused')
  })
})
