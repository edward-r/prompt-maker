import {
  expandTokenizedLines,
  getTokenizedCursorCoordinates,
  type TokenLabelLookup,
} from '../tui/components/core/tokenized-text'
import { getSoftWrappedCursorOffset, softWrapLine } from '../tui/components/core/soft-wrap'

describe('soft-wrap', () => {
  it('wraps by character width (constant width)', () => {
    expect(softWrapLine('abcdef', { first: 3, rest: 3 }).segments).toEqual(['abc', 'def'])
  })

  it('wraps with distinct first/rest widths', () => {
    expect(softWrapLine('abcdefg', { first: 2, rest: 3 }).segments).toEqual(['ab', 'cde', 'fg'])
  })

  it('prefers breaking on whitespace when available', () => {
    expect(softWrapLine('hello world', { first: 8, rest: 8 }).segments).toEqual(['hello ', 'world'])
    expect(softWrapLine('hello  world', { first: 8, rest: 8 }).segments).toEqual([
      'hello  ',
      'world',
    ])
  })

  it('treats non-positive widths as 1', () => {
    expect(softWrapLine('abc', { first: 0, rest: -1 }).segments).toEqual(['a', 'b', 'c'])
  })

  it('always returns at least one segment', () => {
    expect(softWrapLine('', { first: 3, rest: 3 }).segments).toEqual([''])
  })

  it('maps cursor positions within wrapped segments', () => {
    const wrapped = softWrapLine('abcdef', { first: 3, rest: 3 })

    expect(getSoftWrappedCursorOffset(wrapped, 0)).toEqual({
      rowOffset: 0,
      column: 0,
      needsTrailingEmptyLine: false,
    })

    expect(getSoftWrappedCursorOffset(wrapped, 2)).toEqual({
      rowOffset: 0,
      column: 2,
      needsTrailingEmptyLine: false,
    })

    expect(getSoftWrappedCursorOffset(wrapped, 3)).toEqual({
      rowOffset: 1,
      column: 0,
      needsTrailingEmptyLine: false,
    })

    expect(getSoftWrappedCursorOffset(wrapped, 5)).toEqual({
      rowOffset: 1,
      column: 2,
      needsTrailingEmptyLine: false,
    })
  })

  it('maps end-of-line to a trailing empty line when the final segment is full', () => {
    const wrapped = softWrapLine('abcdef', { first: 3, rest: 3 })

    expect(getSoftWrappedCursorOffset(wrapped, 6)).toEqual({
      rowOffset: 2,
      column: 0,
      needsTrailingEmptyLine: true,
    })
  })

  it('maps end-of-line within the final segment when there is remaining width', () => {
    const wrapped = softWrapLine('abcde', { first: 3, rest: 3 })

    expect(getSoftWrappedCursorOffset(wrapped, 5)).toEqual({
      rowOffset: 1,
      column: 2,
      needsTrailingEmptyLine: false,
    })
  })

  it('supports cursor mapping with tokenized display columns', () => {
    const tokenLabel: TokenLabelLookup = (character) => (character === '$' ? 'XYZ' : null)
    const displayLine = expandTokenizedLines('a$', tokenLabel)[0] ?? ''

    expect(displayLine).toBe('aXYZ')

    const coordinates = getTokenizedCursorCoordinates('a$', 2, tokenLabel)
    expect(coordinates).toEqual({ row: 0, column: 4 })

    const wrapped = softWrapLine(displayLine, { first: 2, rest: 2 })
    expect(wrapped.segments).toEqual(['aX', 'YZ'])

    expect(getSoftWrappedCursorOffset(wrapped, coordinates.column)).toEqual({
      rowOffset: 2,
      column: 0,
      needsTrailingEmptyLine: true,
    })
  })
})
