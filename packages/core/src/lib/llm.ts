import fs from 'node:fs/promises'
import path from 'node:path'
import { inflateSync } from 'node:zlib'

export type TextPart = { type: 'text'; text: string }
export type ImagePart = { type: 'image'; mimeType: string; data: string }
export type VideoPart = { type: 'video_uri'; mimeType: string; fileUri: string }
export type PdfPart = {
  type: 'pdf'
  mimeType: 'application/pdf'
  filePath: string
  fileUri?: string
}
export type MessageContent = string | (TextPart | ImagePart | VideoPart | PdfPart)[]

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
  const payloadMessages = await Promise.all(messages.map(toOpenAIMessageAsync))

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
  const input = await Promise.all(messages.map(toOpenAIResponsesInputMessageAsync))

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

const PDF_MAX_PAGES_ENV = 'PROMPT_MAKER_PDF_MAX_PAGES'
const PDF_MAX_TEXT_CHARS_ENV = 'PROMPT_MAKER_PDF_MAX_TEXT_CHARS'
const PDF_MAX_STREAMS_ENV = 'PROMPT_MAKER_PDF_MAX_STREAMS'
const DEFAULT_PDF_MAX_PAGES = 30
const DEFAULT_PDF_MAX_TEXT_CHARS = 200_000
const DEFAULT_PDF_MAX_STREAMS = 200

const parsePositiveIntegerEnv = (key: string, fallback: number): number => {
  const raw = process.env[key]
  if (!raw) return fallback

  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

type PdfExtractResult = { ok: true; text: string } | { ok: false; message: string }

type ParsedPdfString = { bytes: Uint8Array; nextIndex: number }

type PdfJsLoadingTask = { promise: Promise<unknown> }

type PdfJsModule = {
  getDocument: (options: unknown) => PdfJsLoadingTask
}

type PdfJsDocument = {
  numPages: number
  getPage: (pageNumber: number) => Promise<unknown>
}

type PdfJsPage = {
  getTextContent: () => Promise<unknown>
}

type PdfJsTextItem = { str?: unknown } & Record<string, unknown>

type PdfJsTextContent = {
  items?: unknown
}

const isPdfJsModule = (value: unknown): value is PdfJsModule => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const maybe = value as { getDocument?: unknown }
  return typeof maybe.getDocument === 'function'
}

const isPdfJsDocument = (value: unknown): value is PdfJsDocument => {
  if (!value || typeof value !== 'object') return false
  const maybe = value as { numPages?: unknown; getPage?: unknown }
  return typeof maybe.numPages === 'number' && typeof maybe.getPage === 'function'
}

const isPdfJsPage = (value: unknown): value is PdfJsPage => {
  if (!value || typeof value !== 'object') return false
  return typeof (value as { getTextContent?: unknown }).getTextContent === 'function'
}

const isPdfJsTextContent = (value: unknown): value is PdfJsTextContent => {
  return Boolean(value) && typeof value === 'object'
}

const loadPdfJs = async (): Promise<PdfJsModule | null> => {
  try {
    const mod = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown
    return isPdfJsModule(mod) ? mod : null
  } catch {
    return null
  }
}

const normalizeExtractedText = (value: string): string => {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const extractPdfTextWithPdfJs = async (filePath: string): Promise<PdfExtractResult> => {
  const pdfjs = await loadPdfJs()
  if (!pdfjs) {
    return { ok: false, message: 'PDF text extraction library is unavailable.' }
  }

  const maxPages = parsePositiveIntegerEnv(PDF_MAX_PAGES_ENV, DEFAULT_PDF_MAX_PAGES)
  const maxChars = parsePositiveIntegerEnv(PDF_MAX_TEXT_CHARS_ENV, DEFAULT_PDF_MAX_TEXT_CHARS)

  let buffer: Buffer
  try {
    buffer = await fs.readFile(filePath)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, message: `Unable to read PDF ${filePath}: ${message}` }
  }

  try {
    const bytes = new Uint8Array(buffer)
    const task = pdfjs.getDocument({ data: bytes, disableWorker: true })
    const doc = await task.promise

    if (!isPdfJsDocument(doc)) {
      return { ok: false, message: `PDF parser returned an unexpected document for ${filePath}.` }
    }

    const pageCount = Math.max(0, Math.min(doc.numPages, maxPages))

    const chunks: string[] = []
    let charsSoFar = 0

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await doc.getPage(pageNumber)
      if (!isPdfJsPage(page)) {
        continue
      }

      const textContent = await page.getTextContent()
      if (!isPdfJsTextContent(textContent)) {
        continue
      }

      const items = (textContent as PdfJsTextContent).items
      if (!Array.isArray(items)) {
        continue
      }

      const pageStrings = items
        .map((item) => {
          const str = (item as PdfJsTextItem).str
          return typeof str === 'string' ? str : ''
        })
        .filter((value) => value.length > 0)

      const pageText = normalizeExtractedText(pageStrings.join(' '))
      if (!pageText) {
        continue
      }

      chunks.push(pageText)
      charsSoFar += pageText.length + 1
      if (charsSoFar >= maxChars) {
        break
      }
    }

    const merged = normalizeExtractedText(chunks.join('\n'))
    if (!merged) {
      return {
        ok: false,
        message:
          'Unable to extract text from PDF. If this is a scanned PDF, convert it to searchable text (OCR) or use a Gemini model for native PDF input.',
      }
    }

    return { ok: true, text: merged.slice(0, maxChars) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, message: `Failed to parse PDF ${filePath}: ${message}` }
  }
}

const isWhitespaceByte = (byte: number): boolean => {
  return byte === 0x09 || byte === 0x0a || byte === 0x0d || byte === 0x20
}

const decodeUtf16Be = (bytes: Uint8Array): string => {
  const length = bytes.length
  const start = length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff ? 2 : 0

  const codeUnits: number[] = []
  for (let i = start; i + 1 < length; i += 2) {
    const high = bytes[i] ?? 0
    const low = bytes[i + 1] ?? 0
    codeUnits.push((high << 8) | low)
  }

  return String.fromCharCode(...codeUnits)
}

const decodePdfStringBytes = (bytes: Uint8Array): string => {
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return decodeUtf16Be(bytes)
  }

  // PDFDocEncoding is not implemented here; latin1 is a pragmatic fallback.
  return Buffer.from(bytes).toString('latin1')
}

const readPdfLiteralString = (data: string, startIndex: number): ParsedPdfString | null => {
  if (data[startIndex] !== '(') return null

  const bytes: number[] = []
  let depth = 1
  let i = startIndex + 1

  while (i < data.length) {
    const ch = data[i]
    if (ch === undefined) break

    if (ch === '\\') {
      const next = data[i + 1]
      if (next === undefined) {
        i += 1
        continue
      }

      // Line continuation
      if (next === '\n') {
        i += 2
        continue
      }
      if (next === '\r') {
        if (data[i + 2] === '\n') {
          i += 3
        } else {
          i += 2
        }
        continue
      }

      const octalMatch = data.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)
      if (octalMatch) {
        bytes.push(Number.parseInt(octalMatch[0], 8))
        i += 1 + octalMatch[0].length
        continue
      }

      const mapped =
        next === 'n'
          ? 0x0a
          : next === 'r'
            ? 0x0d
            : next === 't'
              ? 0x09
              : next === 'b'
                ? 0x08
                : next === 'f'
                  ? 0x0c
                  : next.charCodeAt(0)

      bytes.push(mapped)
      i += 2
      continue
    }

    if (ch === '(') {
      depth += 1
      bytes.push(ch.charCodeAt(0))
      i += 1
      continue
    }

    if (ch === ')') {
      depth -= 1
      if (depth === 0) {
        return { bytes: Uint8Array.from(bytes), nextIndex: i + 1 }
      }
      bytes.push(ch.charCodeAt(0))
      i += 1
      continue
    }

    bytes.push(ch.charCodeAt(0))
    i += 1
  }

  return null
}

const readPdfHexString = (data: string, startIndex: number): ParsedPdfString | null => {
  if (data[startIndex] !== '<') return null
  if (data[startIndex + 1] === '<') return null

  let i = startIndex + 1
  const hexChars: string[] = []

  while (i < data.length) {
    const ch = data[i]
    if (ch === undefined) break
    if (ch === '>') {
      i += 1
      break
    }
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === '\f') {
      i += 1
      continue
    }
    hexChars.push(ch)
    i += 1
  }

  const hex = hexChars.join('')
  if (hex.length === 0) return null

  const normalized = hex.length % 2 === 1 ? `${hex}0` : hex
  const bytes: number[] = []

  for (let idx = 0; idx + 1 < normalized.length; idx += 2) {
    const byte = Number.parseInt(normalized.slice(idx, idx + 2), 16)
    if (!Number.isFinite(byte)) {
      return null
    }
    bytes.push(byte)
  }

  return { bytes: Uint8Array.from(bytes), nextIndex: i }
}

const readOperator = (data: string, startIndex: number): { op: string; nextIndex: number } => {
  let i = startIndex
  while (i < data.length) {
    const byte = data.charCodeAt(i)
    if (!isWhitespaceByte(byte)) break
    i += 1
  }

  const ch = data[i]
  if (ch === undefined) {
    return { op: '', nextIndex: i }
  }

  if (ch === "'" || ch === '"') {
    return { op: ch, nextIndex: i + 1 }
  }

  let end = i
  while (end < data.length) {
    const b = data.charCodeAt(end)
    const isAlpha = (b >= 0x41 && b <= 0x5a) || (b >= 0x61 && b <= 0x7a)
    if (!isAlpha) break
    end += 1
  }

  return { op: data.slice(i, end), nextIndex: end }
}

const extractTextFromContentStream = (data: string): string[] => {
  const out: string[] = []

  let i = 0
  while (i < data.length) {
    const ch = data[i]

    if (ch === '(') {
      const parsed = readPdfLiteralString(data, i)
      if (!parsed) {
        i += 1
        continue
      }

      const { op, nextIndex } = readOperator(data, parsed.nextIndex)
      if (op === 'Tj' || op === "'" || op === '"') {
        const text = normalizeExtractedText(decodePdfStringBytes(parsed.bytes))
        if (text) out.push(text)
        i = nextIndex
        continue
      }

      i = parsed.nextIndex
      continue
    }

    if (ch === '[') {
      const pieces: string[] = []
      i += 1

      while (i < data.length && data[i] !== ']') {
        const inner = data[i]
        if (inner === '(') {
          const parsed = readPdfLiteralString(data, i)
          if (!parsed) {
            i += 1
            continue
          }
          const text = normalizeExtractedText(decodePdfStringBytes(parsed.bytes))
          if (text) pieces.push(text)
          i = parsed.nextIndex
          continue
        }

        if (inner === '<') {
          const parsed = readPdfHexString(data, i)
          if (!parsed) {
            i += 1
            continue
          }
          const text = normalizeExtractedText(decodePdfStringBytes(parsed.bytes))
          if (text) pieces.push(text)
          i = parsed.nextIndex
          continue
        }

        i += 1
      }

      if (data[i] === ']') {
        const { op, nextIndex } = readOperator(data, i + 1)
        if (op === 'TJ') {
          const combined = normalizeExtractedText(pieces.join(' '))
          if (combined) out.push(combined)
          i = nextIndex
          continue
        }
      }

      i += 1
      continue
    }

    i += 1
  }

  return out
}

const extractPdfTextFromBuffer = (buffer: Buffer): PdfExtractResult => {
  const maxStreams = parsePositiveIntegerEnv(PDF_MAX_STREAMS_ENV, DEFAULT_PDF_MAX_STREAMS)
  const maxChars = parsePositiveIntegerEnv(PDF_MAX_TEXT_CHARS_ENV, DEFAULT_PDF_MAX_TEXT_CHARS)

  const pieces: string[] = []

  let searchIndex = 0
  let streamsSeen = 0

  while (streamsSeen < maxStreams) {
    const streamIndex = buffer.indexOf('stream', searchIndex)
    if (streamIndex < 0) break

    streamsSeen += 1

    const dictStart = Math.max(0, streamIndex - 2048)
    const dictText = buffer.subarray(dictStart, streamIndex).toString('latin1')
    const isFlate = /\/FlateDecode\b/.test(dictText)

    let dataStart = streamIndex + 'stream'.length

    while (dataStart < buffer.length) {
      const byte = buffer[dataStart]
      if (byte === 0x0a) {
        dataStart += 1
        break
      }
      if (byte === 0x0d) {
        if (buffer[dataStart + 1] === 0x0a) {
          dataStart += 2
        } else {
          dataStart += 1
        }
        break
      }
      if (byte === 0x20 || byte === 0x09) {
        dataStart += 1
        continue
      }
      // Unexpected; bail out of this stream.
      break
    }

    const endIndex = buffer.indexOf('endstream', dataStart)
    if (endIndex < 0) break

    const rawStream = buffer.subarray(dataStart, endIndex)

    let contentBytes: Buffer = rawStream
    if (isFlate) {
      try {
        contentBytes = inflateSync(rawStream)
      } catch {
        contentBytes = rawStream
      }
    }

    const streamText = contentBytes.toString('latin1')

    let lengthSoFar = pieces.reduce((sum, part) => sum + part.length + 1, 0)

    for (const extracted of extractTextFromContentStream(streamText)) {
      if (!extracted) {
        continue
      }

      pieces.push(extracted)
      lengthSoFar += extracted.length + 1
      if (lengthSoFar >= maxChars) {
        break
      }
    }

    if (lengthSoFar >= maxChars) {
      break
    }

    searchIndex = endIndex + 'endstream'.length
  }

  const merged = normalizeExtractedText(pieces.join('\n'))
  if (!merged) {
    return {
      ok: false,
      message:
        'Unable to extract text from PDF. If this is a scanned PDF, convert it to searchable text (OCR) or use a Gemini model for native PDF input.',
    }
  }

  return { ok: true, text: merged.slice(0, maxChars) }
}

const extractPdfTextFromFile = async (filePath: string): Promise<PdfExtractResult> => {
  const pdfJsResult = await extractPdfTextWithPdfJs(filePath)
  if (pdfJsResult.ok) {
    return pdfJsResult
  }

  try {
    const buffer = await fs.readFile(filePath)
    return extractPdfTextFromBuffer(buffer)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, message: `Unable to read PDF ${filePath}: ${message}` }
  }
}

const isVideoPart = (part: TextPart | ImagePart | VideoPart | PdfPart): part is VideoPart => {
  return part.type === 'video_uri'
}

const isPdfPart = (part: TextPart | ImagePart | VideoPart | PdfPart): part is PdfPart => {
  return part.type === 'pdf'
}

const toOpenAIMessageAsync = async (message: Message): Promise<OpenAIChatCompletionMessage> => ({
  role: message.role,
  content: await toOpenAIContentAsync(message.content),
})

const toOpenAIContentAsync = async (content: MessageContent): Promise<OpenAIChatMessageContent> => {
  if (typeof content === 'string') {
    return content
  }

  const hasVideo = content.some((part) => isVideoPart(part))
  if (hasVideo) {
    throw new Error(
      'Video inputs are only supported when using Gemini models. Remove --video or switch to a Gemini model.',
    )
  }

  const isAllText = content.every((part) => part.type === 'text')
  if (isAllText) {
    return content.map((part) => ('text' in part ? part.text : '')).join('')
  }

  const parts: Array<
    { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
  > = []

  for (const part of content) {
    if (part.type === 'text') {
      parts.push({ type: 'text', text: part.text })
      continue
    }

    if (part.type === 'image') {
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${part.mimeType};base64,${part.data}` },
      })
      continue
    }

    if (isPdfPart(part)) {
      const extracted = await extractPdfTextFromFile(part.filePath)
      if (extracted.ok) {
        const label = path.basename(part.filePath)
        parts.push({ type: 'text', text: `PDF (${label}):\n${extracted.text}` })
      } else {
        parts.push({ type: 'text', text: extracted.message })
      }
      continue
    }

    parts.push({ type: 'text', text: '' })
  }

  return parts
}

const toOpenAIResponsesInputMessageAsync = async (
  message: Message,
): Promise<OpenAIResponsesInputMessage> => ({
  role: message.role === 'system' ? 'developer' : message.role,
  content: await toOpenAIResponsesContentAsync(message.content),
})

const toOpenAIResponsesContentAsync = async (
  content: MessageContent,
): Promise<OpenAIResponsesInputContent> => {
  if (typeof content === 'string') {
    return content
  }

  const hasVideo = content.some((part) => isVideoPart(part))
  if (hasVideo) {
    throw new Error(
      'Video inputs are only supported when using Gemini models. Remove --video or switch to a Gemini model.',
    )
  }

  const isAllText = content.every((part) => part.type === 'text')
  if (isAllText) {
    return content.map((part) => ('text' in part ? part.text : '')).join('')
  }

  const parts: Array<OpenAIResponsesInputText | OpenAIResponsesInputImage> = []

  for (const part of content) {
    if (part.type === 'text') {
      parts.push({ type: 'input_text', text: part.text })
      continue
    }

    if (part.type === 'image') {
      parts.push({
        type: 'input_image',
        image_url: `data:${part.mimeType};base64,${part.data}`,
      })
      continue
    }

    if (isPdfPart(part)) {
      const extracted = await extractPdfTextFromFile(part.filePath)
      if (extracted.ok) {
        const label = path.basename(part.filePath)
        parts.push({ type: 'input_text', text: `PDF (${label}):\n${extracted.text}` })
      } else {
        parts.push({ type: 'input_text', text: extracted.message })
      }
      continue
    }

    parts.push({ type: 'input_text', text: '' })
  }

  return parts
}

const toGeminiParts = (content: MessageContent): GeminiContentPart[] => {
  if (typeof content === 'string') {
    return content ? [{ text: content }] : []
  }

  return content.map((part) => {
    if (part.type === 'text') {
      return { text: part.text }
    }

    if (part.type === 'image') {
      return { inlineData: { mimeType: part.mimeType, data: part.data } }
    }

    if (part.type === 'video_uri') {
      return { fileData: { mimeType: part.mimeType, fileUri: part.fileUri } }
    }

    if (part.type === 'pdf') {
      if (!part.fileUri) {
        throw new Error(
          `PDF attachment ${part.filePath} is missing a Gemini fileUri. ` +
            'Upload the PDF via the Gemini Files API before calling Gemini models.',
        )
      }
      return { fileData: { mimeType: part.mimeType, fileUri: part.fileUri } }
    }

    return { text: '' }
  })
}
