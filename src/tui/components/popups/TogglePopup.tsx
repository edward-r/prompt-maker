import { Box, Text, useStdout } from 'ink'

import { TOGGLE_LABELS } from '../../config'
import type { ToggleField } from '../../types'
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

export type TogglePopupProps = {
  field: ToggleField
  selectionIndex: number
}

export const TogglePopup = ({ field, selectionIndex }: TogglePopupProps) => {
  const { theme } = useTheme()
  const { stdout } = useStdout()

  const terminalColumns = stdout?.columns ?? 80
  const popupWidth = clamp(terminalColumns - 10, 40, 72)

  const paddingColumns = 2 * POPUP_PADDING_X
  const contentWidth = Math.max(0, popupWidth - paddingColumns)

  const backgroundProps = inkBackgroundColorProps(theme.popupBackground)

  const options = ['On', 'Off']

  const popupHeight = 10

  return (
    <PopupSheet
      width={popupWidth}
      height={popupHeight}
      paddingX={POPUP_PADDING_X}
      paddingY={POPUP_PADDING_Y}
      background={theme.popupBackground}
    >
      <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
        {padRight(`${TOGGLE_LABELS[field]} Setting`, contentWidth)}
      </Text>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        {options.map((label, index) => {
          const isSelected = index === selectionIndex
          const textProps = isSelected
            ? {
                ...inkColorProps(theme.selectionText),
                ...inkBackgroundColorProps(theme.selectionBackground),
              }
            : { ...backgroundProps, ...inkColorProps(theme.text) }

          return (
            <Text key={label} {...textProps}>
              {padRight(label, contentWidth)}
            </Text>
          )
        })}
      </Box>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight('Use arrows to select · Enter to confirm · Esc to cancel', contentWidth)}
      </Text>
    </PopupSheet>
  )
}
