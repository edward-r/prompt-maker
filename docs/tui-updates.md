# TUI Parity Updates (implemented in PR #15)

This document originally described a plan to update the Ink + React TUI to support CLI “auditable workflows” introduced in PR #14.

Those planned items are now implemented on `feature/tui-cli-parity-refacto` (PR #15).

Scope constraints (still apply):

- Preserve input routing priority (**Help overlay > Popup > Screen > AppContainer globals**) as described in `docs/tui-design.md` and `src/tui/DEVELOPER_NOTE.md`.
- Keep reducers pure (`*-reducer.ts`), and keep effects in hooks.

---

## Summary

User-facing TUI parity improvements:

- `/budgets`: configure token budgets + overflow strategy (persists to config).
- `/resume`: resume generation from history or an exported payload file (persists default mode/source).
- `/export`: export a selected history payload to JSON/YAML (persists default format/output directory).
- Help overlay includes a “Workflows” section to make these discoverable.

CLI behavior/UX improvements related to these workflows:

- `export --from-history <selector>` now validates schema compatibility for the selected history entry and fails with an actionable error if the selected entry has an unsupported `schemaVersion`.

---

## TUI Workflow Commands

All of these commands are listed in the command palette (`Ctrl+G` or type `/`) and open a popup (no inline args parsing).

### `/budgets`

- Popup fields:
  - `Max context tokens` (optional integer)
  - `Max input tokens` (optional integer)
  - `Overflow strategy` (`fail`, `drop-smart`, `drop-url`, `drop-largest`, `drop-oldest`, or unset)
- Behavior:
  - Budgets are enabled when either token field is non-empty.
  - If budgets are enabled and overflow strategy is unset, the effective strategy defaults to `fail`.
  - Clearing both token fields disables budgets.
- Persistence:
  - Writes to CLI config under `promptGenerator.maxInputTokens`, `promptGenerator.maxContextTokens`, and `promptGenerator.contextOverflowStrategy`.

Implementation entrypoints:

- UI: `src/tui/components/popups/BudgetsPopup.tsx`
- Parsing: `src/tui/budget-settings.ts`
- Persistence: `src/config.ts` (`updateCliPromptGeneratorSettings`)

### `/resume`

- Popup fields:
  - `Source`: `history` or `file`
  - `Mode`: `best-effort` or `strict`
  - History picker (for `history`) or payload path input (for `file`)
- Behavior:
  - Resume runs can start even when the typed intent is empty (the resumed payload supplies the intent).
  - Resume only reuses `source:"file"` context paths. URL/smart entries are treated as missing.
  - `best-effort` warns (and continues) if some resumed files are missing.
  - `strict` fails if any resumed `source:"file"` context paths are missing.
- Persistence:
  - Writes `resumeMode` and `resumeSourceKind` to CLI config.

Implementation entrypoints:

- UI: `src/tui/components/popups/ResumePopup.tsx`
- History list: `src/tui/resume-history.ts`
- Persistence: `src/config.ts` (`updateCliResumeSettings`)

### `/export`

- Popup fields:
  - `Format`: `json` or `yaml`
  - `Out`: output file path (relative to cwd or absolute)
  - History picker (newest-first list of `last`, `last:2`, …)
- Behavior:
  - Exports write the selected history payload to the chosen output path.
  - History entries with an unsupported `schemaVersion` are surfaced in the picker as unsupported; export fails if you attempt to export an unsupported entry.
- Persistence:
  - Writes `exportFormat` and `exportOutDir` (directory path) to CLI config.

Implementation entrypoints:

- UI: `src/tui/components/popups/ExportPopup.tsx`
- History picker + schema gating: `src/history/generate-history.ts`
- File writing helper: `src/export/export-generate-payload.ts`
- Persistence: `src/config.ts` (`updateCliExportSettings`)

---

## Config keys (relevant to parity workflows)

Config is loaded from (`src/config.ts`):

1. `PROMPT_MAKER_CLI_CONFIG=/path/to/config.json`
2. `~/.config/prompt-maker-cli/config.json`
3. `~/.prompt-maker-cli.json`

Relevant persisted keys:

- Budgets:
  - `promptGenerator.maxInputTokens`
  - `promptGenerator.maxContextTokens`
  - `promptGenerator.contextOverflowStrategy`
- Resume defaults:
  - `resumeMode` (`best-effort` | `strict`)
  - `resumeSourceKind` (`history` | `file`)
- Export defaults:
  - `exportFormat` (`json` | `yaml`)
  - `exportOutDir` (directory path)

---

## Help overlay

Help overlay text is generated in `src/tui/help-config.ts`.

PR #15 adds a “Workflows” section that calls out:

- `/budgets`
- `/resume`
- `/export`
- A note that `compose` is CLI-only (not implemented in the TUI)
