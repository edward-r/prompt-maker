import fs from 'node:fs'

import { useEffect, useMemo, useState } from 'react'

import { parseAbsolutePathFromInput } from '../../../drag-drop-path'

type StatFn = (candidate: string) => Promise<fs.Stats>

export type UseDroppedFileDetectionFs = {
  stat: StatFn
}

export type UseDroppedFileDetectionResult = {
  droppedFilePath: string | null
  existsSync: (candidate: string) => boolean
  isFilePath: (candidate: string) => boolean
}

type PathProbe = {
  exists: boolean
  isFile: boolean
}

const getErrnoCode = (error: unknown): string | null => {
  if (!(error instanceof Error)) {
    return null
  }

  const maybeWithCode = error as unknown as { code?: unknown }
  return typeof maybeWithCode.code === 'string' ? maybeWithCode.code : null
}

const DEFAULT_FS_IMPL: UseDroppedFileDetectionFs = {
  stat: (candidate: string) => fs.promises.stat(candidate),
}

export const useDroppedFileDetection = (
  inputValue: string,
  fsImpl: UseDroppedFileDetectionFs = DEFAULT_FS_IMPL,
): UseDroppedFileDetectionResult => {
  const [cacheVersion, setCacheVersion] = useState(0)

  const cache = useMemo(() => new Map<string, PathProbe>(), [])
  const inFlight = useMemo(() => new Set<string>(), [])

  const candidate = useMemo(() => parseAbsolutePathFromInput(inputValue), [inputValue])

  useEffect(() => {
    if (!candidate) {
      return
    }

    if (cache.has(candidate) || inFlight.has(candidate)) {
      return
    }

    inFlight.add(candidate)

    let cancelled = false

    void (async () => {
      try {
        const stats = await fsImpl.stat(candidate)
        if (cancelled) {
          return
        }

        cache.set(candidate, { exists: true, isFile: stats.isFile() })
      } catch (error) {
        if (cancelled) {
          return
        }

        const code = getErrnoCode(error)
        if (code === 'ENOENT' || code === 'ENOTDIR') {
          cache.set(candidate, { exists: false, isFile: false })
        } else {
          cache.set(candidate, { exists: false, isFile: false })
        }
      } finally {
        if (!cancelled) {
          inFlight.delete(candidate)
          setCacheVersion((prev) => prev + 1)
        }
      }
    })()

    return () => {
      cancelled = true
      inFlight.delete(candidate)
    }
  }, [candidate, cache, fsImpl, inFlight])

  const droppedFilePath = useMemo(() => {
    if (!candidate) {
      return null
    }

    const entry = cache.get(candidate)
    return entry?.exists && entry.isFile ? candidate : null
  }, [cacheVersion, cache, candidate])

  const existsSync = useMemo(() => {
    return (path: string): boolean => cache.get(path)?.exists ?? false
  }, [cacheVersion, cache])

  const isFilePath = useMemo(() => {
    return (path: string): boolean => {
      const entry = cache.get(path)
      return entry?.exists === true && entry.isFile
    }
  }, [cacheVersion, cache])

  return {
    droppedFilePath,
    existsSync,
    isFilePath,
  }
}
