import {
  buildIterationCompleteHistoryMessages,
  buildJsonPayloadHistoryMessages,
  wrapTextForHistory,
} from '../../tui/hooks/generation-history-formatters'

jest.mock('wrap-ansi', () => jest.fn())

const wrapAnsiMock = jest.requireMock('wrap-ansi') as jest.Mock

describe('generation-history-formatters', () => {
  beforeEach(() => {
    wrapAnsiMock.mockReset()
  })

  it('wrapTextForHistory preserves order and splits wrapped lines', () => {
    wrapAnsiMock.mockImplementation((text: string) => {
      if (text === 'abc') {
        return 'a\nbc'
      }
      return text
    })

    expect(wrapTextForHistory('abc\ndef', 12)).toEqual(['a', 'bc', 'def'])

    expect(wrapAnsiMock).toHaveBeenCalledTimes(2)
    expect(wrapAnsiMock).toHaveBeenCalledWith('abc', 12, expect.objectContaining({ hard: true }))
    expect(wrapAnsiMock).toHaveBeenCalledWith('def', 12, expect.objectContaining({ hard: true }))
  })

  it('buildIterationCompleteHistoryMessages matches existing text output', () => {
    wrapAnsiMock.mockImplementation((text: string) => text)

    expect(
      buildIterationCompleteHistoryMessages({
        iteration: 2,
        tokens: 123,
        prompt: 'Line 1\nLine 2',
        wrapWidth: 80,
      }),
    ).toEqual([
      { content: 'Iteration 2 complete (123 tokens)', kind: 'progress' },
      { content: 'Prompt (iteration 2):', kind: 'system' },
      { content: 'Line 1', kind: 'system' },
      { content: 'Line 2', kind: 'system' },
    ])

    expect(
      buildIterationCompleteHistoryMessages({
        iteration: 1,
        tokens: 100,
        reasoningTokens: 50,
        prompt: 'Only line',
        wrapWidth: 80,
      })[0],
    ).toEqual({
      content: 'Iteration 1 complete (100 prompt tokens · 50 reasoning tokens)',
      kind: 'progress',
    })
  })

  it('buildJsonPayloadHistoryMessages pretty prints the payload', () => {
    wrapAnsiMock.mockImplementation((text: string) => text)

    expect(buildJsonPayloadHistoryMessages({ a: 1 }, 80)).toEqual([
      { content: 'JSON payload:', kind: 'system' },
      { content: '{', kind: 'system' },
      { content: '  "a": 1', kind: 'system' },
      { content: '}', kind: 'system' },
    ])
  })
})
