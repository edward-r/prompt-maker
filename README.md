# Prompt Maker CLI (`@perceptron/prompt-maker-cli`)

Terminal-first prompt generator with a built-in Ink TUI. It turns rough intent + optional context (files, URLs, smart context, images, videos) into a structured prompt contract, with optional polishing, streaming telemetry, and automatic history logging.

Highlights:

- **Generate workflow**: run from flags or from the TUI.
- **Context ingestion**: file globs (`--context`), URLs (`--url`, including GitHub trees), optional smart context (`--smart-context`), and media (`--image`, `--video`).
- **Auditable runs**: token telemetry, structured stream events (`--stream jsonl`), and JSONL history (`~/.config/prompt-maker-cli/history.jsonl`).
- **TUI-first**: `prompt-maker-cli` with no args launches the TUI.

The project is **TUI-first**:

- `prompt-maker-cli` with **no args** launches the TUI.
- Use the same pipelines via flags (`generate`) or tests (`test`) when you need automation.

## Quickstart

From repo root:

```bash
npm ci
npm run build

# TUI (default if no args)
npm start

# Generate from a one-shot intent
npm start -- "Draft a confident onboarding-bot spec" --model gpt-4o-mini

# Explicit commands
npm start -- ui
npm start -- test prompt-tests.yaml
```

Global install from a local checkout:

```bash
npm install -g .

# Now you can run:
prompt-maker-cli
```

## CLI modes and routing

`prompt-maker-cli` has three top-level modes:

- `ui`: Ink TUI
- `generate` (default for non-`ui`/`test` args): prompt generation pipeline
- `test`: prompt test runner

Routing rules:

- No args → `ui`
- First arg `ui` → `ui`
- First arg `test` → `test`
- First arg `generate` or `expand` → `generate` (`expand` is an alias)
- Anything else (including flags like `--json`) → `generate`

## TUI mode (recommended)

The Ink TUI is the fastest way to iterate on prompts interactively:

- One “generate” view with a scrollable history + a single input bar.
- Command palette + popups for models, context, settings, and themes.
- Built-in Test Runner view.
- Session-oriented UX (reuse last prompt, view token breakdown, show last reasoning, etc.).

### Launch

```bash
# Default: the TUI (no args)
prompt-maker-cli

# Explicit entry
prompt-maker-cli ui

# Start TUI with an interactive transport socket/pipe
prompt-maker-cli ui --interactive-transport /tmp/pmc.sock
```

Important caveats:

- **TTY required**: Ink needs raw-mode input. Running the TUI without a real TTY will throw an Ink “Raw mode is not supported” error.
- **Minimal arg parsing**: `ui` only parses `--interactive-transport`. `prompt-maker-cli ui --help` is not implemented.
- **FZF matching**: the TUI uses the npm `fzf` library for fuzzy matching (bundled via `npm install`; no separate `fzf` binary is required).

### Keybindings

Global keybinds:

- `Ctrl+G`: open command palette (Generate view)
- `Ctrl+T`: switch to Test Runner view
- `?`: toggle help overlay
- `Ctrl+C` or `/exit`: exit
- `Esc`: dismiss popups/menus (never exits)

Generate view:

- Type normal text + `Enter`: generate
- Type `/`: enter command mode (filters the palette)
- `↑/↓`: scroll history (when no help/popup is active)
- `Tab`:
  - If the input looks like a dropped absolute file path, it adds that file as context.
  - Otherwise, it opens the `/series` flow.

Test Runner view:

- `Tab` / `Shift+Tab`: change focus
- `Enter`:
  - in file input: moves focus to actions
  - in actions: runs tests

#### Input routing invariant

Key handling priority (highest wins):

1. Help overlay
2. Popup input
3. Active screen input
4. AppContainer global keys

This prevents “fallthrough” where one key triggers multiple layers.

### Command palette (`/commands`)

Open the palette with `Ctrl+G` or type `/` in the Generate input.

Common commands:

| Command       | Args           | What it does                                                          |
| ------------- | -------------- | --------------------------------------------------------------------- |
| `/model`      | -              | Pick the generation model                                             |
| `/target`     | -              | Pick the target/runtime model (recorded; not included in prompt text) |
| `/file`       | -              | Add local file context (popup)                                        |
| `/url`        | `[url ...]`    | Add URL context directly or via popup                                 |
| `/smart`      | `on\|off`      | Toggle smart context                                                  |
| `/series`     | `[draft text]` | Generate a set of standalone “atomic prompts”                         |
| `/theme`      | -              | Theme picker (preview with arrows, `Enter` confirm, `Esc` cancel)     |
| `/theme-mode` | -              | Theme mode picker (`dark` / `light` / `system`)                       |
| `/test`       | `[file]`       | Run prompt tests or open the test popup                               |

Notes:

- `/theme-mode` opens a popup (it does not parse inline args).
- `/json` inside the TUI only affects whether a JSON payload is shown in the history pane; it does not enable generate-mode `--json`.
- Useful extras: `/tokens` (token breakdown), `/history` (command history), `/reasoning` or `/why` (last model reasoning, when available).

### Series generation (“atomic prompts”)

`/series` (or `Tab`) generates:

- `00-overview.md`
- One file per atomic prompt step (e.g. `01-...md`, `02-...md`, ...)

Artifacts are written under:

- `generated/series/<timestamp>-<intent-slug>/`

If the output directory cannot be created (permissions, read-only filesystem, etc.), the series still generates but won’t be saved.

### TUI theming

Inside the TUI:

- `/theme` opens the theme picker.
- `/theme-mode` switches appearance mode (`dark`, `light`, or `system`).

Theme settings persist to CLI config (`theme` + `themeMode`).

Theme JSON format:

- Top-level `theme` object (required)
- Top-level `defs` object (optional)
- Canonical schema: `src/tui/theme/theme-types.ts`

#### Custom themes

Theme files are plain JSON. The theme name is the filename without `.json`.

- **Global** (per-user): `~/.config/prompt-maker-cli/themes/*.json`
- **Project-local**: `.prompt-maker-cli/themes/*.json`
  - Parent directories are also scanned (walking up from the current working directory).

Quick start:

```bash
# Global install
mkdir -p ~/.config/prompt-maker-cli/themes
cp src/tui/theme/examples/ocean-example.json ~/.config/prompt-maker-cli/themes/ocean.json

# Or project-local
mkdir -p .prompt-maker-cli/themes
cp src/tui/theme/examples/ocean-example.json .prompt-maker-cli/themes/ocean.json
```

Restart the TUI, then run `/theme` and select `ocean`.

#### Theme precedence

If multiple themes share the same name:

1. Project-local themes in the nearest directory to your CWD (highest precedence)
2. Project-local themes in ancestor directories
3. Global themes (`~/.config/prompt-maker-cli/themes`)
4. Built-in themes (lowest precedence)

#### Theme mode (`system`)

`system` is intentionally pragmatic:

- If `TERM_BACKGROUND` is set to `light`/`dark`, it is used.
- Else, we try to infer from `COLORFGBG`.
- If no reliable signal is present, we deterministically fall back to `dark`.
- Config also accepts `themeMode: "auto"` as an alias for `"system"`.

## Generate mode (CLI)

Generate consumes intent from one of:

- Positional string: `prompt-maker-cli "..."`
- File: `--intent-file path/to/intent.md`
- `stdin`: pipe into the command

### Common workflows

```bash
# Inline intent + context files + copy to clipboard
prompt-maker-cli "Draft a confident onboarding-bot spec" \
  --model gpt-4o-mini \
  --context docs/spec/**/*.md \
  --image assets/wireframe.png \
  --copy

# URL context (web pages or GitHub)
prompt-maker-cli "Summarize the docs" \
  --url https://example.com/docs \
  --url https://github.com/example/repo/tree/main/docs

# Smart context (local embeddings) + scoped scan root
prompt-maker-cli "Explain this module" \
  --smart-context \
  --smart-context-root src

# JSON payload capture (non-interactive only)
prompt-maker-cli --intent-file drafts/travel.md --json > runs/travel.json

# Stream progress/events as JSONL (use --quiet to avoid mixing text output)
prompt-maker-cli "Summarize" --stream jsonl --quiet > runs/events.jsonl
```

### Key flags

| Flag / Input                                | Purpose                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `<intent>` / `--intent-file <path>` / stdin | Provide the rough intent text. Pipe stdin when automating.                            |
| `-c, --context <glob>` (repeatable)         | Attach local file(s) to the request; globs use `fast-glob` (`dot: true`).             |
| `--url <https://...>` (repeatable)          | Download remote pages or GitHub content and attach as virtual context.                |
| `--smart-context`                           | Attach additional relevant local files via embeddings search.                         |
| `--smart-context-root <path>`               | Limit smart-context scanning to a specific directory (default: CWD).                  |
| `--image <path>` (repeatable)               | Attach reference images (PNG/JPG/JPEG/WEBP/GIF, ≤20MB).                               |
| `--video <path>` (repeatable)               | Attach reference videos (Gemini only; non-Gemini models are auto-switched).           |
| `--model <name>`                            | Override the generation model used by the CLI.                                        |
| `--target <name>`                           | Target/runtime model recorded in JSON/history (not included in prompt text).          |
| `-i, --interactive`                         | Enable a TTY refinement loop (requires a TTY).                                        |
| `--interactive-transport <path>`            | Listen on a Unix socket / Windows named pipe for `refine`/`finish` commands.          |
| `--polish`, `--polish-model <name>`         | Run the finishing pass and optionally choose a different model.                       |
| `--json`                                    | Emit machine-readable JSON (non-interactive only).                                    |
| `--stream none\|jsonl`                      | Emit newline-delimited JSON events to stdout.                                         |
| `--quiet`                                   | Suppress human-oriented output (banners/telemetry/boxed prompts).                     |
| `--progress/--no-progress`                  | Enable/disable progress spinners (spinners are disabled during interactive sessions). |
| `--show-context`                            | Print resolved context payload before generation.                                     |
| `--context-file <path>`                     | Write resolved context to disk (same format as `--show-context`).                     |
| `--context-format text\|json`               | Choose how `--show-context`/`--context-file` render the context payload.              |
| `--context-template <name>`                 | Wrap the final prompt using a named template (built-in: `nvim`).                      |
| `--copy`, `--open-chatgpt`                  | Copy/open the final artifact for quick sharing.                                       |

Notes:

- `--json` cannot be combined with interactive refinement (`--interactive` or `--interactive-transport`).
- `--show-context` prints to **stderr** when `--json` is enabled (so stdout stays machine-readable).
- `--stream jsonl` is designed for machine consumption; for clean JSONL output on stdout use `--quiet` and avoid other human-output flags.
- `DEBUG=1` or `VERBOSE=1` prints the model’s `reasoning` (if provided) to stderr.

### Interactive refinement

Two interactive mechanisms exist:

- `--interactive` (TTY): uses terminal prompts to ask whether to refine and to collect the next refinement instruction.
  - If `--interactive` is set but no TTY is detected, the CLI warns and proceeds non-interactively.
- `--interactive-transport <path>`: accepts newline-delimited JSON commands over a local socket/pipe.
  - Unix: pass a socket path like `/tmp/pmc.sock`.
  - Windows: pass a named pipe path like `\\.\pipe\pmc`.

Commands are newline-delimited JSON:

```json
{"type":"refine","instruction":"Make it shorter"}
{"type":"finish"}
```

The transport also receives the same JSONL stream events as an always-on event “tap” (even if `--stream` is `none`).

### Context sources and limits (high-level)

- `--context` globs use `fast-glob` with `{ dot: true }`.
- `--url` accepts `http:`/`https:` and stores each entry as a virtual file (`path: url:<url>`).
  - HTML is limited to 1MB and converted to text.
- GitHub URLs (`--url https://github.com/...`) can expand repo trees/blobs.
  - Safety limits: max 60 files, max 64KB each.
- `--smart-context` indexes files (≤25KB) and caches embeddings at `~/.config/prompt-maker-cli/embeddings_cache.json`.

## Prompt tests

```bash
prompt-maker-cli test
# or
prompt-maker-cli test prompt-tests.yaml
```

- Default file: `prompt-tests.yaml` (repo root)
- TUI Test Runner view: `Ctrl+T`
- Quirk: `prompt-maker-cli test --help` prints help but still runs the suite

## Provider configuration

Credentials and defaults can come from env vars or a config file.

Config path resolution:

- `PROMPT_MAKER_CLI_CONFIG=/path/to/config.json` (highest precedence)
- `~/.config/prompt-maker-cli/config.json`
- `~/.prompt-maker-cli.json`

Example config:

```json
{
  "openaiApiKey": "sk-...",
  "geminiApiKey": "gk-...",
  "promptGenerator": {
    "defaultModel": "gpt-4o-mini",
    "defaultGeminiModel": "gemini-2.5-pro"
  },
  "contextTemplates": {
    "scratch": "# Scratch\n\n{{prompt}}"
  },
  "theme": "ocean",
  "themeMode": "system"
}
```

Env vars override config keys:

- `OPENAI_API_KEY` (and optional `OPENAI_BASE_URL`)
- `GEMINI_API_KEY` (and optional `GEMINI_BASE_URL`)
- Optional: `GITHUB_TOKEN` (for GitHub URL context rate limits)

## Outputs and persistence

- Generate-run history (JSONL): `~/.config/prompt-maker-cli/history.jsonl`
- TUI command history: `~/.config/prompt-maker-cli/tui-history.json`
- Token telemetry:
  - Printed as a summary in non-`--quiet` runs
  - Always emitted as a `context.telemetry` JSONL stream event

## Development

```bash
npm ci
npm run build
npm start

# watch + restart
npm run dev -- ui
npm run dev -- "Draft a confident onboarding-bot spec" --model gemini-1.5-flash

npm run typecheck
npm test
npm run format
```

Maintainer references:

- `docs/prompt-maker-cli-tui-encyclopedia.md` (authoritative behavior reference)
- `docs/tui-design.md` (UX goals + input routing invariant)
- `src/tui/DEVELOPER_NOTE.md` (architecture notes; some paths are historical)

## License

MIT
