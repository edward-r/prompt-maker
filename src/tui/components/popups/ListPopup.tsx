import { useMemo, type ComponentProps } from 'react'
import { Box, Text, useStdout } from 'ink'

import { SingleLineTextInput } from '../core/SingleLineTextInput'
import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps } from '../../theme/theme-types'
import { resolveListPopupHeights, DEFAULT_MAX_VISIBLE_LIST_ITEMS } from './list-popup-layout'
import { resolveWindowedList } from './list-window'
import { PopupSheet } from './PopupSheet'

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max))

const POPUP_PADDING_X = 2
const POPUP_PADDING_Y = 2
const POPUP_MIN_HEIGHT = 10

const padRight = (value: string, width: number): string => {
  if (width <= 0) {
    return ''
  }

  const trimmed = value.length > width ? value.slice(0, width) : value
  return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
}

export type ListPopupProps = {
  title: string
  placeholder: string
  draft: string
  items: readonly string[]
  selectedIndex: number
  emptyLabel: string
  instructions: string
  suggestedItems?: readonly string[]
  suggestedSelectionIndex?: number
  suggestedFocused?: boolean
  maxHeight?: number
  onDraftChange: (value: string) => void
  onSubmitDraft: (value: string) => void
}

const resolveSelectedVisible = (
  items: readonly string[],
  selectedIndex: number,
  maxRows: number,
): { start: number; values: readonly string[]; showBefore: boolean; showAfter: boolean } => {
  if (items.length === 0) {
    return { start: 0, values: [], showBefore: false, showAfter: false }
  }

  const window = resolveWindowedList({
    itemCount: items.length,
    selectedIndex,
    maxVisibleRows: maxRows,
    lead: 2,
  })

  return {
    start: window.start,
    values: items.slice(window.start, window.end),
    showBefore: window.showBefore,
    showAfter: window.showAfter,
  }
}

const resolveSuggestedVisible = (
  suggestions: readonly string[],
  selectedIndex: number,
  maxRows: number,
): { start: number; values: readonly string[]; showBefore: boolean; showAfter: boolean } => {
  if (suggestions.length === 0) {
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

export const ListPopup = ({
  title,
  placeholder,
  draft,
  items,
  selectedIndex,
  emptyLabel,
  instructions,
  suggestedItems,
  suggestedSelectionIndex,
  suggestedFocused,
  maxHeight,
  onDraftChange,
  onSubmitDraft,
}: ListPopupProps) => {
  const { theme } = useTheme()
  const { stdout } = useStdout()

  const terminalColumns = stdout?.columns ?? 80
  const popupWidth = clamp(terminalColumns - 10, 40, 72)

  const paddingColumns = 2 * POPUP_PADDING_X
  const contentWidth = Math.max(0, popupWidth - paddingColumns)

  const backgroundProps = inkBackgroundColorProps(theme.popupBackground)

  const fallbackHeight = 16
  const popupHeight = Math.max(POPUP_MIN_HEIGHT, Math.floor(maxHeight ?? fallbackHeight))

  const hasSuggestions = (suggestedItems?.length ?? 0) > 0

  const safeSuggestedSelection = Math.max(
    0,
    Math.min(suggestedSelectionIndex ?? 0, Math.max((suggestedItems?.length ?? 0) - 1, 0)),
  )
  const effectiveSuggestedFocused = Boolean(hasSuggestions && suggestedFocused)

  const focusedSelectionProps = {
    ...inkColorProps(theme.selectionText),
    ...inkBackgroundColorProps(theme.selectionBackground),
  }

  const unfocusedSelectionProps = {
    ...inkColorProps(theme.chipText),
    ...inkBackgroundColorProps(theme.chipBackground),
  }

  // Hooks must run consistently across renders (suggestions can arrive async).
  const heights = useMemo(
    () => resolveListPopupHeights({ maxHeight: popupHeight, hasSuggestions }),
    [hasSuggestions, popupHeight],
  )

  const selectedVisible = useMemo(
    () => resolveSelectedVisible(items, selectedIndex, heights.selectedRows),
    [heights.selectedRows, items, selectedIndex],
  )

  const suggestionRows = heights.suggestionRows

  const suggestedVisible = useMemo(() => {
    if (!hasSuggestions || suggestionRows <= 0) {
      return { start: 0, values: [], showBefore: false, showAfter: false }
    }

    return resolveSuggestedVisible(suggestedItems ?? [], safeSuggestedSelection, suggestionRows)
  }, [hasSuggestions, safeSuggestedSelection, suggestedItems, suggestionRows])

  const upperBound = Math.max(items.length - DEFAULT_MAX_VISIBLE_LIST_ITEMS, 0)
  const start = Math.max(0, Math.min(selectedIndex - 2, upperBound))
  const visibleItems = items.slice(start, start + DEFAULT_MAX_VISIBLE_LIST_ITEMS)

  const selectedLines = useMemo(() => {
    const lines: Array<{ key: string; label: string; props: ComponentProps<typeof Text> }> = []

    if (items.length === 0) {
      lines.push({
        key: 'empty',
        label: emptyLabel,
        props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
      })
    } else {
      if (selectedVisible.showBefore) {
        lines.push({
          key: 'before',
          label: '… earlier entries …',
          props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
        })
      }

      selectedVisible.values.forEach((value, index) => {
        const actualIndex = selectedVisible.start + index
        const isSelected = actualIndex === selectedIndex
        const rowLabel = `${actualIndex + 1}. ${value}`
        const textProps = isSelected
          ? focusedSelectionProps
          : { ...backgroundProps, ...inkColorProps(theme.text) }

        lines.push({ key: `${value}-${actualIndex}`, label: rowLabel, props: textProps })
      })

      if (selectedVisible.showAfter) {
        lines.push({
          key: 'after',
          label: '… later entries …',
          props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
        })
      }
    }

    while (lines.length < heights.selectedRows) {
      lines.push({ key: `pad-${lines.length}`, label: '', props: backgroundProps })
    }

    return lines
  }, [
    backgroundProps,
    emptyLabel,
    focusedSelectionProps,
    heights.selectedRows,
    items.length,
    selectedIndex,
    selectedVisible.showAfter,
    selectedVisible.showBefore,
    selectedVisible.start,
    selectedVisible.values,
    theme.mutedText,
    theme.text,
  ])

  const suggestionLines = useMemo(() => {
    const lines: Array<{ key: string; label: string; props: ComponentProps<typeof Text> }> = []

    if (suggestionRows <= 0) {
      return lines
    }

    if (suggestedVisible.showBefore) {
      lines.push({
        key: 'before',
        label: '… earlier suggestions …',
        props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
      })
    }

    suggestedVisible.values.forEach((value, index) => {
      const actualIndex = suggestedVisible.start + index
      const isSelected = actualIndex === safeSuggestedSelection

      const textProps = isSelected
        ? effectiveSuggestedFocused
          ? focusedSelectionProps
          : unfocusedSelectionProps
        : { ...backgroundProps, ...inkColorProps(theme.text) }

      lines.push({ key: `${value}-${actualIndex}`, label: value, props: textProps })
    })

    if (suggestedVisible.showAfter) {
      lines.push({
        key: 'after',
        label: '… later suggestions …',
        props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
      })
    }

    while (lines.length < suggestionRows) {
      lines.push({ key: `pad-${lines.length}`, label: '', props: backgroundProps })
    }

    return lines
  }, [
    backgroundProps,
    effectiveSuggestedFocused,
    focusedSelectionProps,
    safeSuggestedSelection,
    suggestionRows,
    suggestedVisible.showAfter,
    suggestedVisible.showBefore,
    suggestedVisible.start,
    suggestedVisible.values,
    theme.mutedText,
    theme.text,
    unfocusedSelectionProps,
  ])

  return hasSuggestions ? (
    <PopupSheet
      width={popupWidth}
      height={popupHeight}
      paddingX={POPUP_PADDING_X}
      paddingY={POPUP_PADDING_Y}
      background={theme.popupBackground}
    >
      <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
        {padRight(title, contentWidth)}
      </Text>

      <Box flexDirection="row">
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          Add:
        </Text>
        <SingleLineTextInput
          value={draft}
          onChange={onDraftChange}
          placeholder={placeholder}
          onSubmit={() => onSubmitDraft(draft)}
          focus={!effectiveSuggestedFocused}
          width={Math.max(1, contentWidth - 'Add: '.length)}
          backgroundColor={theme.popupBackground}
        />
      </Box>

      <Box
        flexDirection="column"
        height={1 + heights.selectedRows}
        flexShrink={0}
        overflow="hidden"
      >
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('Selected', contentWidth)}
        </Text>
        {selectedLines.map((line) => (
          <Text key={line.key} {...line.props}>
            {padRight(line.label, contentWidth)}
          </Text>
        ))}
      </Box>

      {suggestionRows > 0 ? (
        <Box flexDirection="column" height={1 + suggestionRows} flexShrink={0} overflow="hidden">
          <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
            {padRight('Suggestions', contentWidth)}
          </Text>
          {suggestionLines.map((line) => (
            <Text key={line.key} {...line.props}>
              {padRight(line.label, contentWidth)}
            </Text>
          ))}
        </Box>
      ) : null}

      <Box flexShrink={0}>
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight(instructions, contentWidth)}
        </Text>
      </Box>
    </PopupSheet>
  ) : (
    <PopupSheet
      width={popupWidth}
      height={popupHeight}
      paddingX={POPUP_PADDING_X}
      paddingY={POPUP_PADDING_Y}
      background={theme.popupBackground}
    >
      <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
        {padRight(title, contentWidth)}
      </Text>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight('Add new', contentWidth)}
        </Text>
        <SingleLineTextInput
          value={draft}
          onChange={onDraftChange}
          placeholder={placeholder}
          onSubmit={() => onSubmitDraft(draft)}
          focus
          width={contentWidth}
          backgroundColor={theme.popupBackground}
        />
      </Box>
      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        {items.length === 0 ? (
          <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
            {padRight(emptyLabel, contentWidth)}
          </Text>
        ) : (
          <>
            {start > 0 ? (
              <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
                {padRight('… earlier entries …', contentWidth)}
              </Text>
            ) : null}
            {visibleItems.map((value, index) => {
              const actualIndex = start + index
              const isSelected = actualIndex === selectedIndex
              const textProps = isSelected
                ? focusedSelectionProps
                : { ...backgroundProps, ...inkColorProps(theme.text) }
              return (
                <Text key={`${value}-${actualIndex}`} {...textProps}>
                  {padRight(`${actualIndex + 1}. ${value}`, contentWidth)}
                </Text>
              )
            })}
            {start + DEFAULT_MAX_VISIBLE_LIST_ITEMS < items.length ? (
              <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
                {padRight('… later entries …', contentWidth)}
              </Text>
            ) : null}
          </>
        )}
      </Box>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight(instructions, contentWidth)}
      </Text>
    </PopupSheet>
  )
}
