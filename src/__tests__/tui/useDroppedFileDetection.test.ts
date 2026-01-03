import fs from 'node:fs'

import { act, renderHook } from '@testing-library/react'
import { JSDOM } from 'jsdom'

import { parseAbsolutePathFromInput } from '../../tui/drag-drop-path'
import { useDroppedFileDetection } from '../../tui/screens/command/hooks/useDroppedFileDetection'

const dom = new JSDOM('<!doctype html><html><body></body></html>')

type GlobalDom = { window: Window; document: Document }

beforeAll(() => {
  const target = globalThis as unknown as GlobalDom
  target.window = dom.window as unknown as Window
  target.document = dom.window.document
})

afterAll(() => {
  const target = globalThis as unknown as Partial<GlobalDom>
  delete target.window
  delete target.document
})

describe('useDroppedFileDetection', () => {
  describe('parseAbsolutePathFromInput (candidate parsing)', () => {
    it('parses quoted absolute paths with spaces', () => {
      expect(parseAbsolutePathFromInput('"/Users/alice/My File.md"')).toBe(
        '/Users/alice/My File.md',
      )
    })

    it('returns null when extra tokens exist', () => {
      expect(parseAbsolutePathFromInput('/file arg')).toBeNull()
    })
  })

  const createStats = (isFile: boolean): fs.Stats => {
    return { isFile: () => isFile } as unknown as fs.Stats
  }

  it('does not call stat when input has no absolute path', () => {
    const stat = jest.fn<Promise<fs.Stats>, [string]>(async () => createStats(true))

    const { result } = renderHook(() => useDroppedFileDetection('hello', { stat }))

    expect(result.current.droppedFilePath).toBeNull()
    expect(stat).not.toHaveBeenCalled()
  })

  it('resolves droppedFilePath once stat confirms file', async () => {
    const stat = jest.fn<Promise<fs.Stats>, [string]>(async () => createStats(true))

    const { result } = renderHook(() => useDroppedFileDetection('/tmp/file.txt', { stat }))

    expect(result.current.droppedFilePath).toBeNull()

    await act(async () => {
      await Promise.resolve()
    })

    expect(stat).toHaveBeenCalledTimes(1)
    expect(stat).toHaveBeenCalledWith('/tmp/file.txt')

    expect(result.current.droppedFilePath).toBe('/tmp/file.txt')
    expect(result.current.existsSync('/tmp/file.txt')).toBe(true)
    expect(result.current.isFilePath('/tmp/file.txt')).toBe(true)
  })

  it('treats existing non-files as not droppedFilePath', async () => {
    const stat = jest.fn<Promise<fs.Stats>, [string]>(async () => createStats(false))

    const { result } = renderHook(() => useDroppedFileDetection('/tmp', { stat }))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.droppedFilePath).toBeNull()
    expect(result.current.existsSync('/tmp')).toBe(true)
    expect(result.current.isFilePath('/tmp')).toBe(false)
  })

  it('caches stat results by path', async () => {
    const stat = jest.fn<Promise<fs.Stats>, [string]>(async () => createStats(true))

    const { result, rerender } = renderHook(
      ({ value }) => useDroppedFileDetection(value, { stat }),
      { initialProps: { value: '/tmp/file.txt' } },
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.droppedFilePath).toBe('/tmp/file.txt')
    expect(stat).toHaveBeenCalledTimes(1)

    rerender({ value: '/tmp/file.txt' })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.droppedFilePath).toBe('/tmp/file.txt')
    expect(stat).toHaveBeenCalledTimes(1)
  })

  it('returns exists=false for ENOENT paths', async () => {
    const error = new Error('missing') as Error & { code: string }
    error.code = 'ENOENT'

    const stat = jest.fn<Promise<fs.Stats>, [string]>(async () => {
      throw error
    })

    const { result } = renderHook(() => useDroppedFileDetection('/tmp/missing.txt', { stat }))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.droppedFilePath).toBeNull()
    expect(result.current.existsSync('/tmp/missing.txt')).toBe(false)
    expect(result.current.isFilePath('/tmp/missing.txt')).toBe(false)
  })
})
