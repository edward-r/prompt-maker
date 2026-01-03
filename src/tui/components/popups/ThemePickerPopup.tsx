import { useMemo } from 'react'
import { Box, Text, useStdout } from 'ink'

import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps } from '../../theme/theme-types'
import { resolveWindowedValues } from './list-windowing'
import { PopupSheet } from './PopupSheet'

export type ThemePickerPopupProps = {
  selectionIndex: number
  initialThemeName: string
  maxHeight?: number
}

const POPUP_PADDING_X = 2
const POPUP_PADDING_Y = 2

const resolveListRows = (popupHeight: number, hasError: boolean): number => {
  const paddingRows = 2 * POPUP_PADDING_Y
  const contentHeight = Math.max(1, popupHeight - paddingRows)

  const fixedRows = 4 + (hasError ? 1 : 0)
  return Math.max(1, contentHeight - fixedRows)
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max))

const padRight = (value: string, width: number): string => {
  if (width <= 0) {
    return ''
  }

  const trimmed = value.length > width ? value.slice(0, width) : value
  if (trimmed.length === width) {
    return trimmed
  }

  return `${trimmed}${' '.repeat(width - trimmed.length)}`
}

export const ThemePickerPopup = ({
  selectionIndex,
  initialThemeName,
  maxHeight,
}: ThemePickerPopupProps) => {
  const { theme, themes, activeThemeName, error } = useTheme()
  const { stdout } = useStdout()

  const terminalColumns = stdout?.columns ?? 80

  // Keep the popup reasonably sized and deterministic.
  const popupWidth = clamp(terminalColumns - 10, 40, 72)

  const paddingColumns = 2 * POPUP_PADDING_X
  const contentWidth = Math.max(10, popupWidth - paddingColumns)

  const fallbackHeight = 16
  const popupHeight = Math.max(10, Math.floor(maxHeight ?? fallbackHeight))

  const listRows = useMemo(() => resolveListRows(popupHeight, Boolean(error)), [error, popupHeight])

  const names = useMemo(() => themes.map((descriptor) => descriptor.name), [themes])
  const labelsByName = useMemo(() => {
    const entries = themes.map((descriptor) => [descriptor.name, descriptor.label] as const)
    return new Map(entries)
  }, [themes])

  const initialLabel = labelsByName.get(initialThemeName) ?? initialThemeName

  const clampedSelection = Math.min(selectionIndex, Math.max(names.length - 1, 0))

  const window = useMemo(
    () => resolveWindowedValues(names, clampedSelection, listRows),
    [clampedSelection, listRows, names],
  )

  const selectedTextProps = {
    ...inkColorProps(theme.selectionText),
    ...inkBackgroundColorProps(theme.selectionBackground),
  }

  const backgroundProps = inkBackgroundColorProps(theme.popupBackground)

  const renderFill = (width: number): string => (width > 0 ? ' '.repeat(width) : '')

  const headerLeft = 'Theme'
  const headerRight = 'esc'
  const headerGap = Math.max(0, contentWidth - headerLeft.length - headerRight.length)

  const currentLabel = `Current: ${initialLabel}`

  const listLines = useMemo((): Array<{ key: string; label: string; isSelected: boolean }> => {
    const lines: Array<{ key: string; label: string; isSelected: boolean }> = []

    if (names.length === 0) {
      lines.push({
        key: 'empty',
        label: padRight('No themes loaded.', contentWidth),
        isSelected: false,
      })
      while (lines.length < listRows) {
        lines.push({
          key: `pad-${lines.length}`,
          label: padRight('', contentWidth),
          isSelected: false,
        })
      }
      return lines
    }

    if (window.showBefore) {
      lines.push({ key: 'before', label: '… earlier …', isSelected: false })
    }

    window.values.forEach((name, offset) => {
      const label = labelsByName.get(name) ?? name
      const isActive = name === activeThemeName
      const line = `${isActive ? '●' : ' '} ${label}`
      const isSelected = window.start + offset === clampedSelection
      lines.push({ key: name, label: line, isSelected })
    })

    if (window.showAfter) {
      lines.push({ key: 'after', label: '… later …', isSelected: false })
    }

    while (lines.length < listRows) {
      lines.push({ key: `pad-${lines.length}`, label: '', isSelected: false })
    }

    return lines.map((line) => ({ ...line, label: padRight(line.label, contentWidth) }))
  }, [activeThemeName, clampedSelection, contentWidth, labelsByName, listRows, names, window])

  const footer = '↑/↓ preview · Enter confirm · Esc cancel'

  return (
    <PopupSheet
      width={popupWidth}
      height={popupHeight}
      paddingX={POPUP_PADDING_X}
      paddingY={POPUP_PADDING_Y}
      background={theme.popupBackground}
    >
      <Box flexDirection="row">
        <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
          {headerLeft}
        </Text>
        <Text {...backgroundProps}>{renderFill(headerGap)}</Text>
        <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
          {headerRight}
        </Text>
      </Box>

      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight(currentLabel, contentWidth)}
      </Text>

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Box flexDirection="column">
        {listLines.map((line) => (
          <Text
            key={line.key}
            {...(line.isSelected
              ? selectedTextProps
              : { ...backgroundProps, ...inkColorProps(theme.text) })}
          >
            {line.label}
          </Text>
        ))}
      </Box>

      {error ? (
        <Text {...backgroundProps} {...inkColorProps(theme.error)}>
          {padRight(error.message, contentWidth)}
        </Text>
      ) : null}

      <Text {...backgroundProps}>{padRight('', contentWidth)}</Text>
      <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
        {padRight(footer, contentWidth)}
      </Text>
    </PopupSheet>
  )
}
