import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const readJson = async (filePath: string): Promise<unknown> => {
  const contents = await fs.readFile(filePath, 'utf8')
  return JSON.parse(contents) as unknown
}

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

describe('budget settings persistence', () => {
  const envBefore = { ...process.env }

  afterEach(() => {
    process.env = { ...envBefore }
  })

  test('saving updates promptGenerator without rewriting other fields', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pm-budgets-persist-'))
    const configPath = path.join(tempRoot, 'config.json')

    await writeJson(configPath, {
      openaiApiKey: 'keep-me',
      promptGenerator: { defaultModel: 'gpt-4o', maxInputTokens: 500 },
    })

    process.env.PROMPT_MAKER_CLI_CONFIG = configPath

    jest.resetModules()
    const { updateCliPromptGeneratorSettings } = await import('../../config')

    await updateCliPromptGeneratorSettings({
      maxInputTokens: 123,
      maxContextTokens: 456,
      contextOverflowStrategy: 'drop-oldest',
    })

    const updated = await readJson(configPath)
    expect(updated).toMatchObject({
      openaiApiKey: 'keep-me',
      promptGenerator: {
        defaultModel: 'gpt-4o',
        maxInputTokens: 123,
        maxContextTokens: 456,
        contextOverflowStrategy: 'drop-oldest',
      },
    })
  })

  test('null patch deletes budget fields', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pm-budgets-persist-'))
    const configPath = path.join(tempRoot, 'config.json')

    await writeJson(configPath, {
      promptGenerator: {
        defaultModel: 'gpt-4o',
        maxInputTokens: 123,
        maxContextTokens: 456,
        contextOverflowStrategy: 'drop-oldest',
      },
    })

    process.env.PROMPT_MAKER_CLI_CONFIG = configPath

    jest.resetModules()
    const { updateCliPromptGeneratorSettings } = await import('../../config')

    await updateCliPromptGeneratorSettings({
      maxInputTokens: null,
      maxContextTokens: null,
      contextOverflowStrategy: null,
    })

    const updated = await readJson(configPath)
    expect(updated).toMatchObject({
      promptGenerator: { defaultModel: 'gpt-4o' },
    })

    expect(updated).not.toMatchObject({
      promptGenerator: {
        maxInputTokens: expect.anything(),
      },
    })
  })
})
