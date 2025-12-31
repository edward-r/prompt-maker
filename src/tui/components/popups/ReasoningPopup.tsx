import { Box, Text, useStdout } from 'ink'

import { ScrollableOutput } from '../core/ScrollableOutput'
import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps } from '../../theme/theme-types'
import type { HistoryEntry } from '../../types'
import { PopupSheet } from './PopupSheet'

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max))

const POPUP_PADDING_X = 2
const POPUP_PADDING_Y = 2

const padRight = (value: string, width: number): string => {
  if (width <= 0) {
    return ''
  }

  const trimmed = value.length > width ? value.slice(0, width) : value
  return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
}

export type ReasoningPopupProps = {
  lines: readonly HistoryEntry[]
  visibleRows: number
  scrollOffset: number
}

export const ReasoningPopup = ({ lines, visibleRows, scrollOffset }: ReasoningPopupProps) => {
  const { theme } = useTheme()
  const { stdout } = useStdout()

  const terminalColumns = stdout?.columns ?? 80
  const popupWidth = clamp(terminalColumns - 10, 40, 72)

  const paddingColumns = 2 * POPUP_PADDING_X
  const contentWidth = Math.max(0, popupWidth - paddingColumns)

  const backgroundProps = inkBackgroundColorProps(theme.popupBackground)

  const popupHeight = lines.length === 0 ? 9 : visibleRows + 8

  if (lines.length === 0) {
    return (
      <PopupSheet
        width={popupWidth}
        height={popupHeight}
        paddingX={POPUP_PADDING_X}
        paddingY={POPUP_PADDING_Y}
        background={theme.popupBackground}
      >
        <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
          {padRight('Model Reasoning', contentWidth)}
        </Text>
        <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('No reasoning recorded yet. Run generation first.', contentWidth)}
        </Text>
        <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('Esc to close', contentWidth)}
        </Text>
      </PopupSheet>
    )
  }

  return (
    <PopupSheet
      width={popupWidth}
      height={popupHeight}
      paddingX={POPUP_PADDING_X}
      paddingY={POPUP_PADDING_Y}
      background={theme.popupBackground}
    >
      <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
        {padRight('Model Reasoning', contentWidth)}
      </Text>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column" height={visibleRows} overflow="hidden">
        <ScrollableOutput
          lines={lines}
          visibleRows={visibleRows}
          scrollOffset={scrollOffset}
          contentWidth={contentWidth}
          backgroundColor={theme.popupBackground}
        />
      </Box>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight('↑/↓ scroll · PgUp/PgDn · Esc to close', contentWidth)}
      </Text>
    </PopupSheet>
  )
}
