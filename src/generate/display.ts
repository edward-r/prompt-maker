import boxen from 'boxen'
import chalk from 'chalk'

import { formatTokenCount } from '../token-counter'

export const displayPrompt = (prompt: string, iteration: number, tokenCount?: number): void => {
  const label = iteration === 1 ? 'Generated Prompt' : `Iteration ${iteration}`
  const meta = typeof tokenCount === 'number' ? chalk.dim(` · ${formatTokenCount(tokenCount)}`) : ''
  const title = chalk.bold.green(`${label}${meta}`)

  const boxed = boxen(prompt, {
    padding: { left: 1, right: 1, top: 0, bottom: 0 },
    borderColor: 'green',
    borderStyle: 'round',
    title,
    titleAlignment: 'left',
  })

  console.log(`\n${boxed}`)
}

export const displayPolishedPrompt = (prompt: string, model: string): void => {
  const title = chalk.bold.magenta(`Polished Prompt · ${model}`)
  const boxed = boxen(prompt, {
    padding: { left: 1, right: 1, top: 0, bottom: 0 },
    borderColor: 'magenta',
    borderStyle: 'round',
    title,
    titleAlignment: 'left',
  })

  console.log(`\n${boxed}`)
}

export const displayContextTemplatePrompt = (prompt: string, templateName: string): void => {
  const title = chalk.bold.blue(`Context Template · ${templateName}`)
  const boxed = boxen(prompt, {
    padding: { left: 1, right: 1, top: 0, bottom: 0 },
    borderColor: 'blue',
    borderStyle: 'round',
    title,
    titleAlignment: 'left',
  })

  console.log(`\n${boxed}`)
}
