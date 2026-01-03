import type {
  InkColorValue,
  MarkdownThemeSlot,
  RequiredThemeSlot,
  ResolvedTheme,
} from '../theme/theme-types'

/**
 * Minimal markdown token styling for the history pane.
 *
 * This is intentionally *not* a full markdown renderer; it’s a lightweight
 * tokenizer that applies semantic theme slots to common markdown constructs so
 * generated prompts are easier to review in the TUI.
 */

export type MarkdownSpan = {
  text: string
  slot: MarkdownThemeSlot
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

export type MarkdownLineTokenization = {
  spans: MarkdownSpan[]
  nextState: MarkdownTokenizationState
}

export type MarkdownTokenizationState = {
  inCodeBlock: boolean
}

export const DEFAULT_MARKDOWN_STATE: MarkdownTokenizationState = { inCodeBlock: false }

const SLOT_FALLBACKS: Record<MarkdownThemeSlot, RequiredThemeSlot> = {
  markdownText: 'text',
  markdownHeading: 'accent',
  markdownLink: 'accent',
  markdownLinkText: 'accent',
  markdownCode: 'warning',
  markdownBlockQuote: 'mutedText',
  markdownEmph: 'text',
  markdownStrong: 'text',
  markdownHorizontalRule: 'border',
  markdownListItem: 'mutedText',
  markdownListEnumeration: 'mutedText',
  markdownImage: 'accent',
  markdownImageText: 'text',
  markdownCodeBlock: 'mutedText',
}

export const resolveMarkdownSlotColor = (
  theme: ResolvedTheme,
  slot: MarkdownThemeSlot,
): InkColorValue => {
  const raw = theme[slot]
  if (raw !== undefined || Object.prototype.hasOwnProperty.call(theme, slot)) {
    return raw
  }

  return theme[SLOT_FALLBACKS[slot]]
}

const HR_RE = /^(?:\*\s*\*\s*\*\s*|-{3,}\s*|_{3,}\s*)$/
const HEADING_RE = /^(\s{0,3})(#{1,6})\s+(.*)$/
const BLOCKQUOTE_RE = /^(\s{0,3})>\s?(.*)$/
const BULLET_RE = /^(\s*)([-+*])\s+(.*)$/
const ENUM_RE = /^(\s*)(\d+)([.)])\s+(.*)$/

const startsFence = (line: string): boolean => /^\s*```/.test(line)

const pushSpan = (spans: MarkdownSpan[], span: MarkdownSpan) => {
  if (!span.text) {
    return
  }
  const last = spans[spans.length - 1]
  if (
    last &&
    last.slot === span.slot &&
    last.bold === span.bold &&
    last.italic === span.italic &&
    last.underline === span.underline
  ) {
    last.text += span.text
    return
  }
  spans.push(span)
}

const tokenizeInline = (text: string, baseSlot: MarkdownThemeSlot): MarkdownSpan[] => {
  const spans: MarkdownSpan[] = []
  let index = 0

  const flushPlain = (endExclusive: number) => {
    if (endExclusive <= index) {
      return
    }
    pushSpan(spans, { text: text.slice(index, endExclusive), slot: baseSlot })
    index = endExclusive
  }

  while (index < text.length) {
    const char = text[index]

    if (char === '`') {
      const end = text.indexOf('`', index + 1)
      if (end > index + 1) {
        flushPlain(index)
        pushSpan(spans, { text: text.slice(index, end + 1), slot: 'markdownCode' })
        index = end + 1
        continue
      }
    }

    if (text.startsWith('![', index)) {
      const closeBracket = text.indexOf(']', index + 2)
      const openParen = closeBracket >= 0 ? text.indexOf('(', closeBracket + 1) : -1
      const closeParen = openParen >= 0 ? text.indexOf(')', openParen + 1) : -1

      if (closeBracket >= 0 && openParen === closeBracket + 1 && closeParen > openParen) {
        flushPlain(index)
        pushSpan(spans, { text: '![', slot: 'markdownImage' })
        pushSpan(spans, {
          text: text.slice(index + 2, closeBracket),
          slot: 'markdownImageText',
        })
        pushSpan(spans, {
          text: text.slice(closeBracket, closeParen + 1),
          slot: 'markdownImage',
        })
        index = closeParen + 1
        continue
      }
    }

    if (char === '[') {
      const closeBracket = text.indexOf(']', index + 1)
      const openParen = closeBracket >= 0 ? text.indexOf('(', closeBracket + 1) : -1
      const closeParen = openParen >= 0 ? text.indexOf(')', openParen + 1) : -1

      if (closeBracket >= 0 && openParen === closeBracket + 1 && closeParen > openParen) {
        flushPlain(index)
        pushSpan(spans, { text: '[', slot: 'markdownLink' })
        pushSpan(spans, {
          text: text.slice(index + 1, closeBracket),
          slot: 'markdownLinkText',
          underline: true,
        })
        pushSpan(spans, {
          text: text.slice(closeBracket, closeParen + 1),
          slot: 'markdownLink',
        })
        index = closeParen + 1
        continue
      }
    }

    if (text.startsWith('**', index)) {
      const end = text.indexOf('**', index + 2)
      if (end > index + 2) {
        flushPlain(index)
        pushSpan(spans, { text: text.slice(index, end + 2), slot: 'markdownStrong', bold: true })
        index = end + 2
        continue
      }
    }

    if (char === '*') {
      const end = text.indexOf('*', index + 1)
      if (end > index + 1) {
        flushPlain(index)
        pushSpan(spans, { text: text.slice(index, end + 1), slot: 'markdownEmph', italic: true })
        index = end + 1
        continue
      }
    }

    const nextSpecialCandidates = [
      text.indexOf('`', index + 1),
      text.indexOf('![', index + 1),
      text.indexOf('[', index + 1),
      text.indexOf('*', index + 1),
    ].filter((value) => value >= 0)

    const nextSpecial = nextSpecialCandidates.length > 0 ? Math.min(...nextSpecialCandidates) : -1
    if (nextSpecial === -1) {
      flushPlain(text.length)
      break
    }

    flushPlain(nextSpecial)
  }

  return spans
}

const withLineStyle = (
  spans: MarkdownSpan[],
  style: Pick<MarkdownSpan, 'bold' | 'italic' | 'underline'>,
): MarkdownSpan[] => {
  if (!style.bold && !style.italic && !style.underline) {
    return spans
  }

  return spans.map((span) => ({
    ...span,
    ...(style.bold ? { bold: true } : {}),
    ...(style.italic ? { italic: true } : {}),
    ...(style.underline ? { underline: true } : {}),
  }))
}

export const tokenizeMarkdownLine = (
  line: string,
  state: MarkdownTokenizationState,
): MarkdownLineTokenization => {
  const trimmed = line.trimStart()

  if (startsFence(trimmed)) {
    return {
      spans: [{ text: line, slot: 'markdownCodeBlock' }],
      nextState: { inCodeBlock: !state.inCodeBlock },
    }
  }

  if (state.inCodeBlock) {
    return {
      spans: [{ text: line, slot: 'markdownCodeBlock' }],
      nextState: state,
    }
  }

  if (HR_RE.test(trimmed)) {
    return {
      spans: [{ text: line, slot: 'markdownHorizontalRule' }],
      nextState: state,
    }
  }

  const heading = HEADING_RE.exec(line)
  if (heading) {
    const indent = heading[1] ?? ''
    const hashes = heading[2] ?? ''
    const rest = heading[3] ?? ''

    const spans: MarkdownSpan[] = []
    if (indent) {
      pushSpan(spans, { text: indent, slot: 'markdownHeading' })
    }
    pushSpan(spans, { text: `${hashes} `, slot: 'markdownHeading' })
    tokenizeInline(rest, 'markdownHeading').forEach((span) => {
      pushSpan(spans, span)
    })

    return {
      spans: withLineStyle(spans, { bold: true }),
      nextState: state,
    }
  }

  const quote = BLOCKQUOTE_RE.exec(line)
  if (quote) {
    const indent = quote[1] ?? ''
    const rest = quote[2] ?? ''

    const spans: MarkdownSpan[] = []
    if (indent) {
      pushSpan(spans, { text: indent, slot: 'markdownBlockQuote' })
    }
    pushSpan(spans, { text: '> ', slot: 'markdownBlockQuote' })
    tokenizeInline(rest, 'markdownBlockQuote').forEach((span) => pushSpan(spans, span))
    return { spans, nextState: state }
  }

  const enumeration = ENUM_RE.exec(line)
  if (enumeration) {
    const indent = enumeration[1] ?? ''
    const number = enumeration[2] ?? ''
    const punctuation = enumeration[3] ?? '.'
    const rest = enumeration[4] ?? ''

    const spans: MarkdownSpan[] = []
    if (indent) {
      pushSpan(spans, { text: indent, slot: 'markdownText' })
    }
    pushSpan(spans, { text: `${number}${punctuation} `, slot: 'markdownListEnumeration' })
    tokenizeInline(rest, 'markdownText').forEach((span) => pushSpan(spans, span))
    return { spans, nextState: state }
  }

  const bullet = BULLET_RE.exec(line)
  if (bullet) {
    const indent = bullet[1] ?? ''
    const marker = bullet[2] ?? '-'
    const rest = bullet[3] ?? ''

    const spans: MarkdownSpan[] = []
    if (indent) {
      pushSpan(spans, { text: indent, slot: 'markdownText' })
    }
    pushSpan(spans, { text: `${marker} `, slot: 'markdownListItem' })
    tokenizeInline(rest, 'markdownText').forEach((span) => pushSpan(spans, span))
    return { spans, nextState: state }
  }

  return {
    spans: tokenizeInline(line, 'markdownText'),
    nextState: state,
  }
}

export const tokenizeMarkdownLines = (lines: readonly string[]): MarkdownSpan[][] => {
  let state = DEFAULT_MARKDOWN_STATE
  return lines.map((line) => {
    const tokenized = tokenizeMarkdownLine(line, state)
    state = tokenized.nextState
    return tokenized.spans
  })
}
