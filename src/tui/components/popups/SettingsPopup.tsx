import { useMemo } from 'react'
import { Box, Text, useStdout } from 'ink'

import { resolveIndicatorSegments, type IndicatorSegment } from '../core/status-indicators-layout'
import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps } from '../../theme/theme-types'
import type { InkColorValue } from '../../theme/theme-types'
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

export type SettingsPopupProps = {
  chips: readonly string[]
}

const resolveSegmentLabel = (segment: IndicatorSegment): string => segment.label

export const SettingsPopup = ({ chips }: SettingsPopupProps) => {
  const { theme } = useTheme()
  const { stdout } = useStdout()
  const segments = useMemo(() => resolveIndicatorSegments(chips), [chips])

  const terminalColumns = stdout?.columns ?? 80
  const popupWidth = clamp(terminalColumns - 10, 40, 72)

  const paddingColumns = 2 * POPUP_PADDING_X
  const contentWidth = Math.max(0, popupWidth - paddingColumns)

  const backgroundProps = inkBackgroundColorProps(theme.popupBackground)

  const resolveSegmentColor = (segment: IndicatorSegment): InkColorValue => {
    switch (segment.style) {
      case 'success':
        return theme.success
      case 'warning':
        return theme.warning
      case 'danger':
        return theme.error
      case 'primary':
        return theme.text
      case 'muted':
      default:
        return theme.mutedText
    }
  }

  const popupHeight = 8 + Math.max(1, segments.length)

  return (
    <PopupSheet
      width={popupWidth}
      height={popupHeight}
      paddingX={POPUP_PADDING_X}
      paddingY={POPUP_PADDING_Y}
      background={theme.popupBackground}
    >
      <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
        {padRight('Current Settings', contentWidth)}
      </Text>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        {segments.length === 0 ? (
          <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
            {padRight('No settings available yet.', contentWidth)}
          </Text>
        ) : (
          segments.map((segment) => {
            const label = `${resolveSegmentLabel(segment)}: `
            const value = segment.value
            const remaining = Math.max(0, contentWidth - label.length - value.length)

            return (
              <Box key={segment.id} flexDirection="row">
                <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
                  {label}
                </Text>
                <Text {...backgroundProps} {...inkColorProps(resolveSegmentColor(segment))}>
                  {value}
                </Text>
                <Text {...backgroundProps}>{' '.repeat(remaining)}</Text>
              </Box>
            )
          })
        )}
      </Box>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight('Esc to close', contentWidth)}
      </Text>
    </PopupSheet>
  )
}
