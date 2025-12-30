import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Text, useInput, type Key } from 'ink'

import {
  backspace,
  clampCursor,
  deleteForward,
  insertText,
  moveCursorLeft,
  moveCursorRight,
  type MultilineTextBufferState,
} from './multiline-text-buffer'
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

const toRenderLines = (
  value: string,
  placeholder: string | undefined,
  tokenLabel: TokenLabelLookup,
): RenderLine[] => {
  if (!value) {
    return [{ id: 'placeholder', content: placeholder ?? '', isPlaceholder: true }]
  }

  const lines = expandTokenizedLines(value, tokenLabel)
  return lines.map((line, index) => ({ id: `line-${index}`, content: line, isPlaceholder: false }))
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

  const lines = useMemo(
    () => toRenderLines(value, placeholder, resolvedTokenLabel),
    [placeholder, resolvedTokenLabel, value],
  )
  const { row: cursorRow, column: cursorColumn } = useMemo(
    () => getTokenizedCursorCoordinates(value, cursor, resolvedTokenLabel),
    [cursor, resolvedTokenLabel, value],
  )

  const backgroundProps = inkBackgroundColorProps(backgroundColor)

  return (
    <Box flexDirection="column" height={lines.length}>
      {lines.map((line, lineIndex) => {
        const isCursorLine = lineIndex === cursorRow
        const safeColumn = isCursorLine ? Math.min(cursorColumn, line.content.length) : 0
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

        const gutterSpacer = gutter?.spacer ?? 0
        const safeSpacer = Number.isFinite(gutterSpacer) ? Math.max(0, Math.floor(gutterSpacer)) : 0
        const spacerText = safeSpacer > 0 ? ' '.repeat(safeSpacer) : ''

        const gutterColumns = gutter ? gutter.glyph.length + safeSpacer : 0
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
