# Title
Add schemaVersion to GenerateJsonPayload and propagate to outputs/history

Role
You are a TypeScript engineer extending the generate output contract.

Context
GenerateJsonPayload is defined in src/generate/types.ts and is emitted in --json mode, generation.final stream event, and appended to ~/.config/prompt-maker-cli/history.jsonl via src/history-logger.ts. Recommendation proposes adding schemaVersion to stabilize tooling.

Goals & Tasks
- Add an optional (or initially required) field schemaVersion to GenerateJsonPayload.
- Ensure pipeline populates schemaVersion in the payload it emits and logs.
- Keep backward compatibility: existing parsers should not break; adding a field is additive.

Inputs
- Files:
  - src/generate/types.ts
  - src/generate/pipeline.ts
  - src/history-logger.ts
  - docs that describe payload shape (if any)

Constraints
- Choose a schemaVersion format (e.g., "1" or "1.0") and keep it stable.
- Ensure any JSON schemas/tests are updated accordingly.

Execution Plan
1. Update GenerateJsonPayload type to include schemaVersion: string.
2. In src/generate/pipeline.ts where payload is assembled, set schemaVersion to a constant (e.g., '1').
3. Update any tests that assert payload shape.
4. Update any docs that list payload fields.

Output Format
- Provide a git diff (or explicit file edits).

Validation
- Commands:
  - npm test
  - npm run build
- Runtime checks:
  - node dist/index.js "hello" --json --quiet (with environment configured or with a mocked generator in tests)
- Expected outcomes:
  - JSON payload includes schemaVersion.
  - generation.final result includes schemaVersion.
  - Newly appended history entries include schemaVersion.