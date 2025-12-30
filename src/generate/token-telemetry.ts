import { stdout as output } from 'node:process'

import boxen from 'boxen'
import chalk from 'chalk'
import Table from 'cli-table3'

import type { FileContext } from '../file-context'
import { GEN_SYSTEM_PROMPT } from '../prompt-generator-service'
import { countTokens, formatTokenCount } from '../token-counter'

import type { TokenTelemetry } from './types'

export const buildTokenTelemetry = (
  intentText: string,
  files: FileContext[],
  metaInstructions?: string,
): TokenTelemetry => {
  const fileSummaries = files.map((file) => ({
    path: file.path,
    tokens: countTokens(file.content),
  }))
  const fileTokens = fileSummaries.reduce((acc, file) => acc + file.tokens, 0)
  const intentTokens = countTokens(intentText)
  const metaTokens = metaInstructions?.trim() ? countTokens(metaInstructions) : 0
  const systemTokens = countTokens(GEN_SYSTEM_PROMPT) + metaTokens

  return {
    files: fileSummaries,
    intentTokens,
    fileTokens,
    systemTokens,
    totalTokens: intentTokens + fileTokens + systemTokens,
  }
}

export const displayTokenSummary = ({
  files,
  intentTokens,
  fileTokens,
  systemTokens,
  totalTokens,
}: TokenTelemetry): void => {
  const telemetryLines = [
    `${chalk.gray('Total')}: ${chalk.white(formatTokenCount(totalTokens))}`,
    `${chalk.gray('Intent')}: ${chalk.white(formatTokenCount(intentTokens))}`,
    `${chalk.gray('Files')}: ${chalk.white(formatTokenCount(fileTokens))}`,
    `${chalk.gray('System')}: ${chalk.white(formatTokenCount(systemTokens))}`,
  ].join('\n')

  console.log('')
  console.log(
    boxen(telemetryLines, {
      padding: { left: 1, right: 1, top: 0, bottom: 0 },
      borderColor: 'cyan',
      borderStyle: 'round',
      title: chalk.bold.cyan('Context Telemetry'),
      titleAlignment: 'left',
    }),
  )
  console.log('')

  if (files.length === 0) {
    return
  }

  const terminalWidth = Math.max(60, Math.min(output.columns ?? 100, 110))
  const numberColumnWidth = 4
  const tokensColumnWidth = 14
  const pathColumnWidth = Math.max(24, terminalWidth - numberColumnWidth - tokensColumnWidth)
  const table = new Table({
    head: [chalk.gray('#'), chalk.gray('Path'), chalk.gray('Tokens')],
    style: { head: [], border: [] },
    wordWrap: true,
    colWidths: [numberColumnWidth, pathColumnWidth, tokensColumnWidth],
  })

  files.slice(0, 10).forEach((file, index) => {
    table.push([
      chalk.dim(String(index + 1)),
      chalk.white(file.path),
      chalk.green(formatTokenCount(file.tokens)),
    ])
  })

  console.log(table.toString())
  console.log('')

  if (files.length > 10) {
    console.log(chalk.dim(`…and ${files.length - 10} more context files`))
  }
}
