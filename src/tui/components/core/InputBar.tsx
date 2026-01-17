import React from 'react'
import { Box, Text, useStdout } from 'ink'

import { MultilineTextInput, type DebugKeyEvent } from './MultilineTextInput'
import { resolveIndicatorSegments } from './status-indicators-layout'
import { resolveInputBarPresentation, type InputBarMode } from './input-bar-presentation'
import type { TokenLabelLookup } from './tokenized-text'

import { OpencodeSpinner } from '../OpencodeSpinner'

import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps } from '../../theme/theme-types'

export { estimateInputBarRows } from './input-bar-layout'
export type { InputBarRowEstimateOptions } from './input-bar-layout'

const APP_CONTAINER_PADDING_X = 2
const COMMAND_SCREEN_PADDING_X = 1

const padRight = (value: string, width: number): string => {
  if (width <= 0) {
    return ''
  }

  const trimmed = value.length > width ? value.slice(0, width) : value
  return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
}

export type InputBarProps = {
  value: string
  onChange: (next: string) => void
  onSubmit: (value: string) => void
  mode?: InputBarMode
  isDisabled?: boolean
  isPasteActive?: boolean
  isBusy?: boolean
  statusChips: readonly string[]
  placeholder?: string
  hint?: string | undefined
  debugLine?: string | undefined
  tokenLabel?: TokenLabelLookup | undefined
  onDebugKeyEvent?: ((event: DebugKeyEvent) => void) | undefined
}

export const InputBar: React.FC<InputBarProps> = ({
  value,
  onChange,
  onSubmit,
  mode = 'intent',
  isDisabled = false,
  isPasteActive = false,
  isBusy = false,
  statusChips,
  placeholder,
  hint,
  debugLine,
  tokenLabel,
  onDebugKeyEvent,
}) => {
  const { theme } = useTheme()
  const { stdout } = useStdout()

  // `resolveInputBarPresentation` is pure but involves string/config mapping.
  // Memoizing it keeps the render path a bit more predictable.
  const presentation = React.useMemo(() => resolveInputBarPresentation(mode), [mode])

  const summary = React.useMemo(() => {
    const segments = resolveIndicatorSegments(statusChips)
    const status = segments.find((segment) => segment.label === 'Status')
    const model = segments.find((segment) => segment.label === 'Model')
    const polish = segments.find((segment) => segment.label === 'Polish')
    const target = segments.find((segment) => segment.label === 'Target')
    return { status, model, polish, target }
  }, [statusChips])

  const borderColor = presentation.borderTone === 'warning' ? theme.warning : theme.border
  const labelColor = presentation.labelTone === 'warning' ? theme.warning : theme.mutedText

  const terminalColumns = stdout?.columns ?? 80
  const barWidth = Math.max(
    0,
    terminalColumns - 2 * (APP_CONTAINER_PADDING_X + COMMAND_SCREEN_PADDING_X),
  )

  const backgroundProps = inkBackgroundColorProps(theme.panelBackground)

  const busyStatusSuffix = ' (working)'
  const busySpinnerLabel = '  Ctrl+c interrupt'

  const busySpinnerMaxLength = 12
  const busySpinnerLength = Math.min(busySpinnerMaxLength, Math.max(1, barWidth - 2))
  const busySpinnerLabelWidth = Math.max(0, barWidth - 2 - busySpinnerLength)
  const busySpinnerLabelText = busySpinnerLabel.slice(0, busySpinnerLabelWidth)

  const statusLineColumns = React.useMemo(() => {
    const joinerColumns = ' · '.length
    let columns = 0
    let partCount = 0

    const addPart = (value: string): void => {
      if (partCount > 0) {
        columns += joinerColumns
      }
      columns += value.length
      partCount += 1
    }

    if (summary.status) {
      const suffix = isBusy ? busyStatusSuffix : ''
      addPart(`Status: ${summary.status.value}${suffix}`)
    }

    if (summary.model) {
      addPart(`Model: ${summary.model.value}`)
    }

    if (summary.polish) {
      addPart(`Polish: ${summary.polish.value}`)
    }

    if (summary.target) {
      addPart(`Target: ${summary.target.value}`)
    }

    return columns
  }, [
    busyStatusSuffix,
    isBusy,
    summary.model?.value,
    summary.polish?.value,
    summary.status?.value,
    summary.target?.value,
  ])

  const BORDER_GLYPH = '▌'

  const renderBorderPrefix = (): React.ReactNode => (
    <>
      <Text {...backgroundProps} {...inkColorProps(borderColor)}>
        {BORDER_GLYPH}
      </Text>
      <Text {...backgroundProps}> </Text>
    </>
  )

  const renderBareBorderPrefix = (): React.ReactNode => <Text>{padRight('', 2)}</Text>

  return (
    <Box flexDirection="column" paddingLeft={0} paddingRight={0} paddingY={0} width="100%">
      <Box flexDirection="column" width="100%" {...inkBackgroundColorProps(theme.panelBackground)}>
        <Box flexDirection="row" width="100%">
          {renderBorderPrefix()}
          <Text {...backgroundProps} {...inkColorProps(labelColor)} bold={presentation.labelBold}>
            {presentation.label}
          </Text>
          <Text {...backgroundProps}>
            {padRight('', Math.max(0, barWidth - 2 - presentation.label.length))}
          </Text>
        </Box>

        {hint ? (
          <Box flexDirection="row" width="100%">
            {renderBorderPrefix()}
            <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
              {hint}
            </Text>
            <Text {...backgroundProps}>
              {padRight('', Math.max(0, barWidth - 2 - hint.length))}
            </Text>
          </Box>
        ) : null}

        {debugLine ? (
          <Box flexDirection="row" width="100%">
            {renderBorderPrefix()}
            <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
              {debugLine}
            </Text>
            <Text {...backgroundProps}>
              {padRight('', Math.max(0, barWidth - 2 - debugLine.length))}
            </Text>
          </Box>
        ) : null}

        <MultilineTextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder={placeholder ?? 'Describe your goal or type /command'}
          focus={!isDisabled}
          isDisabled={isDisabled}
          isPasteActive={isPasteActive}
          tokenLabel={tokenLabel}
          onDebugKeyEvent={onDebugKeyEvent}
          gutter={{ glyph: BORDER_GLYPH, color: borderColor, spacer: 1 }}
          width={barWidth}
          backgroundColor={theme.panelBackground}
        />

        {summary.status || summary.model || summary.polish || summary.target ? (
          <Box flexDirection="row" width="100%">
            {renderBorderPrefix()}

            {summary.status ? (
              <>
                <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
                  Status:{' '}
                </Text>
                <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
                  {summary.status.value}
                </Text>
                {isBusy ? (
                  <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
                    {busyStatusSuffix}
                  </Text>
                ) : null}
              </>
            ) : null}

            {summary.status && (summary.model || summary.polish || summary.target) ? (
              <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
                {' · '}
              </Text>
            ) : null}

            {summary.model ? (
              <>
                <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
                  Model:{' '}
                </Text>
                <Text {...backgroundProps} {...inkColorProps(theme.text)}>
                  {summary.model.value}
                </Text>
              </>
            ) : null}

            {summary.model && (summary.polish || summary.target) ? (
              <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
                {' · '}
              </Text>
            ) : null}

            {summary.polish ? (
              <>
                <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
                  Polish:{' '}
                </Text>
                <Text {...backgroundProps} {...inkColorProps(theme.text)}>
                  {summary.polish.value}
                </Text>
              </>
            ) : null}

            {summary.polish && summary.target ? (
              <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
                {' · '}
              </Text>
            ) : null}

            {summary.target ? (
              <>
                <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
                  Target:{' '}
                </Text>
                <Text {...backgroundProps} {...inkColorProps(theme.text)}>
                  {summary.target.value}
                </Text>
              </>
            ) : null}

            <Text {...backgroundProps}>
              {padRight('', Math.max(0, barWidth - 2 - statusLineColumns))}
            </Text>
          </Box>
        ) : null}
      </Box>

      <Box flexDirection="row" width="100%">
        {renderBareBorderPrefix()}

        {isBusy ? (
          <>
            <OpencodeSpinner length={busySpinnerLength} />
            <Text {...inkColorProps(theme.mutedText)}>{busySpinnerLabelText}</Text>
          </>
        ) : null}

        <Text>
          {padRight(
            '',
            Math.max(
              0,
              barWidth - 2 - (isBusy ? busySpinnerLength + busySpinnerLabelText.length : 0),
            ),
          )}
        </Text>
      </Box>
    </Box>
  )
}
