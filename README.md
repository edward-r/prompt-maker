# Prompt Maker CLI

Terminal-first prompt generator with a built-in Ink TUI. It turns rough intent + optional context (files, URLs, smart context, images, videos) into a structured prompt contract, with optional polishing, streaming telemetry, and automatic history logging.

- **Generate workflow**: run from flags or from the TUI.
- **Context ingestion**: file globs (`--context`), URLs (`--url`, including GitHub trees), optional smart context (`--smart-context`), and media (`--image`, `--video`).
- **Auditable runs**: token telemetry, structured stream events (`--stream jsonl`), and JSONL history (`~/.config/prompt-maker-cli/history.jsonl`).
- **TUI-first**: `prompt-maker-cli` with no args launches the TUI; `prompt-maker-cli ui` is the explicit entry.

## Install / Build

Prereqs: Node.js `>=18`.

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

Development (watch + restart):

```bash
npm run dev -- ui
# or
npm run dev -- "Draft a confident onboarding-bot spec" --model gemini-1.5-flash
```

Global install from a local checkout:

```bash
npm install -g .
# or, for iterative dev
eval "$(npm bin -g)"   # (optional sanity check)
npm link
```

## Usage (Generate)

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

# Intent from file + JSON payload capture
prompt-maker-cli --intent-file drafts/travel.md --json > runs/travel.json

# Smart context (local embeddings) + scoped scan root
prompt-maker-cli "Explain this module" \
  --smart-context \
  --smart-context-root src

# Video input forces Gemini (default model can be configured)
prompt-maker-cli "Review this demo recording" \
  --video media/demo.mp4
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
| `--stream none\|jsonl`                      | Emit newline-delimited JSON events describing pipeline progress.                      |
| `--quiet`                                   | Suppress banners/telemetry UI (useful for editor integrations).                       |
| `--progress/--no-progress`                  | Enable/disable progress spinners (spinners are disabled during interactive sessions). |
| `--show-context`                            | Print resolved context payload before generation.                                     |
| `--context-file <path>`                     | Write resolved context to disk (same format as `--show-context`).                     |
| `--context-format text\|json`               | Choose how `--show-context`/`--context-file` render the context payload.              |
| `--context-template <name>`                 | Wrap the final prompt using a named template (built-in: `nvim`).                      |
| `--copy`, `--open-chatgpt`                  | Copy/open the final artifact for quick sharing.                                       |

Notes:

- `--json` cannot be combined with interactive refinement (`--interactive` or `--interactive-transport`).
- `DEBUG=1` or `VERBOSE=1` prints the model’s `reasoning` (if provided) to stderr.

## TUI mode

Launch the guided terminal UI instead of the flag-only workflow:

```bash
# Default: the TUI (no args)
prompt-maker-cli

# Explicit entry
prompt-maker-cli ui

# Start TUI with an interactive transport socket/pipe
prompt-maker-cli ui --interactive-transport /tmp/pmc.sock
```

Global keys (see `?` in-app for the definitive list):

- `Ctrl+G`: open command palette in Generate view
- `Ctrl+T`: switch to Test Runner view
- `?`: toggle help overlay
- `Ctrl+C` or `/exit`: exit
- `Esc`: dismiss popups/menus (never exits)

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
    "defaultGeminiModel": "gemini-3-pro-preview"
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

## TUI theming

Inside the TUI:

- `/theme` opens the theme picker (↑/↓ previews, Enter confirms, Esc cancels).
- `/theme-mode` switches the appearance mode (`dark`, `light`, or `system`).

### Custom themes

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

### Precedence

If multiple themes share the same name:

1. Project-local themes in the nearest directory to your CWD (highest precedence)
2. Project-local themes in ancestor directories
3. Global themes (`~/.config/prompt-maker-cli/themes`)
4. Built-in themes (lowest precedence)

### Theme mode (`system`)

`system` is intentionally pragmatic:

- If `TERM_BACKGROUND` is set to `light`/`dark`, it is used.
- Else, we try to infer from `COLORFGBG`.
- If no reliable signal is present, we deterministically fall back to `dark`.
- Config also accepts `themeMode: "auto"` as an alias for `"system"`.

### Theme JSON format

A theme file has two top-level keys:

- `defs` (optional): named colors
- `theme`: the actual theme slots

The canonical schema lives in `src/tui/theme/theme-types.ts`.

## Prompt tests

Run prompt tests from the CLI:

```bash
prompt-maker-cli test
# or
prompt-maker-cli test prompt-tests.yaml
```

Or use the TUI Test Runner view (`Ctrl+T`).
