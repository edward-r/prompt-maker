const mockReadFile = jest.fn()
const mockMkdir = jest.fn()
const mockWriteFile = jest.fn()

jest.mock('node:fs/promises', () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}))

describe('model-manager', () => {
  beforeEach(() => {
    jest.resetModules()
    mockReadFile.mockReset()
    mockMkdir.mockReset()
    mockWriteFile.mockReset()
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('returns cached models when cache is fresh', async () => {
    const now = 1_700_000_000_000
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        timestamp: now - 1_000,
        models: { openai: ['gpt-4o'], gemini: ['gemini-1.5-pro'] },
      }),
    )

    const mockFetch = jest.fn()

    const { getAvailableModels } = await import('../utils/model-manager')

    const result = await getAvailableModels('openai-key', 'gemini-key', {
      cacheFilePath: '/tmp/models-cache.json',
      now,
      fetchImpl: mockFetch,
    })

    expect(result).toEqual({ openai: ['gpt-4o'], gemini: ['gemini-1.5-pro'] })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('refreshes a stale cache and writes the updated file', async () => {
    const now = 1_700_000_000_000

    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        timestamp: 0,
        models: { openai: ['gpt-legacy'], gemini: ['gemini-legacy'] },
      }),
    )

    const mockFetch = jest.fn(async (url: RequestInfo | URL) => {
      const href = typeof url === 'string' ? url : url.toString()
      if (href.includes('openai.com')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ data: [{ id: 'gpt-4o' }, { id: 'whisper-1' }, { id: 'o1-mini' }] }),
        } as unknown as Response
      }

      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          models: [
            {
              name: 'models/gemini-1.5-pro',
              supportedGenerationMethods: ['generateContent'],
            },
            {
              name: 'models/embedding-001',
              supportedGenerationMethods: ['embedContent'],
            },
          ],
        }),
      } as unknown as Response
    })

    const { getAvailableModels } = await import('../utils/model-manager')

    const result = await getAvailableModels('openai-key', 'gemini-key', {
      cacheFilePath: '/tmp/models-cache.json',
      now,
      fetchImpl: mockFetch,
    })

    expect(result.openai).toEqual(['gpt-4o', 'o1-mini'])
    expect(result.gemini).toEqual(['gemini-1.5-pro'])

    expect(mockMkdir).toHaveBeenCalled()
    expect(mockWriteFile).toHaveBeenCalled()
  })

  it('avoids writes and network calls without keys', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('missing'))

    const mockFetch = jest.fn()

    const { FALLBACK_MODELS, getAvailableModels } = await import('../utils/model-manager')

    const result = await getAvailableModels(null, undefined, {
      cacheFilePath: '/tmp/models-cache.json',
      now: 1_700_000_000_000,
      fetchImpl: mockFetch,
    })

    expect(result).toEqual(FALLBACK_MODELS)
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('filters video-capable Gemini models by token limit and fileData support', async () => {
    const mockFetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const href = typeof url === 'string' ? url : url.toString()

      if (href.includes('/v1beta/models?')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            models: [
              {
                name: 'models/gemini-3-pro-preview',
                supportedGenerationMethods: ['generateContent'],
                inputTokenLimit: 1_000_000,
              },
              {
                name: 'models/gemini-2.5-pro',
                supportedGenerationMethods: ['generateContent'],
                inputTokenLimit: 1_000_000,
              },
              {
                name: 'models/gemini-2.0-flash',
                supportedGenerationMethods: ['generateContent'],
                inputTokenLimit: 32_000,
              },
            ],
          }),
        } as unknown as Response
      }

      if (href.includes('gemini-3-pro-preview:generateContent')) {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () =>
            JSON.stringify({
              error: { code: 404, message: 'Requested entity was not found.', status: 'NOT_FOUND' },
            }),
        } as unknown as Response
      }

      if (href.includes('gemini-2.5-pro:generateContent')) {
        const parsed = init?.body ? (JSON.parse(String(init.body)) as any) : null
        const fileUri = parsed?.contents?.[0]?.parts?.[0]?.fileData?.fileUri
        if (fileUri !== 'INVALID_FILE_URI') {
          throw new Error('Expected probe to include INVALID_FILE_URI.')
        }

        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: async () =>
            JSON.stringify({
              error: { code: 400, message: 'Invalid file uri.', status: 'INVALID_ARGUMENT' },
            }),
        } as unknown as Response
      }

      throw new Error(`Unexpected fetch url: ${href}`)
    })

    const { getVideoCapableGeminiModels } = await import('../utils/model-manager')

    const result = await getVideoCapableGeminiModels('gemini-key', {
      fetchImpl: mockFetch as unknown as typeof fetch,
    })

    expect(result).toEqual(['gemini-2.5-pro'])
  })
})
