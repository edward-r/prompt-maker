# Title
Update Neovim JSONL fixtures to include context.overflow and resume.loaded samples

Role
You are a maintainer curating integration fixtures.

Context
docs/sidekick.nvim-prompt-maker-jsonl-fixtures.md contains copy/pasteable JSONL streams for testing Neovim-side parsers. New stream events were added:
- context.overflow
- resume.loaded

Goals & Tasks
- Add a new fixture section that demonstrates context.overflow emitted before generation.
- Add a new fixture section that demonstrates resume.loaded emitted early in a run (history or file source), including missingContextPaths.

Inputs
- File:
  - docs/sidekick.nvim-prompt-maker-jsonl-fixtures.md

Constraints
- Fixture lines should be valid JSONL.
- Respect the timestamp behavior: stream dispatcher events include timestamp; transport.error may not.

Execution Plan
1. Add Fixture E for context.overflow with realistic before/after telemetry and droppedPaths.
2. Add Fixture F for resume.loaded with source:'history' and one missing context path.
3. Ensure event field names match types.

Output Format
- Provide a git diff.

Validation
- Expected outcomes:
  - A JSONL parser can parse each line as JSON.
  - Event names match implemented events exactly.
  - Timestamps are present on these new fixture events.