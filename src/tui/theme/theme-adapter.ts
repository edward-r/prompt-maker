const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const adaptOpencodeThemeJson = (value: unknown): unknown | null => {
  if (!isRecord(value)) {
    return null
  }

  const themeRaw = value.theme
  if (!isRecord(themeRaw)) {
    return null
  }

  const looksLikeOpencode =
    'textMuted' in themeRaw ||
    'backgroundPanel' in themeRaw ||
    'backgroundElement' in themeRaw ||
    'primary' in themeRaw

  if (!looksLikeOpencode) {
    return null
  }

  const theme: Record<string, unknown> = { ...themeRaw }

  if (theme.mutedText === undefined && themeRaw.textMuted !== undefined) {
    theme.mutedText = 'textMuted'
  }

  if (theme.panelBackground === undefined && themeRaw.backgroundPanel !== undefined) {
    theme.panelBackground = 'backgroundPanel'
  }

  if (theme.popupBackground === undefined && theme.panelBackground !== undefined) {
    theme.popupBackground = 'panelBackground'
  }

  if (theme.accent === undefined && themeRaw.primary !== undefined) {
    theme.accent = 'primary'
  }

  if (theme.accentText === undefined && themeRaw.background !== undefined) {
    theme.accentText = 'background'
  }

  if (theme.selectionBackground === undefined) {
    if (themeRaw.backgroundElement !== undefined) {
      theme.selectionBackground = 'backgroundElement'
    } else if (themeRaw.backgroundPanel !== undefined) {
      theme.selectionBackground = 'backgroundPanel'
    }
  }

  if (theme.selectionText === undefined && themeRaw.text !== undefined) {
    theme.selectionText = 'text'
  }

  if (theme.chipBackground === undefined) {
    if (themeRaw.backgroundElement !== undefined) {
      theme.chipBackground = 'backgroundElement'
    } else if (themeRaw.backgroundPanel !== undefined) {
      theme.chipBackground = 'backgroundPanel'
    }
  }

  if (theme.chipText === undefined && themeRaw.text !== undefined) {
    theme.chipText = 'text'
  }

  if (theme.chipMutedText === undefined) {
    if (themeRaw.textMuted !== undefined) {
      theme.chipMutedText = 'textMuted'
    } else if (themeRaw.text !== undefined) {
      theme.chipMutedText = 'text'
    }
  }

  const adapted: Record<string, unknown> = { theme }
  if ('defs' in value) {
    adapted.defs = value.defs
  }

  return adapted
}
