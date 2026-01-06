import fs from 'node:fs/promises'
import path from 'node:path'

import type { GenerateJsonPayload } from '../generate/types'
import { serializeGeneratePayload, type PayloadFormat } from '../generate/payload-io'

export const writeGeneratePayloadExport = async (options: {
  payload: GenerateJsonPayload
  format: PayloadFormat
  outPath: string
  cwd?: string | undefined
}): Promise<{ absolutePath: string }> => {
  const cwd = options.cwd ?? process.cwd()
  const absolutePath = path.resolve(cwd, options.outPath)

  await fs.mkdir(path.dirname(absolutePath), { recursive: true })

  const serialized = serializeGeneratePayload(options.payload, options.format)
  await fs.writeFile(absolutePath, serialized, 'utf8')

  return { absolutePath }
}
