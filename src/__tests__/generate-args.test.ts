import { extractIntentArg, parseGenerateArgs, stripHelpFlags } from '../generate/args'

describe('generate args helpers', () => {
  describe('extractIntentArg', () => {
    it('detects positional intent after -i/--interactive', () => {
      const result = extractIntentArg(['-i', 'intent.md', '--json'])

      expect(result.positionalIntent).toBe('intent.md')
      expect(result.positionalIntentAfterInteractive).toBe(true)
      expect(result.optionArgs).toEqual(['-i', '--json'])
    })

    it('consumes value flags without treating them as intent', () => {
      const result = extractIntentArg(['--context', 'src/**/*.ts', 'do the thing'])

      expect(result.positionalIntent).toBe('do the thing')
      expect(result.optionArgs).toEqual(['--context', 'src/**/*.ts'])
    })
  })

  describe('stripHelpFlags', () => {
    it('removes help flags before -- passthrough', () => {
      const result = stripHelpFlags(['--help', '-h', '--json'])

      expect(result.helpRequested).toBe(true)
      expect(result.optionArgs).toEqual(['--json'])
    })

    it('preserves help tokens after -- passthrough', () => {
      const result = stripHelpFlags(['--help', '--', '--help', '-h'])

      expect(result.helpRequested).toBe(true)
      expect(result.optionArgs).toEqual(['--', '--help', '-h'])
    })
  })

  describe('parseGenerateArgs', () => {
    it('parses token budget flags without consuming intent', () => {
      const parsed = parseGenerateArgs(['--max-input-tokens', '100', 'do the thing'])

      expect(parsed.args.maxInputTokens).toBe(100)
      expect(parsed.args.intent).toBe('do the thing')
    })

    it('rejects non-positive integer token budgets', () => {
      expect(() => parseGenerateArgs(['--max-input-tokens', '0'])).toThrow(
        '--max-input-tokens must be a positive integer.',
      )

      expect(() => parseGenerateArgs(['--max-context-tokens', '1.5'])).toThrow(
        '--max-context-tokens must be a positive integer.',
      )
    })

    it('parses validated context overflow strategy', () => {
      const parsed = parseGenerateArgs(['--context-overflow', 'drop-oldest'])

      expect(parsed.args.contextOverflow).toBe('drop-oldest')
    })

    it('rejects invalid context overflow strategy', () => {
      expect(() => parseGenerateArgs(['--context-overflow', 'nope'])).toThrow()
    })
  })
})
