import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { appendToHistory } from '../../history-logger'
import { runGeneratePipeline } from '../../generate/pipeline'
import {
  GENERATE_JSON_PAYLOAD_SCHEMA_VERSION,
  type GenerateArgs,
  type GenerateJsonPayload,
  type StreamEventInput,
} from '../../generate/types'
import { serializeGeneratePayload } from '../../generate/payload-io'
import { createPromptGeneratorService } from '../../prompt-generator-service'
import { resolveHistoryFilePath } from '../../history-logger'

const promptService = {
  generatePrompt: jest.fn<Promise<string>, []>(),
}

jest.mock('clipboardy', () => ({ write: jest.fn() }))
jest.mock('open', () => jest.fn())

jest.mock('../../config', () => ({
  loadCliConfig: jest.fn().mockResolvedValue(null),
}))

jest.mock('../../prompt-generator-service', () => ({
  createPromptGeneratorService: jest.fn(),
  resolveDefaultGenerateModel: jest.fn().mockResolvedValue('gpt-4o-mini'),
  isGemini: jest.fn(() => false),
}))

jest.mock('../../generate/models', () => ({
  resolveTargetModel: jest.fn(
    async ({
      defaultTargetModel,
      explicitTarget,
    }: {
      defaultTargetModel: string
      explicitTarget?: string
    }) => explicitTarget ?? defaultTargetModel,
  ),
  resolveGeminiVideoModel: jest.fn().mockResolvedValue('gemini-1.5-pro'),
}))

jest.mock('../../history-logger', () => ({
  appendToHistory: jest.fn().mockResolvedValue(undefined),
  resolveHistoryFilePath: jest.fn(() => 'history.jsonl'),
}))

jest.mock('../../io', () => ({
  readFromStdin: jest.fn().mockResolvedValue(null),
}))

const mockAppendToHistory = appendToHistory as jest.Mock
const mockResolveHistoryFilePath = resolveHistoryFilePath as jest.Mock
const mockCreatePromptGeneratorService = createPromptGeneratorService as jest.Mock

const createTempDir = async (): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), 'prompt-maker-resume-from-file-'))

const createBaseArgs = (): GenerateArgs => ({
  interactive: false,
  copy: false,
  openChatGpt: false,
  polish: false,
  json: false,
  quiet: true,
  progress: false,
  stream: 'none',
  showContext: false,
  contextFormat: 'text',
  help: false,
  context: [],
  urls: [],
  images: [],
  video: [],
  smartContext: false,
})

describe('runGeneratePipeline --resume-from', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreatePromptGeneratorService.mockResolvedValue(promptService)
  })

  it('loads a JSON payload file, seeds state, and emits resume.loaded with source=file', async () => {
    const dir = await createTempDir()

    try {
      const existingPath = path.join(dir, 'existing.md')
      const missingPath = path.join(dir, 'missing.md')
      await fs.writeFile(existingPath, 'existing content', 'utf8')

      const payloadPath = path.join(dir, 'payload.json')
      const resumedPayload: GenerateJsonPayload = {
        schemaVersion: GENERATE_JSON_PAYLOAD_SCHEMA_VERSION,
        intent: 'resumed intent',
        model: 'gpt-4o-mini',
        targetModel: 'gpt-4o-mini',
        prompt: 'previous prompt',
        polishedPrompt: 'previous polished',
        polishModel: 'polish-model',
        metaInstructions: 'Be concise',
        refinements: ['prior refinement'],
        iterations: 2,
        interactive: true,
        timestamp: '2025-01-01T00:00:00.000Z',
        contextPaths: [
          { path: existingPath, source: 'file' },
          { path: missingPath, source: 'file' },
          { path: 'url:https://example.com', source: 'url' },
        ],
      }

      await fs.writeFile(payloadPath, serializeGeneratePayload(resumedPayload, 'json'), 'utf8')

      const events: StreamEventInput[] = []
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

      await runGeneratePipeline(
        {
          ...createBaseArgs(),
          resumeFrom: payloadPath,
          resumeMode: 'best-effort',
        },
        {
          onStreamEvent: (event) => {
            events.push(event)
          },
        },
      )

      warnSpy.mockRestore()

      const resumeEvent = events.find(
        (event): event is Extract<StreamEventInput, { event: 'resume.loaded' }> =>
          event.event === 'resume.loaded',
      )

      expect(resumeEvent).toBeDefined()
      expect(resumeEvent?.source).toBe('file')
      expect(resumeEvent?.reusedContextPaths).toEqual([{ path: existingPath, source: 'file' }])
      expect(resumeEvent?.missingContextPaths).toEqual(
        expect.arrayContaining([
          { path: missingPath, source: 'file' },
          { path: 'url:https://example.com', source: 'url' },
        ]),
      )

      expect(mockResolveHistoryFilePath).not.toHaveBeenCalled()

      expect(promptService.generatePrompt).not.toHaveBeenCalled()
      expect(mockAppendToHistory).toHaveBeenCalledWith(
        expect.objectContaining({ intent: 'resumed intent', prompt: 'previous polished' }),
      )
    } finally {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })

  it('loads a YAML payload file and emits resume.loaded with source=file', async () => {
    const dir = await createTempDir()

    try {
      const existingPath = path.join(dir, 'existing.md')
      await fs.writeFile(existingPath, 'existing content', 'utf8')

      const payloadPath = path.join(dir, 'payload.yaml')
      const resumedPayload: GenerateJsonPayload = {
        schemaVersion: GENERATE_JSON_PAYLOAD_SCHEMA_VERSION,
        intent: 'resumed intent',
        model: 'gpt-4o-mini',
        targetModel: 'gpt-4o-mini',
        prompt: 'previous prompt',
        refinements: [],
        iterations: 1,
        interactive: false,
        timestamp: '2025-01-01T00:00:00.000Z',
        contextPaths: [{ path: existingPath, source: 'file' }],
      }

      await fs.writeFile(payloadPath, serializeGeneratePayload(resumedPayload, 'yaml'), 'utf8')

      const events: StreamEventInput[] = []

      await runGeneratePipeline(
        {
          ...createBaseArgs(),
          resumeFrom: payloadPath,
          resumeMode: 'best-effort',
        },
        {
          onStreamEvent: (event) => {
            events.push(event)
          },
        },
      )

      const resumeEvent = events.find(
        (event): event is Extract<StreamEventInput, { event: 'resume.loaded' }> =>
          event.event === 'resume.loaded',
      )

      expect(resumeEvent).toBeDefined()
      expect(resumeEvent?.source).toBe('file')
      expect(resumeEvent?.reusedContextPaths).toEqual([{ path: existingPath, source: 'file' }])
      expect(resumeEvent?.missingContextPaths).toEqual([])

      expect(mockResolveHistoryFilePath).not.toHaveBeenCalled()
      expect(promptService.generatePrompt).not.toHaveBeenCalled()
    } finally {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })

  it('fails fast with a descriptive error when the payload file cannot be parsed', async () => {
    const dir = await createTempDir()

    try {
      const payloadPath = path.join(dir, 'payload.json')
      await fs.writeFile(payloadPath, '{ not-valid-json', 'utf8')

      await expect(
        runGeneratePipeline({
          ...createBaseArgs(),
          resumeFrom: payloadPath,
          resumeMode: 'best-effort',
        }),
      ).rejects.toThrow(/Failed to parse JSON/i)

      expect(mockCreatePromptGeneratorService).not.toHaveBeenCalled()
      expect(mockAppendToHistory).not.toHaveBeenCalled()
    } finally {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })
})
