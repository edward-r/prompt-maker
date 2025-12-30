import { stdout as output } from 'node:process'

import type { StreamEventInput, StreamMode } from './types'

export type StreamWriter = (chunk: string) => void

export type StreamDispatcher = {
  mode: StreamMode
  emit: (event: StreamEventInput) => void
}

type StreamDispatcherOptions = {
  writer?: StreamWriter
  taps?: StreamWriter[]
}

export const createStreamDispatcher = (
  mode: StreamMode,
  options: StreamDispatcherOptions = {},
): StreamDispatcher => {
  const writer =
    options.writer ??
    ((chunk: string): void => {
      output.write(chunk)
    })
  const taps = options.taps ?? []

  const emitToTaps = (serialized: string): void => {
    taps.forEach((tap) => {
      tap(serialized)
    })
  }

  if (mode !== 'jsonl') {
    return {
      mode,
      emit: (event) => {
        if (taps.length === 0) {
          return
        }
        const payload = { ...event, timestamp: new Date().toISOString() }
        const serialized = `${JSON.stringify(payload)}\n`
        emitToTaps(serialized)
      },
    }
  }

  return {
    mode,
    emit: (event) => {
      const payload = { ...event, timestamp: new Date().toISOString() }
      const serialized = `${JSON.stringify(payload)}\n`
      writer(serialized)
      emitToTaps(serialized)
    },
  }
}
