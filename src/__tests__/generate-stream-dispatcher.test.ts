import { createStreamDispatcher } from '../generate/stream'
import type { StreamEventInput } from '../generate/types'

describe('createStreamDispatcher', () => {
  it('serializes context.overflow events with timestamps', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00.000Z'))

    try {
      const chunks: string[] = []
      const dispatcher = createStreamDispatcher('jsonl', {
        writer: (chunk) => {
          chunks.push(chunk)
        },
      })

      const event: StreamEventInput = {
        event: 'context.overflow',
        strategy: 'drop-largest',
        before: {
          files: [],
          intentTokens: 200,
          fileTokens: 300,
          systemTokens: 700,
          totalTokens: 1200,
        },
        after: {
          files: [],
          intentTokens: 200,
          fileTokens: 100,
          systemTokens: 700,
          totalTokens: 1000,
        },
        droppedPaths: [{ path: 'docs/too-big.md', source: 'file' }],
      }

      dispatcher.emit(event)

      expect(chunks).toHaveLength(1)

      const serialized = chunks[0]?.trim()
      expect(serialized).toBeTruthy()

      const parsed = JSON.parse(serialized ?? '{}') as StreamEventInput & { timestamp: string }

      expect(parsed).toEqual(
        expect.objectContaining({
          event: 'context.overflow',
          strategy: 'drop-largest',
          timestamp: '2024-01-01T00:00:00.000Z',
          droppedPaths: [{ path: 'docs/too-big.md', source: 'file' }],
        }),
      )
    } finally {
      jest.useRealTimers()
    }
  })
})
