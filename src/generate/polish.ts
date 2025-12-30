import { callLLM } from '@prompt-maker/core'

import {
  ensureModelCredentials,
  sanitizePromptForTargetModelLeakage,
} from '../prompt-generator-service'

const POLISH_SYSTEM_PROMPT =
  'You refine prompt contracts for language models. Preserve headings, bullet ordering, and constraints. Only tighten wording and fix inconsistencies.'

export const polishPrompt = async (
  originalIntent: string,
  prompt: string,
  model: string,
  targetModel?: string,
): Promise<string> => {
  await ensureModelCredentials(model)

  const normalizedTargetModel = targetModel?.trim() ?? ''

  const targetGuidance = normalizedTargetModel
    ? [
        'Internal Optimization Target (do not include in output):',
        `- targetRuntimeModel: ${normalizedTargetModel}`,
        '',
        'Rules (non-negotiable):',
        '- Use the target runtime model only to tune compliance, clarity, and formatting expectations.',
        '- Do NOT mention or output the target runtime model id/label/name anywhere in the polished prompt text.',
        '- Do NOT include phrases like "Target runtime model" / "Target Runtime Model" in the polished prompt text.',
        '- Only include the target model id/label/name if the user intent explicitly asks to mention it.',
      ].join('\n')
    : ''

  const messages = [
    { role: 'system' as const, content: POLISH_SYSTEM_PROMPT },
    ...(targetGuidance ? [{ role: 'system' as const, content: targetGuidance }] : []),
    {
      role: 'user' as const,
      content: [
        'Intent:',
        originalIntent,
        '---',
        'Generated prompt candidate:',
        prompt,
        '---',
        'Return the polished prompt text, preserving exact sections.',
      ].join('\n'),
    },
  ]

  const raw = await callLLM(messages, model)

  return sanitizePromptForTargetModelLeakage({
    prompt: raw,
    intent: originalIntent,
    targetModel: normalizedTargetModel,
  })
}
