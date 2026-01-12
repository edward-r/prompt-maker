import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Text, useInput, useStdout, type Key } from 'ink'

import {
  backspace,
  clampCursor,
  deleteForward,
  insertText,
  moveCursorLeft,
  moveCursorRight,
  type MultilineTextBufferState,
} from './multiline-text-buffer'
import { softWrapLine, getSoftWrappedCursorOffset } from './soft-wrap'
import { isBackspaceKey } from './text-input-keys'
import {
  expandTokenizedLines,
  getTokenizedCursorCoordinates,
  type TokenLabelLookup,
} from './tokenized-text'

import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps, type InkColorValue } from '../../theme/theme-types'

export type DebugKeyEvent = {
  input: string
  key: Key
}

export type MultilineTextInputGutter = {
  glyph: string
  color: InkColorValue
  spacer?: number | undefined
}

export type MultilineTextInputProps = {
  value: string
  onChange: (next: string) => void
  onSubmit: (value: string) => void
  placeholder?: string | undefined
  focus?: boolean
  isDisabled?: boolean
  isPasteActive?: boolean
  tokenLabel?: TokenLabelLookup | undefined
  onDebugKeyEvent?: ((event: DebugKeyEvent) => void) | undefined
  gutter?: MultilineTextInputGutter | undefined

  // Optional rendering constraints (useful for input bars that must paint their full width).
  width?: number | undefined
  backgroundColor?: InkColorValue
}

const PROMPT = '› '
const PROMPT_SPACER = '  '

type RenderLine = {
  id: string
  content: string
  isPlaceholder: boolean
}

type WrappedLayout = {
  readonly lines: readonly RenderLine[]
  readonly cursorRow: number
  readonly cursorColumn: number
}

const toHardLines = (
  value: string,
  placeholder: string | undefined,
  tokenLabel: TokenLabelLookup,
): readonly RenderLine[] => {
  if (!value) {
    return [{ id: 'placeholder', content: placeholder ?? '', isPlaceholder: true }]
  }

  const lines = expandTokenizedLines(value, tokenLabel)
  return lines.map((line, index) => ({ id: `line-${index}`, content: line, isPlaceholder: false }))
}

const normalizeColumns = (columns: number): number => {
  if (!Number.isFinite(columns)) {
    return 0
  }

  return Math.max(0, Math.floor(columns))
}

export const MultilineTextInput: React.FC<MultilineTextInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  focus = false,
  isDisabled = false,
  isPasteActive = false,
  tokenLabel,
  onDebugKeyEvent,
  gutter,
  width,
  backgroundColor,
}) => {
  const { theme } = useTheme()
  const { stdout } = useStdout()
  const [cursor, setCursor] = useState<number>(value.length)
  const internalUpdateRef = useRef(false)

  const state: MultilineTextBufferState = useMemo(
    () => ({ value, cursor: clampCursor(cursor, value) }),
    [cursor, value],
  )

  const applyNextState = (nextState: MultilineTextBufferState): void => {
    internalUpdateRef.current = true
    setCursor(nextState.cursor)
    onChange(nextState.value)
  }

  useEffect(() => {
    if (internalUpdateRef.current) {
      internalUpdateRef.current = false
      return
    }

    setCursor(value.length)
  }, [value])

  useInput(
    (input, key) => {
      if (!focus || isDisabled || isPasteActive) {
        return
      }

      if (onDebugKeyEvent) {
        onDebugKeyEvent({ input, key })
      }

      const isCtrlJ = key.ctrl && input.toLowerCase() === 'j'
      const isAltEnter =
        key.meta && (key.return || input === '\r' || input === '\n' || input === '')
      const isEscapedAltEnter = input === '\u001b\r' || input === '\u001b\n'

      if (isCtrlJ || isAltEnter || isEscapedAltEnter) {
        applyNextState(insertText(state, '\n'))
        return
      }

      if (key.return) {
        onSubmit(value)
        return
      }

      if (isBackspaceKey(input, key)) {
        applyNextState(backspace(state))
        return
      }

      if (key.delete) {
        applyNextState(deleteForward(state))
        return
      }

      if (key.leftArrow) {
        setCursor(moveCursorLeft(state).cursor)
        return
      }

      if (key.rightArrow) {
        setCursor(moveCursorRight(state).cursor)
        return
      }

      if (!input) {
        return
      }

      if (key.ctrl || key.meta) {
        return
      }

      applyNextState(insertText(state, input))
    },
    { isActive: focus && !isDisabled },
  )

  const resolvedTokenLabel = useMemo<TokenLabelLookup>(
    () => tokenLabel ?? (() => null),
    [tokenLabel],
  )

  const hardLines = useMemo(
    () => toHardLines(value, placeholder, resolvedTokenLabel),
    [placeholder, resolvedTokenLabel, value],
  )

  const tokenizedCursor = useMemo(
    () => getTokenizedCursorCoordinates(value, cursor, resolvedTokenLabel),
    [cursor, resolvedTokenLabel, value],
  )

  const gutterSpacer = gutter?.spacer ?? 0
  const safeSpacer = Number.isFinite(gutterSpacer) ? Math.max(0, Math.floor(gutterSpacer)) : 0

  const gutterColumns = gutter ? gutter.glyph.length + safeSpacer : 0

  const totalColumns = useMemo(() => {
    if (typeof width === 'number') {
      return normalizeColumns(width)
    }

    return normalizeColumns(stdout?.columns ?? 80)
  }, [stdout?.columns, width])

  const wrapped = useMemo<WrappedLayout>(() => {
    const lines: RenderLine[] = []

    let cursorRow = 0
    let cursorColumn = 0

    for (let hardIndex = 0; hardIndex < hardLines.length; hardIndex += 1) {
      const hardLine = hardLines[hardIndex]
      if (!hardLine) {
        continue
      }

      const hardLineStart = lines.length

      const isFirstHardLine = hardIndex === 0
      const firstPrefixColumns = isFirstHardLine ? PROMPT.length : PROMPT_SPACER.length

      const firstWrapWidth = Math.max(1, totalColumns - gutterColumns - firstPrefixColumns)
      const restWrapWidth = Math.max(1, totalColumns - gutterColumns - PROMPT_SPACER.length)

      const wrappedHardLine = softWrapLine(hardLine.content, {
        first: firstWrapWidth,
        rest: restWrapWidth,
      })

      const isCursorHardLine = hardIndex === tokenizedCursor.row
      const cursorOffset = isCursorHardLine
        ? getSoftWrappedCursorOffset(wrappedHardLine, tokenizedCursor.column)
        : null

      if (isCursorHardLine && cursorOffset) {
        cursorRow = hardLineStart + cursorOffset.rowOffset
        cursorColumn = cursorOffset.column
      }

      for (
        let segmentIndex = 0;
        segmentIndex < wrappedHardLine.segments.length;
        segmentIndex += 1
      ) {
        const segment = wrappedHardLine.segments[segmentIndex]
        if (segment === undefined) {
          continue
        }

        lines.push({
          id: `${hardLine.id}-seg-${segmentIndex}`,
          content: segment,
          isPlaceholder: hardLine.isPlaceholder,
        })
      }

      if (isCursorHardLine && cursorOffset?.needsTrailingEmptyLine) {
        lines.push({
          id: `${hardLine.id}-seg-${wrappedHardLine.segments.length}`,
          content: '',
          isPlaceholder: hardLine.isPlaceholder,
        })
      }
    }

    if (lines.length === 0) {
      return {
        lines: [{ id: 'empty', content: '', isPlaceholder: true }],
        cursorRow: 0,
        cursorColumn: 0,
      }
    }

    const safeCursorRow = Math.max(0, Math.min(cursorRow, lines.length - 1))

    const cursorLine = lines[safeCursorRow]
    const safeCursorColumn = cursorLine
      ? Math.max(0, Math.min(cursorColumn, cursorLine.content.length))
      : 0

    return {
      lines,
      cursorRow: safeCursorRow,
      cursorColumn: safeCursorColumn,
    }
  }, [gutterColumns, hardLines, tokenizedCursor.column, tokenizedCursor.row, totalColumns])

  const backgroundProps = inkBackgroundColorProps(backgroundColor)

  return (
    <Box flexDirection="column" height={wrapped.lines.length}>
      {wrapped.lines.map((line, lineIndex) => {
        const isCursorLine = lineIndex === wrapped.cursorRow
        const safeColumn = isCursorLine ? Math.min(wrapped.cursorColumn, line.content.length) : 0
        const before = isCursorLine ? line.content.slice(0, safeColumn) : line.content
        const cursorCharacter = isCursorLine
          ? safeColumn < line.content.length
            ? line.content.charAt(safeColumn)
            : ' '
          : ''
        const after =
          isCursorLine && safeColumn < line.content.length ? line.content.slice(safeColumn + 1) : ''

        const prefix = lineIndex === 0 ? PROMPT : PROMPT_SPACER
        const lineColorProps = line.isPlaceholder ? inkColorProps(theme.mutedText) : {}

        const spacerText = safeSpacer > 0 ? ' '.repeat(safeSpacer) : ''

        const renderedColumns = isCursorLine
          ? before.length + cursorCharacter.length + after.length
          : before.length
        const usedColumns = gutterColumns + prefix.length + renderedColumns
        const fillerColumns =
          typeof width === 'number' && width > usedColumns ? width - usedColumns : 0
        const filler = fillerColumns > 0 ? ' '.repeat(fillerColumns) : ''

        return (
          <Box key={line.id}>
            {gutter ? (
              <>
                <Text {...backgroundProps} {...inkColorProps(gutter.color)}>
                  {gutter.glyph}
                </Text>
                {spacerText ? <Text {...backgroundProps}>{spacerText}</Text> : null}
              </>
            ) : null}
            <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
              {prefix}
            </Text>
            {isCursorLine ? (
              <>
                <Text {...backgroundProps} {...lineColorProps}>
                  {before}
                </Text>
                <Text inverse {...backgroundProps} {...lineColorProps}>
                  {cursorCharacter}
                </Text>
                <Text {...backgroundProps} {...lineColorProps}>
                  {after}
                </Text>
              </>
            ) : (
              <Text {...backgroundProps} {...lineColorProps}>
                {before}
              </Text>
            )}
            {filler ? <Text {...backgroundProps}>{filler}</Text> : null}
          </Box>
        )
      })}
    </Box>
  )
}
