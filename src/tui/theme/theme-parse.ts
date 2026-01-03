import fs from 'node:fs/promises'

export const readJsonFile = async (filePath: string): Promise<unknown> => {
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw) as unknown
}
