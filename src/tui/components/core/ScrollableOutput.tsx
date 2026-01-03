import { memo, useMemo } from 'react'
import { Box, Text } from 'ink'

import type { HistoryEntry } from '../../types'
import { useTheme } from '../../theme/theme-provider'
import { inkBackgroundColorProps, inkColorProps, type InkColorValue } from '../../theme/theme-types'
import {
  DEFAULT_MARKDOWN_STATE,
  resolveMarkdownSlotColor,
  tokenizeMarkdownLine,
} from '../../markdown/markdown-highlight'

const padRight = (value: string, width: number | undefined): string => {
  if (typeof width !== 'number' || width <= 0) {
    return value
  }

  const trimmed = value.length > width ? value.slice(0, width) : value
  return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
}

export type ScrollableOutputProps = {
  lines: readonly HistoryEntry[]
  visibleRows: number
  scrollOffset: number

  contentWidth?: number | undefined
  backgroundColor?: InkColorValue
}

export const ScrollableOutput = memo(
  ({ lines, visibleRows, scrollOffset, contentWidth, backgroundColor }: ScrollableOutputProps) => {
    const { theme } = useTheme()

    const startIndex = Math.max(0, Math.min(scrollOffset, Math.max(0, lines.length - visibleRows)))
    const endIndex = Math.min(lines.length, startIndex + visibleRows)
    const visibleLines = useMemo(
      () => lines.slice(startIndex, endIndex),
      [lines, startIndex, endIndex],
    )

    const backgroundProps = inkBackgroundColorProps(backgroundColor)

    const padded = useMemo(() => {
      const next: Array<HistoryEntry | null> = [...visibleLines]
      while (next.length < visibleRows) {
        next.push(null)
      }
      return next
    }, [visibleLines, visibleRows])

    const markdownStartState = useMemo(() => {
      let state = DEFAULT_MARKDOWN_STATE

      for (let i = 0; i < startIndex; i += 1) {
        const entry = lines[i]
        if (!entry || entry.format !== 'markdown') {
          state = DEFAULT_MARKDOWN_STATE
          continue
        }

        if (/^\s*```/.test(entry.content)) {
          state = { inCodeBlock: !state.inCodeBlock }
        }
      }

      return state
    }, [lines, startIndex])

    const decorated = useMemo(() => {
      let state = markdownStartState

      return padded.map((entry) => {
        if (!entry) {
          state = DEFAULT_MARKDOWN_STATE
          return { entry, content: '', spans: null }
        }

        const content =
          typeof contentWidth === 'number' && contentWidth > 0
            ? entry.content.slice(0, contentWidth)
            : entry.content

        if (entry.format === 'markdown') {
          const tokenized = tokenizeMarkdownLine(content, state)
          state = tokenized.nextState
          return { entry, content, spans: tokenized.spans }
        }

        state = DEFAULT_MARKDOWN_STATE
        return { entry, content, spans: null }
      })
    }, [contentWidth, markdownStartState, padded])

    return (
      <Box flexDirection="column" height={visibleRows} overflow="hidden">
        {decorated.map((row, index) => {
          if (!row.entry) {
            return (
              <Text key={`blank-${startIndex + index}`} {...backgroundProps}>
                {padRight('', contentWidth)}
              </Text>
            )
          }

          const key = `${row.entry.id}-${startIndex + index}`

          if (row.entry.format === 'markdown' && row.spans) {
            const paddingLength =
              typeof contentWidth === 'number' && contentWidth > 0
                ? Math.max(0, contentWidth - row.content.length)
                : 0

            return (
              <Text key={key} {...backgroundProps}>
                {row.spans.map((span, spanIndex) => (
                  <Text
                    key={`${key}-span-${spanIndex}`}
                    {...inkColorProps(resolveMarkdownSlotColor(theme, span.slot))}
                    {...(span.bold ? { bold: true } : {})}
                    {...(span.italic ? { italic: true } : {})}
                    {...(span.underline ? { underline: true } : {})}
                  >
                    {span.text}
                  </Text>
                ))}
                {paddingLength > 0 ? ' '.repeat(paddingLength) : null}
              </Text>
            )
          }

          const color =
            row.entry.kind === 'user'
              ? theme.accent
              : row.entry.kind === 'progress'
                ? theme.warning
                : theme.text

          return (
            <Text key={key} {...backgroundProps} {...inkColorProps(color)}>
              {padRight(row.entry.content, contentWidth)}
            </Text>
          )
        })}
      </Box>
    )
  },
)

ScrollableOutput.displayName = 'ScrollableOutput'
