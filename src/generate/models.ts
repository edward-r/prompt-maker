import { loadCliConfig } from '../config'
import { loadModelOptions } from '../tui/model-options'
import { isGemini } from '../prompt-generator-service'

export const resolveGeminiVideoModel = async (): Promise<string> => {
  const config = await loadCliConfig()
  const configured = config?.promptGenerator?.defaultGeminiModel?.trim()
  if (configured && isGemini(configured)) {
    return configured
  }
  return 'gemini-3-pro-preview'
}

type ResolveTargetModelOptions = {
  explicitTarget?: string
  defaultTargetModel: string
}

export const resolveTargetModel = async ({
  explicitTarget,
  defaultTargetModel,
}: ResolveTargetModelOptions): Promise<string> => {
  if (explicitTarget === undefined) {
    return defaultTargetModel
  }

  const normalized = explicitTarget.trim()
  if (!normalized) {
    throw new Error('--target requires a non-empty model id.')
  }

  const { options } = await loadModelOptions()
  const match = options.find((option) => option.id === normalized)

  if (!match) {
    const known = options
      .slice(0, 12)
      .map((option) => option.id)
      .join(', ')

    throw new Error(
      [
        `Unknown --target model: ${normalized}`,
        known ? `Known models include: ${known}` : 'No known models are configured.',
        'Add custom entries under promptGenerator.models in ~/.config/prompt-maker-cli/config.json.',
      ].join('\n'),
    )
  }

  return match.id
}
