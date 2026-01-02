import { parseUrlArgs, validateHttpUrlCandidate } from '../../tui/screens/command/utils/url-args'

describe('url args', () => {
  test('parseUrlArgs splits on whitespace and commas', () => {
    expect(parseUrlArgs(' https://a.com https://b.com ')).toEqual([
      'https://a.com',
      'https://b.com',
    ])

    expect(parseUrlArgs('https://a.com,https://b.com')).toEqual(['https://a.com', 'https://b.com'])

    expect(parseUrlArgs('https://a.com, https://b.com\nhttps://c.com')).toEqual([
      'https://a.com',
      'https://b.com',
      'https://c.com',
    ])
  })

  test('validateHttpUrlCandidate validates HTTP(S)', () => {
    expect(validateHttpUrlCandidate('https://example.com').ok).toBe(true)
    expect(validateHttpUrlCandidate('http://example.com').ok).toBe(true)

    const empty = validateHttpUrlCandidate('   ')
    expect(empty.ok).toBe(false)

    const invalid = validateHttpUrlCandidate('notaurl')
    expect(invalid.ok).toBe(false)

    const protocol = validateHttpUrlCandidate('ftp://example.com')
    expect(protocol.ok).toBe(false)
  })
})
