# Title
Implement export subcommand: write GenerateJsonPayload from history to JSON/YAML

Role
You are a TypeScript CLI engineer adding a new top-level command.

Context
CLI routing is in src/index.ts with modes ui/test/generate. History is logged as JSONL at ~/.config/prompt-maker-cli/history.jsonl (src/history-logger.ts). Recommendation proposes a new command:
- prompt-maker-cli export [--from-history <selector>] --format json|yaml --out <path>
This command should export a single GenerateJsonPayload in a portable file.

Goals & Tasks
- Add a new top-level mode `export` in src/index.ts routing.
- Implement src/export-command.ts (new) that:
  - reads history.jsonl
  - selects an entry based on --from-history
  - writes selected entry to --out as JSON or YAML
- Define selection behavior for --from-history:
  - Support at minimum: 'last' (default) and a numeric index from end (e.g., 'last', 'last:5'), or a simple integer N meaning "N-th from end".
  - Keep it simple and deterministic.
- Ensure stdout remains clean/machine-readable: export writes nothing to stdout on success; use stderr for human logs unless --quiet behavior is specified.

Inputs
- Files:
  - src/index.ts
  - src/history-logger.ts (for history location knowledge)
  - src/generate/types.ts (GenerateJsonPayload type)

Constraints
- Node ESM.
- Add a YAML dependency only if not already present; keep dependencies minimal.
- Fail with descriptive errors if history file missing/empty or selector invalid.

Execution Plan
1. Add routing in src/index.ts so `export` dispatches to a new handler.
2. Implement argument parsing for export (yargs or a simple parser consistent with other commands).
3. Implement history reader:
  - read file
  - split by newline
  - parse JSON per line with try/catch
  - keep only valid entries
4. Implement selector:
  - default 'last'
  - parse integer forms
5. Serialize:
  - JSON: pretty-print with 2 spaces
  - YAML: use a YAML library to dump, ensuring stable output
6. Write to --out, creating parent directories if necessary (or require they exist; choose one and document).
7. Add tests using a temporary directory and a fixture history.jsonl with multiple entries.

Output Format
- Provide a git diff (or explicit file edits) including new command file and tests.

Validation
- Commands:
  - npm test
  - npm run build
- Manual check:
  - Create a temp history file by setting HOME to a temp dir and writing ~/.config/prompt-maker-cli/history.jsonl with two JSON lines.
  - Run:
    - node dist/index.js export --from-history last --format json --out /tmp/pmc-export.json
    - node dist/index.js export --from-history 2 --format yaml --out /tmp/pmc-export.yaml
- Expected outcomes:
  - Output files exist and contain the selected payload.
  - JSON output parses with jq.
  - YAML output loads with a YAML parser.
  - Invalid selectors exit non-zero with a clear message.