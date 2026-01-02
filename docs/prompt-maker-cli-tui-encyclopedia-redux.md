# prompt-maker-cli TUI Encyclopedia

This is a technical overview of the Ink TUI: how it boots, how keyboard input is routed, how commands and popups work, and how the TUI delegates to the same generation/test pipelines as the CLI.

This doc intentionally prefers _stable file references_ (paths) over fragile line-number anchors.

## High-level architecture

There are three CLI modes:

- `ui`: Ink TUI (default when no args)
- `generate`: prompt generation pipeline (default for most args)
- `test`: prompt test runner

Routing is implemented in `src/index.ts`.

### Module map

- CLI routing and pipelines
  - CLI entry: `src/index.ts`
  - Generate pipeline: `src/generate-command.ts`
  - Test pipeline: `src/test-command.ts`
- TUI shell
  - Ink render entry: `src/tui/index.tsx`
  - Root layout + global keys: `src/tui/AppContainer.tsx`
  - Global key resolution: `src/tui/app-container-keymap.ts`
- Generate screen (“command screen”)
  - Screen entry: `src/tui/screens/command/CommandScreen.tsx`
  - Implementation: `src/tui/screens/command/CommandScreenImpl.tsx`
  - Screen reducer: `src/tui/screens/command/command-screen-reducer.ts`
- Test runner screen
  - Screen: `src/tui/screens/test-runner/TestRunnerScreen.tsx`
  - Reducer: `src/tui/screens/test-runner/test-runner-reducer.ts`
- Command palette
  - Command list: `src/tui/config.ts` (`COMMAND_DESCRIPTORS`)
  - Filtering/scoring: `src/tui/command-filter.ts`
- Popups
  - Popup state machine: `src/tui/popup-reducer.ts`
  - Popup effects + command dispatch: `src/tui/hooks/usePopupManager.ts`
  - Popup components: `src/tui/components/popups/*`

## Boot sequence (CLI → TUI)

1. `prompt-maker-cli` executes `src/index.ts`.
2. If argv is empty, `resolveCommand()` chooses `ui`.
3. `ui` dynamically imports `src/tui/index.tsx` and runs `runTuiCommand()`.
4. `runTuiCommand()` parses `--interactive-transport` and mounts `<AppContainer />` with Ink.

This dynamic import keeps the non-TUI path fast and avoids Ink initialization for generate/test runs.

## AppContainer responsibilities

`src/tui/AppContainer.tsx` is the TUI “shell”:

- Wraps the app in:
  - `ThemeProvider` (`src/tui/theme/theme-provider.tsx`)
  - `ToastProvider` (`src/tui/notifier.ts`)
  - `ContextProvider` (`src/tui/context.tsx`) for shared generate inputs (files/urls/media/smart context settings, etc.)
- Tracks which view is active (`generate` vs `tests`).
- Owns the help overlay (`?`) and ensures it suppresses normal input.
- Owns global key handling (Ctrl+G, Ctrl+T, Ctrl+C).

### Help overlay

Help content is generated from `src/tui/help-config.ts`, which pulls its command list from `COMMAND_DESCRIPTORS`.

The help overlay is deliberately the highest-priority input layer.

## Input routing (the “no fallthrough” rule)

The TUI is designed to avoid a common terminal-UI bug: _one keypress triggering multiple handlers_.

The intended priority order is:

1. Help overlay (when open)
2. Popup input (when open)
3. Screen input (typing, scrolling, command palette navigation)
4. Global keys (exit, view switching)

The key mechanism that enforces this is Ink’s `useInput(..., { isActive })` plus explicit state flags (`helpOpen`, popup visibility) passed down from `AppContainer`.

Global key resolution happens in `src/tui/app-container-keymap.ts`.

## Command palette

Commands are:

- Declared in `src/tui/config.ts` as `COMMAND_DESCRIPTORS`.
- Rendered via the Generate screen.
- Filtered/scored by `src/tui/command-filter.ts`.

### Matching behavior

`filterCommandDescriptors()` implements simple scoring rules:

- Case-insensitive matching.
- Prefix matches (id/alias/label) rank above substring matches.
- Stable ordering when scores tie.

This logic is intentionally pure and unit-testable.

## Popups

Most commands open a popup rather than performing a one-shot action.

### State machine

Popup state is managed by a reducer:

- `src/tui/popup-reducer.ts` (pure reducer; no Ink/TTY assumptions)
- `src/tui/hooks/usePopupManager.ts` (effects + command dispatch)

The hook is responsible for:

- Opening popups
- Running async workspace scans for suggestions (files/images/videos)
- Applying user selections back to the shared context or screen toggles
- Enforcing guardrails (example: JSON output cannot be enabled when interactive transport is active)

### Popup types

Popup components live under `src/tui/components/popups/*`.

Common ones:

- Model selection (`/model`, `/target`)
- Context lists (`/file`, `/url`, `/image`, `/video`, `/history`)
- Informational (`/tokens`, `/settings`, `/reasoning`)
- Theme (`/theme`, `/theme-mode`)

## Generation pipeline integration

The TUI does not implement model calls directly.

Instead, it delegates to the same pipeline used by the CLI:

- `src/generate-command.ts` exports `runGeneratePipeline(args, options)`.

The Generate screen uses a hook that:

- Builds a `GenerateArgs` structure from the current UI state (intent source, selected model, context lists, toggles).
- Hooks into the pipeline’s structured stream events and maps them into:
  - history entries
  - status text
  - token usage statistics

Relevant modules:

- `src/tui/hooks/useGenerationPipeline.ts`
- `src/tui/generation-pipeline-reducer.ts`

### Stream events

The generate pipeline can emit JSONL stream events (`--stream jsonl` on the CLI). The TUI reuses the same event schema internally to keep the UI’s history/status consistent.

Event types are defined in `src/generate-command.ts` (examples: `progress.update`, `context.telemetry`, `generation.iteration.*`, `upload.state`).

## Series generation

Series generation is a TUI-only workflow intended for “atomic prompts” (independent steps).

- Triggered by `/series` or by pressing `Tab` (when not adding a dropped file path).
- Writes artifacts to a timestamped folder under `generated/series`.

Implementation lives in `src/tui/hooks/useGenerationPipeline.ts`.

## Prompt tests (TUI + CLI)

The test runner exists in two places:

- CLI: `prompt-maker-cli test [file]`
- TUI: Test Runner view (`Ctrl+T`)

Both use the same underlying functions from `src/test-command.ts`:

- `runPromptTestSuite(filePath, { reporter })`

Test definitions are YAML and validated by Zod:

- Schema: `src/testing/test-schema.ts`
- Evaluator: `src/testing/evaluator.ts`

## Persistence

The TUI and CLI persist several artifacts:

- Generation history (JSONL): `~/.config/prompt-maker-cli/history.jsonl` (written by `src/history-logger.ts`)
- TUI command history: `~/.config/prompt-maker-cli/tui-history.json` (used by `/history`)
- Smart context embeddings cache: `~/.config/prompt-maker-cli/embeddings_cache.json` (see `src/rag/vector-store.ts`)
- Theme settings: stored in the CLI config (`theme`, `themeMode`) via `src/config.ts`

## Extending the TUI

### Add a new `/command`

1. Add a descriptor to `src/tui/config.ts`.
2. Add behavior in `src/tui/hooks/usePopupManager.ts` (dispatch popup open, toggle state, or run an action).
3. If a popup is needed:
   - Add a union member in `src/tui/types.ts`.
   - Add transitions in `src/tui/popup-reducer.ts`.
   - Add a popup component under `src/tui/components/popups/`.

### Add a new popup safely

Follow the reducer-first pattern:

- Put state transitions in `src/tui/popup-reducer.ts`.
- Keep async work in `src/tui/hooks/usePopupManager.ts`.
- Add/adjust unit tests under `src/__tests__/tui/` when behavior changes.
