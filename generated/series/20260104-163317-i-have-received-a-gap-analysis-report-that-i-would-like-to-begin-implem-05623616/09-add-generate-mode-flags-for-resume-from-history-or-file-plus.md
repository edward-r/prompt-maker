# Title
Add generate-mode flags for resume from history or file, plus strict/best-effort mode

Role
You are a TypeScript CLI engineer extending generate-mode argument surface.

Context
Generate-mode args are in src/generate/args.ts. Recommendation proposes:
- --resume <history-id> or --resume-last
- --resume-from <path>
- --resume-mode strict|best-effort
History is JSONL at ~/.config/prompt-maker-cli/history.jsonl.

Goals & Tasks
- Add generate-mode flags:
  - --resume-last (boolean)
  - --resume <selector> (string)
  - --resume-from <path> (string)
  - --resume-mode strict|best-effort (default: best-effort)
- Enforce mutual exclusivity:
  - --resume-from cannot be combined with --resume or --resume-last
  - --resume and --resume-last cannot be combined
- Ensure flags appear in help.

Inputs
- Files:
  - src/generate/args.ts
  - Any args typing file used by pipeline

Constraints
- Backward compatible defaults.
- Keep selection format aligned with export selector if possible.
- Do not implement resume behavior in this prompt; only add flags + validation.

Execution Plan
1. Add options in yargs.
2. Add .conflicts rules for mutual exclusivity.
3. Add choices for resume-mode.
4. Update types.
5. Add unit tests for arg conflicts if test harness exists.

Output Format
- Provide a git diff (or explicit file edits).

Validation
- Commands:
  - npm run build
  - node dist/index.js generate --help
- Expected outcomes:
  - Help output shows resume flags.
  - Running with conflicting flags exits non-zero with a yargs error.
  - resume-mode rejects unknown values.