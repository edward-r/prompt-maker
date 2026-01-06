# Prompt Maker CLI TUI Design

This document describes the _current_ Ink-based TUI: its UX goals, input routing invariants, and how the code is organized.

If you’re looking for a user guide, the fastest way to learn the TUI is to run it and hit `?`.

## Goals

- **Keyboard-first**: no mouse required; command palette + popups cover most actions.
- **Safe input routing**: help/popup layers must “own” the keyboard (no fallthrough).
- **Shared core logic**: the TUI calls the same generation/test pipeline as the CLI.
- **Automation-friendly**: the CLI continues to support JSON/JSONL output; the TUI is optional.

## Entry points

- CLI routing: `src/index.ts`
  - No args defaults to `ui`.
  - `test` runs the prompt test runner.
  - Everything else runs the generate workflow.
- TUI renderer: `src/tui/index.tsx` (parses `--interactive-transport`, then mounts `AppContainer`).

## Global keybinds

Defined by `src/tui/app-container-keymap.ts` and shown in help (`?`).

- `Ctrl+G`: open command palette (Generate view)
- `Ctrl+T`: switch to Test Runner view
- `?`: toggle help overlay
- `Ctrl+C`: exit
- `Esc`: dismiss UI elements (never exits)

## Input routing invariants

Priority order (highest wins):

1. **Help overlay**: when help is open, it consumes almost all keys.
2. **Popup input**: when a popup is open, it “owns” the keyboard.
3. **Screen input**: active screen handles keys (history scrolling, typing, submission).
4. **AppContainer global keys**: only truly-global shortcuts should run here.

This is enforced by:

- `AppContainer` tracking `isHelpOpen` + `isPopupOpen` and gating global actions.
- Screens using `useInput(..., { isActive })` to ensure only the top layer handles keys.

## Screen model

The TUI has two views:

- **Generate** (`src/tui/screens/command/CommandScreen.tsx`)
- **Test Runner** (`src/tui/screens/test-runner/TestRunnerScreen.tsx`)

The view is managed by `src/tui/AppContainer.tsx`.

## Generate view UX

The Generate view is a scrollable history pane plus a single input bar:

- Type normal text → treated as an intent.
- Type `/` → command mode (command palette opens and filters).
- Drag & drop an absolute file path, then press `Tab` to attach it.

Commands are defined in `src/tui/config.ts` (`COMMAND_DESCRIPTORS`). The palette uses matching helpers in `src/tui/command-filter.ts`.

### Popups

Most commands open a popup:

- `/model`, `/target` → model selection
- `/file`, `/url`, `/image`, `/video` → add context items
- `/smart`, `/smart-root` → smart context controls
- `/theme`, `/theme-mode` → theme controls
- `/tokens`, `/budgets`, `/resume`, `/export`, `/settings`, `/history`, `/reasoning` → informational/workflow views

Popup transitions are managed with a pure reducer (`src/tui/popup-reducer.ts`) and a hook for effects (`src/tui/hooks/usePopupManager.ts`).

### Series generation

`/series` (or pressing `Tab`) produces a set of standalone “atomic prompts” (no cross references between steps). It writes the artifacts under a timestamped folder (see `src/tui/hooks/useGenerationPipeline.ts`).

## Test Runner UX

The Test Runner view runs suites defined by `prompt-tests.yaml` (or another YAML file). It uses the same underlying runner exported by `src/test-command.ts`.

## Theming

- Theme definitions and loader: `src/tui/theme/*`
- Some TUI settings are persisted into CLI config via `src/config.ts` (theme, budgets, resume defaults, export defaults).

Theme JSON examples live in `src/tui/theme/examples/`.
