import { loadCliConfig, resolveGeminiCredentials, resolveOpenAiCredentials } from '../config'
import { isGeminiModelId } from '../model-providers'

export const resolveDefaultGenerateModel = async (): Promise<string> => {
  const config = await loadCliConfig()
  return (
    config?.promptGenerator?.defaultModel?.trim() ||
    process.env.PROMPT_MAKER_GENERATE_MODEL?.trim() ||
    'gpt-4o-mini'
  )
}

export const ensureModelCredentials = async (model: string): Promise<void> => {
  if (isGemini(model)) {
    if (!process.env.GEMINI_API_KEY) {
      const credentials = await resolveGeminiCredentials()
      process.env.GEMINI_API_KEY = credentials.apiKey
      if (credentials.baseUrl && !process.env.GEMINI_BASE_URL) {
        process.env.GEMINI_BASE_URL = credentials.baseUrl
      }
    }
    return
  }

  if (!process.env.OPENAI_API_KEY) {
    const credentials = await resolveOpenAiCredentials()
    process.env.OPENAI_API_KEY = credentials.apiKey
    if (credentials.baseUrl && !process.env.OPENAI_BASE_URL) {
      process.env.OPENAI_BASE_URL = credentials.baseUrl
    }
  }
}

export const isGemini = (model: string): boolean => isGeminiModelId(model)
