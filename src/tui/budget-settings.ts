import type { ContextOverflowStrategy } from '../config'

export type BudgetSettings = {
  maxContextTokens: number | null
  maxInputTokens: number | null
  contextOverflowStrategy: ContextOverflowStrategy | null
}

export type BudgetSettingsDraft = {
  maxContextTokensDraft: string
  maxInputTokensDraft: string
  contextOverflowStrategyDraft: ContextOverflowStrategy | ''
}

export type BudgetSettingsParseResult =
  | { ok: true; settings: BudgetSettings }
  | { ok: false; errorMessage: string }

const parseOptionalPositiveInteger = (
  raw: string,
  label: string,
): { ok: true; value: number | null } | { ok: false; errorMessage: string } => {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: true, value: null }
  }

  if (!/^[0-9]+$/.test(trimmed)) {
    return { ok: false, errorMessage: `${label} must be a positive integer.` }
  }

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return { ok: false, errorMessage: `${label} must be a positive integer.` }
  }

  return { ok: true, value: parsed }
}

export const parseBudgetSettingsDraft = (draft: BudgetSettingsDraft): BudgetSettingsParseResult => {
  const maxContextResult = parseOptionalPositiveInteger(
    draft.maxContextTokensDraft,
    'Max context tokens',
  )
  if (!maxContextResult.ok) {
    return maxContextResult
  }

  const maxInputResult = parseOptionalPositiveInteger(draft.maxInputTokensDraft, 'Max input tokens')
  if (!maxInputResult.ok) {
    return maxInputResult
  }

  const budgetsEnabled = maxContextResult.value !== null || maxInputResult.value !== null

  const effectiveStrategy: ContextOverflowStrategy | null = draft.contextOverflowStrategyDraft
    ? draft.contextOverflowStrategyDraft
    : budgetsEnabled
      ? 'fail'
      : null

  return {
    ok: true,
    settings: {
      maxContextTokens: maxContextResult.value,
      maxInputTokens: maxInputResult.value,
      contextOverflowStrategy: effectiveStrategy,
    },
  }
}
