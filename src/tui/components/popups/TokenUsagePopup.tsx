import { Box, Text, useStdout } from 'ink'

import type { TokenUsageBreakdown, TokenUsageRun } from '../../token-usage-store'
import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps } from '../../theme/theme-types'
import { PopupSheet } from './PopupSheet'

const formatNumber = (value: number): string => value.toLocaleString('en-US')

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

const formatUsd = (value: number | null): string => {
  if (value === null) {
    return 'n/a'
  }
  if (value === 0) {
    return '$0.00'
  }
  if (value < 0.01) {
    return `$${value.toFixed(4)}`
  }
  return `$${value.toFixed(2)}`
}

const padCell = (value: string, width: number, align: 'left' | 'right'): string => {
  if (value.length >= width) {
    return value
  }
  const padding = ' '.repeat(width - value.length)
  return align === 'right' ? `${padding}${value}` : `${value}${padding}`
}

type Row = {
  label: string
  tokens: number
}

const renderTable = (rows: readonly Row[]): string[] => {
  const labelWidth = Math.max(12, ...rows.map((row) => row.label.length))
  const tokenWidth = Math.max(8, ...rows.map((row) => formatNumber(row.tokens).length))

  return rows.map((row) => {
    const label = padCell(row.label, labelWidth, 'left')
    const tokens = padCell(formatNumber(row.tokens), tokenWidth, 'right')
    return `${label}  ${tokens}`
  })
}

export type TokenUsagePopupProps = {
  run: TokenUsageRun | null
  breakdown: TokenUsageBreakdown | null
  budgets: import('../../budget-settings').BudgetSettings
  latestContextOverflow: import('../../generation-pipeline-reducer').ContextOverflowDetails | null
}

export const TokenUsagePopup = ({
  run,
  breakdown,
  budgets,
  latestContextOverflow,
}: TokenUsagePopupProps) => {
  const { theme } = useTheme()
  const { stdout } = useStdout()

  const terminalColumns = stdout?.columns ?? 80
  const popupWidth = clamp(terminalColumns - 10, 40, 72)

  const paddingColumns = 2 * POPUP_PADDING_X
  const contentWidth = Math.max(0, popupWidth - paddingColumns)

  const backgroundProps = inkBackgroundColorProps(theme.popupBackground)

  const terminalRows = stdout?.rows ?? 24
  const popupHeight = clamp(terminalRows - 6, 18, 34)

  const budgetsEnabled = budgets.maxContextTokens !== null || budgets.maxInputTokens !== null
  const effectiveOverflow = budgets.contextOverflowStrategy ?? (budgetsEnabled ? 'fail' : null)

  const overflowSummary = latestContextOverflow
    ? `Last overflow: ${latestContextOverflow.strategy} · dropped ${latestContextOverflow.droppedPaths.length}`
    : 'Last overflow: none'

  const overflowPreview = latestContextOverflow
    ? (() => {
        const previewLimit = 5
        const preview = latestContextOverflow.droppedPaths
          .slice(0, previewLimit)
          .map((entry) => entry.path)
        const remaining = latestContextOverflow.droppedPaths.length - preview.length
        const suffix = remaining > 0 ? ` …(+${remaining} more)` : ''
        return preview.length > 0 ? `Dropped: ${preview.join(', ')}${suffix}` : 'Dropped: (none)'
      })()
    : null

  if (!run || !breakdown) {
    return (
      <PopupSheet
        width={popupWidth}
        height={popupHeight}
        paddingX={POPUP_PADDING_X}
        paddingY={POPUP_PADDING_Y}
        background={theme.popupBackground}
      >
        <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
          {padRight('Token Usage', contentWidth)}
        </Text>
        <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('No token usage recorded yet. Run generation first.', contentWidth)}
        </Text>

        <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight(
            `Budgets: input=${budgets.maxInputTokens ?? 'unset'} · context=${budgets.maxContextTokens ?? 'unset'} · overflow=${effectiveOverflow ?? 'unset'}`,
            contentWidth,
          )}
        </Text>

        <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight(overflowSummary, contentWidth)}
        </Text>
        {overflowPreview ? (
          <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
            {padRight(overflowPreview, contentWidth)}
          </Text>
        ) : null}

        <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('Esc to close', contentWidth)}
        </Text>
      </PopupSheet>
    )
  }

  const inputRows = renderTable([
    { label: 'Intent', tokens: breakdown.input.intent },
    { label: 'Files', tokens: breakdown.input.files },
    { label: 'System', tokens: breakdown.input.system },
    { label: 'Input total', tokens: breakdown.input.total },
  ])

  const outputRows = renderTable([
    { label: 'Reasoning', tokens: breakdown.output.reasoning },
    { label: 'Final prompt', tokens: breakdown.output.prompt },
    { label: 'Output total', tokens: breakdown.output.total },
  ])

  return (
    <PopupSheet
      width={popupWidth}
      height={popupHeight}
      paddingX={POPUP_PADDING_X}
      paddingY={POPUP_PADDING_Y}
      background={theme.popupBackground}
    >
      <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
        {padRight('Token Usage', contentWidth)}
      </Text>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        <Text {...backgroundProps} {...inkColorProps(theme.text)}>
          {padRight(`Model: ${run.model}`, contentWidth)}
        </Text>
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight(`Started: ${run.startedAt}`, contentWidth)}
        </Text>
      </Box>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('Input', contentWidth)}
        </Text>
        {inputRows.map((line) => (
          <Text key={`input-${line}`} {...backgroundProps} {...inkColorProps(theme.text)}>
            {padRight(line, contentWidth)}
          </Text>
        ))}
      </Box>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('Output', contentWidth)}
        </Text>
        {outputRows.map((line) => (
          <Text key={`output-${line}`} {...backgroundProps} {...inkColorProps(theme.text)}>
            {padRight(line, contentWidth)}
          </Text>
        ))}
      </Box>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('Totals', contentWidth)}
        </Text>
        <Text {...backgroundProps} {...inkColorProps(theme.text)}>
          {padRight(`Total tokens ${formatNumber(breakdown.totals.tokens)}`, contentWidth)}
        </Text>
        <Text {...backgroundProps} {...inkColorProps(theme.text)}>
          {padRight(`Estimated cost ${formatUsd(breakdown.totals.estimatedCostUsd)}`, contentWidth)}
        </Text>
      </Box>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('Budgets', contentWidth)}
        </Text>
        <Text {...backgroundProps} {...inkColorProps(theme.text)}>
          {padRight(
            `input=${budgets.maxInputTokens ?? 'unset'} · context=${budgets.maxContextTokens ?? 'unset'} · overflow=${effectiveOverflow ?? 'unset'}`,
            contentWidth,
          )}
        </Text>
      </Box>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('Context Overflow', contentWidth)}
        </Text>
        <Text {...backgroundProps} {...inkColorProps(theme.text)}>
          {padRight(overflowSummary, contentWidth)}
        </Text>
        {overflowPreview ? (
          <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
            {padRight(overflowPreview, contentWidth)}
          </Text>
        ) : null}
      </Box>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight('Esc to close', contentWidth)}
      </Text>
    </PopupSheet>
  )
}
