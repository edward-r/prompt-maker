import fs from 'node:fs/promises'

import chalk from 'chalk'

import type { FileContext } from '../file-context'

export const displayContextFiles = (
  files: FileContext[],
  format: 'text' | 'json',
  writeLine: (line: string) => void,
): void => {
  if (format === 'json') {
    writeLine(serializeContextAsJson(files))
    return
  }

  writeLine(`\n${chalk.bold.cyan('Context Files')}`)
  writeLine(chalk.dim('──────────────'))

  if (files.length === 0) {
    writeLine(chalk.dim('(none)'))
    return
  }

  files.forEach((file, index) => {
    writeLine(`<file path="${file.path}">`)
    writeLine(file.content)
    writeLine('</file>')
    if (index < files.length - 1) {
      writeLine('')
    }
  })
}

export const writeContextFile = async (
  filePath: string,
  format: 'text' | 'json',
  files: FileContext[],
): Promise<void> => {
  const payload = format === 'json' ? serializeContextAsJson(files) : serializeContextAsText(files)
  await fs.writeFile(filePath, payload, 'utf8')
}

export const serializeContextAsJson = (files: FileContext[]): string =>
  JSON.stringify(
    files.map(({ path, content }) => ({ path, content })),
    null,
    2,
  )

export const serializeContextAsText = (files: FileContext[]): string => {
  if (files.length === 0) {
    return '(none)'
  }
  return files
    .map((file) => [`<file path="${file.path}">`, file.content, '</file>'].join('\n'))
    .join('\n\n')
}
