import { parseGenerateArgs } from './args'
import { runGeneratePipeline } from './pipeline'

export const runGenerateCommand = async (argv: string[]): Promise<void> => {
  const { args, showHelp } = parseGenerateArgs(argv)

  if (args.help) {
    showHelp()
    return
  }

  await runGeneratePipeline(args)
}
