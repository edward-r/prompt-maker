# Prompt Maker CLI + TUI Encyclopedia (Current Codebase)

This document is the **source-of-truth user + maintainer reference** for `@perceptron/prompt-maker-cli`’s Ink TUI and the underlying generate/test CLI workflows.

- Package: `@perceptron/prompt-maker-cli` (ESM)
- Node: `>=18` (`package.json`)
- Binary: `prompt-maker-cli` → `dist/index.js` (`package.json#bin`)

Where possible, each behavior links back to an implementation file under `src/`.

> Note: The previous version of this encyclopedia referenced an older repo layout (`apps/prompt-maker-cli/...`) and embedded line-ranges. This repo’s current layout is **single-package** at the root (`src/`, `dist/`).

## Table of Contents

- [1. CLI Entry Points & Modes](#1-cli-entry-points--modes)
- [2. Generate Mode (CLI)](#2-generate-mode-cli)
- [3. Context Ingestion](#3-context-ingestion)
- [4. Interactive Refinement (TTY and Transport)](#4-interactive-refinement-tty-and-transport)
- [5. Outputs, Streaming, Telemetry, and Persistence](#5-outputs-streaming-telemetry-and-persistence)
- [6. Test Runner (CLI)](#6-test-runner-cli)
- [7. TUI Overview](#7-tui-overview)
- [8. TUI Keybindings](#8-tui-keybindings)
- [9. TUI Commands (`/command` palette)](#9-tui-commands-command-palette)
- [10. TUI Themes](#10-tui-themes)
- [11. TUI Architecture Map (for maintainers)](#11-tui-architecture-map-for-maintainers)
- [12. TODOs / Known Quirks](#12-todos--known-quirks)

---

## 1. CLI Entry Points & Modes

Routing is implemented in `src/index.ts`.

### Commands and routing rules

`prompt-maker-cli` has three top-level modes:

- `ui`: Ink TUI
- `test`: prompt test runner
- `generate`: prompt generation pipeline

Routing rules (`src/index.ts`):

- No args → `ui`
- First arg `ui` → `ui`
- First arg `test` → `test`
- First arg `generate` or `expand` → `generate` (alias)
- Anything else (including flags like `--json`) → `generate`

### Practical examples

```bash
# TUI (default)
prompt-maker-cli

# TUI explicitly
prompt-maker-cli ui

# Generate
prompt-maker-cli "Draft an onboarding prompt" --model gpt-4o-mini

# Generate (explicit subcommand)
prompt-maker-cli generate "Draft an onboarding prompt"

# Tests
prompt-maker-cli test
prompt-maker-cli test prompt-tests.yaml
```

---

## 2. Generate Mode (CLI)

Generate-mode argument parsing lives in `src/generate/args.ts` and the main pipeline is `src/generate/pipeline.ts`.

### Intent sources

Generate consumes intent from one of:

- Positional string: `prompt-maker-cli "..."`
- File: `--intent-file path/to/intent.md`
- `stdin`: pipe into the command

Implementation: `src/generate/intent.ts` (called from `src/generate/pipeline.ts`).

### Flags (authoritative)

The `--help` output for generate is produced by yargs in `src/generate/args.ts` and matches `node dist/index.js --help`.

| Flag                      |          Type | Default | Notes                                                                              |
| ------------------------- | ------------: | ------: | ---------------------------------------------------------------------------------- |
| `-f, --intent-file`       |        string |       - | Read intent from file                                                              |
| `--model`                 |        string |       - | Generation model override                                                          |
| `--target`                |        string |       - | Target/runtime model for optimization guidance (not included in prompt text)       |
| `--polish-model`          |        string |       - | Model used for polish pass                                                         |
| `-i, --interactive`       |       boolean | `false` | Enables interactive refinement if a TTY is available                               |
| `--interactive-transport` |        string |       - | Local socket/pipe to drive refinements remotely                                    |
| `--polish`                |       boolean | `false` | Run polish pass after generation                                                   |
| `--json`                  |       boolean | `false` | Emit JSON payload to stdout (non-interactive only)                                 |
| `--stream`                | `none\|jsonl` |  `none` | Emit JSONL event stream to stdout                                                  |
| `--quiet`                 |       boolean | `false` | Suppress human-oriented output (banners/telemetry)                                 |
| `--progress`              |       boolean |  `true` | Show progress spinner (non-interactive only)                                       |
| `--copy`                  |       boolean | `false` | Copy final prompt to clipboard                                                     |
| `--open-chatgpt`          |       boolean | `false` | Open a ChatGPT URL prefilled with the prompt                                       |
| `--context-template`      |        string |       - | Wrap final prompt using a named template                                           |
| `--show-context`          |       boolean | `false` | Print resolved context files before generation                                     |
| `-c, --context`           |      string[] |    `[]` | File glob patterns (repeatable)                                                    |
| `--url`                   |      string[] |    `[]` | URL context entries (repeatable)                                                   |
| `--image`                 |      string[] |    `[]` | Image file paths (repeatable)                                                      |
| `--video`                 |      string[] |    `[]` | Video file paths (repeatable)                                                      |
| `--context-file`          |        string |       - | Write resolved context to a file                                                   |
| `--context-format`        |  `text\|json` |  `text` | Format used by `--show-context` and `--context-file`                               |
| `--smart-context`         |       boolean | `false` | Auto-attach relevant local files via embeddings                                    |
| `--smart-context-root`    |        string |       - | Base directory for smart-context scan                                              |
| `--max-input-tokens`      |        number |       - | Enforce a maximum input budget (intent + system + text context)                    |
| `--max-context-tokens`    |        number |       - | Enforce a maximum budget for text context entries (file/url/smart)                 |
| `--context-overflow`      |        string |       - | Overflow handling: `fail`, `drop-smart`, `drop-url`, `drop-largest`, `drop-oldest` |

### Flag incompatibilities

Enforced in `src/generate/pipeline.ts`:

- `--json` **cannot** be combined with interactive modes (`--interactive` or `--interactive-transport`).
  - Error text: `--json cannot be combined with --interactive.`

### Common generate examples

```bash
# Minimal
prompt-maker-cli "Draft a confident onboarding-bot prompt" --model gpt-4o-mini

# Intent file + context + JSON output
prompt-maker-cli --intent-file drafts/intent.md \
  --context src/**/*.ts \
  --context "!src/**/__tests__/**" \
  --json > runs/intent.json

# Show exactly what gets embedded (text)
prompt-maker-cli "Explain this module" --context src/tui/**/*.ts --show-context

# Capture resolved context to a file (JSON array of {path, content})
prompt-maker-cli "Summarize" --url https://example.com \
  --context-file resolved-context.json --context-format json
```

---

## 3. Context Ingestion

### 3.1 File context (`--context`)

Implementation: `src/file-context.ts`.

- Globs are expanded with `fast-glob` using `{ dot: true }`.
- If no files match, the CLI prints a warning and continues with no file context.
- Each matched file is read as UTF-8; unreadable files are skipped with a warning.

Embedding format used in prompts (`src/file-context.ts`):

```xml
<file path="relative/or/absolute/path">
...file contents...
</file>
```

### 3.2 URL context (`--url`)

Implementation: `src/url-context.ts`.

- Only `http:` / `https:` URLs are accepted.
- HTML is downloaded with a timeout and a maximum size (`MAX_HTML_BYTES = 1MB`).
- HTML is converted to text via `html-to-text` (scripts/styles skipped).
- Each URL context entry is stored as a virtual file:
  - `path: url:https://example.com/...`

### 3.3 GitHub URL context

GitHub URLs are handled specially inside `src/url-context.ts` and resolved by `src/github-context.ts`.

Supported GitHub URL shapes (parsed in `src/github-context.ts`):

- Repository root: `https://github.com/<owner>/<repo>`
- Tree view: `https://github.com/<owner>/<repo>/tree/<ref>/<path?>`
- Blob view: `https://github.com/<owner>/<repo>/blob/<ref>/<path>`

Safety limits (`src/github-context.ts`):

- Max files: `MAX_GITHUB_FILES = 60`
- Max file size: `MAX_GITHUB_FILE_BYTES = 64KB`
- Skips common large/binary paths (node_modules, dist, lockfiles, archives, etc.)

GitHub files become virtual context entries:

- `path: github:<owner>/<repo>/<path>`

### 3.4 Smart context (`--smart-context`)

Implementation: `src/smart-context-service.ts` and `src/rag/vector-store.ts`.

Workflow:

1. Scan workspace for candidate files (default patterns):
   - `**/*.{ts,tsx,js,jsx,py,md,json}`
   - Ignored: `node_modules`, `dist`, `.git`, etc.
2. Only files smaller than 25KB are indexed (`MAX_EMBEDDING_FILE_SIZE`).
3. Index embeddings (cached on disk).
4. Search top K results (`k = 5`) relative to the user’s intent.
5. Read matching files and add them to context (skipping files already present).

Embeddings cache location (`src/rag/vector-store.ts`):

- `~/.config/prompt-maker-cli/embeddings_cache.json`

### 3.5 Images (`--image`)

Implementation: `src/image-loader.ts`.

- Supported extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`
- Max size: 20MB per image
- Images are embedded as base64 “image parts” (see `@prompt-maker/core` `ImagePart`).

### 3.6 Video (`--video`)

Implementation:

- Upload: `src/media-loader.ts` (Gemini Files API)
- Message parts: `src/prompt-generator/video-parts.ts`
- Model switching: `src/generate/pipeline.ts` + `src/generate/models.ts`

Behavior:

- Video files are uploaded to Gemini Files API and referenced by URI.
- Supported extensions (mime-inferred): `.mp4`, `.mov`, `.m4v`, `.webm`, `.avi`, `.mpeg`, `.mpg`, `.gif`.
- Requires `GEMINI_API_KEY` (or an explicit API key passed to the uploader).
- If videos are provided and the selected generation model is not Gemini, the CLI switches to a Gemini model that supports video input:
  - It prefers `gemini-2.5-pro` when available, otherwise falls back (see `src/generate/models.ts`).

### 3.7 Token budgets and context overflow

Token budgets are applied after all text context is resolved (files, URLs, smart context) and before generation begins.

Flags (or config equivalents) are consumed in `src/generate/pipeline.ts` and evaluated by `src/generate/context-budget.ts`:

- `--max-input-tokens`: caps total input tokens (`intentTokens + systemTokens + fileTokens`).
- `--max-context-tokens`: caps tokens reserved for text context entries (`fileTokens`).
- `--context-overflow`: chooses how to respond when `fileTokens` exceeds the allowed budget.

Notes:

- Budgets apply only to **text context entries** (`--context`, `--url`, `--smart-context`).
  - Images/videos are not included in the token budget model and are never trimmed by these strategies.
- If both `--max-input-tokens` and `--max-context-tokens` are set, the effective allowance for text context is:
  - `allowedFileTokens = min(maxContextTokens, maxInputTokens - intentTokens - systemTokens)`
- If budgets are set but `--context-overflow` is omitted, the default strategy is `fail`.
- If no budgets are set, overflow strategy is ignored and no trimming occurs.

Overflow strategies (`ContextOverflowStrategy` in `src/generate/types.ts`):

- `fail`: throw an error and abort generation.
- `drop-smart`: drop smart-context entries first, then drop remaining entries oldest-first.
- `drop-url`: drop URL entries first, then drop remaining entries oldest-first.
- `drop-largest`: drop the largest token entries first (ties break by age).
- `drop-oldest`: drop entries in original attachment order (oldest-first).

When trimming drops any text context entries:

- `contextPaths` in the final JSON payload is pruned to match the kept entries.
- A `context.overflow` stream event is emitted (see Streaming below).

---

## 4. Interactive Refinement (TTY and Transport)

Interactive logic is in `src/generate/interactive.ts`.

### 4.1 TTY interactive (`--interactive`)

- If `--interactive` is enabled and stdin/stdout are TTYs, the CLI uses `enquirer` prompts to ask whether to refine, and for the refinement instruction.
- If `--interactive` is enabled but no TTY is detected, the CLI prints a warning and proceeds as a normal non-interactive run.

### 4.2 Interactive transport (`--interactive-transport <path>`)

Implementation: `src/generate/interactive-transport.ts`.

- Creates a local `net.Server` on either:
  - Unix socket path (e.g. `/tmp/pmc.sock`), or
  - Windows named pipe path (must start with `\\.\pipe\...`).

The client sends **newline-delimited JSON** commands:

- Refine:
  - `{"type":"refine","instruction":"Make it shorter"}`
- Finish:
  - `{"type":"finish"}`

The transport stream also receives JSONL events emitted by the pipeline (even if `--stream` is `none`), because the transport is always attached as an event “tap”.

Constraint:

- `--json` cannot be used with `--interactive-transport` (enforced in `src/generate/pipeline.ts`).

---

## 5. Outputs, Streaming, Telemetry, and Persistence

### 5.1 JSON output (`--json`)

When `--json` is enabled, the CLI prints a JSON payload to **stdout**:

- Shape: `GenerateJsonPayload` (`src/generate/types.ts`)
- Includes: `intent`, `model`, `targetModel`, `prompt`, optional `polishedPrompt`, `iterations`, `refinements`, `contextPaths`, timestamps, etc.

`--show-context` behavior when combined with `--json`:

- Context is printed to **stderr** (so stdout can remain machine-readable). Implementation: `src/generate/pipeline.ts`.

### 5.2 Streaming (`--stream jsonl`)

Implementation: `src/generate/stream.ts` and event types in `src/generate/types.ts`.

When enabled:

- The CLI writes newline-delimited JSON events to **stdout**.

Example (streaming + budgets):

```bash
prompt-maker-cli "Summarize these files" \
  --context src/**/*.ts \
  --stream jsonl \
  --progress=false \
  --max-context-tokens 8000 \
  --context-overflow drop-smart
```

- Event names include (non-exhaustive):
  - `progress.update`
  - `context.telemetry`
  - `context.overflow`
  - `upload.state`
  - `generation.iteration.start`
  - `generation.iteration.complete`
  - `interactive.state`
  - `interactive.awaiting`
  - `transport.*`
  - `generation.final`

#### `context.overflow` event

Emitted when token budgets are enabled and the CLI drops one or more text context entries to satisfy the budget.

Shape (`src/generate/types.ts`):

- `event`: `"context.overflow"`
- `timestamp`: ISO-8601 string
- `strategy`: `fail | drop-smart | drop-url | drop-largest | drop-oldest`
- `before`: token telemetry before trimming
- `after`: token telemetry after trimming
- `droppedPaths`: array of `{ path, source }` entries removed from context

Example JSONL line (formatted for readability):

```json
{
  "event": "context.overflow",
  "timestamp": "2026-01-04T16:33:17.000Z",
  "strategy": "drop-smart",
  "before": {
    "files": [
      { "path": "src/a.ts", "tokens": 1200 },
      { "path": "src/b.ts", "tokens": 900 }
    ],
    "intentTokens": 200,
    "fileTokens": 2100,
    "systemTokens": 700,
    "totalTokens": 3000
  },
  "after": {
    "files": [{ "path": "src/a.ts", "tokens": 1200 }],
    "intentTokens": 200,
    "fileTokens": 1200,
    "systemTokens": 700,
    "totalTokens": 2100
  },
  "droppedPaths": [{ "path": "src/b.ts", "source": "smart" }]
}
```

### 5.3 Token telemetry

Implementation: `src/generate/token-telemetry.ts`.

- Token telemetry is computed for:
  - the intent
  - each context file
  - the system prompt (+ optional meta instructions)
- A summary is printed in non-JSON, non-quiet mode.
- Telemetry is always emitted as a `context.telemetry` stream event and returned as `GeneratePipelineResult.telemetry`.

### 5.4 History logging (generate runs)

Implementation: `src/history-logger.ts`.

Every generate run appends JSONL to:

- `~/.config/prompt-maker-cli/history.jsonl`

### 5.5 Config resolution

Implementation: `src/config.ts`.

Config resolution order:

1. `PROMPT_MAKER_CLI_CONFIG=/path/to/config.json`
2. `~/.config/prompt-maker-cli/config.json`
3. `~/.prompt-maker-cli.json`

Config keys validated today (`src/config.ts`):

- Provider credentials:
  - `openaiApiKey`, `openaiBaseUrl`
  - `geminiApiKey`, `geminiBaseUrl`
- Prompt generator:
  - `promptGenerator.defaultModel`
  - `promptGenerator.defaultGeminiModel`
  - `promptGenerator.models[]` (custom model registry)
- Templates:
  - `contextTemplates.<name>`
- TUI theming (persisted):
  - `theme`
  - `themeMode` (`light` / `dark` / `system`; `auto` is accepted as an alias for `system`)

### 5.6 TUI-local persistence

TUI command history is stored separately from generate history:

- `~/.config/prompt-maker-cli/tui-history.json`

Implementation: `src/tui/command-history.ts`.

---

## 6. Test Runner (CLI)

Implementation: `src/test-command.ts`.

Usage:

```bash
prompt-maker-cli test
prompt-maker-cli test prompt-tests.yaml
```

- Default file: `prompt-tests.yaml` (repo root)
- Test suite format is validated by zod schema in `src/testing/test-schema.ts`.

---

## 7. TUI Overview

The Ink TUI is implemented under `src/tui/` and launched via `src/tui/index.tsx`.

### Launch

```bash
prompt-maker-cli
# or
prompt-maker-cli ui

# With interactive transport
prompt-maker-cli ui --interactive-transport /tmp/pmc.sock
```

TUI argument parsing is intentionally minimal (`src/tui/index.tsx`):

- Only `--interactive-transport` is parsed.
- `ui --help` is **not** implemented; passing `--help` will still attempt to run Ink.

TTY requirement:

- Ink requires raw-mode input; running the TUI without a real TTY will throw an Ink “Raw mode is not supported” error.

### Views

`AppContainer` (`src/tui/AppContainer.tsx`) has two views:

- Generate view (default)
- Test Runner view

---

## 8. TUI Keybindings

Authoritative sources:

- Global key router: `src/tui/app-container-keymap.ts`
- Help overlay text: `src/tui/help-config.ts`

### Global

- `Ctrl+G`: open command palette (and switch to Generate view if needed)
- `Ctrl+T`: switch to Test Runner view
- `?`: toggle help overlay
- `Ctrl+C`: exit
- `Esc`: dismiss UI elements (never exits)

### Generate view

The Generate view is a “chat-like” screen:

- Type freeform text and press Enter to generate.
- Type `/` to enter command mode (command palette filtering).
- `↑/↓`: scroll history (when no popup/help is active)

Tab behavior (verified in `src/tui/screens/command/hooks/useContextPopupGlue.ts`):

- If the current input looks like a dropped absolute file path, `Tab` adds that file to context.
- Otherwise, `Tab` opens the `/series` flow.

### Test Runner view

Verified in `src/tui/screens/test-runner/TestRunnerScreen.tsx`:

- `Tab` / `Shift+Tab`: change focus
- `Enter` (file input): moves focus to actions
- `Enter` (actions): runs tests

---

## 9. TUI Commands (`/command` palette)

Commands are listed in the palette via `src/tui/config.ts`.

Execution is split:

- Popup-backed commands are handled by `src/tui/hooks/usePopupManager.ts`.
- Session commands like `/new` and `/reuse` are handled in the command screen layer (see `src/tui/screens/command/hooks/useSessionCommands.ts`).

### Command list and behavior

| Command                   | Args                     | Behavior                                                                                |
| ------------------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `/model`                  | -                        | Open model picker popup (generation model)                                              |
| `/target`                 | -                        | Open target model picker popup                                                          |
| `/polish`                 | `off\|clear\|--clear`    | Clear polish model; otherwise open polish model picker                                  |
| `/intent`                 | `[path]`                 | Set intent file path; without args opens picker popup                                   |
| `/meta` / `/instructions` | `[text]`                 | Set meta instructions; without args opens editor popup                                  |
| `/new`                    | -                        | Reset session state (see `src/tui/screens/command/hooks/useSessionCommands.ts`)         |
| `/reuse`                  | -                        | Reset and reuse last prompt (see `src/tui/screens/command/hooks/useSessionCommands.ts`) |
| `/file`                   | -                        | Open file-context popup                                                                 |
| `/url`                    | `[url ...]`              | Add URLs directly (HTTP(S) only) or open popup                                          |
| `/smart`                  | `on\|off`                | Toggle smart context                                                                    |
| `/smart-root`             | `<path>\|--clear\|clear` | Set/clear smart context root (may auto-enable smart context)                            |
| `/image`                  | `[path]`                 | Attach an image path directly or open popup                                             |
| `/video`                  | `[path]`                 | Attach a video path directly or open popup                                              |
| `/copy`                   | `[on\|off]`              | Toggle auto-copy or open toggle popup                                                   |
| `/chatgpt`                | `[on\|off]`              | Toggle auto-open-chatgpt or open toggle popup                                           |
| `/json`                   | `[on\|off]`              | Toggle showing JSON payload in TUI history (blocked when transport active)              |
| `/tokens`                 | -                        | Open token breakdown popup                                                              |
| `/settings`               | -                        | Open settings popup                                                                     |
| `/theme`                  | -                        | Open theme picker popup                                                                 |
| `/theme-mode`             | -                        | Open theme mode picker popup                                                            |
| `/reasoning` / `/why`     | -                        | Open last reasoning popup                                                               |
| `/history`                | -                        | Open command history popup                                                              |
| `/series`                 | `[draft text]`           | Start atomic prompt series flow (prefills from typed/last intent or intent file)        |
| `/test`                   | `[file]`                 | Run tests (with arg) or open test popup                                                 |
| `/exit`                   | -                        | Exit the app                                                                            |

Notes:

- `/theme-mode` currently **opens a popup**; it does not parse inline args (despite some older docs claiming `/theme-mode dark|light|system`). Implementation: `src/tui/hooks/usePopupManager.ts`.
- `/json` in the TUI controls whether the final JSON payload is shown in the history pane; it does not change the underlying generate-mode `--json` behavior.

---

## 10. TUI Themes

Theme implementation lives under `src/tui/theme/`.

### Theme discovery

Implementation: `src/tui/theme/theme-loader.ts`.

Themes are loaded from:

- Built-ins: `src/tui/theme/builtins/*`
- Global custom themes:
  - `~/.config/prompt-maker-cli/themes/*.json`
- Project themes (walk up from `process.cwd()`):
  - `<cwd-or-parent>/.prompt-maker-cli/themes/*.json`

Precedence (highest wins on name collision):

1. Project theme closest to the current working directory
2. Project themes in ancestor directories
3. Global themes
4. Built-in themes

If a custom theme overrides a built-in by name, the built-in label is kept.

### Theme JSON schema (enforced)

Validation is performed in `src/tui/theme/theme-loader.ts`.

- Required top-level keys:
  - `theme` (object)
  - `defs` (optional object)
- Required theme slots are enumerated in `src/tui/theme/theme-types.ts` (`REQUIRED_THEME_SLOTS`).
- Supported color value types:
  - string (hex, keyword, or reference)
  - number (ANSI 0–255)
  - variant object: `{ "dark": <value>, "light": <value> }`

Opencode compatibility:

- Some Opencode theme shapes are adapted on load (see `adaptOpencodeThemeJson` in `src/tui/theme/theme-loader.ts`).

### Persistence

Theme selection is persisted to CLI config (`src/config.ts`) via `updateCliThemeSettings`:

- `theme`: selected theme name
- `themeMode`: `dark` / `light` / `system`

The theme provider loads and saves this selection via `src/tui/theme/theme-settings-service.ts`.

---

## 11. TUI Architecture Map (for maintainers)

High-level module boundaries:

- Entrypoint + routing: `src/index.ts`
- Generate pipeline: `src/generate/pipeline.ts`
- Test runner: `src/test-command.ts`
- TUI entry: `src/tui/index.tsx`
- TUI app shell: `src/tui/AppContainer.tsx`
- Generate view (Command screen): `src/tui/screens/command/*`
- Test Runner view: `src/tui/screens/test-runner/*`

Key design invariants (reinforced by `AGENTS.md`):

- Input routing priority: Help overlay > Popups > Screen input > AppContainer global keys
- Reducers are kept pure and unit-testable (many tests live under `src/__tests__/tui/`)

---

## 12. TODOs / Known Quirks

These are verified behaviors that may surprise users:

- `prompt-maker-cli test --help` prints help but **still runs** the test suite afterwards.
  - Reason: `src/test-command.ts` parses args but does not special-case `--help`.
- `prompt-maker-cli ui --help` is not implemented; it will try to start Ink.
  - `src/tui/index.tsx` only parses `--interactive-transport`.
- `prompt-maker-cli --version` prints a version but does not exit the process.
  - If you run it without an intent, generate mode will then error with “Intent text is required…”.
