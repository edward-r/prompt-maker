import {
  REQUIRED_THEME_SLOTS,
  type RequiredThemeSlot,
  type ThemeColorValue,
  type ThemeJson,
} from './theme-types'

type ThemeValidationResult = { ok: true; theme: ThemeJson } | { ok: false; message: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isThemeColorVariant = (value: unknown): value is { dark: unknown; light: unknown } => {
  if (!isRecord(value)) {
    return false
  }
  return 'dark' in value && 'light' in value
}

const isThemeColorValue = (value: unknown): value is ThemeColorValue => {
  if (typeof value === 'string') {
    return true
  }
  if (typeof value === 'number') {
    return Number.isFinite(value)
  }
  if (isThemeColorVariant(value)) {
    return isThemeColorValue(value.dark) && isThemeColorValue(value.light)
  }
  return false
}

export const validateThemeJson = (value: unknown): ThemeValidationResult => {
  if (!isRecord(value)) {
    return { ok: false, message: 'Theme JSON must be an object.' }
  }

  const theme = value.theme
  if (!isRecord(theme)) {
    return { ok: false, message: 'Theme JSON must include a `theme` object.' }
  }

  const defs = value.defs
  if (defs !== undefined) {
    if (!isRecord(defs)) {
      return { ok: false, message: '`defs` must be an object when present.' }
    }

    for (const [key, defValue] of Object.entries(defs)) {
      if (!isThemeColorValue(defValue)) {
        return { ok: false, message: `Invalid defs color value for key: ${key}` }
      }
    }
  }

  const missingSlots: RequiredThemeSlot[] = []
  for (const slot of REQUIRED_THEME_SLOTS) {
    const slotValue = theme[slot]
    if (slotValue === undefined) {
      missingSlots.push(slot)
      continue
    }
    if (!isThemeColorValue(slotValue)) {
      return { ok: false, message: `Invalid theme color value for slot: ${slot}` }
    }
  }

  if (missingSlots.length > 0) {
    return {
      ok: false,
      message: `Theme JSON missing required slots: ${missingSlots.join(', ')}`,
    }
  }

  for (const [key, slotValue] of Object.entries(theme)) {
    if (!isThemeColorValue(slotValue)) {
      return { ok: false, message: `Invalid theme color value for key: ${key}` }
    }
  }

  return { ok: true, theme: value as ThemeJson }
}
