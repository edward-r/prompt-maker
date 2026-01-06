import { Box, Text, useStdout } from 'ink'

import type { ResumeHistoryItem, ResumeMode, ResumeSourceKind } from '../../types'
import { SingleLineTextInput } from '../core/SingleLineTextInput'
import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps } from '../../theme/theme-types'
import { PopupSheet } from './PopupSheet'

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max))

const POPUP_PADDING_X = 2
const POPUP_PADDING_Y = 2

const padRight = (value: string, width: number): string => {
  if (width <= 0) {
    return ''
  }

  const trimmed = value.length > width ? value.slice(0, Math.max(0, width - 1)).concat('…') : value
  return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
}

const formatMode = (mode: ResumeMode): string => (mode === 'strict' ? 'strict' : 'best-effort')

const formatSource = (source: ResumeSourceKind): string => (source === 'file' ? 'file' : 'history')

const joinItemLine = (item: ResumeHistoryItem): string => `${item.title} · ${item.detail}`

export type ResumePopupProps = {
  selectionIndex: number
  sourceKind: ResumeSourceKind
  mode: ResumeMode

  historyItems: ResumeHistoryItem[]
  historySelectionIndex: number
  historyErrorMessage: string | null

  payloadPathDraft: string
  suggestedItems: string[]
  suggestedSelectionIndex: number
  suggestedFocused: boolean

  onPayloadPathChange: (next: string) => void
  onSubmit: () => void
}

export const ResumePopup = ({
  selectionIndex,
  sourceKind,
  mode,
  historyItems,
  historySelectionIndex,
  historyErrorMessage,
  payloadPathDraft,
  suggestedItems,
  suggestedSelectionIndex,
  suggestedFocused,
  onPayloadPathChange,
  onSubmit,
}: ResumePopupProps) => {
  const { theme } = useTheme()
  const { stdout } = useStdout()

  const terminalColumns = stdout?.columns ?? 80
  const popupWidth = clamp(terminalColumns - 10, 54, 92)

  const paddingColumns = 2 * POPUP_PADDING_X
  const contentWidth = Math.max(0, popupWidth - paddingColumns)

  const backgroundProps = inkBackgroundColorProps(theme.popupBackground)

  const activeRowProps = {
    ...inkColorProps(theme.selectionText),
    ...inkBackgroundColorProps(theme.selectionBackground),
  }

  const inactiveRowProps = { ...backgroundProps, ...inkColorProps(theme.text) }

  const normalizedSelection = clamp(selectionIndex, 0, 2)

  const visibleRows = 7

  const historyStartIndex = clamp(
    historySelectionIndex - Math.floor(visibleRows / 2),
    0,
    Math.max(0, historyItems.length - visibleRows),
  )
  const historySlice = historyItems.slice(historyStartIndex, historyStartIndex + visibleRows)

  return (
    <PopupSheet
      width={popupWidth}
      height={18}
      paddingX={POPUP_PADDING_X}
      paddingY={POPUP_PADDING_Y}
      background={theme.popupBackground}
    >
      <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
        {padRight('Resume Generation', contentWidth)}
      </Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight(
          '↑/↓ select · ←/→ change · Enter resume · Tab suggestions · Esc close',
          contentWidth,
        )}
      </Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight('Note: resumes file-path context only; URL/smart treated missing.', contentWidth)}
      </Text>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>

      <Box flexDirection="column">
        <Text {...(normalizedSelection === 0 ? activeRowProps : inactiveRowProps)}>
          {padRight(`Source: ${formatSource(sourceKind)}`, contentWidth)}
        </Text>
        <Text {...(normalizedSelection === 1 ? activeRowProps : inactiveRowProps)}>
          {padRight(`Mode: ${formatMode(mode)}`, contentWidth)}
        </Text>
      </Box>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>

      {sourceKind === 'history' ? (
        <Box flexDirection="column">
          {historyItems.length === 0 ? (
            <Text
              {...backgroundProps}
              {...inkColorProps(historyErrorMessage ? theme.error : theme.mutedText)}
            >
              {padRight(historyErrorMessage ?? 'Loading history…', contentWidth)}
            </Text>
          ) : (
            historySlice.map((item, offset) => {
              const absoluteIndex = historyStartIndex + offset
              const isSelected = absoluteIndex === historySelectionIndex
              const rowProps =
                normalizedSelection === 2 && isSelected
                  ? activeRowProps
                  : { ...backgroundProps, ...inkColorProps(theme.text) }

              return (
                <Text key={item.selector} {...rowProps}>
                  {padRight(`${isSelected ? '›' : ' '} ${joinItemLine(item)}`, contentWidth)}
                </Text>
              )
            })
          )}
        </Box>
      ) : (
        <Box flexDirection="column">
          <Box flexDirection="row">
            <Text
              {...(normalizedSelection === 2 && !suggestedFocused
                ? activeRowProps
                : inactiveRowProps)}
            >
              {padRight('Payload:', 9)}
            </Text>
            <SingleLineTextInput
              value={payloadPathDraft}
              onChange={onPayloadPathChange}
              onSubmit={() => onSubmit()}
              placeholder="path/to/payload.json"
              focus={normalizedSelection === 2 && !suggestedFocused}
              width={Math.max(1, contentWidth - 9)}
              backgroundColor={theme.popupBackground}
            />
          </Box>

          {suggestedFocused && suggestedItems.length > 0 ? (
            <Box flexDirection="column" marginTop={1}>
              {suggestedItems.slice(0, 6).map((suggestion, index) => {
                const isSelected = index === suggestedSelectionIndex
                const rowProps = isSelected ? activeRowProps : inactiveRowProps
                return (
                  <Text key={suggestion} {...rowProps}>
                    {padRight(`${isSelected ? '›' : ' '} ${suggestion}`, contentWidth)}
                  </Text>
                )
              })}
            </Box>
          ) : null}
        </Box>
      )}
    </PopupSheet>
  )
}
