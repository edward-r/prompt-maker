const envFlagEnabled = (value: string | undefined): boolean => {
  if (!value) {
    return false
  }
  const normalized = value.trim().toLowerCase()
  return normalized !== '0' && normalized !== 'false'
}

export const shouldTraceFlags = (): boolean => envFlagEnabled(process.env.PROMPT_MAKER_DEBUG_FLAGS)

export const shouldTraceCopy = (): boolean =>
  envFlagEnabled(process.env.PROMPT_MAKER_COPY_TRACE) || shouldTraceFlags()
