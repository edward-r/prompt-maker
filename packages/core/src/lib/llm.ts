export type TextPart = { type: 'text'; text: string }
export type ImagePart = { type: 'image'; mimeType: string; data: string }
export type VideoPart = { type: 'video_uri'; mimeType: string; fileUri: string }
export type MessageContent = string | (TextPart | ImagePart | VideoPart)[]

export type Message = {
  role: 'system' | 'user' | 'assistant'
  content: MessageContent
}

type OpenAIChatMessageContent =
  | string
  | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>

type OpenAIChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant'
  content: OpenAIChatMessageContent
}

type OpenAIResponseContentPart = { type: 'text'; text: string }

type ChatCompletionChoice = {
  index: number
  message: { role: 'assistant'; content: string | OpenAIResponseContentPart[] }
}

type ChatCompletionResponse = {
  choices: ChatCompletionChoice[]
}

type GeminiApiVersion = 'v1' | 'v1beta'

type GeminiContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { mimeType: string; fileUri: string } }

type GeminiContent = {
  role: 'user' | 'model' | 'system'
  parts: GeminiContentPart[]
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiContentPart[] } }>
}

type GeminiRequestBody = {
  contents: GeminiContent[]
  systemInstruction?: GeminiContent
  generationConfig: { temperature: number }
}

type OpenAIEmbeddingResponse = {
  data?: Array<{ embedding: number[] }>
}

type GeminiEmbeddingResponse = {
  embedding?: { value?: number[] }
}

/**
 * OpenAI Responses API types (partial, just what we need).
 * Docs: https://platform.openai.com/docs/api-reference/responses
 */
type OpenAIResponsesInputText = { type: 'input_text'; text: string }
type OpenAIResponsesInputImage = { type: 'input_image'; image_url: string }
type OpenAIResponsesInputContent =
  | string
  | Array<OpenAIResponsesInputText | OpenAIResponsesInputImage>

type OpenAIResponsesInputMessage = {
  role: 'developer' | 'user' | 'assistant'
  content: OpenAIResponsesInputContent
}

type OpenAIResponsesOutputText = { type: 'output_text'; text?: string }

type OpenAIResponsesOutputMessage = {
  type: 'message'
  role?: 'assistant' | 'user' | 'developer'
  content?: OpenAIResponsesOutputText[]
}

type OpenAIResponsesOutputOther = { type?: string; role?: unknown } & Record<string, unknown>
type OpenAIResponsesOutputItem = OpenAIResponsesOutputMessage | OpenAIResponsesOutputOther

type OpenAIResponsesResponse = {
  output_text?: string
  output?: OpenAIResponsesOutputItem[]
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? process.env.GEMINI_MODEL ?? 'gpt-5.1-codex'
const DEFAULT_OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small'
const DEFAULT_GEMINI_EMBEDDING_MODEL = 'text-embedding-004'

const rawOpenAiBase = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'
const OPENAI_BASE_URL = rawOpenAiBase.replace(/\/$/, '')

// Keep backwards-compatible behavior if OPENAI_BASE_URL was set to a nested path.
const OPENAI_CHAT_ENDPOINT = `${OPENAI_BASE_URL.replace(/\/chat\/completions$/, '')}/chat/completions`
const OPENAI_RESPONSES_ENDPOINT = `${OPENAI_BASE_URL.replace(/\/chat\/completions$/, '')}/responses`
const OPENAI_EMBEDDING_ENDPOINT = `${OPENAI_BASE_URL.replace(/\/chat\/completions$/, '')}/embeddings`

const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com'

const normalizeGeminiBaseUrl = (value: string | undefined): string => {
  const trimmed = value?.trim()
  const candidate = trimmed && trimmed.length > 0 ? trimmed : DEFAULT_GEMINI_BASE_URL
  const withoutTrailingSlash = candidate.replace(/\/$/, '')

  const suffixes = ['/v1beta/models', '/v1/models', '/v1beta', '/v1']
  const stripped = suffixes.reduce((current, suffix) => {
    return current.endsWith(suffix) ? current.slice(0, -suffix.length) : current
  }, withoutTrailingSlash)

  return stripped || DEFAULT_GEMINI_BASE_URL
}

const GEMINI_BASE_URL = normalizeGeminiBaseUrl(process.env.GEMINI_BASE_URL)
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION?.trim() || 'v1beta'

const normalizeGeminiApiVersion = (value: string): GeminiApiVersion => {
  const trimmed = value.trim().toLowerCase()
  return trimmed === 'v1beta' ? 'v1beta' : 'v1'
}

export const callLLM = async (
  messages: Message[],
  model: string = DEFAULT_MODEL,
): Promise<string> => {
  const provider = resolveProvider(model)

  if (provider === 'gemini') {
    return callGemini(messages, model)
  }

  return callOpenAI(messages, model)
}

export const getEmbedding = async (text: string, model?: string): Promise<number[]> => {
  if (!text || !text.trim()) {
    throw new Error('Text to embed must not be empty.')
  }

  const requestedModel = model?.trim()
  const targetModel =
    requestedModel && requestedModel.length > 0 ? requestedModel : DEFAULT_OPENAI_EMBEDDING_MODEL
  const provider = resolveProvider(targetModel)

  if (provider === 'gemini') {
    const geminiModel =
      requestedModel && requestedModel.length > 0 ? requestedModel : DEFAULT_GEMINI_EMBEDDING_MODEL
    return callGeminiEmbedding(text, geminiModel)
  }

  return callOpenAIEmbedding(text, targetModel)
}

const resolveProvider = (model: string): 'openai' | 'gemini' => {
  const normalized = model.trim().toLowerCase()
  if (
    normalized.startsWith('gemini') ||
    normalized.startsWith('gemma') ||
    normalized === 'text-embedding-004'
  ) {
    return 'gemini'
  }
  return 'openai'
}

/**
 * Routing rule:
 * - Chat Completions endpoint is for chat-tuned models.
 * - GPT-5.x reasoning models (e.g., gpt-5.2-pro) should go to Responses API.
 */
const shouldUseChatCompletions = (model: string): boolean => {
  const m = model.trim().toLowerCase()

  // GPT-5.x reasoning models (and other "o" series reasoning models) are not supported on chat.
  if (m.startsWith('gpt-5') && !m.includes('chat') && !m.includes('codex')) {
    return false
  }

  if (m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4')) {
    return false
  }

  return true
}

const toErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string') return maybeMessage
  }
  return ''
}

const isOpenAIEndpointMismatchError = (error: unknown): boolean => {
  const text = toErrorMessage(error).toLowerCase()
  if (!text) return false

  const mentionsChat = text.includes('/chat/completions') || text.includes('chat/completions')
  const mentionsResponses =
    text.includes('/responses') || text.includes('v1/responses') || text.includes('responses api')

  // Typical error: "does not support the /v1/chat/completions endpoint. Please use /v1/responses"
  return mentionsChat && mentionsResponses
}

const callOpenAI = async (messages: Message[], model: string): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY env var is not set.')
  }

  const preferChat = shouldUseChatCompletions(model)

  try {
    return preferChat
      ? await callOpenAIChatCompletions(messages, model, apiKey)
      : await callOpenAIResponses(messages, model, apiKey)
  } catch (error: unknown) {
    if (!isOpenAIEndpointMismatchError(error)) {
      throw error
    }

    return preferChat
      ? await callOpenAIResponses(messages, model, apiKey)
      : await callOpenAIChatCompletions(messages, model, apiKey)
  }
}

const callOpenAIChatCompletions = async (
  messages: Message[],
  model: string,
  apiKey: string,
): Promise<string> => {
  const payloadMessages = messages.map(toOpenAIMessage)

  const response = await fetch(OPENAI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: payloadMessages,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`OpenAI request failed with status ${response.status}: ${details}`)
  }

  const data = (await response.json()) as ChatCompletionResponse
  const rawContent = data.choices?.[0]?.message?.content
  const content =
    typeof rawContent === 'string'
      ? rawContent.trim()
      : rawContent
        ? rawContent
            .map((part) => part.text ?? '')
            .join('')
            .trim()
        : ''

  if (!content) {
    throw new Error('OpenAI response did not include assistant content.')
  }

  return content
}

const callOpenAIResponses = async (
  messages: Message[],
  model: string,
  apiKey: string,
): Promise<string> => {
  const input = messages.map(toOpenAIResponsesInputMessage)

  // Note: reasoning models can have parameter compatibility constraints.
  // Keep this payload minimal to avoid invalid requests.
  const response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`OpenAI request failed with status ${response.status}: ${details}`)
  }

  const data = (await response.json()) as OpenAIResponsesResponse
  const content = extractOpenAIResponsesText(data)

  if (!content) {
    throw new Error('OpenAI response did not include assistant content.')
  }

  return content
}

const extractOpenAIResponsesText = (response: OpenAIResponsesResponse): string | null => {
  const direct = response.output_text?.trim()
  if (direct && direct.length > 0) return direct

  const output = response.output ?? []
  const assistantMessages = output.filter(
    (item): item is OpenAIResponsesOutputMessage =>
      item.type === 'message' && item.role === 'assistant',
  )

  const text = assistantMessages
    .flatMap((msg) => msg.content ?? [])
    .filter((part): part is OpenAIResponsesOutputText => part.type === 'output_text')
    .map((part) => (part.text ?? '').toString())
    .join('')
    .trim()

  return text.length > 0 ? text : null
}

type GeminiCallFailure = {
  ok: false
  status: number
  details: string
  apiVersion: GeminiApiVersion
}

type GeminiCallResult = { ok: true; content: string } | GeminiCallFailure

const callGeminiOnce = async (
  messages: Message[],
  model: string,
  apiKey: string,
  apiVersion: GeminiApiVersion,
): Promise<GeminiCallResult> => {
  const endpointBase = GEMINI_BASE_URL
  const normalizedVersion = normalizeGeminiApiVersion(apiVersion)
  const url = `${endpointBase}/${normalizedVersion}/models/${model}:generateContent?key=${apiKey}`
  const body = buildGeminiRequestBody(messages)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const details = await response.text()
    return { ok: false, status: response.status, details, apiVersion: normalizedVersion }
  }

  const data = (await response.json()) as GeminiResponse
  const content = extractGeminiText(data)

  if (!content) {
    throw new Error('Gemini response did not include text content.')
  }

  return { ok: true, content }
}

const messageHasGeminiFileParts = (content: MessageContent): boolean => {
  return typeof content !== 'string' && content.some((part) => 'fileUri' in part)
}

const requestHasGeminiFileParts = (messages: Message[]): boolean => {
  return messages.some((message) => messageHasGeminiFileParts(message.content))
}

const shouldRetryGeminiApiVersion = (status: number): boolean => {
  // Gemini models sometimes move between API versions.
  return status === 404
}

const callGemini = async (messages: Message[], model: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY env var is not set.')
  }

  const wantsFileParts = requestHasGeminiFileParts(messages)
  const envVersion = normalizeGeminiApiVersion(GEMINI_API_VERSION)

  // `fileData`/`file_data` parts are only supported on some Gemini API versions.
  const primaryVersion: GeminiApiVersion = wantsFileParts ? 'v1beta' : envVersion

  const primary = await callGeminiOnce(messages, model, apiKey, primaryVersion)
  if (primary.ok) {
    return primary.content
  }

  if (shouldRetryGeminiApiVersion(primary.status)) {
    const fallbackVersion: GeminiApiVersion = primaryVersion === 'v1beta' ? 'v1' : 'v1beta'
    const fallback = await callGeminiOnce(messages, model, apiKey, fallbackVersion)
    if (fallback.ok) {
      return fallback.content
    }

    throw new Error(
      `Gemini (${fallback.apiVersion}) request failed with status ${fallback.status}: ${fallback.details}\n` +
        `Tried ${primary.apiVersion} first: ${primary.details}`,
    )
  }

  throw new Error(
    `Gemini (${primary.apiVersion}) request failed with status ${primary.status}: ${primary.details}`,
  )
}

const buildGeminiRequestBody = (messages: Message[]): GeminiRequestBody => {
  const systemMessages = messages.filter((message) => message.role === 'system')

  const contents: GeminiContent[] = messages
    .filter((message) => message.role !== 'system')
    .map((message) => {
      const role = message.role === 'user' ? 'user' : 'model'
      const parts = toGeminiParts(message.content)
      if (parts.length === 0) {
        parts.push({ text: '' })
      }
      return {
        role,
        parts,
      }
    })

  if (contents.length === 0) {
    throw new Error('Gemini requests require at least one user message.')
  }

  const payload: GeminiRequestBody = {
    contents,
    generationConfig: { temperature: 0.2 },
  }

  const systemParts = systemMessages.flatMap((message) => toGeminiParts(message.content))

  if (systemParts.length > 0) {
    payload.systemInstruction = {
      role: 'system',
      parts: systemParts,
    }
  }

  return payload
}

const extractGeminiText = (response: GeminiResponse): string | null => {
  const firstCandidate = response.candidates?.[0]
  const parts = firstCandidate?.content?.parts ?? []
  const text = parts
    .map((part) => ('text' in part ? (part.text ?? '') : ''))
    .join('')
    .trim()

  return text || null
}

const callOpenAIEmbedding = async (text: string, model: string): Promise<number[]> => {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY env var is not set.')
  }

  const response = await fetch(OPENAI_EMBEDDING_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: text }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`OpenAI embedding request failed with status ${response.status}: ${details}`)
  }

  const data = (await response.json()) as OpenAIEmbeddingResponse
  const embedding = data.data?.[0]?.embedding

  if (!embedding) {
    throw new Error('OpenAI embedding response did not include embedding values.')
  }

  return embedding
}

const callGeminiEmbedding = async (text: string, model: string): Promise<number[]> => {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY env var is not set.')
  }

  const endpointBase = GEMINI_BASE_URL
  const url = `${endpointBase}/${GEMINI_API_VERSION}/models/${model}:embedContent?key=${apiKey}`
  const body = {
    content: {
      parts: [{ text }],
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Gemini embedding request failed with status ${response.status}: ${details}`)
  }

  const data = (await response.json()) as GeminiEmbeddingResponse
  const embedding = data.embedding?.value

  if (!embedding) {
    throw new Error('Gemini embedding response did not include embedding values.')
  }

  return embedding
}

const toOpenAIMessage = (message: Message): OpenAIChatCompletionMessage => ({
  role: message.role,
  content: toOpenAIContent(message.content),
})

const toOpenAIContent = (content: MessageContent): OpenAIChatMessageContent => {
  if (typeof content === 'string') {
    return content
  }

  return content.map((part) => {
    if ('text' in part) {
      return { type: 'text', text: part.text }
    }

    if ('data' in part) {
      const imagePart = part as ImagePart
      return {
        type: 'image_url',
        image_url: { url: `data:${imagePart.mimeType};base64,${imagePart.data}` },
      }
    }

    if ('fileUri' in part) {
      throw new Error(
        'Video inputs are only supported when using Gemini models. Remove --video or switch to a Gemini model.',
      )
    }

    return { type: 'text', text: '' }
  })
}

const toOpenAIResponsesInputMessage = (message: Message): OpenAIResponsesInputMessage => ({
  role: message.role === 'system' ? 'developer' : message.role,
  content: toOpenAIResponsesContent(message.content),
})

const toOpenAIResponsesContent = (content: MessageContent): OpenAIResponsesInputContent => {
  if (typeof content === 'string') {
    return content
  }

  const hasVideo = content.some((part) => 'fileUri' in part)
  if (hasVideo) {
    throw new Error(
      'Video inputs are only supported when using Gemini models. Remove --video or switch to a Gemini model.',
    )
  }

  const isAllText = content.every((part) => 'text' in part)
  if (isAllText) {
    return content.map((part) => ('text' in part ? part.text : '')).join('')
  }

  return content.map((part) => {
    if ('text' in part) {
      return { type: 'input_text', text: part.text }
    }

    if ('data' in part) {
      const imagePart = part as ImagePart
      return {
        type: 'input_image',
        image_url: `data:${imagePart.mimeType};base64,${imagePart.data}`,
      }
    }

    return { type: 'input_text', text: '' }
  })
}

const toGeminiParts = (content: MessageContent): GeminiContentPart[] => {
  if (typeof content === 'string') {
    return content ? [{ text: content }] : []
  }

  return content.map((part) => {
    if ('text' in part) {
      return { text: part.text }
    }

    if ('data' in part) {
      const imagePart = part as ImagePart
      return { inlineData: { mimeType: imagePart.mimeType, data: imagePart.data } }
    }

    if ('fileUri' in part) {
      const videoPart = part as VideoPart
      return { fileData: { mimeType: videoPart.mimeType, fileUri: videoPart.fileUri } }
    }

    return { text: '' }
  })
}
