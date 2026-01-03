import { createBufferedHistoryWriter } from '../../tui/hooks/buffered-history-writer'

describe('buffered-history-writer', () => {
  it('buffers writes until flush, preserving order', () => {
    const push = jest.fn()
    let scheduleCalls = 0

    const writer = createBufferedHistoryWriter({
      push,
      scheduleFlush: () => {
        scheduleCalls += 1
      },
    })

    writer.pushBuffered('first')
    writer.pushBuffered('second', 'progress')

    expect(push).not.toHaveBeenCalled()
    expect(scheduleCalls).toBe(1)

    writer.flush()

    expect(push.mock.calls).toEqual([
      ['first', undefined, undefined],
      ['second', 'progress', undefined],
    ])

    writer.pushBuffered('third')

    expect(push.mock.calls).toHaveLength(2)
    expect(scheduleCalls).toBe(2)

    writer.flush()

    expect(push.mock.calls).toEqual([
      ['first', undefined, undefined],
      ['second', 'progress', undefined],
      ['third', undefined, undefined],
    ])
  })

  it('pushManyBuffered schedules once and preserves kinds', () => {
    const push = jest.fn()
    let scheduleCalls = 0

    const writer = createBufferedHistoryWriter({
      push,
      scheduleFlush: () => {
        scheduleCalls += 1
      },
    })

    writer.pushManyBuffered([
      { content: 'a', kind: 'system' },
      { content: 'b', kind: 'progress' },
      { content: 'c' },
    ])

    expect(push).not.toHaveBeenCalled()
    expect(scheduleCalls).toBe(1)

    writer.flush()

    expect(push.mock.calls).toEqual([
      ['a', 'system', undefined],
      ['b', 'progress', undefined],
      ['c', undefined, undefined],
    ])
  })
})
