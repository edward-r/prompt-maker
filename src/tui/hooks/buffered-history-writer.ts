import type { HistoryEntry } from '../types'

export type HistoryPush = (
  content: string,
  kind?: HistoryEntry['kind'],
  format?: HistoryEntry['format'],
) => void

export type BufferedHistoryWriter = {
  pushBuffered: (
    content: string,
    kind?: HistoryEntry['kind'],
    format?: HistoryEntry['format'],
  ) => void
  pushManyBuffered: (
    entries: Array<{
      content: string
      kind?: HistoryEntry['kind']
      format?: HistoryEntry['format']
    }>,
  ) => void
  flush: () => void
}

type FlushScheduler = (flush: () => void) => void

type BufferedHistoryEntry = {
  content: string
  kind: HistoryEntry['kind'] | undefined
  format: HistoryEntry['format'] | undefined
}

const scheduleMicrotaskFlush: FlushScheduler = (flush) => {
  queueMicrotask(flush)
}

export const createBufferedHistoryWriter = (options: {
  push: HistoryPush
  scheduleFlush?: FlushScheduler
}): BufferedHistoryWriter => {
  const scheduleFlush = options.scheduleFlush ?? scheduleMicrotaskFlush

  let scheduled = false
  let queue: BufferedHistoryEntry[] = []

  const flush = () => {
    scheduled = false

    const entries = queue
    queue = []

    entries.forEach((entry) => {
      options.push(entry.content, entry.kind, entry.format)
    })
  }

  const schedule = () => {
    if (scheduled) {
      return
    }

    scheduled = true
    scheduleFlush(flush)
  }

  const pushBuffered = (
    content: string,
    kind?: HistoryEntry['kind'],
    format?: HistoryEntry['format'],
  ) => {
    queue.push({ content, kind, format })
    schedule()
  }

  const pushManyBuffered = (
    entries: Array<{
      content: string
      kind?: HistoryEntry['kind']
      format?: HistoryEntry['format']
    }>,
  ) => {
    entries.forEach((entry) => {
      queue.push({ content: entry.content, kind: entry.kind, format: entry.format })
    })

    if (entries.length > 0) {
      schedule()
    }
  }

  return {
    pushBuffered,
    pushManyBuffered,
    flush,
  }
}
