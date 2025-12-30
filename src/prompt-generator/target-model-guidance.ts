const TARGET_RUNTIME_MODEL_PHRASE_REGEX = /target runtime model/i

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const sanitizePromptForTargetModelLeakage = ({
  prompt,
  intent,
  targetModel,
}: {
  prompt: string
  intent: string
  targetModel: string
}): string => {
  const normalizedTargetModel = targetModel.trim()
  if (!normalizedTargetModel) {
    return prompt
  }

  const normalizedIntent = intent.trim().toLowerCase()
  const normalizedTargetLower = normalizedTargetModel.toLowerCase()
  if (normalizedIntent.includes(normalizedTargetLower)) {
    return prompt
  }

  const normalizedPromptLower = prompt.toLowerCase()
  if (
    !TARGET_RUNTIME_MODEL_PHRASE_REGEX.test(prompt) &&
    !normalizedPromptLower.includes(normalizedTargetLower)
  ) {
    return prompt
  }

  const withoutTargetModelLines = prompt
    .split('\n')
    .filter((line) => !TARGET_RUNTIME_MODEL_PHRASE_REGEX.test(line))
    .join('\n')

  const targetRegex = new RegExp(escapeRegExp(normalizedTargetModel), 'gi')
  const withoutTargetMentions = withoutTargetModelLines.replace(targetRegex, '')

  const cleaned = withoutTargetMentions
    .split('\n')
    .map((line) =>
      line
        .replace(/\*\*\s*\*\*/g, '')
        .replace(/[ \t]{2,}/g, ' ')
        .trimEnd(),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')

  return cleaned.trim()
}

export const buildTargetRuntimeModelGuidance = (targetModel: string): string => {
  const normalized = targetModel.trim()
  if (!normalized) {
    return ''
  }

  return [
    'Internal Optimization Target (do not include in output):',
    `- targetRuntimeModel: ${normalized}`,
    '',
    'Rules (non-negotiable):',
    '- Use the target runtime model only to tune the contract for compliance, clarity, and formatting expectations.',
    '- Do NOT mention or output the target runtime model id/label/name anywhere in the returned prompt text.',
    '- Do NOT include phrases like "Target runtime model" / "Target Runtime Model" in the returned prompt text.',
    '- Only include the target model id/label/name if the user intent explicitly asks to mention it.',
  ].join('\n')
}
