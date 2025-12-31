import { resolveGeminiCredentials } from '../config'
import { loadModelOptions } from '../tui/model-options'
import { getVideoCapableGeminiModels } from '../utils/model-manager'

const DEFAULT_GEMINI_VIDEO_MODEL = 'gemini-2.5-pro'

export const resolveGeminiVideoModel = async (): Promise<string> => {
  try {
    const credentials = await resolveGeminiCredentials()
    const candidates = await getVideoCapableGeminiModels(credentials.apiKey, {
      ...(credentials.baseUrl ? { baseUrl: credentials.baseUrl } : {}),
    })

    const preferredOrder = [DEFAULT_GEMINI_VIDEO_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash']
    for (const preferred of preferredOrder) {
      if (candidates.includes(preferred)) {
        return preferred
      }
    }

    return candidates[0] ?? DEFAULT_GEMINI_VIDEO_MODEL
  } catch {
    return DEFAULT_GEMINI_VIDEO_MODEL
  }
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
