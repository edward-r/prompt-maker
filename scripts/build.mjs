import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { build, context } from 'esbuild'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const cliArgs = process.argv.slice(2)
const watch = cliArgs.includes('--watch')
const minify = cliArgs.includes('--minify')

const srcEntry = path.join(repoRoot, 'src/index.ts')
const outFile = path.join(repoRoot, 'dist/index.js')
const metaFile = path.join(repoRoot, 'dist/meta.json')

const coreSrcRoot = path.join(repoRoot, 'packages/core/src')

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

const buildOptions = {
  entryPoints: [srcEntry],
  outfile: outFile,
  bundle: true,
  packages: 'external',
  platform: 'node',
  target: 'node18',
  format: 'esm',
  sourcemap: true,
  minify,
  plugins: [promptMakerCoreAliasPlugin],
  metafile: true,
  logLevel: 'info',
}

await fs.mkdir(path.dirname(outFile), { recursive: true })

if (watch) {
  const ctx = await context(buildOptions)
  await ctx.watch()
  console.log('esbuild is watching for changes...')
} else {
  const result = await build(buildOptions)
  await fs.writeFile(metaFile, JSON.stringify(result.metafile, null, 2), 'utf8')
}
