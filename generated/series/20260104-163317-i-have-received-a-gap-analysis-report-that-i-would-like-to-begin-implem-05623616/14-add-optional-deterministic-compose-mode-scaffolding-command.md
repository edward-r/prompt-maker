# Title
Add optional deterministic compose mode scaffolding (command routing + stub output)

Role
You are a TypeScript CLI engineer adding a new subcommand scaffold.

Context
Recommendation P2 suggests an optional deterministic compose mode, but it is medium→high complexity. This prompt only adds the minimal scaffolding so the command exists and is testable, without implementing full recipe semantics.

Goals & Tasks
- Add a new top-level mode `compose` in src/index.ts.
- Implement src/compose-command.ts (new) that:
  - accepts --recipe <path> and --input <text>
  - reads the recipe file as text
  - outputs a deterministic composed prompt as plain text (for now: a stable placeholder composition like recipe contents + a separator + input)
- Ensure command has --help.

Inputs
- Files:
  - src/index.ts

Constraints
- Must not invoke any LLM APIs.
- Keep output deterministic.
- This is scaffolding; do not claim prompt-engine parity.

Execution Plan
1. Add routing in src/index.ts.
2. Add a yargs parser for compose with required flags --recipe and --input.
3. Read file, build deterministic output.
4. Add minimal tests that run compose handler with a temp file and assert stdout.

Output Format
- Provide a git diff.

Validation
- Commands:
  - npm test
  - npm run build
  - node dist/index.js compose --help
  - node dist/index.js compose --recipe ./tmp-recipe.yaml --input "hello"
- Expected outcomes:
  - help output is shown.
  - command exits 0 and prints deterministic composed text.
  - no network calls occur.