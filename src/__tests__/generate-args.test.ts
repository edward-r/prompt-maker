import { extractIntentArg, stripHelpFlags } from '../generate/args'

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
})
