import { Box, Text, useStdout } from 'ink'

import type { ExportHistoryItem } from '../../types'
import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps } from '../../theme/theme-types'
import { SingleLineTextInput } from '../core/SingleLineTextInput'

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

const joinItemLine = (item: ExportHistoryItem): string => `${item.title} · ${item.detail}`

export type ExportPopupProps = {
  selectionIndex: number
  format: 'json' | 'yaml'
  outPathDraft: string
  historyItems: ExportHistoryItem[]
  historySelectionIndex: number
  historyErrorMessage: string | null

  onOutPathChange: (next: string) => void
  onSubmit: () => void
}

export const ExportPopup = ({
  selectionIndex,
  format,
  outPathDraft,
  historyItems,
  historySelectionIndex,
  historyErrorMessage,
  onOutPathChange,
  onSubmit,
}: ExportPopupProps) => {
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
        {padRight('Export History Payload', contentWidth)}
      </Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight('↑/↓ select · ←/→ change · Enter export · Esc close', contentWidth)}
      </Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight('Tip: use an absolute path, or relative to cwd.', contentWidth)}
      </Text>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>

      <Box flexDirection="column">
        <Text {...(normalizedSelection === 0 ? activeRowProps : inactiveRowProps)}>
          {padRight(`Format: ${format}`, contentWidth)}
        </Text>

        <Box flexDirection="row">
          <Text {...(normalizedSelection === 1 ? activeRowProps : inactiveRowProps)}>
            {padRight('Out:', 6)}
          </Text>
          <SingleLineTextInput
            value={outPathDraft}
            onChange={onOutPathChange}
            onSubmit={() => onSubmit()}
            placeholder={`prompt-export.${format}`}
            focus={normalizedSelection === 1}
            width={Math.max(1, contentWidth - 6)}
            backgroundColor={theme.popupBackground}
          />
        </Box>
      </Box>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>

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
    </PopupSheet>
  )
}
