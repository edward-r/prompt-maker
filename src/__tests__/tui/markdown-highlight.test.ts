import {
  resolveMarkdownSlotColor,
  tokenizeMarkdownLines,
} from '../../tui/markdown/markdown-highlight'
import type { ResolvedTheme } from '../../tui/theme/theme-types'

const makeBaseTheme = (): ResolvedTheme => ({
  background: '#000000',
  text: '#ffffff',
  mutedText: '#888888',
  border: '#444444',
  accent: '#00ffff',
  accentText: '#000000',
  warning: '#ffff00',
  error: '#ff0000',
  success: '#00ff00',
  panelBackground: '#111111',
  popupBackground: '#111111',
  selectionBackground: '#333333',
  selectionText: '#ffffff',
  chipBackground: '#222222',
  chipText: '#ffffff',
  chipMutedText: '#aaaaaa',
})

describe('markdown-highlight', () => {
  test('tokenizes common markdown constructs into theme slots', () => {
    const lines = [
      '# Heading',
      '> Blockquote with `code`',
      '- Bullet item',
      '1. Enumerated item',
      '---',
      '[Link text](https://example.com)',
      '`inline`',
      '**strong** and *emph*',
      '![alt text](image.png)',
      '```ts',
      'const x = 1',
      '```',
    ]

    const tokenized = tokenizeMarkdownLines(lines)

    expect(tokenized[0]?.[0]?.slot).toBe('markdownHeading')
    expect(tokenized[1]?.[0]?.slot).toBe('markdownBlockQuote')

    expect(tokenized[2]?.some((span) => span.slot === 'markdownListItem')).toBe(true)
    expect(tokenized[3]?.some((span) => span.slot === 'markdownListEnumeration')).toBe(true)

    expect(tokenized[4]?.[0]?.slot).toBe('markdownHorizontalRule')

    const linkLine = tokenized[5] ?? []
    expect(linkLine.some((span) => span.slot === 'markdownLinkText' && span.underline)).toBe(true)
    expect(linkLine.some((span) => span.slot === 'markdownLink')).toBe(true)

    expect(tokenized[6]?.[0]?.slot).toBe('markdownCode')

    const strongLine = tokenized[7] ?? []
    expect(strongLine.some((span) => span.slot === 'markdownStrong' && span.bold)).toBe(true)
    expect(strongLine.some((span) => span.slot === 'markdownEmph' && span.italic)).toBe(true)

    const imageLine = tokenized[8] ?? []
    expect(imageLine.some((span) => span.slot === 'markdownImageText')).toBe(true)
    expect(imageLine.some((span) => span.slot === 'markdownImage')).toBe(true)

    expect(tokenized[9]?.[0]?.slot).toBe('markdownCodeBlock')
    expect(tokenized[10]?.[0]?.slot).toBe('markdownCodeBlock')
    expect(tokenized[11]?.[0]?.slot).toBe('markdownCodeBlock')
  })

  test('resolves markdown slot colors with fallbacks', () => {
    const base = makeBaseTheme()

    expect(resolveMarkdownSlotColor(base, 'markdownText')).toBe(base.text)
    expect(resolveMarkdownSlotColor(base, 'markdownHeading')).toBe(base.accent)
    expect(resolveMarkdownSlotColor(base, 'markdownHorizontalRule')).toBe(base.border)

    const overridden: ResolvedTheme = {
      ...base,
      markdownHeading: '#123456',
      markdownLink: undefined,
    }

    expect(resolveMarkdownSlotColor(overridden, 'markdownHeading')).toBe('#123456')
    expect(resolveMarkdownSlotColor(overridden, 'markdownLink')).toBeUndefined()
  })
})
