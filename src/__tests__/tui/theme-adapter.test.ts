import fs from 'node:fs/promises'
import path from 'node:path'

import { adaptOpencodeThemeJson } from '../../tui/theme/theme-adapter'
import { validateThemeJson } from '../../tui/theme/theme-validate'

const FIXTURES_ROOT = path.join(__dirname, '..', '__fixtures__', 'themes')

const readFixtureJson = async (relativePath: string): Promise<unknown> => {
  const filePath = path.join(FIXTURES_ROOT, relativePath)
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw) as unknown
}

describe('theme adapter', () => {
  test('does not adapt prompt-maker schema themes', async () => {
    const parsed = await readFixtureJson(path.join('global', 'ocean.json'))
    expect(adaptOpencodeThemeJson(parsed)).toBeNull()
  })

  test('adapts opencode-like themes into prompt-maker schema', async () => {
    const parsed = await readFixtureJson(path.join('adapt', 'opencode.json'))

    const adapted = adaptOpencodeThemeJson(parsed)
    expect(adapted).not.toBeNull()

    const validated = validateThemeJson(adapted)
    expect(validated.ok).toBe(true)

    if (!validated.ok) {
      throw new Error('Expected adapted theme to validate')
    }

    expect(validated.theme.defs?.surface).toBe('#0b2a32')

    expect(validated.theme.theme.textMuted).toBe('#94d2bd')
    expect(validated.theme.theme.backgroundPanel).toBe('surface')
    expect(validated.theme.theme.backgroundElement).toBe('#005f73')
    expect(validated.theme.theme.primary).toBe('#0a9396')

    expect(validated.theme.theme.mutedText).toBe('textMuted')
    expect(validated.theme.theme.panelBackground).toBe('backgroundPanel')
    expect(validated.theme.theme.popupBackground).toBe('panelBackground')
    expect(validated.theme.theme.accent).toBe('primary')
    expect(validated.theme.theme.accentText).toBe('background')
    expect(validated.theme.theme.selectionBackground).toBe('backgroundElement')
    expect(validated.theme.theme.selectionText).toBe('text')
    expect(validated.theme.theme.chipBackground).toBe('backgroundElement')
    expect(validated.theme.theme.chipText).toBe('text')
    expect(validated.theme.theme.chipMutedText).toBe('textMuted')
  })
})
