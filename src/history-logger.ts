import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export const resolveHistoryFilePath = (): string => {
  const envHome = process.env.HOME?.trim()
  const homeDir = envHome && envHome.length > 0 ? envHome : os.homedir()
  return path.join(homeDir, '.config', 'prompt-maker-cli', 'history.jsonl')
}

export const appendToHistory = async (payload: object): Promise<void> => {
  const historyFile = resolveHistoryFilePath()

  try {
    await fs.mkdir(path.dirname(historyFile), { recursive: true })
    const line = `${JSON.stringify(payload)}\n`
    await fs.appendFile(historyFile, line, 'utf8')
  } catch (error) {
    console.warn('Failed to write history entry:', error)
  }
}
