import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { context } from 'esbuild'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const srcEntry = path.join(repoRoot, 'src/index.ts')
const outFile = path.join(repoRoot, 'dist/index.js')

const coreSrcRoot = path.join(repoRoot, 'packages/core/src')

const cliArgs = process.argv.slice(2)

let child = null

const killChild = () => {
  if (!child) return
  child.kill('SIGTERM')
  child = null
}

const startChild = () => {
  killChild()

  child = spawn('node', [outFile, ...cliArgs], {
    stdio: 'inherit',
  })
}

const promptMakerCoreAliasPlugin = {
  name: 'prompt-maker-core-alias',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@prompt-maker\/core$/ }, () => ({
      path: path.join(coreSrcRoot, 'index.ts'),
    }))

    pluginBuild.onResolve({ filter: /^@prompt-maker\/core\/.+$/ }, (args) => {
      const subPath = args.path.slice('@prompt-maker/core/'.length)
      return {
        path: path.join(coreSrcRoot, subPath),
      }
    })
  },
}

const restartPlugin = {
  name: 'restart-on-rebuild',
  setup(pluginBuild) {
    pluginBuild.onEnd((result) => {
      if (result.errors.length > 0) {
        return
      }

      startChild()
    })
  },
}

const ctx = await context({
  entryPoints: [srcEntry],
  outfile: outFile,
  bundle: true,
  packages: 'external',
  platform: 'node',
  target: 'node18',
  format: 'esm',
  sourcemap: true,
  plugins: [promptMakerCoreAliasPlugin, restartPlugin],
  logLevel: 'info',
})

const shutdown = async () => {
  killChild()
  await ctx.dispose()
}

process.on('SIGINT', () => {
  void shutdown().finally(() => process.exit(0))
})
process.on('SIGTERM', () => {
  void shutdown().finally(() => process.exit(0))
})

await ctx.watch()
await ctx.rebuild()
