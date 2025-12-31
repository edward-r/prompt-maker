import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export type ProviderModelLists = {
  openai: string[]
  gemini: string[]
}

export type ModelCache = {
  timestamp: number
  models: ProviderModelLists
}

export type GetAvailableModelsOptions = {
  cacheFilePath?: string
  now?: number
  fetchImpl?: typeof fetch
  openAiBaseUrl?: string
  geminiBaseUrl?: string
  openAiOrganizationId?: string
  openAiProjectId?: string
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const DEFAULT_MODEL_CACHE_FILE = path.join(
  os.homedir(),
  '.config',
  'prompt-maker-cli',
  'models-cache.json',
)

// Hardcoded fallbacks in case of network failure / first run offline.
export const FALLBACK_MODELS: ProviderModelLists = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
}

type OpenAiModelListResponse = {
  data: Array<{ id: string }>
}

type GeminiModelListResponse = {
  models: Array<{
    name: string
    supportedGenerationMethods?: string[]
    inputTokenLimit?: number
  }>
}

const normalizeModelId = (value: string): string => value.trim()

const normalizeModelList = (models: readonly string[]): string[] => {
  const unique = new Set(models.map(normalizeModelId).filter(Boolean))
  return Array.from(unique).sort((a, b) => a.localeCompare(b))
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isOpenAiModelListResponse = (value: unknown): value is OpenAiModelListResponse => {
  if (!isRecord(value)) {
    return false
  }
  const data = value.data
  if (!Array.isArray(data)) {
    return false
  }
  return data.every((entry) => isRecord(entry) && typeof entry.id === 'string')
}

const isGeminiModelListResponse = (value: unknown): value is GeminiModelListResponse => {
  if (!isRecord(value)) {
    return false
  }
  const models = value.models
  if (!Array.isArray(models)) {
    return false
  }
  return models.every((entry) => {
    if (!isRecord(entry) || typeof entry.name !== 'string') {
      return false
    }

    if (
      entry.supportedGenerationMethods !== undefined &&
      (!Array.isArray(entry.supportedGenerationMethods) ||
        !entry.supportedGenerationMethods.every((method) => typeof method === 'string'))
    ) {
      return false
    }

    if (entry.inputTokenLimit !== undefined && typeof entry.inputTokenLimit !== 'number') {
      return false
    }

    return true
  })
}

const buildOpenAiModelsUrl = (baseUrl?: string): string => {
  const normalized = baseUrl?.trim().replace(/\/$/, '')
  if (!normalized) {
    return 'https://api.openai.com/v1/models'
  }
  if (normalized.endsWith('/v1')) {
    return `${normalized}/models`
  }
  return `${normalized}/v1/models`
}

const normalizeGeminiBaseUrl = (value?: string): string => {
  const normalized = value?.trim().replace(/\/$/, '')
  if (!normalized) {
    return 'https://generativelanguage.googleapis.com'
  }

  const suffixes = ['/v1beta/models', '/v1/models', '/v1beta', '/v1']
  return suffixes.reduce((current, suffix) => {
    return current.endsWith(suffix) ? current.slice(0, -suffix.length) : current
  }, normalized)
}

const buildGeminiModelsUrl = (baseUrl?: string, apiKey?: string): string => {
  const root = normalizeGeminiBaseUrl(baseUrl)
  const key = apiKey?.trim() || ''
  return `${root}/v1beta/models?key=${encodeURIComponent(key)}`
}

const fetchJson = async (
  fetchImpl: typeof fetch,
  url: string,
  init?: RequestInit,
): Promise<unknown> => {
  const response = await fetchImpl(url, init)
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}): ${response.statusText}`)
  }
  return (await response.json()) as unknown
}

const fetchOpenAiModels = async (
  apiKey: string | null | undefined,
  options: {
    fetchImpl: typeof fetch
    baseUrl?: string
    organizationId?: string
    projectId?: string
  },
): Promise<string[]> => {
  const trimmedKey = apiKey?.trim()
  if (!trimmedKey) {
    return []
  }

  const url = buildOpenAiModelsUrl(options.baseUrl)
  const headers: Record<string, string> = { Authorization: `Bearer ${trimmedKey}` }
  if (options.organizationId?.trim()) {
    headers['OpenAI-Organization'] = options.organizationId.trim()
  }
  if (options.projectId?.trim()) {
    headers['OpenAI-Project'] = options.projectId.trim()
  }

  const data = await fetchJson(options.fetchImpl, url, {
    headers,
  })

  if (!isOpenAiModelListResponse(data)) {
    throw new Error('OpenAI models response had unexpected shape.')
  }

  return data.data
    .map((entry) => entry.id)
    .filter((id) => {
      const normalized = id.toLowerCase()
      return (
        normalized.startsWith('gpt') ||
        normalized.startsWith('o') ||
        normalized.startsWith('chatgpt')
      )
    })
}

export type GeminiModelDescriptor = {
  id: string
  supportedGenerationMethods: string[]
  inputTokenLimit?: number
}

export const MIN_VIDEO_INPUT_TOKEN_LIMIT = 128_000

const fetchGeminiModels = async (
  apiKey: string | null | undefined,
  options: {
    fetchImpl: typeof fetch
    baseUrl?: string
  },
): Promise<string[]> => {
  const trimmedKey = apiKey?.trim()
  if (!trimmedKey) {
    return []
  }

  const url = buildGeminiModelsUrl(options.baseUrl, trimmedKey)
  const data = await fetchJson(options.fetchImpl, url)

  if (!isGeminiModelListResponse(data)) {
    throw new Error('Gemini models response had unexpected shape.')
  }

  return data.models
    .filter((entry) => entry.supportedGenerationMethods?.includes('generateContent'))
    .map((entry) => entry.name.replace(/^models\//, ''))
}

const fetchGeminiModelDescriptors = async (
  apiKey: string | null | undefined,
  options: {
    fetchImpl: typeof fetch
    baseUrl?: string
  },
): Promise<GeminiModelDescriptor[]> => {
  const trimmedKey = apiKey?.trim()
  if (!trimmedKey) {
    return []
  }

  const url = buildGeminiModelsUrl(options.baseUrl, trimmedKey)
  const data = await fetchJson(options.fetchImpl, url)

  if (!isGeminiModelListResponse(data)) {
    throw new Error('Gemini models response had unexpected shape.')
  }

  return data.models
    .filter((entry) => entry.supportedGenerationMethods?.includes('generateContent'))
    .map((entry) => ({
      id: entry.name.replace(/^models\//, ''),
      supportedGenerationMethods: entry.supportedGenerationMethods ?? [],
      ...(typeof entry.inputTokenLimit === 'number'
        ? { inputTokenLimit: entry.inputTokenLimit }
        : {}),
    }))
}

const buildGeminiGenerateContentUrl = (
  baseUrl: string,
  apiKey: string,
  modelId: string,
): string => {
  const normalized = normalizeGeminiBaseUrl(baseUrl)
  return `${normalized}/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`
}

type GeminiProbeOutcome =
  | { ok: true }
  | {
      ok: false
      reason: 'model-not-found' | 'filedata-unsupported' | 'unknown'
      details: string
    }

export const probeGeminiModelSupportsFileData = async (
  fetchImpl: typeof fetch,
  modelId: string,
  apiKey: string,
  baseUrl?: string,
): Promise<GeminiProbeOutcome> => {
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) {
    return { ok: false, reason: 'unknown', details: 'Missing Gemini API key.' }
  }

  const url = buildGeminiGenerateContentUrl(
    baseUrl ?? 'https://generativelanguage.googleapis.com',
    trimmedKey,
    modelId,
  )

  // Important: we purposely use a bogus fileUri to test schema support without actually uploading.
  // If the model supports fileData, the request should fail for a different reason (e.g. bad file uri),
  // not "Unknown name fileData".
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: 'video/mp4',
              // Intentionally invalid to avoid ambiguous 404s.
              fileUri: 'INVALID_FILE_URI',
            },
          },
          { text: 'Describe the video.' },
        ],
      },
    ],
    generationConfig: { temperature: 0.2 },
  }

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (response.ok) {
    return { ok: true }
  }

  const details = await response.text()

  if (response.status === 404) {
    return { ok: false, reason: 'model-not-found', details }
  }

  if (response.status === 400 && details.includes('Unknown name') && details.includes('fileData')) {
    return { ok: false, reason: 'filedata-unsupported', details }
  }

  // If it fails for any other reason, we assume the schema was accepted.
  return { ok: true }
}

export const getVideoCapableGeminiModels = async (
  apiKey: string | null | undefined,
  options: {
    fetchImpl?: typeof fetch
    baseUrl?: string
  } = {},
): Promise<string[]> => {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  if (!fetchImpl) {
    return []
  }

  const trimmedKey = apiKey?.trim()
  if (!trimmedKey) {
    return []
  }

  const descriptors = await fetchGeminiModelDescriptors(trimmedKey, {
    fetchImpl,
    ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
  })

  const candidates = descriptors
    .filter((model) => {
      const normalizedId = model.id.toLowerCase()
      const isGemini = normalizedId.includes('gemini')
      const tokenLimit = model.inputTokenLimit ?? 0
      return isGemini && tokenLimit >= MIN_VIDEO_INPUT_TOKEN_LIMIT
    })
    .sort((a, b) => {
      const aLimit = a.inputTokenLimit ?? 0
      const bLimit = b.inputTokenLimit ?? 0
      if (bLimit !== aLimit) {
        return bLimit - aLimit
      }
      return a.id.localeCompare(b.id)
    })

  const supported: string[] = []

  for (const model of candidates) {
    const probe = await probeGeminiModelSupportsFileData(
      fetchImpl,
      model.id,
      trimmedKey,
      options.baseUrl,
    )

    if (probe.ok) {
      supported.push(model.id)
    }
  }

  return supported
}

const readCacheFile = async (cacheFilePath: string): Promise<ModelCache | null> => {
  try {
    const raw = await fs.readFile(cacheFilePath, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) {
      return null
    }
    const timestamp = parsed.timestamp
    const models = parsed.models
    if (typeof timestamp !== 'number' || !isRecord(models)) {
      return null
    }
    const openai = models.openai
    const gemini = models.gemini
    if (!Array.isArray(openai) || !Array.isArray(gemini)) {
      return null
    }
    if (
      !openai.every((id) => typeof id === 'string') ||
      !gemini.every((id) => typeof id === 'string')
    ) {
      return null
    }
    return {
      timestamp,
      models: {
        openai: normalizeModelList(openai),
        gemini: normalizeModelList(gemini),
      },
    }
  } catch {
    return null
  }
}

const writeCacheFile = async (
  cacheFilePath: string,
  models: ProviderModelLists,
  now: number,
): Promise<void> => {
  await fs.mkdir(path.dirname(cacheFilePath), { recursive: true })
  const payload: ModelCache = { timestamp: now, models }
  await fs.writeFile(cacheFilePath, JSON.stringify(payload, null, 2), 'utf8')
}

export const getAvailableModels = async (
  openAiKey?: string | null,
  geminiKey?: string | null,
  options: GetAvailableModelsOptions = {},
): Promise<ProviderModelLists> => {
  const cacheFilePath = options.cacheFilePath ?? DEFAULT_MODEL_CACHE_FILE
  const now = options.now ?? Date.now()

  const cached = await readCacheFile(cacheFilePath)
  if (cached) {
    const age = now - cached.timestamp
    if (age >= 0 && age < ONE_DAY_MS) {
      return cached.models
    }

    const canRefresh = Boolean(openAiKey?.trim() || geminiKey?.trim())
    if (!canRefresh) {
      return cached.models
    }
  } else {
    const canRefresh = Boolean(openAiKey?.trim() || geminiKey?.trim())
    if (!canRefresh) {
      return FALLBACK_MODELS
    }
  }

  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  if (!fetchImpl) {
    return cached?.models ?? FALLBACK_MODELS
  }

  let openai: string[] = []
  let gemini: string[] = []

  try {
    const results = await Promise.allSettled([
      fetchOpenAiModels(openAiKey, {
        fetchImpl,
        ...(options.openAiBaseUrl ? { baseUrl: options.openAiBaseUrl } : {}),
        ...(options.openAiOrganizationId ? { organizationId: options.openAiOrganizationId } : {}),
        ...(options.openAiProjectId ? { projectId: options.openAiProjectId } : {}),
      }),
      fetchGeminiModels(geminiKey, {
        fetchImpl,
        ...(options.geminiBaseUrl ? { baseUrl: options.geminiBaseUrl } : {}),
      }),
    ])

    const openAiResult = results[0]
    if (openAiResult.status === 'fulfilled') {
      openai = openAiResult.value
    } else {
      console.error('Failed to fetch OpenAI models', openAiResult.reason)
    }

    const geminiResult = results[1]
    if (geminiResult.status === 'fulfilled') {
      gemini = geminiResult.value
    } else {
      console.error('Failed to fetch Gemini models', geminiResult.reason)
    }
  } catch (error) {
    console.error('Failed to refresh model cache', error)
  }

  const result: ProviderModelLists = {
    openai: normalizeModelList(openai.length > 0 ? openai : FALLBACK_MODELS.openai),
    gemini: normalizeModelList(gemini.length > 0 ? gemini : FALLBACK_MODELS.gemini),
  }

  try {
    await writeCacheFile(cacheFilePath, result, now)
  } catch (error) {
    console.error('Failed to write model cache', error)
  }

  return result
}
