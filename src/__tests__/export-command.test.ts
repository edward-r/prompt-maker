import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import yaml from 'js-yaml'

import { runExportCommand } from '../export-command'
import { GENERATE_JSON_PAYLOAD_SCHEMA_VERSION, type GenerateJsonPayload } from '../generate/types'

describe('export-command', () => {
  const originalHome = process.env.HOME
  const originalExitCode = process.exitCode
  const tempHomes: string[] = []

  afterEach(async () => {
    await Promise.all(
      tempHomes.map(async (home) => {
        await fs.rm(home, { recursive: true, force: true })
      }),
    )
    tempHomes.splice(0, tempHomes.length)

    if (originalHome === undefined) {
      delete process.env.HOME
    } else {
      process.env.HOME = originalHome
    }

    process.exitCode = originalExitCode

    jest.restoreAllMocks()
  })

  const writeHistory = async (homeDir: string, lines: string[]): Promise<string> => {
    const historyPath = path.join(homeDir, '.config', 'prompt-maker-cli', 'history.jsonl')
    await fs.mkdir(path.dirname(historyPath), { recursive: true })
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

  it('exports the last history entry by default (JSON)', async () => {
    const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), 'pmc-export-home-'))
    tempHomes.push(tempHome)
    process.env.HOME = tempHome

    const first = createPayload({ intent: 'first', timestamp: '2025-01-01T00:00:00.000Z' })
    const second = createPayload({ intent: 'second', timestamp: '2025-01-02T00:00:00.000Z' })

    await writeHistory(tempHome, [JSON.stringify(first), 'not json', JSON.stringify(second)])

    const outPath = path.join(tempHome, 'export.json')
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    await runExportCommand(['--format', 'json', '--out', outPath, '--quiet'])

    expect(log).not.toHaveBeenCalled()
    expect(err).not.toHaveBeenCalled()

    const written = await fs.readFile(outPath, 'utf8')
    expect(JSON.parse(written) as unknown).toEqual(second)
  })

  it('exports the N-th entry from end (YAML)', async () => {
    const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), 'pmc-export-home-'))
    tempHomes.push(tempHome)
    process.env.HOME = tempHome

    const first = createPayload({ intent: 'first', timestamp: '2025-01-01T00:00:00.000Z' })
    const second = createPayload({ intent: 'second', timestamp: '2025-01-02T00:00:00.000Z' })
    const third = createPayload({ intent: 'third', timestamp: '2025-01-03T00:00:00.000Z' })

    await writeHistory(tempHome, [
      JSON.stringify(first),
      JSON.stringify(second),
      JSON.stringify(third),
    ])

    const outPath = path.join(tempHome, 'export.yaml')
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    await runExportCommand(['--from-history', '2', '--format', 'yaml', '--out', outPath, '--quiet'])

    expect(log).not.toHaveBeenCalled()
    expect(err).not.toHaveBeenCalled()

    const written = await fs.readFile(outPath, 'utf8')
    const parsed = yaml.load(written)
    expect(parsed as unknown).toEqual(second)
  })

  it('fails with a clear message for invalid selectors', async () => {
    const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), 'pmc-export-home-'))
    tempHomes.push(tempHome)
    process.env.HOME = tempHome

    const first = createPayload({ intent: 'first', timestamp: '2025-01-01T00:00:00.000Z' })
    await writeHistory(tempHome, [JSON.stringify(first)])

    const outPath = path.join(tempHome, 'export.json')
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    await runExportCommand([
      '--from-history',
      'last:0',
      '--format',
      'json',
      '--out',
      outPath,
      '--quiet',
    ])

    expect(process.exitCode).toBe(1)
    expect(err).toHaveBeenCalledWith(expect.stringContaining('Invalid --from-history selector'))
    await expect(fs.stat(outPath)).rejects.toThrow()
  })

  it('fails when the history file is missing', async () => {
    const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), 'pmc-export-home-'))
    tempHomes.push(tempHome)
    process.env.HOME = tempHome

    const outPath = path.join(tempHome, 'export.json')
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    await runExportCommand(['--format', 'json', '--out', outPath, '--quiet'])

    expect(process.exitCode).toBe(1)
    expect(err).toHaveBeenCalledWith(expect.stringContaining('History file not found'))
  })
})
