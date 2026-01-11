# Comprehensive, Progressive Lesson Plan for Using prompt-maker-cli (PMC)

This tutorial is a progressive, lab-first curriculum that teaches a developer to use **prompt-maker-cli (PMC)** from beginner to advanced.

It’s grounded in the repository’s docs and source-of-truth behavior:

- `docs/cookbook.md`
- `docs/tui-styling-guide.md`
- `docs/prompt-maker-cli-tui-encyclopedia.md`
- `docs/neovim-plugin-integration.md`
- `src/prompt-generator/message-builders.ts`

> Note: there is also a legacy tutorial at `legacy docs/tutorial.md`. It contains older path references, but its command patterns are still broadly consistent with the modern CLI.

---

## Assumptions

- You are in the repo root (`prompt-maker/`) with Node.js **18+**.
- You have at least one provider configured:
  - OpenAI: `OPENAI_API_KEY`
  - Gemini: `GEMINI_API_KEY` (required for video)
- Optional: `GITHUB_TOKEN` for GitHub URL context (improves API rate limits).
- OS defaults: macOS or Linux. Windows works for most CLI features, but interactive transport uses Windows named pipes (see Lesson 8).

---

## Syllabus (Progressive Lessons)

1. **Setup & Mental Model** (Beginner)
2. **TUI Basics: Generate View + Command Palette** (Beginner)
3. **TUI Power Features: Context, Series, History, Tokens, Themes** (Intermediate)
4. **Generate Mode Fundamentals: Intent + Context + Output** (Beginner → Intermediate)
5. **Remote Context: URLs + GitHub URLs** (Intermediate)
6. **Smart Context (Local RAG / Embeddings)** (Intermediate)
7. **Media Attachments: Images + Video (Gemini)** (Intermediate)
8. **Refinement Workflows: Interactive TTY + Interactive Transport** (Advanced)
9. **Automation Outputs: `--json`, `--stream jsonl`, quiet/progress controls** (Advanced)
10. **Prompt Testing: `prompt-maker-cli test` + YAML suites** (Intermediate)
11. **NeoVim Integration Playbooks (including sidekick.nvim terminal workflows)** (Advanced)

Capstones:

- **Capstone A**: Non-interactive automation run → JSON → extract prompt
- **Capstone B**: JSONL streaming run → parse events
- **Capstone C**: NeoVim workflow → one-shot + interactive transport loop

---

## Shared Reference: Run Methods

Use whichever matches your situation:

### From source (recommended while working in this repo)

```bash
npm ci
npm run build

# TUI (default when no args)
npm start

# Generate
npm start -- "Draft a confident onboarding-bot spec" --model gpt-4o-mini

# Test runner
npm start -- test prompt-tests.yaml
```

### Installed CLI binary

```bash
# TUI
prompt-maker-cli

# Generate
prompt-maker-cli "Summarize src/tui/ in 5 bullets" --context "src/tui/**/*.ts*" --polish

# Tests
prompt-maker-cli test
```

---

# Lesson 1 — Setup & Mental Model (Beginner)

## Objectives

- Build and run PMC from this repo.
- Understand the three top-level modes: `ui`, `generate`, `test`.
- Configure credentials via env vars or config file.

## Prerequisites

- Node.js 18+
- Repo clone

## Concepts

- **Routing rules** (`docs/prompt-maker-cli-tui-encyclopedia.md`):
  - No args → `ui`
  - `ui` → TUI
  - `test` → prompt test runner
  - `generate` / `expand` → generate pipeline
  - Anything else (including flags like `--json`) → generate pipeline
- **Config resolution order** (`docs/prompt-maker-cli-tui-encyclopedia.md`, `docs/cookbook.md`):
  1. `PROMPT_MAKER_CLI_CONFIG=/path/to/config.json`
  2. `~/.config/prompt-maker-cli/config.json`
  3. `~/.prompt-maker-cli.json`
- **Credential precedence** (`docs/cookbook.md`, `docs/neovim-plugin-integration.md`):
  - Env vars override config keys:
    - `OPENAI_API_KEY` (optional `OPENAI_BASE_URL`)
    - `GEMINI_API_KEY` (optional `GEMINI_BASE_URL`)

## Walkthrough (Commands)

```bash
# 1) Install deps + build
npm ci
npm run build

# 2) Confirm the CLI runs (TUI)
npm start
```

If you want to use the `prompt-maker-cli` binary directly:

```bash
# From the repo root
npm install -g .

# Sanity check
prompt-maker-cli --help
```

## Lab

1. Start the TUI via `npm start`.
2. Exit cleanly with `Ctrl+C`.
3. Create a config file (choose one):
   - `~/.config/prompt-maker-cli/config.json` (recommended)
   - or set `PROMPT_MAKER_CLI_CONFIG` to point at a custom path.

Example config skeleton (do not commit secrets):

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

## Validation

- `npm start` launches an Ink UI (not a stack trace).
- `prompt-maker-cli` is on your `$PATH` if you installed globally.
- With credentials configured, later lessons won’t fail with “Missing OpenAI credentials” / “Missing Gemini credentials”.

## Troubleshooting

- **Ink raw mode error**: you’re not in a real TTY (e.g. piping output); use generate mode instead.
- **Credential errors**: set env vars or config keys (`openaiApiKey` / `geminiApiKey`).

## Video Script (Lesson 1)

- On screen: repo root → run `npm ci` → run `npm run build`.
- Show: `npm start` opens the TUI and exits with `Ctrl+C`.
- Narration beats:
  - “Three modes: `ui`, `generate`, `test`.”
  - “Config precedence and env var override.”
  - “We’re using repo build first; global install is optional.”

---

# Lesson 2 — TUI Basics: Generate View + Command Palette (Beginner)

## Objectives

- Navigate the TUI and use core global keys.
- Use the command palette to discover TUI commands.
- Generate a basic prompt from typed intent.

## Prerequisites

- Lesson 1

## Concepts

- TUI global keys (`docs/cookbook.md`, `docs/prompt-maker-cli-tui-encyclopedia.md`):
  - `Ctrl+G`: open command palette
  - `Ctrl+T`: switch to Test Runner view
  - `/help`: open help overlay (definitive keybind list)
  - `Esc`: dismiss popups
- The TUI is “keyboard-first” and follows strict input routing:
  1. Help overlay
  2. Popup input
  3. Screen input
  4. Global keys

## Walkthrough (Commands)

```bash
# Start the TUI
prompt-maker-cli
# (or: npm start)
```

In the UI:

1. Type `/help` to open help.
2. Press `Ctrl+G` to open the command palette.
3. Type `/` (or keep palette open) and browse commands.

## Lab

1. In the Generate view, type a short intent (example):
   - “Summarize this repository in 5 bullets.”
2. Press `Enter` to generate.
3. Open the command palette (`Ctrl+G`) and run:
   - `/settings`
   - `/history`

## Validation

- You can open help (`/help`) and the command palette (`Ctrl+G`).
- A prompt is generated and appears in the history pane.
- `/history` shows prior commands/runs.

## Troubleshooting

- **Keys don’t work**: a popup or help overlay likely owns input—press `Esc`.
- **Generation fails**: check credential setup (Lesson 1).

## Video Script (Lesson 2)

- Show `prompt-maker-cli` launch.
- Demo: `/help`, `Ctrl+G`, run `/settings`, run `/history`.
- Generate one intent and point out history updates.

---

# Lesson 3 — TUI Power Features: Context, Series, History, Tokens, Themes (Intermediate)

## Objectives

- Add context (files, URLs, images, video, smart context) via the TUI.
- Generate a **series** (atomic prompt plan) and find the saved files.
- Understand token telemetry and history in the UI.
- Change themes and theme mode, and understand where themes are loaded from.

## Prerequisites

- Lessons 1–2

## Concepts

### Adding context via TUI commands

From `docs/cookbook.md` and `docs/prompt-maker-cli-tui-encyclopedia.md`:

- `/file`: add file globs
- `/url`: add URL context
- `/image`: attach image paths
- `/video`: attach video paths (forces Gemini at generation time)
- `/smart`: toggle smart context
- `/smart-root`: set/clear smart-context root

### Series generation and its constraints

- TUI generates a “series” and writes markdown files under:
  - `generated/series/<timestamped-folder>/`
  - Includes `00-overview.md` plus one file per atomic prompt (`docs/cookbook.md`).
- Under the hood, series generation asks the model to return **strict JSON** matching:

```json
{
  "reasoning": "...",
  "overviewPrompt": "...",
  "atomicPrompts": [{ "title": "...", "content": "..." }]
}
```

(See `src/prompt-generator/message-builders.ts`.)

- Series and regular prompt generation share a constraint: **the model must not execute tasks**, only craft instruction artifacts.

### Themes and theme discovery

From `docs/prompt-maker-cli-tui-encyclopedia.md` and `docs/tui-styling-guide.md`:

- Built-in themes live under `src/tui/theme/builtins/`.
- Custom themes are discovered from:
  - `~/.config/prompt-maker-cli/themes/*.json`
  - Project: `.prompt-maker-cli/themes/*.json` (searches ancestor directories)
- Theme selection persists back to your CLI config as `theme` and `themeMode`.

## Walkthrough (Commands)

```bash
prompt-maker-cli
```

In the UI:

1. Add file context: open palette → `/file` → enter `docs/*.md`.
2. Add URL context: `/url` → paste `https://github.com/<owner>/<repo>` (any repo URL is fine).
3. Open token breakdown popup: `/tokens`.
4. Create a series:
   - type an intent, then press `Tab`, or
   - run `/series`.
5. Change theme:
   - `/theme` → choose a theme
   - `/theme-mode` → pick `dark`, `light`, or `system`

## Lab

1. Run `/series` for an intent like:
   - “Create an implementation plan to add a new command to the TUI.”
2. Find the generated folder:
   - `generated/series/<timestamped-folder>/`
3. Open `/tokens` after a run and note:
   - total tokens
   - which files contributed the most tokens
4. (Optional) Install a custom theme by copying the example theme:

```bash
mkdir -p .prompt-maker-cli/themes
cp src/tui/theme/examples/ocean-example.json .prompt-maker-cli/themes/ocean.json
```

Restart the TUI and select `ocean` via `/theme`.

## Validation

- A new folder exists under `generated/series/` after `/series`.
- `/tokens` shows a breakdown (even if values differ).
- Theme selection persists across TUI restarts.

## Troubleshooting

- **Series folder not written**: filesystem permissions issue; the TUI should still generate but will report write errors.
- **Theme not found**: confirm theme JSON is in one of the discovery directories and restart the TUI.

## Video Script (Lesson 3)

- Demo: `/file` with `docs/*.md` and `/tokens`.
- Demo: `/series` → show `generated/series/...` folder.
- Demo: copy `ocean-example.json` into `.prompt-maker-cli/themes/` and select it.

---

# Lesson 4 — Generate Mode Fundamentals: Intent + Context + Output (Beginner → Intermediate)

## Objectives

- Use generate mode via `prompt-maker-cli "..."` and `prompt-maker-cli generate ...`.
- Provide intent via positional arg, `--intent-file`, or stdin.
- Attach file context with `--context` globs (including `!` excludes).
- Use `--show-context` / `--context-file` / `--context-format`.

## Prerequisites

- Lesson 1

## Concepts

### Intent ingestion methods

From `docs/prompt-maker-cli-tui-encyclopedia.md`:

- Positional intent: `prompt-maker-cli "..."`
- Intent file: `--intent-file path/to/intent.md` (alias `-f`)
- stdin: pipe into the command

Rule of thumb:

- Provide intent exactly one way (avoid ambiguity).

### Local context ingestion

From `docs/prompt-maker-cli-tui-encyclopedia.md` and `docs/cookbook.md`:

- `-c, --context <glob>` is repeatable.
- Globs use `fast-glob` and support excludes via `!` prefixes.

### Context preview/export

- `--show-context` prints resolved context before generation.
- `--context-file <path>` writes resolved context to a file.
- `--context-format text|json` controls rendering.

## Walkthrough (Commands)

```bash
# Positional intent
prompt-maker-cli "Summarize the TUI architecture in 5 bullets" \
  --context "docs/prompt-maker-cli-tui-encyclopedia.md"

# Intent from file (keep it small; intent files are validated and size-capped)
cat > /tmp/pmc-intent.md <<'EOF'
Summarize the key PMC run modes and how routing works.
EOF

prompt-maker-cli --intent-file /tmp/pmc-intent.md \
  --context "docs/prompt-maker-cli-tui-encyclopedia.md" \
  --show-context

# Intent from stdin
printf "%s" "List key CLI flags and what they do" | prompt-maker-cli \
  --context docs/prompt-maker-cli-tui-encyclopedia.md
```

## Lab

1. Run a context preview export:

```bash
prompt-maker-cli "Explain PMC context ingestion" \
  --context "docs/prompt-maker-cli-tui-encyclopedia.md" \
  --context-file /tmp/pmc-context.json \
  --context-format json
```

2. Inspect that file and confirm it’s structured JSON.

## Validation

- `--show-context` prints `<file ...>` blocks (text mode).
- `/tmp/pmc-context.json` is a JSON array (json mode).

## Troubleshooting

- **No files matched**: your glob didn’t match any files; PMC warns and continues.
- **Unreadable files**: PMC warns and skips those files.

## Video Script (Lesson 4)

- Show 3 intent ingestion methods (positional, `--intent-file`, stdin).
- Show `--context` excludes using `!`.
- Show `--context-file --context-format json` and open the output.

---

# Lesson 5 — Remote Context: URLs + GitHub URLs (Intermediate)

## Objectives

- Attach remote docs using `--url`.
- Use GitHub URLs (`blob`, `tree`, repo root) as context.
- Understand size/file limits and authentication behaviors.

## Prerequisites

- Lesson 4

## Concepts

From `docs/prompt-maker-cli-tui-encyclopedia.md` and `docs/neovim-plugin-integration.md`:

- `--url` only accepts `http:` / `https:`.
- HTML pages are downloaded (≤ 1MB) and converted to text.
- GitHub URLs are special-cased:
  - Repo root: `https://github.com/<owner>/<repo>`
  - Tree: `https://github.com/<owner>/<repo>/tree/<ref>/<path?>`
  - Blob: `https://github.com/<owner>/<repo>/blob/<ref>/<path>`
- GitHub safety limits:
  - max files: 60
  - max size per file: 64KB
  - common large/binary paths skipped (`node_modules`, `dist`, lockfiles, archives, etc.)
- Optional auth: set `GITHUB_TOKEN` to reduce rate-limit pain.

## Walkthrough (Commands)

```bash
# Basic web URL context
prompt-maker-cli "Summarize this page into prompt instructions" \
  --url https://example.com

# GitHub repo root as context
prompt-maker-cli "Summarize this repo" \
  --url https://github.com/folke/sidekick.nvim

# GitHub tree path as context
prompt-maker-cli "Summarize the docs folder" \
  --url https://github.com/folke/sidekick.nvim/tree/main/doc
```

## Lab

1. Run a GitHub URL ingest and confirm it keeps running even if some files are skipped.
2. Repeat with `GITHUB_TOKEN` set (if you have one) and observe improved reliability under rate limits.

## Validation

- Output includes content that clearly came from the URL.
- If any URL fails, PMC emits warnings but continues.

## Troubleshooting

- **HTTP errors**: confirm URL is reachable and uses http(s).
- **GitHub rate limiting**: set `GITHUB_TOKEN`.

## Video Script (Lesson 5)

- Demo `--url` against a normal page and a GitHub repo tree.
- Point out safety limits and why PMC skips heavy paths.

---

# Lesson 6 — Smart Context (Local RAG / Embeddings) (Intermediate)

## Objectives

- Turn on smart context with `--smart-context`.
- Scope scanning with `--smart-context-root`.
- Understand what gets indexed, where it’s cached, and common failure modes.

## Prerequisites

- Lesson 4

## Concepts

From `docs/prompt-maker-cli-tui-encyclopedia.md` and `docs/neovim-plugin-integration.md`:

- Smart context:
  - scans local files using `fast-glob` patterns like `**/*.{ts,tsx,js,jsx,py,md,json}`
  - skips `node_modules`, `dist`, `.git`, lockfiles, etc.
  - skips files > 25KB
  - caches embeddings in `~/.config/prompt-maker-cli/embeddings_cache.json`
  - searches top-k results (k=5) based on the intent

## Walkthrough (Commands)

```bash
# Smart context with default scan root (CWD)
prompt-maker-cli "Explain how the TUI theme system works" \
  --smart-context

# Smart context with an explicit root
prompt-maker-cli "Explain how token telemetry is computed" \
  --smart-context \
  --smart-context-root src
```

## Lab

1. Run smart context once.
2. Confirm the cache file exists:

```bash
ls -la ~/.config/prompt-maker-cli/embeddings_cache.json
```

3. Run again with the same intent and root; it should be faster due to caching.

## Validation

- `~/.config/prompt-maker-cli/embeddings_cache.json` exists after the first run.
- Output references local files you didn’t explicitly pass via `--context`.

## Troubleshooting

- **Indexing errors**: PMC logs warnings but continues; reduce scope with `--smart-context-root`.
- **Unexpected file choices**: tighten your intent (embeddings search is intent-driven).

## Video Script (Lesson 6)

- Run one command without smart context, one with smart context.
- Show embeddings cache file creation.
- Explain when to use `--smart-context-root`.

---

# Lesson 7 — Media Attachments: Images + Video (Gemini) (Intermediate)

## Objectives

- Attach images via `--image` and understand supported formats and size caps.
- Attach video via `--video` and understand Gemini-only requirements.
- Understand model auto-switch behavior when `--video` is present.

## Prerequisites

- Lesson 4
- Gemini credentials for video: `GEMINI_API_KEY`

## Concepts

From `docs/prompt-maker-cli-tui-encyclopedia.md` and `docs/neovim-plugin-integration.md`:

- Images (`--image`):
  - supported: PNG/JPG/JPEG/WEBP/GIF
  - max 20MB each
  - unsupported/oversize → warning and skipped
- Video (`--video`):
  - requires Gemini
  - uploads via Google Files API and polls until `ACTIVE`
  - if you selected a non-Gemini model, PMC auto-switches to a Gemini video-capable model

## Walkthrough (Commands)

```bash
# Image attach (repeatable)
prompt-maker-cli "Critique this UI for accessibility" \
  --image path/to/screenshot.png \
  --polish

# Video attach (Gemini required; model may auto-switch)
prompt-maker-cli "Analyze this demo recording and list usability issues" \
  --video path/to/demo.mp4 \
  --progress=false
```

## Lab

1. Run an image-based prompt generation.
2. Run a video-based prompt generation and observe:
   - an upload phase
   - `--progress=false` reduces spinner noise (or use `--no-progress`)

## Validation

- For image: the run succeeds without warnings about unsupported extensions.
- For video: the run only succeeds when Gemini credentials are configured.

## Troubleshooting

- **Image skipped**: verify extension and file size.
- **Video fails immediately**: missing `GEMINI_API_KEY` or unreadable file.
- **Upload appears stuck**: keep the process alive; uploads poll until `ACTIVE`.

## Video Script (Lesson 7)

- Show one run with `--image` and one run with `--video`.
- Call out: “Video forces Gemini; PMC may auto-switch the model.”

---

# Lesson 8 — Refinement Workflows: Interactive TTY + Interactive Transport (Advanced)

## Objectives

- Use `--interactive` for a TTY-based refinement loop.
- Use `--interactive-transport` for programmatic refinement (editor/plugin workflows).
- Understand what commands transport accepts and what events you can observe.

## Prerequisites

- Lesson 4

## Concepts

### Interactive TTY mode

From `docs/prompt-maker-cli-tui-encyclopedia.md`:

- `--interactive` enables a refinement loop **only when a TTY is available**.
- If no TTY is detected, PMC warns and proceeds non-interactively.

### Interactive transport mode

From `docs/prompt-maker-cli-tui-encyclopedia.md` and `docs/neovim-plugin-integration.md`:

- `--interactive-transport <path>` opens a local server:
  - Unix socket path like `/tmp/pmc.sock` (macOS/Linux)
  - Windows named pipe path must start with `\\.\pipe\...`
- Client sends **newline-delimited JSON** commands:
  - `{"type":"refine","instruction":"..."}`
  - `{"type":"finish"}`
- Transport also receives JSONL events emitted by the pipeline.

### Hard constraints

- `--json` cannot be combined with `--interactive` or `--interactive-transport`.

## Walkthrough (Commands)

### A) Interactive TTY

```bash
prompt-maker-cli "Draft a code review prompt for this repo" \
  --context "docs/prompt-maker-cli-tui-encyclopedia.md" \
  --interactive
```

Follow the prompts to refine; finish by choosing not to refine.

### B) Interactive transport (two terminals)

Terminal A (start PMC):

```bash
prompt-maker-cli "Draft a refactor plan for the token telemetry system" \
  --context "src/generate/token-telemetry.ts" \
  --stream jsonl \
  --quiet \
  --interactive-transport /tmp/pmc.sock
```

Terminal B (send commands using Node.js):

```bash
node -e "
const net = require('node:net');
const socketPath = '/tmp/pmc.sock';
const c = net.createConnection(socketPath);
c.on('data', (d) => process.stdout.write(d));
c.on('connect', () => {
  c.write(JSON.stringify({ type: 'refine', instruction: 'Add a Validation section and keep steps testable.' }) + '\n');
  setTimeout(() => c.write(JSON.stringify({ type: 'finish' }) + '\n'), 500);
});
"
```

## Lab

1. Run the transport workflow above.
2. Observe the JSONL stream in Terminal A.
3. Confirm you see at least:
   - `interactive.awaiting` events
   - `generation.iteration.start` / `generation.iteration.complete`
   - `generation.final`

## Validation

- Refinement changes the output (you should see at least two iterations).
- The process exits after `finish`.

## Troubleshooting

- **Socket path already exists**: remove the stale file and retry.
- **No `interactive.awaiting`**: ensure you started with `--interactive-transport`.
- **Mixed output**: use `--quiet` so stdout is JSONL-only (plus any final prompt text depending on mode).

## Video Script (Lesson 8)

- Split-screen recording (two terminals):
  - Left: PMC running with `--interactive-transport`.
  - Right: Node one-liner sending `refine` then `finish`.
- Narrate: “Transport is how editor plugins drive refinement loops.”

---

# Lesson 9 — Automation Outputs: `--json`, `--stream jsonl`, quiet/progress controls (Advanced)

## Objectives

- Produce machine-readable JSON output with `--json`.
- Stream JSONL events with `--stream jsonl`.
- Use `--quiet` and `--progress=false` / `--no-progress` to keep stdout parseable.
- Understand context templates and `renderedPrompt` fallback logic.
- Learn where history is stored and how to use it.

## Prerequisites

- Lesson 4

## Concepts

### JSON output

From `docs/prompt-maker-cli-tui-encyclopedia.md` and `docs/cookbook.md`:

- `--json` prints a pretty JSON payload to **stdout**.
- `--show-context` + `--json` prints context to **stderr** (to protect stdout JSON).
- `--json` cannot be combined with interactive modes.

### Streaming JSONL

From `docs/neovim-plugin-integration.md`:

- `--stream jsonl` writes newline-delimited JSON events to stdout.
- Use `--quiet` to suppress human-oriented output so stdout is parseable.

Event names you can rely on include (each JSONL line includes an `event` field plus event-specific payload fields):

- `context.telemetry`
- `progress.update`
- `upload.state`
- `generation.iteration.start`
- `generation.iteration.complete`
- `interactive.state`
- `interactive.awaiting`
- `transport.listening`, `transport.client.connected`, `transport.client.disconnected`
- `generation.final`

### `--quiet`, progress flags, and telemetry presentation

- `--quiet` suppresses banners/telemetry UI.
- Progress spinners are controlled via:
  - `--progress=false` (boolean form)
  - or `--no-progress` (CLI alias)

### Context templates and fallback fields

From `docs/neovim-plugin-integration.md`:

- `--context-template nvim` wraps output into an editor-friendly template.
- JSON payload may include:
  - `renderedPrompt` (if template applied)
  - `polishedPrompt` (if `--polish`)
  - otherwise `prompt`

Fallback logic for consumers:

1. Use `renderedPrompt` if present.
2. Else use `polishedPrompt` if present.
3. Else use `prompt`.

### History

- Every generate run appends JSONL to:
  - `~/.config/prompt-maker-cli/history.jsonl`

## Walkthrough (Commands)

### A) JSON output (recommended for scripting)

```bash
prompt-maker-cli "Summarize the PMC generate flags" \
  --context docs/prompt-maker-cli-tui-encyclopedia.md \
  --json > /tmp/pmc-run.json

# Extract the generated prompt
node -e "
const fs = require('node:fs');
const run = JSON.parse(fs.readFileSync('/tmp/pmc-run.json','utf8'));
console.log(run.renderedPrompt ?? run.polishedPrompt ?? run.prompt);
"
```

### B) JSONL stream output (recommended for live UIs)

```bash
prompt-maker-cli "Explain smart context and where it caches embeddings" \
  --context docs/neovim-plugin-integration.md \
  --stream jsonl \
  --quiet \
  --progress=false > /tmp/pmc-events.jsonl
```

## Lab

1. Produce JSON output and extract the `prompt` using the Node snippet above.
2. Produce JSONL stream output and confirm you have newline-delimited JSON objects.
3. Confirm history appended:

```bash
ls -la ~/.config/prompt-maker-cli/history.jsonl
```

## Validation

- `/tmp/pmc-run.json` parses as JSON and contains keys like `schemaVersion`, `intent`, `model`, `targetModel`, and `prompt`.
- `/tmp/pmc-events.jsonl` contains multiple JSON objects separated by newlines.
- `~/.config/prompt-maker-cli/history.jsonl` grows over time.

## Troubleshooting

- **Stdout not parseable**: add `--quiet` and disable progress (`--progress=false` or `--no-progress`).
- **Need both JSONL and final JSON**: be careful—combining `--stream jsonl` with `--json` mixes formats on stdout; prefer reading the final payload from `~/.config/prompt-maker-cli/history.jsonl` instead.

## Video Script (Lesson 9)

- Show `--json > run.json` and extract via `node -e`.
- Show `--stream jsonl --quiet` and open the JSONL file.
- Explain the `renderedPrompt → polishedPrompt → prompt` fallback order.

---

# Lesson 10 — Prompt Testing: `prompt-maker-cli test` + YAML suites (Intermediate)

## Objectives

- Run prompt tests with `prompt-maker-cli test`.
- Understand the YAML suite concept and how failures are reported.
- Run tests in the TUI Test Runner view.

## Prerequisites

- Lesson 1

## Concepts

From `docs/prompt-maker-cli-tui-encyclopedia.md` and `docs/cookbook.md`:

- CLI test runner:
  - `prompt-maker-cli test` uses `prompt-tests.yaml` by default.
  - `prompt-maker-cli test path/to/suite.yaml` runs a specific file.
- The suite is validated (Zod schema) and tests result in a non-zero exit code on failures.

## Walkthrough (Commands)

```bash
# Default suite
prompt-maker-cli test

# Explicit suite
prompt-maker-cli test prompt-tests.yaml
```

TUI:

- `Ctrl+T` → Test Runner view
- Select file (default `prompt-tests.yaml`) → Run

## Lab

1. Run `prompt-maker-cli test`.
2. Observe PASS/FAIL results and ensure exit code reflects failures.

```bash
prompt-maker-cli test
echo $?
```

## Validation

- Tests print PASS/FAIL per test.
- Exit code is non-zero if any test fails.

## Troubleshooting

- **`test --help` still runs tests**: known quirk (`docs/prompt-maker-cli-tui-encyclopedia.md`).
- **Credential errors**: tests still require provider access.

## Video Script (Lesson 10)

- Run `prompt-maker-cli test`.
- Show a failing test case (if present) and the exit code.
- Open the TUI test runner (`Ctrl+T`) and run the same suite.

---

# Lesson 11 — NeoVim Integration Playbooks (including sidekick.nvim) (Advanced)

## Objectives

- Use the docs-backed integration patterns for:
  - one-shot prompt into a buffer
  - interactive transport refinement loop
  - context preview workflow
  - history-driven picker concept
  - media-assisted runs
- Run PMC from inside NeoVim terminals.
- Use **sidekick.nvim** as a convenient “integrated AI CLI terminal” to host PMC sessions.

## Prerequisites

- Lessons 8–9
- NeoVim installed
- Optional: sidekick.nvim installed (see https://github.com/folke/sidekick.nvim)

## Concepts

From `docs/neovim-plugin-integration.md`:

- For editor automation, prefer:
  - `--json --quiet --stream jsonl` (for programmatic consumption)
  - `--interactive-transport` for refinement loops
  - `--context-template nvim` for scratch-buffer-friendly formatting
- Template fallback logic for buffer insertion:
  - `renderedPrompt` → `polishedPrompt` → `prompt`

From sidekick.nvim’s README:

- sidekick.nvim provides an integrated terminal wrapper for arbitrary AI CLIs.
- It can “select” or “toggle” a tool session and send text to it.

## Walkthrough (Commands)

### Playbook 1: One-shot prompt into a buffer (CLI-first)

```bash
prompt-maker-cli "Write a refactor prompt for this file" \
  --context src/index.ts \
  --context-template nvim \
  --json --quiet > /tmp/pmc.json
```

Then in NeoVim, paste the output you want (`renderedPrompt` preferred).

### Playbook 2: Interactive transport loop (CLI + editor)

Start PMC:

```bash
prompt-maker-cli "Draft a refactor plan for the active file" \
  --context src/index.ts \
  --quiet \
  --stream jsonl \
  --interactive-transport /tmp/pmc.nvim.sock
```

Send `refine` / `finish` commands from another process (e.g. via Lua plugin code or the Node one-liner from Lesson 8).

### Playbook 3: Context preview (editor preview windows)

```bash
prompt-maker-cli "Explain what this context contains" \
  --context "src/**/*.ts" \
  --context "!src/**/__tests__/**" \
  --context-file /tmp/pmc-context.json \
  --context-format json \
  --show-context
```

### Playbook 4: History-driven picker (concept)

- Read and parse:
  - `~/.config/prompt-maker-cli/history.jsonl`
- Show recent entries by `intent`, `timestamp`, and a snippet of `prompt`.

### Running the PMC TUI inside NeoVim

- In NeoVim, use a builtin terminal:

```vim
:terminal prompt-maker-cli ui
```

- For transport-enabled sessions:

```vim
:terminal prompt-maker-cli ui --interactive-transport /tmp/pmc.nvim.sock
```

### Using sidekick.nvim to host PMC sessions

sidekick.nvim’s “AI CLI Integration” is a general terminal wrapper; you can add a custom tool for PMC.

Example `lazy.nvim` snippet (adapted from sidekick.nvim README):

```lua
{
  "folke/sidekick.nvim",
  opts = {
    cli = {
      tools = {
        pmc = {
          cmd = { "prompt-maker-cli" },
        },
      },
    },
  },
  keys = {
    {
      "<leader>ap",
      function() require("sidekick.cli").toggle({ name = "pmc", focus = true }) end,
      desc = "Sidekick: PMC",
    },
  },
}
```

From NeoVim:

- `:Sidekick cli show name=pmc focus=true` (start or attach)
- Run the TUI or generate commands inside the sidekick terminal:
  - `prompt-maker-cli ui`
  - `prompt-maker-cli "..." --json --quiet --stream jsonl`

## Lab

1. Do a one-shot run from NeoVim that produces `--json --quiet` output.
2. Start a transport session and send a refine command.
3. If using sidekick.nvim:
   - start the `pmc` tool terminal
   - run `prompt-maker-cli ui` inside it

## Validation

- NeoVim terminal can run `prompt-maker-cli ui` without Ink raw-mode errors.
- Transport socket workflow works end-to-end (refine then finish).
- sidekick.nvim can open a terminal session and keep it accessible.

## Troubleshooting

- **Ink raw mode errors inside NeoVim**: your terminal buffer might not support raw mode (or you’re in a headless environment); use generate mode instead.
- **Socket conflicts**: ensure `/tmp/pmc.nvim.sock` is unique per session.

## Video Script (Lesson 11)

- Record NeoVim:
  - open `:terminal prompt-maker-cli ui`
  - show `--interactive-transport` variant
- If sidekick.nvim installed:
  - show `:Sidekick cli show name=pmc focus=true`
  - run a generate command in that terminal

---

# Capstone A — Automation Run: JSON Output → Extract Prompt (Advanced)

## Goal

Produce a non-interactive JSON artifact and programmatically extract the final prompt text.

## Steps

```bash
prompt-maker-cli "Create a release checklist for this repo" \
  --context README.md \
  --context docs/cookbook.md \
  --context-template nvim \
  --polish \
  --json --quiet > /tmp/release-checklist.json

node -e "
const fs = require('node:fs');
const payload = JSON.parse(fs.readFileSync('/tmp/release-checklist.json','utf8'));
const text = payload.renderedPrompt ?? payload.polishedPrompt ?? payload.prompt;
console.log(text);
"
```

## Validation

- `/tmp/release-checklist.json` parses as JSON.
- Output is the template-wrapped prompt (when `renderedPrompt` is present).

## Common failure modes

- Missing credentials.
- Accidentally using `--interactive` with `--json` (invalid combination).

---

# Capstone B — Streaming Run: JSONL Events → Parse & React (Advanced)

## Goal

Capture a JSONL event stream and parse key milestones like `context.telemetry` and `generation.final`.

## Steps

```bash
prompt-maker-cli "Summarize how the TUI theme system loads custom themes" \
  --context docs/tui-styling-guide.md \
  --stream jsonl \
  --quiet \
  --progress=false > /tmp/pmc-theme-events.jsonl

node -e "
const fs = require('node:fs');
const lines = fs.readFileSync('/tmp/pmc-theme-events.jsonl','utf8').trim().split(/\n+/);
for (const line of lines) {
  const evt = JSON.parse(line);

  if (evt.event === 'context.telemetry') {
    console.error('telemetry totalTokens=', evt.telemetry.totalTokens);
  }

  if (evt.event === 'generation.final') {
    const result = evt.result;
    console.log(result.renderedPrompt ?? result.polishedPrompt ?? result.prompt);
  }
}
"
```

## Validation

- The JSONL file contains multiple lines of JSON.
- You observe a `generation.final` event and print the final prompt.

## Common failure modes

- Missing `--quiet` causes non-JSON output to mix into stdout.

---

# Capstone C — NeoVim Scenario: One-shot + Interactive Transport Loop (Advanced)

## Goal

Inside NeoVim, run a one-shot prompt build for a file, then run an interactive transport refinement session.

## Steps

1. NeoVim one-shot:

```vim
:terminal prompt-maker-cli "Review this file and propose tests" --context % --context-template nvim --json --quiet
```

2. NeoVim transport session:

```vim
:terminal prompt-maker-cli "Draft a refactor plan for this file" --context % --quiet --stream jsonl --interactive-transport /tmp/pmc.nvim.sock
```

3. Send commands using a second terminal or a small Lua helper (conceptually the same as Lesson 8’s Node client):
   - send `{"type":"refine","instruction":"..."}`
   - then `{"type":"finish"}`

## Validation

- NeoVim terminal displays a prompt output (one-shot).
- Transport session performs at least one refinement iteration before finishing.

---

# Feature Coverage Checklist (Docs-backed)

| Feature / Capability                                                                                                                  | Where covered            |
| :------------------------------------------------------------------------------------------------------------------------------------ | :----------------------- |
| Install/build from source (`npm ci`, `npm run build`, `npm start`)                                                                    | Lessons 1–2              |
| Global install + binary usage (`prompt-maker-cli`)                                                                                    | Lesson 1                 |
| Three modes: `ui`, `generate` (default), `test`                                                                                       | Lesson 1                 |
| TUI basics: help, command palette, navigation                                                                                         | Lessons 2–3              |
| TUI commands: `/file`, `/url`, `/image`, `/video`, `/smart`, `/smart-root`, `/tokens`, `/history`, `/theme`, `/theme-mode`, `/series` | Lesson 3                 |
| Intent ingestion: positional, `--intent-file/-f`, stdin                                                                               | Lesson 4                 |
| Local context: `--context` globs + excludes (`!`)                                                                                     | Lesson 4                 |
| Context preview/export: `--show-context`, `--context-file`, `--context-format text\|json`                                             | Lessons 4, 11            |
| URL context (`--url`) + GitHub URLs                                                                                                   | Lesson 5                 |
| GitHub token usage (`GITHUB_TOKEN`)                                                                                                   | Lesson 5                 |
| Smart context: `--smart-context`, `--smart-context-root`, embeddings cache                                                            | Lesson 6                 |
| Media: `--image` constraints                                                                                                          | Lesson 7                 |
| Media: `--video` Gemini requirement + upload behavior + model auto-switch                                                             | Lesson 7                 |
| Output: `--json` and non-combinability with interactive modes                                                                         | Lessons 8–9, Capstone A  |
| Output: `--stream jsonl` events and parsing                                                                                           | Lesson 9, Capstone B     |
| `--quiet`, `--progress=false`, `--no-progress` (clean stdout)                                                                         | Lessons 7–9              |
| Context templates: `--context-template nvim`, `renderedPrompt` fallback                                                               | Lessons 9, 11            |
| Refinement: `--interactive` (TTY)                                                                                                     | Lesson 8                 |
| Refinement: `--interactive-transport` (IPC)                                                                                           | Lesson 8, Capstone C     |
| Polishing: `--polish`, `--polish-model`                                                                                               | Lessons 7, 9             |
| `--model` vs `--target` semantics (target not echoed in prompt text by default)                                                       | Lessons 9, 11            |
| History: `~/.config/prompt-maker-cli/history.jsonl`                                                                                   | Lesson 9, 11             |
| Token telemetry (`/tokens` and `context.telemetry` events)                                                                            | Lessons 3, 9, Capstone B |
| Prompt tests: `prompt-maker-cli test`, `prompt-tests.yaml` default                                                                    | Lesson 10                |
| Run tests in the TUI test runner view                                                                                                 | Lessons 2, 10            |
| NeoVim integration playbooks (one-shot, transport loop, context preview, history)                                                     | Lesson 11                |
| sidekick.nvim integration (run PMC in integrated terminal)                                                                            | Lesson 11                |

---

## Next steps

- If you want, extend this curriculum by creating a personal “prompt suite” in `prompt-tests.yaml` and running it via:
  - `prompt-maker-cli test`
  - TUI Test Runner (`Ctrl+T`)
