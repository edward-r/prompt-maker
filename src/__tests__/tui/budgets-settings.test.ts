import { parseBudgetSettingsDraft } from '../../tui/budget-settings'

describe('budget settings draft parsing', () => {
  test('empty fields disable budgets', () => {
    expect(
      parseBudgetSettingsDraft({
        maxContextTokensDraft: '',
        maxInputTokensDraft: '',
        contextOverflowStrategyDraft: '',
      }),
    ).toEqual({
      ok: true,
      settings: {
        maxContextTokens: null,
        maxInputTokens: null,
        contextOverflowStrategy: null,
      },
    })
  })

  test('rejects non-integer tokens', () => {
    const result = parseBudgetSettingsDraft({
      maxContextTokensDraft: 'abc',
      maxInputTokensDraft: '',
      contextOverflowStrategyDraft: '',
    })

    expect(result.ok).toBe(false)
    if (result.ok) {
      throw new Error('Expected error result')
    }
    expect(result.errorMessage).toBe('Max context tokens must be a positive integer.')
  })

  test('defaults overflow to fail when budgets enabled', () => {
    expect(
      parseBudgetSettingsDraft({
        maxContextTokensDraft: '100',
        maxInputTokensDraft: '',
        contextOverflowStrategyDraft: '',
      }),
    ).toEqual({
      ok: true,
      settings: {
        maxContextTokens: 100,
        maxInputTokens: null,
        contextOverflowStrategy: 'fail',
      },
    })
  })

  test('preserves selected overflow strategy', () => {
    expect(
      parseBudgetSettingsDraft({
        maxContextTokensDraft: '100',
        maxInputTokensDraft: '200',
        contextOverflowStrategyDraft: 'drop-oldest',
      }),
    ).toEqual({
      ok: true,
      settings: {
        maxContextTokens: 100,
        maxInputTokens: 200,
        contextOverflowStrategy: 'drop-oldest',
      },
    })
  })

  test('allows setting overflow strategy without budgets', () => {
    expect(
      parseBudgetSettingsDraft({
        maxContextTokensDraft: '',
        maxInputTokensDraft: '',
        contextOverflowStrategyDraft: 'drop-url',
      }),
    ).toEqual({
      ok: true,
      settings: {
        maxContextTokens: null,
        maxInputTokens: null,
        contextOverflowStrategy: 'drop-url',
      },
    })
  })
})
