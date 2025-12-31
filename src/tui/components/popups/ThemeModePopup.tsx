import { Box, Text, useStdout } from 'ink'

import type { ThemeMode } from '../../theme/theme-types'
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

  const trimmed = value.length > width ? value.slice(0, width) : value
  return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
}

export type ThemeModePopupProps = {
  selectionIndex: number
  initialMode: ThemeMode
}

const OPTIONS: readonly ThemeMode[] = ['system', 'dark', 'light']

const formatMode = (mode: ThemeMode): string => {
  if (mode === 'system') {
    return 'System'
  }
  return mode.charAt(0).toUpperCase() + mode.slice(1)
}

export const ThemeModePopup = ({ selectionIndex, initialMode }: ThemeModePopupProps) => {
  const { theme, mode, error } = useTheme()
  const { stdout } = useStdout()

  const terminalColumns = stdout?.columns ?? 80
  const popupWidth = clamp(terminalColumns - 10, 40, 72)

  const paddingColumns = 2 * POPUP_PADDING_X
  const contentWidth = Math.max(0, popupWidth - paddingColumns)

  const backgroundProps = inkBackgroundColorProps(theme.popupBackground)

  const selected = Math.min(selectionIndex, OPTIONS.length - 1)

  const popupHeight = 12 + (error ? 1 : 0)

  return (
    <PopupSheet
      width={popupWidth}
      height={popupHeight}
      paddingX={POPUP_PADDING_X}
      paddingY={POPUP_PADDING_Y}
      background={theme.popupBackground}
    >
      <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
        {padRight('Theme Mode', contentWidth)}
      </Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight(
          `Current: ${formatMode(initialMode)} · Active: ${formatMode(mode)}`,
          contentWidth,
        )}
      </Text>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        {OPTIONS.map((option, index) => {
          const isSelected = index === selected

          const textProps = isSelected
            ? {
                ...inkColorProps(theme.selectionText),
                ...inkBackgroundColorProps(theme.selectionBackground),
              }
            : { ...backgroundProps, ...inkColorProps(theme.text) }

          return (
            <Text key={option} {...textProps}>
              {padRight(formatMode(option), contentWidth)}
            </Text>
          )
        })}
      </Box>
      {error ? (
        <Text {...backgroundProps} {...inkColorProps(theme.error)}>
          {padRight(error.message, contentWidth)}
        </Text>
      ) : null}
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight('↑/↓ select · Enter apply · Esc close', contentWidth)}
      </Text>
    </PopupSheet>
  )
}

export const THEME_MODE_OPTIONS = OPTIONS
