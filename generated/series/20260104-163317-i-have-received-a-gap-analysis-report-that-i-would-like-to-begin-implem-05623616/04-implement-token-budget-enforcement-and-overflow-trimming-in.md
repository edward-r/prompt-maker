# Title
Implement token budget enforcement and overflow trimming in generate pipeline

Role
You are a TypeScript engineer implementing core generate pipeline behavior.

Context
Generate pipeline is in src/generate/pipeline.ts. It resolves intent + context (file/url/smart/media), computes token telemetry via src/generate/token-telemetry.ts, emits context.telemetry events, and then calls the generation workflow. There is currently no enforcement of max token budgets. New flags/config defaults exist:
- args.maxInputTokens, args.maxContextTokens, args.contextOverflow
- config.promptGenerator.maxInputTokens/maxContextTokens/contextOverflowStrategy
A new stream event context.overflow exists.

Goals & Tasks
- Add a "budget evaluation" stage after context resolution and telemetry computation, before calling the generation workflow.
- If maxInputTokens is set (from CLI flag or config default), enforce it using the selected overflow strategy.
- If maxContextTokens is set, enforce budget only on context portion (file/url/smart context text blocks; do not include system prompt tokens in this cap).
- Implement deterministic trimming strategies:
  - fail: throw an error if over budget
  - drop-smart: remove smart-context-derived entries first
  - drop-url: remove URL-derived entries first
  - drop-largest: drop context entries with largest token counts first
  - drop-oldest: drop context entries by stable ordering (oldest first); define "oldest" deterministically as the context assembly order used in the pipeline
- When trimming occurs:
  - recompute telemetry
  - emit context.overflow with strategy, before, after, droppedPaths
  - ensure dropped paths are removed from both context text used for generation and from contextPaths in the final payload

Inputs
- Files:
  - src/generate/pipeline.ts
  - src/generate/token-telemetry.ts
  - src/file-context.ts, src/url-context.ts, src/smart-context-service.ts (to identify and tag sources)
  - src/generate/types.ts (event types, contextPaths shape)
  - src/config.ts (for defaults)

Constraints
- Backward compatible: if no budgets are set, behavior is unchanged.
- Deterministic: trimming decisions must be repeatable given same inputs.
- Do not drop images/videos as part of context trimming unless you explicitly include them in the context budget model; if you exclude them, document it in code comments.
- Machine-readable output constraints:
  - In --json mode, stdout must remain pure JSON; overflow warnings/errors should go to stderr.

Execution Plan
1. In src/generate/pipeline.ts, locate where context entries are resolved into a list used for prompt building.
2. Ensure each context entry can be attributed to a source category: file | url | smart (at minimum). If current data structures lose this info, extend them minimally within pipeline scope (e.g., attach a `source` field alongside `path` and `content`).
3. Compute token telemetry per context entry (already exists). Use per-file token counts to drive drop-largest decisions.
4. Derive effective settings:
  - maxInputTokens: args.maxInputTokens ?? config.promptGenerator.maxInputTokens
  - maxContextTokens: args.maxContextTokens ?? config.promptGenerator.maxContextTokens
  - strategy: args.contextOverflow ?? config.promptGenerator.contextOverflowStrategy
  - If budgets are set but strategy is undefined, default to 'fail' (or choose a conservative default) while keeping "no budgets" default behavior unchanged.
5. Implement a pure helper function (new file allowed, e.g., src/generate/context-budget.ts) that takes:
  - contextEntries (with source, path, content)
  - telemetry inputs or a token counter function
  - budgets + strategy
  and returns { keptEntries, droppedEntries, beforeTelemetry, afterTelemetry }.
6. Integrate helper into pipeline; emit context.overflow when droppedEntries non-empty.
7. Add unit tests for the helper with synthetic context entries and token counts (mock token counter) to verify each strategy.

Output Format
- Provide a git diff (or explicit file edits) including the new helper module and tests.

Validation
- Commands:
  - npm test
  - npm run build
- Manual CLI checks (no real API call needed if you can stop before generation; otherwise mock):
  - Run generate with a tiny max context tokens and multiple context files:
    - node dist/index.js "test" --context docs/**/*.md --max-context-tokens 10 --context-overflow drop-largest --stream jsonl --quiet
  - Expected outcomes:
    - stdout JSONL includes a context.overflow event listing droppedPaths.
    - context.telemetry after trimming shows totalTokens reduced.
    - The final payload’s contextPaths excludes dropped paths.
  - For --context-overflow fail:
    - same command with fail should exit non-zero with an error indicating the budget was exceeded.