/*
 * File/directory suggestion helpers used by the Ink TUI.
 *
 * This module contains two layers:
 * 1) Discovery (IO): scan the workspace using `fast-glob`.
 * 2) Filtering (pure): rank/limit suggestions based on a user query.
 *
 * Keeping filtering logic pure makes it easy to unit test and helps ensure
 * later UI refactors don’t accidentally change suggestion behavior.
 */

import path from 'node:path'

import fg from 'fast-glob'
import { byLengthAsc, byStartAsc, Fzf, extendedMatch } from 'fzf'

const FILE_SUGGESTION_PATTERNS = ['**/*']

export const FILE_SUGGESTION_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/coverage/**',
  '**/.git/**',
  '**/.nx/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/.cache/**',
  '**/build/**',
  '**/out/**',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
]

const DEFAULT_FILE_SUGGESTION_LIMIT = 200

const normalizeToPosix = (value: string): string => value.split(path.sep).join('/')

const toDisplayPath = (cwd: string, candidatePath: string): string | null => {
  const absolutePath = path.isAbsolute(candidatePath)
    ? candidatePath
    : path.resolve(cwd, candidatePath)
  const relative = path.relative(cwd, absolutePath)
  if (!relative || relative.startsWith('..')) {
    return null
  }
  return normalizeToPosix(relative)
}

export type DiscoverFileSuggestionsOptions = {
  cwd?: string
  limit?: number
}

export const discoverFileSuggestions = async (
  options: DiscoverFileSuggestionsOptions = {},
): Promise<string[]> => {
  const cwd = options.cwd ?? process.cwd()
  const limit = options.limit ?? DEFAULT_FILE_SUGGESTION_LIMIT

  const matches = await fg(FILE_SUGGESTION_PATTERNS, {
    cwd,
    dot: true,
    absolute: true,
    onlyFiles: true,
    unique: true,
    suppressErrors: true,
    followSymbolicLinks: false,
    ignore: FILE_SUGGESTION_IGNORE_PATTERNS,
  })

  const unique = new Set<string>()
  for (const match of matches) {
    const displayPath = toDisplayPath(cwd, match)
    if (!displayPath) {
      continue
    }
    unique.add(displayPath)
  }

  return [...unique].sort().slice(0, limit)
}

export type DiscoverDirectorySuggestionsOptions = {
  cwd?: string
  limit?: number
}

export const discoverDirectorySuggestions = async (
  options: DiscoverDirectorySuggestionsOptions = {},
): Promise<string[]> => {
  const cwd = options.cwd ?? process.cwd()
  const limit = options.limit ?? DEFAULT_FILE_SUGGESTION_LIMIT

  const matches = await fg(FILE_SUGGESTION_PATTERNS, {
    cwd,
    dot: true,
    absolute: true,
    onlyDirectories: true,
    unique: true,
    suppressErrors: true,
    followSymbolicLinks: false,
    ignore: FILE_SUGGESTION_IGNORE_PATTERNS,
  })

  const unique = new Set<string>()
  for (const match of matches) {
    const displayPath = toDisplayPath(cwd, match)
    if (!displayPath) {
      continue
    }
    unique.add(displayPath)
  }

  return [...unique].sort().slice(0, limit)
}

const INTENT_FILE_SUGGESTION_PATTERNS = ['**/*.{md,markdown,txt}']

export type DiscoverIntentFileSuggestionsOptions = {
  cwd?: string
  limit?: number
}

export const discoverIntentFileSuggestions = async (
  options: DiscoverIntentFileSuggestionsOptions = {},
): Promise<string[]> => {
  const cwd = options.cwd ?? process.cwd()
  const limit = options.limit ?? DEFAULT_FILE_SUGGESTION_LIMIT

  const matches = await fg(INTENT_FILE_SUGGESTION_PATTERNS, {
    cwd,
    dot: true,
    absolute: true,
    onlyFiles: true,
    unique: true,
    suppressErrors: true,
    followSymbolicLinks: false,
    ignore: FILE_SUGGESTION_IGNORE_PATTERNS,
  })

  const unique = new Set<string>()
  for (const match of matches) {
    const displayPath = toDisplayPath(cwd, match)
    if (!displayPath) {
      continue
    }
    unique.add(displayPath)
  }

  return [...unique].sort().slice(0, limit)
}

export type FilterIntentFileSuggestionsOptions = {
  suggestions: readonly string[]
  query: string
  exclude?: readonly string[]
  limit?: number
}

export const filterIntentFileSuggestions = ({
  suggestions,
  query,
  exclude = [],
  limit = DEFAULT_FILE_SUGGESTION_LIMIT,
}: FilterIntentFileSuggestionsOptions): string[] => {
  const excluded = new Set(exclude)
  const eligible = suggestions.filter((suggestion) => !excluded.has(suggestion))

  return fuzzyFilterStrings(eligible, query, limit)
}

export type FilterFileSuggestionsOptions = {
  suggestions: readonly string[]
  query: string
  exclude?: readonly string[]
  limit?: number
}

const normalizeFzfToken = (token: string): string => {
  if (!token) {
    return token
  }

  // Preserve fzf query operators while normalizing slashes / absolute paths.
  let rest = token
  let prefix = ''
  let suffix = ''

  while (
    rest.startsWith('!') ||
    rest.startsWith('^') ||
    rest.startsWith("'") ||
    rest.startsWith('"')
  ) {
    prefix += rest.slice(0, 1)
    rest = rest.slice(1)
  }

  if (rest.endsWith('$')) {
    suffix = '$'
    rest = rest.slice(0, -1)
  }

  if (!rest) {
    return `${prefix}${suffix}`
  }

  // Normalize absolute paths to a workspace-relative form so matching can work
  // against `discoverFileSuggestions()` results.
  if (!path.isAbsolute(rest)) {
    return `${prefix}${normalizeToPosix(rest)}${suffix}`
  }

  const relative = path.relative(process.cwd(), rest)

  if (relative && !relative.startsWith('..')) {
    return `${prefix}${normalizeToPosix(relative)}${suffix}`
  }

  return `${prefix}${normalizeToPosix(path.basename(rest))}${suffix}`
}

const normalizeQueryForFzf = (query: string): string => {
  const trimmed = query.trim()
  if (!trimmed) {
    return trimmed
  }

  return trimmed
    .split(/\s+/)
    .map((token) => normalizeFzfToken(token))
    .join(' ')
}

const fuzzyFilterStrings = (items: readonly string[], query: string, limit: number): string[] => {
  const trimmed = normalizeQueryForFzf(query)
  if (!trimmed) {
    return items.slice(0, limit)
  }

  // Heuristic: if the query contains path separators, treat it as a path search
  // and use forward matching (fzf's default). Otherwise prefer matching from the
  // end to bias toward filenames.
  const isPathQuery = trimmed.includes('/')

  const fzf = new Fzf(items, {
    casing: 'smart-case',
    normalize: true,
    fuzzy: 'v2',
    forward: isPathQuery,
    match: extendedMatch,
    tiebreakers: [byStartAsc, byLengthAsc],
    limit,
  })

  return fzf
    .find(trimmed)
    .map((result) => result.item)
    .slice(0, limit)
}

export const filterFileSuggestions = ({
  suggestions,
  query,
  exclude = [],
  limit = DEFAULT_FILE_SUGGESTION_LIMIT,
}: FilterFileSuggestionsOptions): string[] => {
  const excluded = new Set(exclude)
  const eligible = suggestions.filter((suggestion) => !excluded.has(suggestion))

  return fuzzyFilterStrings(eligible, query, limit)
}

export type FilterDirectorySuggestionsOptions = FilterFileSuggestionsOptions

export const filterDirectorySuggestions = (options: FilterDirectorySuggestionsOptions): string[] =>
  filterFileSuggestions(options)
