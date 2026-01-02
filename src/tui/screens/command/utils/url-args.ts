export const parseUrlArgs = (raw: string): string[] => {
  return raw
    .split(/[\s,]+/g)
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

export type UrlValidationResult =
  | { ok: true }
  | {
      ok: false
      message: string
    }

export const validateHttpUrlCandidate = (candidate: string): UrlValidationResult => {
  const trimmed = candidate.trim()
  if (!trimmed) {
    return { ok: false, message: 'URL is empty.' }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, message: `Invalid URL: ${trimmed}` }
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    return {
      ok: false,
      message: `Unsupported URL protocol for ${trimmed}. Only HTTP(S) URLs are allowed.`,
    }
  }

  return { ok: true }
}
