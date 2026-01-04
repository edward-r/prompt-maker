# Title
Document token budget flags and overflow behavior

Role
You are a documentation maintainer updating authoritative docs.

Context
The authoritative CLI behavior is documented in docs/prompt-maker-cli-tui-encyclopedia.md and the Neovim integration guide in docs/neovim-plugin-integration.md. Token telemetry exists; now budgets and overflow strategies exist, plus a new stream event context.overflow.

Goals & Tasks
- Update docs/prompt-maker-cli-tui-encyclopedia.md:
  - Add the new flags to the Generate Mode flags table.
  - Describe overflow strategies and defaults.
  - Add mention of the new stream event context.overflow and its shape.
- Update docs/neovim-plugin-integration.md:
  - Add guidance for integrations to set budgets and react to context.overflow.
  - Add recommendations for guardrails based on telemetry totals.

Inputs
- Files:
  - docs/prompt-maker-cli-tui-encyclopedia.md
  - docs/neovim-plugin-integration.md

Constraints
- Keep documentation consistent with implemented behavior and names.
- Avoid claiming behavior not implemented (e.g., dropping media) unless it’s truly implemented.

Execution Plan
1. Add new flags in the flags table and describe expected types/defaults.
2. Add a short section describing how trimming is applied and what gets dropped first per strategy.
3. Add an example command using --stream jsonl and show a sample context.overflow event snippet.
4. Add Neovim integration hints: treat unknown events as ignorable; handle context.overflow for UI notices.

Output Format
- Provide a git diff (or explicit file edits) to the docs.

Validation
- Commands:
  - npm run build (to ensure no tooling depends on docs, but run anyway)
- Expected outcomes:
  - Docs mention the correct flag names: --max-input-tokens, --max-context-tokens, --context-overflow.
  - Docs describe context.overflow with the correct field names and strategy values.
  - No contradictions with existing docs (e.g., JSON output constraints).