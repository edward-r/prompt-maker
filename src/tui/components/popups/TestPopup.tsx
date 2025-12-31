import { Box, Text, useStdout } from 'ink'

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

  const trimmed = value.length > width ? value.slice(0, width) : value
  return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
}

export type TestPopupProps = {
  draft: string
  isRunning: boolean
  onDraftChange: (value: string) => void
  onSubmitDraft: (value: string) => void
}

export const TestPopup = ({ draft, isRunning, onDraftChange, onSubmitDraft }: TestPopupProps) => {
  const { theme } = useTheme()
  const { stdout } = useStdout()

  const terminalColumns = stdout?.columns ?? 80
  const popupWidth = clamp(terminalColumns - 10, 40, 72)

  const paddingColumns = 2 * POPUP_PADDING_X
  const contentWidth = Math.max(0, popupWidth - paddingColumns)

  const backgroundProps = inkBackgroundColorProps(theme.popupBackground)

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
        {padRight('Prompt Tests', contentWidth)}
      </Text>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('Suite path (Enter to run; blank uses prompt-tests.yaml)', contentWidth)}
        </Text>
        <SingleLineTextInput
          value={draft}
          onChange={onDraftChange}
          onSubmit={() => onSubmitDraft(draft)}
          placeholder="prompt-tests.yaml"
          focus
          width={contentWidth}
          backgroundColor={theme.popupBackground}
        />
      </Box>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight(
          isRunning ? 'Tests running… please wait' : 'Enter to start tests · Esc to close',
          contentWidth,
        )}
      </Text>
    </PopupSheet>
  )
}
