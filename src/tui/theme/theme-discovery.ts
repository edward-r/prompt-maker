import fs from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import path from 'node:path'

export type ThemeDiscoveryError = {
  kind: 'read'
  filePath: string
  message: string
}

const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.stat(targetPath)
    return true
  } catch {
    return false
  }
}

export const defaultGlobalThemesDir = (homedir: string): string =>
  path.join(homedir, '.config', 'prompt-maker-cli', 'themes')

export const listThemeJsonFiles = async (
  themesDir: string,
): Promise<{ files: string[]; errors: ThemeDiscoveryError[] }> => {
  const errors: ThemeDiscoveryError[] = []

  if (!(await pathExists(themesDir))) {
    return { files: [], errors }
  }

  let entries: Dirent[]
  try {
    entries = await fs.readdir(themesDir, { withFileTypes: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown directory read error.'
    errors.push({ kind: 'read', filePath: themesDir, message })
    return { files: [], errors }
  }

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(themesDir, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))

  return { files, errors }
}

export const discoverProjectThemesDirs = async (
  cwd: string,
  stopAt?: string | undefined,
): Promise<string[]> => {
  const discovered: string[] = []

  const resolvedStopAt = stopAt ? path.resolve(stopAt) : null
  let current: string | null = path.resolve(cwd)

  while (current !== null) {
    const candidate = path.join(current, '.prompt-maker-cli', 'themes')
    if (await pathExists(candidate)) {
      discovered.push(candidate)
    }

    if (resolvedStopAt && current === resolvedStopAt) {
      current = null
      continue
    }

    const parent = path.dirname(current)
    if (parent === current) {
      current = null
      continue
    }

    current = parent
  }

  return discovered
}
