import { Box, Text, useStdout } from 'ink'

import type { ContextOverflowStrategy } from '../../../config'
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

const STRATEGY_OPTIONS = [
  '',
  'fail',
  'drop-smart',
  'drop-url',
  'drop-largest',
  'drop-oldest',
] as const satisfies ReadonlyArray<ContextOverflowStrategy | ''>

const formatStrategy = (strategy: ContextOverflowStrategy | ''): string =>
  strategy ? strategy : '(unset)'

export type BudgetsPopupProps = {
  selectionIndex: number
  maxContextTokensDraft: string
  maxInputTokensDraft: string
  contextOverflowStrategyDraft: ContextOverflowStrategy | ''
  errorMessage: string | null
  onMaxContextTokensChange: (next: string) => void
  onMaxInputTokensChange: (next: string) => void
  onSubmit: () => void
}

export const BudgetsPopup = ({
  selectionIndex,
  maxContextTokensDraft,
  maxInputTokensDraft,
  contextOverflowStrategyDraft,
  errorMessage,
  onMaxContextTokensChange,
  onMaxInputTokensChange,
  onSubmit,
}: BudgetsPopupProps) => {
  const { theme } = useTheme()
  const { stdout } = useStdout()

  const terminalColumns = stdout?.columns ?? 80
  const popupWidth = clamp(terminalColumns - 10, 44, 80)

  const paddingColumns = 2 * POPUP_PADDING_X
  const contentWidth = Math.max(0, popupWidth - paddingColumns)

  const backgroundProps = inkBackgroundColorProps(theme.popupBackground)

  const popupHeight = 16 + (errorMessage ? 1 : 0)

  const activeRowProps = {
    ...inkColorProps(theme.selectionText),
    ...inkBackgroundColorProps(theme.selectionBackground),
  }

  const inactiveRowProps = { ...backgroundProps, ...inkColorProps(theme.text) }

  const normalizedSelection = clamp(selectionIndex, 0, 2)

  const budgetsEnabled = Boolean(maxContextTokensDraft.trim() || maxInputTokensDraft.trim())
  const effectiveStrategy = budgetsEnabled
    ? contextOverflowStrategyDraft || 'fail'
    : contextOverflowStrategyDraft

  const effectiveLine = budgetsEnabled
    ? `Effective: input=${maxInputTokensDraft.trim() || 'unset'} · context=${maxContextTokensDraft.trim() || 'unset'} · overflow=${formatStrategy(effectiveStrategy)}`
    : `Effective: budgets disabled · overflow=${formatStrategy(effectiveStrategy)}`

  return (
    <PopupSheet
      width={popupWidth}
      height={popupHeight}
      paddingX={POPUP_PADDING_X}
      paddingY={POPUP_PADDING_Y}
      background={theme.popupBackground}
    >
      <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
        {padRight('Token Budgets', contentWidth)}
      </Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight('↑/↓ select · Enter apply · ←/→ change strategy · Esc close', contentWidth)}
      </Text>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>

      <Box flexDirection="column">
        <Box flexDirection="row">
          <Text {...(normalizedSelection === 0 ? activeRowProps : inactiveRowProps)}>
            {padRight('Max context tokens:', 18)}
          </Text>
          <SingleLineTextInput
            value={maxContextTokensDraft}
            onChange={onMaxContextTokensChange}
            onSubmit={() => onSubmit()}
            placeholder="unset"
            focus={normalizedSelection === 0}
            width={Math.max(1, contentWidth - 18)}
            backgroundColor={theme.popupBackground}
          />
        </Box>

        <Box flexDirection="row">
          <Text {...(normalizedSelection === 1 ? activeRowProps : inactiveRowProps)}>
            {padRight('Max input tokens:', 18)}
          </Text>
          <SingleLineTextInput
            value={maxInputTokensDraft}
            onChange={onMaxInputTokensChange}
            onSubmit={() => onSubmit()}
            placeholder="unset"
            focus={normalizedSelection === 1}
            width={Math.max(1, contentWidth - 18)}
            backgroundColor={theme.popupBackground}
          />
        </Box>

        <Box flexDirection="row">
          <Text {...(normalizedSelection === 2 ? activeRowProps : inactiveRowProps)}>
            {padRight('Overflow strategy:', 18)}
          </Text>
          <Text {...(normalizedSelection === 2 ? activeRowProps : inactiveRowProps)}>
            {padRight(formatStrategy(contextOverflowStrategyDraft), contentWidth - 18)}
          </Text>
        </Box>
      </Box>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight(effectiveLine, contentWidth)}
      </Text>

      {errorMessage ? (
        <Text {...backgroundProps} {...inkColorProps(theme.error)}>
          {padRight(errorMessage, contentWidth)}
        </Text>
      ) : null}

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight('Tip: clearing both token fields disables budgets.', contentWidth)}
      </Text>
    </PopupSheet>
  )
}

export const BUDGET_STRATEGY_OPTIONS = STRATEGY_OPTIONS
