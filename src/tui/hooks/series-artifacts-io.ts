import fs from 'node:fs/promises'
import path from 'node:path'

import type { SeriesResponse } from '../../prompt-generator-service'
import { buildSeriesOutputDirName, sanitizeForPathSegment } from '../../utils/series-path'

export type PrepareSeriesOutputDirResult = {
  seriesDir: string
  canWriteFiles: boolean
  errorMessage?: string
}

export const prepareSeriesOutputDir = async (
  intent: string,
  cwd: string = process.cwd(),
): Promise<PrepareSeriesOutputDirResult> => {
  const seriesDir = path.join(
    path.resolve(cwd, 'generated', 'series'),
    buildSeriesOutputDirName(intent),
  )

  try {
    await fs.mkdir(seriesDir, { recursive: true })
    return { seriesDir, canWriteFiles: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown filesystem error.'
    return { seriesDir, canWriteFiles: false, errorMessage: message }
  }
}

export type WriteSeriesArtifactsResult = {
  writtenCount: number
  errors: Array<{ fileName: string; message: string }>
}

export const writeSeriesArtifacts = async (
  seriesDir: string,
  series: SeriesResponse,
): Promise<WriteSeriesArtifactsResult> => {
  const tasks: Array<{ fileName: string; content: string }> = []

  tasks.push({ fileName: '00-overview.md', content: series.overviewPrompt })

  series.atomicPrompts.forEach((step, index) => {
    const stepNumber = index + 1
    const stepPrefix = stepNumber.toString().padStart(2, '0')
    const titleSlug = sanitizeForPathSegment(step.title, 'step', 60)
    tasks.push({ fileName: `${stepPrefix}-${titleSlug}.md`, content: step.content })
  })

  const results = await Promise.allSettled(
    tasks.map(async (task) => {
      await fs.writeFile(path.join(seriesDir, task.fileName), task.content, 'utf8')
      return task.fileName
    }),
  )

  const errors: Array<{ fileName: string; message: string }> = []
  let writtenCount = 0

  results.forEach((result, index) => {
    const fileName = tasks[index]?.fileName ?? 'unknown'
    if (result.status === 'fulfilled') {
      writtenCount += 1
      return
    }

    const message = result.reason instanceof Error ? result.reason.message : String(result.reason)
    errors.push({ fileName, message })
  })

  return { writtenCount, errors }
}
