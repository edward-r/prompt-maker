import { useMemo } from 'react'
import { Box, Text, useStdout } from 'ink'

import { SingleLineTextInput } from '../core/SingleLineTextInput'
import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps, type InkColorValue } from '../../theme/theme-types'
import { PopupSheet } from './PopupSheet'
import {
  buildListPopupModel,
  type ListPopupBlockModel,
  type ListPopupRowModel,
  type ListPopupSectionModel,
} from './list-popup-model'

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
  selectedFocused?: boolean
  layout?: 'input-first' | 'selected-first'
  maxHeight?: number
  onDraftChange: (value: string) => void
  onSubmitDraft: (value: string) => void
}

const resolveRowTextProps = (
  row: ListPopupRowModel,
  backgroundProps: ReturnType<typeof inkBackgroundColorProps>,
  theme: {
    text: InkColorValue
    mutedText: InkColorValue
  },
  focusedSelectionProps: ReturnType<typeof inkColorProps> &
    ReturnType<typeof inkBackgroundColorProps>,
  unfocusedSelectionProps: ReturnType<typeof inkColorProps> &
    ReturnType<typeof inkBackgroundColorProps>,
): ReturnType<typeof inkColorProps> & ReturnType<typeof inkBackgroundColorProps> => {
  if (row.selection === 'focused') {
    return focusedSelectionProps
  }

  if (row.selection === 'unfocused') {
    return unfocusedSelectionProps
  }

  if (row.tone === 'muted') {
    return { ...backgroundProps, ...inkColorProps(theme.mutedText) }
  }

  return { ...backgroundProps, ...inkColorProps(theme.text) }
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
  selectedFocused,
  layout = 'input-first',
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

  const focusedSelectionProps = {
    ...inkColorProps(theme.selectionText),
    ...inkBackgroundColorProps(theme.selectionBackground),
  }

  const unfocusedSelectionProps = {
    ...inkColorProps(theme.chipText),
    ...inkBackgroundColorProps(theme.chipBackground),
  }

  // Hooks must run consistently across renders (suggestions can arrive async).
  const model = useMemo(() => {
    const modelOptions: Parameters<typeof buildListPopupModel>[0] = {
      items,
      selectedIndex,
      emptyLabel,
      instructions,
      layout,
      popupHeight,
      ...(suggestedItems === undefined ? {} : { suggestedItems }),
      ...(suggestedSelectionIndex === undefined ? {} : { suggestedSelectionIndex }),
      ...(suggestedFocused === undefined ? {} : { suggestedFocused }),
      ...(selectedFocused === undefined ? {} : { selectedFocused }),
    }

    return buildListPopupModel(modelOptions)
  }, [
    emptyLabel,
    instructions,
    items,
    layout,
    popupHeight,
    selectedFocused,
    selectedIndex,
    suggestedFocused,
    suggestedItems,
    suggestedSelectionIndex,
  ])

  const renderSpacer = (key: string) => (
    <Text key={key} {...backgroundProps}>
      {padRight('', contentWidth)}
    </Text>
  )

  const renderSection = (section: ListPopupSectionModel) => {
    const containerProps =
      section.fixedRowCount === undefined
        ? { flexDirection: 'column' as const }
        : {
            flexDirection: 'column' as const,
            height: 1 + section.fixedRowCount,
            flexShrink: 0,
            overflow: 'hidden' as const,
          }

    return (
      <Box key={`section-${section.id}`} {...containerProps}>
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight(section.header, contentWidth)}
        </Text>
        {section.rows.map((row) => (
          <Text
            key={row.key}
            {...resolveRowTextProps(
              row,
              backgroundProps,
              { text: theme.text, mutedText: theme.mutedText },
              focusedSelectionProps,
              unfocusedSelectionProps,
            )}
          >
            {padRight(row.label, contentWidth)}
          </Text>
        ))}
      </Box>
    )
  }

  const renderInput = (block: Extract<ListPopupBlockModel, { type: 'input' }>) => {
    if (block.input.variant === 'inline') {
      return (
        <Box key="input" flexDirection="row">
          <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
            {block.input.label}
          </Text>
          <SingleLineTextInput
            value={draft}
            onChange={onDraftChange}
            placeholder={placeholder}
            onSubmit={() => onSubmitDraft(draft)}
            focus={block.input.focus}
            width={Math.max(1, contentWidth - 'Add: '.length)}
            backgroundColor={theme.popupBackground}
          />
        </Box>
      )
    }

    return (
      <Box key="input" flexDirection="column">
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {padRight(block.input.title, contentWidth)}
        </Text>
        <SingleLineTextInput
          value={draft}
          onChange={onDraftChange}
          placeholder={placeholder}
          onSubmit={() => onSubmitDraft(draft)}
          focus={block.input.focus}
          width={contentWidth}
          backgroundColor={theme.popupBackground}
        />
      </Box>
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
        {padRight(title, contentWidth)}
      </Text>

      {model.blocks.map((block, index) => {
        switch (block.type) {
          case 'spacer':
            return renderSpacer(block.key)
          case 'input':
            return renderInput(block)
          case 'section':
            return renderSection(block.section)
          case 'instructions':
            return (
              <Box key={`instructions-${index}`} flexShrink={0} flexDirection="column">
                {block.lines.map((line, lineIndex) => (
                  <Text
                    key={`${lineIndex}-${line}`}
                    {...backgroundProps}
                    {...inkColorProps(theme.mutedText)}
                  >
                    {padRight(line, contentWidth)}
                  </Text>
                ))}
              </Box>
            )
        }
      })}
    </PopupSheet>
  )
}
