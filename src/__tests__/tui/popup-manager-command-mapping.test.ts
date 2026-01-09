import {
  JSON_INTERACTIVE_ERROR,
  mapPopupCommandSelection,
  type CommandMappingContext,
} from '../../tui/hooks/popup-manager/command-mapping'

describe('popup manager command mapping', () => {
  const baseContext: CommandMappingContext = {
    copyEnabled: false,
    chatGptEnabled: false,
    jsonOutputEnabled: false,
    interactiveTransportPath: undefined,
    urls: [],
    images: [],
    videos: [],
    pdfs: [],
    smartContextEnabled: false,
    smartContextRoot: null,
  }

  it('blocks /json when interactive transport is active', () => {
    const result = mapPopupCommandSelection({
      commandId: 'json',
      argsRaw: undefined,
      context: {
        ...baseContext,
        interactiveTransportPath: '/tmp/socket',
      },
    })

    expect(result).toEqual({
      kind: 'steps',
      steps: [
        { type: 'push-history', message: JSON_INTERACTIVE_ERROR, kind: 'system' },
        { type: 'set-input', value: '' },
      ],
    })
  })

  it('maps /url args into add/warn steps with dedupe', () => {
    const result = mapPopupCommandSelection({
      commandId: 'url',
      argsRaw: 'http://a.example, example.com http://a.example',
      context: baseContext,
    })

    if (result.kind !== 'steps') {
      throw new Error('Expected steps result')
    }

    expect(result.steps).toEqual([
      { type: 'add-url', value: 'http://a.example' },
      { type: 'push-history', message: 'Context URL added: http://a.example', kind: 'system' },
      { type: 'push-history', message: 'Warning: Invalid URL: example.com', kind: 'system' },
      { type: 'set-input', value: '' },
      { type: 'close-popup' },
    ])
  })

  it('opens budgets popup from /budgets', () => {
    const result = mapPopupCommandSelection({
      commandId: 'budgets',
      argsRaw: undefined,
      context: baseContext,
    })

    expect(result).toEqual({
      kind: 'steps',
      steps: [
        { type: 'open-popup', popup: 'budgets' },
        { type: 'set-input', value: '' },
      ],
    })
  })

  it('opens resume popup from /resume', () => {
    const result = mapPopupCommandSelection({
      commandId: 'resume',
      argsRaw: undefined,
      context: baseContext,
    })

    expect(result).toEqual({
      kind: 'steps',
      steps: [
        { type: 'open-popup', popup: 'resume' },
        { type: 'set-input', value: '' },
      ],
    })
  })

  it('opens export popup from /export', () => {
    const result = mapPopupCommandSelection({
      commandId: 'export',
      argsRaw: undefined,
      context: baseContext,
    })

    expect(result).toEqual({
      kind: 'steps',
      steps: [
        { type: 'open-popup', popup: 'export' },
        { type: 'set-input', value: '' },
      ],
    })
  })

  it('clears smart root when disabling smart context', () => {
    const result = mapPopupCommandSelection({
      commandId: 'smart',
      argsRaw: 'off',
      context: {
        ...baseContext,
        smartContextEnabled: true,
        smartContextRoot: 'src',
      },
    })

    if (result.kind !== 'steps') {
      throw new Error('Expected steps result')
    }

    expect(result.steps).toEqual([
      { type: 'set-smart-root', value: '' },
      { type: 'toggle-smart-context' },
      {
        type: 'notify',
        message: 'Smart context disabled; root cleared',
        kind: 'warning',
      },
      { type: 'set-input', value: '' },
      { type: 'close-popup' },
    ])
  })
})
