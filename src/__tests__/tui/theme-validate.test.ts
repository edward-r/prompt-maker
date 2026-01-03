import fs from 'node:fs/promises'
import path from 'node:path'

import {
  REQUIRED_THEME_SLOTS,
  type ThemeColorValue,
  type ThemeJson,
} from '../../tui/theme/theme-types'
import { validateThemeJson } from '../../tui/theme/theme-validate'

const FIXTURES_ROOT = path.join(__dirname, '..', '__fixtures__', 'themes')

const readFixtureJson = async (relativePath: string): Promise<unknown> => {
  const filePath = path.join(FIXTURES_ROOT, relativePath)
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw) as unknown
}

const makeValidThemeJson = (): ThemeJson => {
  const theme: Record<string, ThemeColorValue> = {}
  for (const slot of REQUIRED_THEME_SLOTS) {
    theme[slot] = '#000000'
  }
  return { theme }
}

describe('theme validate', () => {
  test('rejects themes missing required slots (fixture)', async () => {
    const parsed = await readFixtureJson(
      path.join('project', '.prompt-maker-cli', 'themes', 'broken-theme.json'),
    )

    const validated = validateThemeJson(parsed)
    expect(validated).toEqual({
      ok: false,
      message:
        'Theme JSON missing required slots: text, mutedText, border, accent, accentText, warning, error, success, panelBackground, popupBackground, selectionBackground, selectionText, chipBackground, chipText, chipMutedText',
    })
  })

  test('rejects invalid defs color values', () => {
    const invalidVariant: unknown = { dark: '#000000', light: null }

    const validated = validateThemeJson({
      ...makeValidThemeJson(),
      defs: {
        bad: invalidVariant,
      },
    })

    expect(validated).toEqual({
      ok: false,
      message: 'Invalid defs color value for key: bad',
    })
  })

  test('rejects invalid required slot values', () => {
    const invalidVariant = { dark: '#000000', light: null } as unknown as ThemeColorValue

    const themeJson = makeValidThemeJson()

    const validated = validateThemeJson({
      ...themeJson,
      theme: {
        ...themeJson.theme,
        border: invalidVariant,
      },
    })

    expect(validated).toEqual({
      ok: false,
      message: 'Invalid theme color value for slot: border',
    })
  })
})
