import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  GENERATE_JSON_PAYLOAD_SCHEMA_VERSION,
  type GenerateJsonPayload,
} from '../../generate/types'
import { loadGeneratePayloadFromFile, serializeGeneratePayload } from '../../generate/payload-io'

const createTempDir = async (): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), 'prompt-maker-payload-io-'))

const SAMPLE_PAYLOAD: GenerateJsonPayload = {
  schemaVersion: GENERATE_JSON_PAYLOAD_SCHEMA_VERSION,
  intent: 'Build a payload loader',
  model: 'gpt-4.1',
  targetModel: 'gpt-4.1',
  prompt: 'Hello world',
  refinements: ['Be concise'],
  iterations: 1,
  interactive: false,
  timestamp: '1970-01-01T00:00:00.000Z',
  contextPaths: [{ path: 'README.md', source: 'file' }],
}

describe('payload-io', () => {
  it('round-trips JSON payloads', async () => {
    const dir = await createTempDir()
    try {
      const filePath = path.join(dir, 'payload.json')
      await fs.writeFile(filePath, serializeGeneratePayload(SAMPLE_PAYLOAD, 'json'), 'utf8')

      await expect(loadGeneratePayloadFromFile(filePath)).resolves.toEqual(SAMPLE_PAYLOAD)
    } finally {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })

  it('round-trips YAML payloads', async () => {
    const dir = await createTempDir()
    try {
      const filePath = path.join(dir, 'payload.yaml')
      await fs.writeFile(filePath, serializeGeneratePayload(SAMPLE_PAYLOAD, 'yaml'), 'utf8')

      await expect(loadGeneratePayloadFromFile(filePath)).resolves.toEqual(SAMPLE_PAYLOAD)
    } finally {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })

  it('throws on invalid JSON content', async () => {
    const dir = await createTempDir()
    try {
      const filePath = path.join(dir, 'payload.json')
      await fs.writeFile(filePath, '{ not-valid-json', 'utf8')

      await expect(loadGeneratePayloadFromFile(filePath)).rejects.toThrow('Failed to parse JSON')
    } finally {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })

  it('throws on invalid payload shape', async () => {
    const dir = await createTempDir()
    try {
      const filePath = path.join(dir, 'payload.yml')
      await fs.writeFile(filePath, 'intent: hello\n', 'utf8')

      await expect(loadGeneratePayloadFromFile(filePath)).rejects.toThrow(
        'Invalid generate payload',
      )
    } finally {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })
})
