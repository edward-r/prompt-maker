# Title
Implement resume refinement in generate pipeline using history selector

Role
You are a TypeScript engineer implementing generate pipeline enhancements.

Context
Generate pipeline (src/generate/pipeline.ts) orchestrates intent resolution, context ingestion, telemetry, generation iterations, and output payload assembly. History is stored as JSONL at ~/.config/prompt-maker-cli/history.jsonl. Generate-mode flags exist:
- --resume-last / --resume <selector>
- --resume-mode strict|best-effort
A resume.loaded stream event type exists.

Goals & Tasks
- Implement resume behavior when --resume-last or --resume is provided:
  - Load the selected GenerateJsonPayload from history.jsonl.
  - Seed the current run’s defaults from the loaded payload:
    - intent (unless user also provided a new intent via positional/intent-file/stdin; if conflict, define precedence and document in code comments)
    - model, targetModel, polishModel settings if relevant
    - metaInstructions if present in payload (if the payload includes it; if not, skip)
    - refinements list
    - previousPrompt should be payload.polishedPrompt ?? payload.prompt
  - Re-resolve context files from payload.contextPaths where source is 'file' (and possibly url/github if represented as virtual paths), handling missing paths:
    - strict: throw if any required file context path cannot be read
    - best-effort: warn and skip missing entries
  - Emit resume.loaded with reused and missing context paths.

Inputs
- Files:
  - src/generate/pipeline.ts
  - src/history-logger.ts (history path)
  - src/generate/types.ts (GenerateJsonPayload, stream events)
  - src/file-context.ts and/or helpers used to read file content

Constraints
- Do not change default non-resume runs.
- Ensure --json output remains valid JSON on stdout (resume logs go to stderr).
- Deterministic selection and context rehydration.

Execution Plan
1. Add a helper to read and select a history entry (can be shared with export logic, but this prompt’s implementation may copy minimal logic).
2. In pipeline start, if resume flags are present, load payload before resolving new intent/context.
3. Decide precedence rules:
  - Suggested: explicit user-provided intent/context flags override resumed data; if no explicit inputs, use resumed.
4. Rehydrate context:
  - For file sources: attempt to read file paths.
  - For url/github virtual paths: either skip with warning (best-effort) or treat as missing (strict) unless you implement refetching.
5. Emit resume.loaded.
6. Ensure generation starts from previousPrompt and includes refinements.
7. Add unit/integration tests:
  - Create a fake history file in a temp HOME.
  - Resume in best-effort mode with one missing file path and confirm warning + event.
  - Resume in strict mode and confirm failure.

Output Format
- Provide a git diff including tests.

Validation
- Commands:
  - npm test
  - npm run build
- Manual test (using temp HOME):
  - Write a minimal history.jsonl entry that references an existing local file and one missing file.
  - Run:
    - node dist/index.js "" --resume-last --resume-mode best-effort --stream jsonl --quiet (or with a stub intent override if required)
  - Expected outcomes:
    - stdout JSONL includes resume.loaded with missingContextPaths listing the missing file.
    - Run continues (best-effort).
  - Run with --resume-mode strict should exit non-zero and mention missing context paths.