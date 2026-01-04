# Title
Add generate-mode CLI flags for token budgets and overflow strategy

Role
You are a TypeScript CLI engineer working on an ESM Node>=18 package.

Context
The repo is @perceptron/prompt-maker-cli. Generate-mode args are parsed in src/generate/args.ts and used by src/generate/pipeline.ts. Current generate flags include --json, --stream, --context, --url, --smart-context, etc. Token telemetry exists (src/generate/token-telemetry.ts) but there is no enforcement/budgeting.

Goals & Tasks
- Add new generate-mode flags:
  - --max-input-tokens <number> (optional)
  - --max-context-tokens <number> (optional)
  - --context-overflow <strategy> where strategy is one of: fail | drop-smart | drop-url | drop-largest | drop-oldest
- Ensure these flags appear in `--help` output for generate mode.
- Update the generated args type to expose these values to the pipeline.

Inputs
- Files:
  - src/generate/args.ts
  - src/generate/types.ts (if it defines argument types)
- Existing CLI behavior docs in docs/prompt-maker-cli-tui-encyclopedia.md (for consistency).

Constraints
- Backward compatible defaults: if flags are absent, behavior must remain unchanged.
- Use yargs validation to ensure numeric flags are positive integers.
- strategy must be validated to the allowed enum.

Execution Plan
1. Inspect src/generate/args.ts to find the yargs builder.
2. Add options for maxInputTokens and maxContextTokens as number options with describe/default undefined.
3. Add option contextOverflow as string option with choices [fail, drop-smart, drop-url, drop-largest, drop-oldest] and default undefined.
4. Ensure the parsed args type includes these fields and they are exported/usable by src/generate/pipeline.ts.
5. Add minimal unit tests for args parsing if the repo has a pattern for it; otherwise add a lightweight test that runs the parser function (if exposed) or validates via snapshot of `node dist/index.js --help` is not feasible.

Output Format
- Provide a git diff (or explicit file edits) adding the three flags and any necessary types.

Validation
- Commands:
  - npm test (or the repo’s test command) should pass.
  - npm run build should pass.
  - node dist/index.js generate --help (or node dist/index.js --help if generate is default) should show the three new flags with correct descriptions and allowed values.
- Expected outcomes:
  - Passing an invalid strategy value exits non-zero with a yargs validation error.
  - Passing non-integer or <=0 values for token flags exits non-zero with a validation error.
  - Running without the new flags behaves exactly as before.