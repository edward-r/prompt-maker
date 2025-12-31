import { useMemo, type ComponentProps } from 'react'
import { Box, Text, useStdout } from 'ink'

import { SingleLineTextInput } from '../core/SingleLineTextInput'
import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps } from '../../theme/theme-types'
import { resolveWindowedList } from './list-window'
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

export type SmartPopupProps = {
  savedRoot: string | null
  draft: string
  suggestedItems: readonly string[]
  suggestedSelectionIndex: number
  suggestedFocused: boolean
  maxHeight?: number
  onDraftChange: (value: string) => void
  onSubmitRoot: (value: string) => void
}

type SuggestionWindow = {
  start: number
  values: readonly string[]
  showBefore: boolean
  showAfter: boolean
}

const resolveSuggestionWindow = (
  suggestions: readonly string[],
  selectedIndex: number,
  maxRows: number,
): SuggestionWindow => {
  if (suggestions.length === 0 || maxRows <= 0) {
    return { start: 0, values: [], showBefore: false, showAfter: false }
  }

  const window = resolveWindowedList({
    itemCount: suggestions.length,
    selectedIndex,
    maxVisibleRows: maxRows,
    lead: 1,
  })

  return {
    start: window.start,
    values: suggestions.slice(window.start, window.end),
    showBefore: window.showBefore,
    showAfter: window.showAfter,
  }
}

export const SmartPopup = ({
  savedRoot,
  draft,
  suggestedItems,
  suggestedSelectionIndex,
  suggestedFocused,
  maxHeight,
  onDraftChange,
  onSubmitRoot,
}: SmartPopupProps) => {
  const { theme } = useTheme()
  const { stdout } = useStdout()

  const terminalColumns = stdout?.columns ?? 80
  const popupWidth = clamp(terminalColumns - 10, 40, 72)

  const paddingColumns = 2 * POPUP_PADDING_X
  const contentWidth = Math.max(0, popupWidth - paddingColumns)

  const backgroundProps = inkBackgroundColorProps(theme.popupBackground)

  const hasSuggestions = suggestedItems.length > 0
  const safeSuggestedSelection = Math.max(
    0,
    Math.min(suggestedSelectionIndex, Math.max(suggestedItems.length - 1, 0)),
  )
  const effectiveSuggestedFocused = hasSuggestions && suggestedFocused

  const popupHeight = Math.max(9, Math.floor(maxHeight ?? 9))

  const suggestionRows = useMemo(() => {
    const paddingRows = 2 * POPUP_PADDING_Y
    const contentRows = Math.max(1, popupHeight - paddingRows)

    const fixedRows = 5
    return Math.max(0, contentRows - fixedRows)
  }, [popupHeight])

  const visibleSuggestions = useMemo(
    () => resolveSuggestionWindow(suggestedItems, safeSuggestedSelection, suggestionRows),
    [safeSuggestedSelection, suggestedItems, suggestionRows],
  )

  const savedLabel = savedRoot ? savedRoot : '(none)'

  const focusedSelectionProps = {
    ...inkColorProps(theme.selectionText),
    ...inkBackgroundColorProps(theme.selectionBackground),
  }

  const unfocusedSelectionProps = {
    ...inkColorProps(theme.chipText),
    ...inkBackgroundColorProps(theme.chipBackground),
  }

  const suggestionLines = useMemo(() => {
    const lines: Array<{ key: string; label: string; props: ComponentProps<typeof Text> }> = []

    if (!hasSuggestions) {
      lines.push({
        key: 'empty',
        label: '(type to filter)',
        props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
      })
    } else {
      if (visibleSuggestions.showBefore) {
        lines.push({
          key: 'before',
          label: '… earlier …',
          props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
        })
      }

      visibleSuggestions.values.forEach((value, index) => {
        const actualIndex = visibleSuggestions.start + index
        const isSelected = actualIndex === safeSuggestedSelection
        const textProps = isSelected
          ? effectiveSuggestedFocused
            ? focusedSelectionProps
            : unfocusedSelectionProps
          : { ...backgroundProps, ...inkColorProps(theme.text) }

        lines.push({ key: `${value}-${actualIndex}`, label: value, props: textProps })
      })

      if (visibleSuggestions.showAfter) {
        lines.push({
          key: 'after',
          label: '… later …',
          props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
        })
      }
    }

    while (lines.length < suggestionRows) {
      lines.push({ key: `pad-${lines.length}`, label: '', props: backgroundProps })
    }

    return lines
  }, [
    backgroundProps,
    effectiveSuggestedFocused,
    focusedSelectionProps,
    hasSuggestions,
    safeSuggestedSelection,
    suggestionRows,
    theme.mutedText,
    theme.text,
    unfocusedSelectionProps,
    visibleSuggestions.showAfter,
    visibleSuggestions.showBefore,
    visibleSuggestions.start,
    visibleSuggestions.values,
  ])

  const rootLabel = 'Root: '
  const inputWidth = Math.max(1, contentWidth - rootLabel.length)

  return (
    <PopupSheet
      width={popupWidth}
      height={popupHeight}
      paddingX={POPUP_PADDING_X}
      paddingY={POPUP_PADDING_Y}
      background={theme.popupBackground}
    >
      <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
        {padRight('Smart Context Root', contentWidth)}
      </Text>
      <Text {...backgroundProps} {...inkColorProps(theme.text)}>
        {padRight('Enter to save · Tab suggestions · Esc close', contentWidth)}
      </Text>

      <Box flexDirection="row">
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {rootLabel}
        </Text>
        <SingleLineTextInput
          value={draft}
          onChange={onDraftChange}
          onSubmit={onSubmitRoot}
          placeholder="relative/dir"
          focus={!effectiveSuggestedFocused}
          width={inputWidth}
          backgroundColor={theme.popupBackground}
        />
      </Box>

      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight(`Saved root: ${savedLabel}`, contentWidth)}
      </Text>

      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight('Suggestions', contentWidth)}
      </Text>

      {suggestionRows > 0 ? (
        <Box flexDirection="column" height={suggestionRows} flexShrink={0} overflow="hidden">
          {suggestionLines.map((line) => (
            <Text key={line.key} {...line.props}>
              {padRight(line.label, contentWidth)}
            </Text>
          ))}
        </Box>
      ) : null}
    </PopupSheet>
  )
}
