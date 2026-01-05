import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { runComposeCommand } from '../compose-command'

describe('compose-command', () => {
  const originalExitCode = process.exitCode
  const tempDirs: string[] = []

  afterEach(async () => {
    await Promise.all(
      tempDirs.map(async (tempDir) => {
        await fs.rm(tempDir, { recursive: true, force: true })
      }),
    )
    tempDirs.splice(0, tempDirs.length)

    process.exitCode = originalExitCode

    jest.restoreAllMocks()
  })

  it('prints deterministic recipe + input composition', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pmc-compose-'))
    tempDirs.push(tempDir)

    const recipePath = path.join(tempDir, 'recipe.yaml')
    await fs.writeFile(recipePath, 'recipe: demo\nsteps:\n  - one\n', 'utf8')

    const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    await runComposeCommand(['--recipe', recipePath, '--input', 'hello'])

    expect(err).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(originalExitCode)
    expect(stdout).toHaveBeenCalledWith('recipe: demo\nsteps:\n  - one\n---\nhello\n')
  })

  it('shows help output when requested', async () => {
    const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const stderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)

    await runComposeCommand(['--help'])

    expect(process.exitCode).toBe(originalExitCode)
    expect(stdout.mock.calls.length + stderr.mock.calls.length).toBeGreaterThan(0)
  })
})
