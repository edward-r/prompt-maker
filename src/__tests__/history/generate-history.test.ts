import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  loadGeneratePayloadFromHistory,
  parseFromHistorySelector,
} from '../../history/generate-history'
import {
  GENERATE_JSON_PAYLOAD_SCHEMA_VERSION,
  type GenerateJsonPayload,
} from '../../generate/types'

describe('generate-history helpers', () => {
  const tempRoots: string[] = []

  afterEach(async () => {
    await Promise.all(
      tempRoots.map(async (root) => {
        await fs.rm(root, { recursive: true, force: true })
      }),
    )
    tempRoots.splice(0, tempRoots.length)
  })

  const writeHistory = async (lines: string[]): Promise<string> => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pm-generate-history-'))
    tempRoots.push(root)
    const historyPath = path.join(root, 'history.jsonl')
    await fs.writeFile(historyPath, `${lines.join('\n')}\n`, 'utf8')
    return historyPath
  }

  const createPayload = (overrides: Partial<GenerateJsonPayload>): GenerateJsonPayload => ({
    schemaVersion: GENERATE_JSON_PAYLOAD_SCHEMA_VERSION,
    intent: 'intent',
    model: 'model',
    targetModel: 'target-model',
    prompt: 'prompt',
    refinements: [],
    iterations: 1,
    interactive: false,
    timestamp: new Date(0).toISOString(),
    contextPaths: [{ path: 'file.txt', source: 'file' }],
    ...overrides,
  })

  test('parseFromHistorySelector parses last/last:N/N', () => {
    expect(parseFromHistorySelector('last')).toEqual({ fromEnd: 1, label: 'last' })
    expect(parseFromHistorySelector('last:2')).toEqual({ fromEnd: 2, label: 'last:2' })
    expect(parseFromHistorySelector('3')).toEqual({ fromEnd: 3, label: '3' })
  })

  test('parseFromHistorySelector rejects invalid selectors', () => {
    expect(() => parseFromHistorySelector('last:0')).toThrow(/Invalid --from-history selector/)
    expect(() => parseFromHistorySelector('wat')).toThrow(/Invalid --from-history selector/)
  })

  test('loadGeneratePayloadFromHistory enforces selector bounds', async () => {
    const payload = createPayload({ intent: 'only' })
    const historyPath = await writeHistory([JSON.stringify(payload)])

    await expect(loadGeneratePayloadFromHistory({ selector: '2', historyPath })).rejects.toThrow(
      /History selector is out of range/,
    )
  })

  test('loadGeneratePayloadFromHistory refuses unsupported schemaVersion', async () => {
    const supported = createPayload({ intent: 'supported' })
    const unsupported = { ...supported, schemaVersion: '999' }

    const historyPath = await writeHistory([JSON.stringify(supported), JSON.stringify(unsupported)])

    await expect(loadGeneratePayloadFromHistory({ selector: 'last', historyPath })).rejects.toThrow(
      /Unsupported history payload schemaVersion=999/,
    )

    await expect(loadGeneratePayloadFromHistory({ selector: '2', historyPath })).resolves.toEqual(
      supported,
    )
  })
})
