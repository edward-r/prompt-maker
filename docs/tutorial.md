# Prompt Maker CLI Tutorial

This tutorial covers the three main modes:

- `prompt-maker-cli` / `prompt-maker-cli ui`: the Ink TUI (default when no args)
- `prompt-maker-cli [intent] [options]`: the generate workflow
- `prompt-maker-cli test [file]`: prompt test runner

## 1) Prerequisites

- Node.js 18+
- Dependencies installed at repo root (`npm ci`)
- Provider credentials (env or config)
  - `OPENAI_API_KEY` (optional `OPENAI_BASE_URL`)
  - `GEMINI_API_KEY` (optional `GEMINI_BASE_URL`)
  - Optional `GITHUB_TOKEN` (for GitHub URL context rate limits)

## 2) Build + run

```bash
npm ci
npm run build

# TUI (default)
npm start

# Generate mode
npm start -- "Draft a confident onboarding-bot spec" --model gpt-4o-mini

# Run tests
npm start -- test prompt-tests.yaml
```

Development mode (watch + restart):

```bash
npm run dev -- ui
# or
npm run dev -- "Draft onboarding spec" --model gemini-1.5-flash
```

## 3) TUI quick start

```bash
prompt-maker-cli
# or
prompt-maker-cli ui
```

In the TUI:

- `Ctrl+G`: open command palette
- `Ctrl+T`: switch to Test Runner
- `?`: help overlay (best place to learn keys)
- Type a normal sentence and press Enter to generate.
- Type `/` to enter command mode (e.g. `/model`, `/file`, `/url`).

## 4) Generate mode at a glance

Generate reads intent from one of:

- a positional string (`prompt-maker-cli "..."`)
- `--intent-file <path>`
- stdin (pipe input)

Common pattern:

```bash
prompt-maker-cli "Draft a confident onboarding-bot spec" \
  --model gpt-4o-mini \
  --context docs/spec/**/*.md \
  --url https://example.com/docs \
  --smart-context \
  --polish \
  --json \
  > runs/onboarding.json

jq -r '.polishedPrompt // .prompt' runs/onboarding.json > prompts/onboarding.md
```

## 5) Refining prompts

There are two refinement modes:

- `--interactive`: TTY-driven refinements (Enquirer prompts).
- `--interactive-transport <path>`: socket/pipe-driven refinements (best for editor plugins).

Important constraint:

- `--json` cannot be combined with `--interactive` or `--interactive-transport`.

## 6) Working with context + media

### Files

```bash
prompt-maker-cli "Explain the module" \
  --context src/**/*.ts \
  --context "!src/**/__tests__/**" \
  --show-context
```

- Globs are resolved with `fast-glob` (`dot: true`).
- Each matched file is embedded as `<file path="…">…</file>`.

### URLs (including GitHub)

```bash
prompt-maker-cli "Summarize the docs" \
  --url https://github.com/example/repo/tree/main/docs \
  --url https://example.com/docs
```

### Smart context (local embeddings)

```bash
prompt-maker-cli "How does the TUI route keyboard input?" \
  --smart-context \
  --smart-context-root src/tui
```

### Images / video

```bash
prompt-maker-cli "Critique this UI mock" --image assets/mock.png

prompt-maker-cli "Review this demo" --video media/demo.mp4
```

- Images are embedded as base64 parts (≤20MB; PNG/JPG/JPEG/WEBP/GIF).
- Video requires Gemini; if you select a non-Gemini model, the CLI will automatically switch to the configured Gemini video model (default: `gemini-3-pro-preview`).

## 7) Token telemetry + history

- Each run computes a token breakdown (intent + files).
- Every run appends a JSONL entry to `~/.config/prompt-maker-cli/history.jsonl`.

## 8) Config

Config resolution:

- `PROMPT_MAKER_CLI_CONFIG=/path/to/config.json`
- `~/.config/prompt-maker-cli/config.json`
- `~/.prompt-maker-cli.json`

Example:

```json
{
  "openaiApiKey": "sk-...",
  "geminiApiKey": "gk-...",
  "promptGenerator": {
    "defaultModel": "gpt-4o-mini",
    "defaultGeminiModel": "gemini-3-pro-preview"
  },
  "contextTemplates": {
    "nvim": "## NeoVim Prompt Buffer\n\n{{prompt}}"
  }
}
```

## 9) Prompt tests

```bash
prompt-maker-cli test
# or
prompt-maker-cli test prompt-tests.yaml
```

In the TUI, switch to Test Runner (`Ctrl+T`) and run the suite there.
