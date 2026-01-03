import os from 'node:os'
import path from 'node:path'

import { adaptOpencodeThemeJson } from './theme-adapter'
import {
  defaultGlobalThemesDir,
  discoverProjectThemesDirs,
  listThemeJsonFiles,
} from './theme-discovery'
import { readJsonFile } from './theme-parse'
import { listThemes, type ThemeRegistryEntry } from './theme-registry'
import type { ThemeJson } from './theme-types'
import { validateThemeJson } from './theme-validate'

export type ThemeSource = 'builtin' | 'global' | 'project'

export type ThemeDescriptor = {
  name: string
  label: string
  source: ThemeSource
  theme: ThemeJson
  filePath?: string
}

export type ThemeLoadErrorKind = 'read' | 'parse' | 'validate'

export type ThemeLoadError = {
  kind: ThemeLoadErrorKind
  filePath: string
  message: string
}

export type LoadThemesOptions = {
  cwd?: string
  stopAt?: string | undefined
  homedir?: string
  globalThemesDir?: string
}

type ThemeCandidate = {
  name: string
  theme: ThemeJson
}

const loadThemeCandidateFromFile = async (
  filePath: string,
): Promise<{ ok: true; candidate: ThemeCandidate } | { ok: false; error: ThemeLoadError }> => {
  const name = path.basename(filePath, '.json')

  let parsed: unknown
  try {
    parsed = await readJsonFile(filePath)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown theme file read error.'
    const kind: ThemeLoadErrorKind = error instanceof SyntaxError ? 'parse' : 'read'
    return { ok: false, error: { kind, filePath, message } }
  }

  const validated = validateThemeJson(parsed)
  if (validated.ok) {
    return { ok: true, candidate: { name, theme: validated.theme } }
  }

  const adapted = adaptOpencodeThemeJson(parsed)
  if (adapted) {
    const adaptedValidated = validateThemeJson(adapted)
    if (adaptedValidated.ok) {
      return { ok: true, candidate: { name, theme: adaptedValidated.theme } }
    }

    return {
      ok: false,
      error: {
        kind: 'validate',
        filePath,
        message: `Theme JSON invalid (after adapting opencode schema): ${adaptedValidated.message}`,
      },
    }
  }

  return { ok: false, error: { kind: 'validate', filePath, message: validated.message } }
}

const toBuiltinDescriptor = (entry: ThemeRegistryEntry): ThemeDescriptor => ({
  name: entry.name,
  label: entry.label,
  source: 'builtin',
  theme: entry.theme,
})

const toCustomDescriptor = (
  candidate: ThemeCandidate,
  source: Exclude<ThemeSource, 'builtin'>,
  filePath: string,
  existing?: ThemeDescriptor,
): ThemeDescriptor => ({
  name: candidate.name,
  label: existing?.label ?? candidate.name,
  source,
  theme: candidate.theme,
  filePath,
})

export const loadThemes = async (
  options: LoadThemesOptions = {},
): Promise<{ themes: ThemeDescriptor[]; errors: ThemeLoadError[] }> => {
  const cwd = options.cwd ?? process.cwd()
  const homedir = options.homedir ?? os.homedir()
  const globalThemesDir = options.globalThemesDir ?? defaultGlobalThemesDir(homedir)

  const builtins = listThemes()
  const order: string[] = builtins.map((theme) => theme.name)
  const extras = new Set<string>()

  const themesByName = new Map<string, ThemeDescriptor>()
  for (const entry of builtins) {
    themesByName.set(entry.name, toBuiltinDescriptor(entry))
  }

  const errors: ThemeLoadError[] = []

  const applyThemeFiles = async (
    source: Exclude<ThemeSource, 'builtin'>,
    themesDir: string,
  ): Promise<void> => {
    const listing = await listThemeJsonFiles(themesDir)
    errors.push(...listing.errors)

    for (const filePath of listing.files) {
      const loaded = await loadThemeCandidateFromFile(filePath)
      if (!loaded.ok) {
        errors.push(loaded.error)
        continue
      }

      const existing = themesByName.get(loaded.candidate.name)
      themesByName.set(
        loaded.candidate.name,
        toCustomDescriptor(loaded.candidate, source, filePath, existing),
      )

      if (!order.includes(loaded.candidate.name)) {
        extras.add(loaded.candidate.name)
      }
    }
  }

  await applyThemeFiles('global', globalThemesDir)

  const projectDirs = await discoverProjectThemesDirs(cwd, options.stopAt)
  const orderedProjectDirs = [...projectDirs].reverse()

  for (const dir of orderedProjectDirs) {
    await applyThemeFiles('project', dir)
  }

  const extrasSorted = Array.from(extras).sort((a, b) => a.localeCompare(b))
  const finalNames = [...order, ...extrasSorted]

  return {
    themes: finalNames
      .map((name) => themesByName.get(name))
      .filter((theme): theme is ThemeDescriptor => Boolean(theme)),
    errors,
  }
}
