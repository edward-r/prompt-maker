# TUI Updates Plan for PR #14 (CLI “comparative features”)

This document proposes a concrete, repo-aligned plan to update the Ink + React TUI so it supports CLI functionality introduced in PR #14.

Scope constraints:

- **No implementation here** — plan only.
- Preserve input routing priority (**Help overlay > Popup > Screen > AppContainer globals**) as described in `docs/tui-design.md` and `src/tui/DEVELOPER_NOTE.md`.
- Follow established boundaries: pure reducers in `*-reducer.ts`, effects in hooks, presentational components in `src/tui/components/**`.

---

## 1. Summary of PR #14 CLI changes relevant to TUI

PR #14 introduced “comparative” / “auditable” workflows centered on **export + resume + deterministic trimming**.

Evidence sources:

- Top-level routing adds new subcommands in `src/index.ts`.
- Generate flags and behavior changes in `src/generate/args.ts` and `src/generate/pipeline.ts`.
- Stream events and payload schema updates in `src/generate/types.ts`.
- Config additions in `src/config.ts`.
- Export + compose subcommands in `src/export-command.ts` and `src/compose-command.ts`.
- Docs/workflows described in `docs/neovim-plugin-integration.md` (updated in PR #14).

### Feature matrix

| Feature                                            | CLI surface (command / flag)                                                                        | Behavior (merged)                                                                                                                                                                                                                                      | TUI impact                                                                                                                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New top-level command routing                      | `prompt-maker-cli export …`, `prompt-maker-cli compose …`                                           | `src/index.ts` routes `export` and `compose` as first-token subcommands. Generate remains the default for “everything else.”                                                                                                                           | TUI is still the default “no args” mode; but TUI should expose **equivalent workflows** where they make sense (especially export).                                 |
| Export last/selected run                           | `export --from-history <selector> --format json\|yaml --out <path>`                                 | Reads `~/.config/prompt-maker-cli/history.jsonl`, selects an entry (`last`, `last:N`, or `N`), writes JSON/YAML (`src/export-command.ts`).                                                                                                             | Add a TUI command/popup to export the **most recent** (or selected) payload without leaving the TUI.                                                               |
| Resume generation from history or exported payload | `--resume-last`, `--resume <selector>`, `--resume-from <path>`, `--resume-mode strict\|best-effort` | Generate pipeline can start from a prior payload: reuses refinements and prior prompt state; **best-effort** skips missing file context; **strict** fails if file context paths are missing. Emits `resume.loaded` early (`src/generate/pipeline.ts`). | Add a TUI command/popup to resume the last run or a chosen entry/file. Ensure the TUI can “generate” even when the typed intent is empty (resume supplies intent). |
| Token budgets and deterministic overflow trimming  | `--max-input-tokens`, `--max-context-tokens`, `--context-overflow <strategy>`                       | Pipeline computes telemetry, optionally prunes **text context entries** (file/url/smart) according to strategy, then emits `context.overflow` + `context.telemetry` (`src/generate/pipeline.ts`).                                                      | TUI needs: (1) UI to set budgets/strategy, (2) visibility when trimming happened, (3) alignment between “attached context” UX and what actually went into the run. |
| New stream event types                             | `resume.loaded`, `context.overflow`                                                                 | Stream schema expanded in `src/generate/types.ts`. These events are also mirrored to interactive transport taps.                                                                                                                                       | TUI already consumes `onStreamEvent` (even when `--stream none`); it must handle these new events (history messages + state updates).                              |
| Generate payload schema versioning                 | `GenerateJsonPayload.schemaVersion === "1"`                                                         | Payload includes a `schemaVersion` constant (`src/generate/types.ts`). Export/resume validates `schemaVersion` (`src/generate/payload-io.ts`).                                                                                                         | TUI JSON payload display should include schema version (for audit/debug) and be resilient to future schema bumps.                                                  |
| Deterministic compose scaffold                     | `compose --recipe <path> --input <text>`                                                            | Reads a recipe file, outputs `recipe + "---" + input` to stdout (`src/compose-command.ts`).                                                                                                                                                            | Likely not worth adding to TUI (CLI/tooling oriented). If excluded, provide guidance in TUI help/docs.                                                             |

### User-visible behavior changes that matter for the TUI

- “Generate” can now be seeded from prior runs (history/payload files), and it explicitly reports what context was reused vs missing (`resume.loaded`).
- “Generate” can now **drop context deterministically** when budgets are enabled, and emits a structured explanation (`context.overflow`).
- History is no longer “just for humans” — it’s an API surface (export/resume).

---

## 2. Current TUI state (baseline)

This section summarizes current TUI capabilities to establish the baseline.

### Screens

Per `docs/tui-design.md`:

- Generate view: `src/tui/screens/command/CommandScreen.tsx` → `src/tui/screens/command/CommandScreenImpl.tsx`
- Test Runner view: `src/tui/screens/test-runner/TestRunnerScreen.tsx`

### Input routing invariants (must preserve)

Documented in `docs/tui-design.md` and reinforced in `src/tui/DEVELOPER_NOTE.md`:

1. **Help overlay** consumes input when open.
2. **Popup input** owns keyboard when open.
3. **Active screen** consumes keys otherwise.
4. **AppContainer global keys** are truly global (exit, switch screens, etc.).

### Generate view model

- Command palette + “slash commands” are defined in `src/tui/config.ts` (`COMMAND_DESCRIPTORS`).
- Popup state machine: `src/tui/popup-reducer.ts` + `src/tui/hooks/usePopupManager.ts`.
- Generation orchestration: `src/tui/hooks/useGenerationPipeline.ts` + `src/tui/generation-pipeline-reducer.ts`.
- Session reset/reuse logic: `src/tui/new-command.ts` (planned via `src/__tests__/new-command.test.ts`) + `src/tui/screens/command/hooks/useSessionCommands.ts`.

Current commands include models, context attachment, smart context toggles, series, copy/chatgpt/json toggles, and informational popups like `/tokens` and `/settings`.

---

## 3. Gap analysis

### Supported today

- Generate pipeline integration via `runGeneratePipeline()` with streamed progress, upload, iteration, and telemetry events.
- Context assembly surfaces:
  - File globs, URLs, images, videos, smart context toggle/root.
- Session resets (`/new`) and “reuse last prompt as meta instructions” (`/reuse`).
- Telemetry visibility (`/tokens`) and on-screen status chips.

### Missing (directly required by PR #14)

1. **Token budgets + overflow strategy configuration**
   - No TUI UI to set: `maxInputTokens`, `maxContextTokens`, `contextOverflow`.
   - TUI doesn’t surface `context.overflow` (dropped paths, strategy, before/after telemetry).
   - Budgets can be configured in CLI config (`src/config.ts`), but the TUI doesn’t display these defaults or let users override them.

2. **Resume workflows**
   - No TUI command to run with `--resume-last` / `--resume` / `--resume-from`.
   - TUI’s `runGeneration` currently **blocks generation** unless there’s typed intent or an intent file (`src/tui/hooks/useGenerationPipeline.ts`). This directly prevents “resume supplies intent” workflows.
   - No UX for `resume.loaded` (reused vs missing context paths) or `--resume-mode strict|best-effort`.

3. **Export workflow**
   - TUI can display JSON payload inline (`/json on`), but cannot export a payload to JSON/YAML the way `prompt-maker-cli export …` can.

### Needs redesign / explicit decisions

- **Mapping droppedPaths back to TUI context lists**:
  - The pipeline records `contextPaths` as resolved entries (file paths / URL paths), while the TUI stores user inputs (file globs, URL strings).
  - We likely cannot safely “edit the user’s globs” based on dropped file paths; instead, we should present dropped paths as **audit info**, not mutate the user’s inputs.

- **Resume semantics in TUI**:
  - CLI resume only reuses **file** context paths; URL/smart entries become “missing” (`src/generate/pipeline.ts`).
  - Decide whether TUI should follow this strictly, or whether it should offer an optional “rehydrate URL/smart by rerunning context resolution” (this would diverge from CLI behavior).

---

## 4. Proposed TUI UX updates

These proposals aim to keep the TUI keyboard-first and aligned with the existing command palette + popup model.

### 4.1 New/updated commands

Add these commands to `src/tui/config.ts` (`COMMAND_DESCRIPTORS`) and map them in `src/tui/hooks/popup-manager/command-mapping.ts`.

1. `/budgets`
   - Description: “Set token budgets + overflow strategy (generate mode).”
   - Opens a new popup to configure `maxInputTokens`, `maxContextTokens`, and `contextOverflow`.

2. `/resume` (and optionally `/resume-last` alias)
   - Description: “Resume from history or payload file.”
   - Opens a popup to choose:
     - source: history selector (`last`, `last:N`, `N`) or file path
     - mode: `best-effort` / `strict`
   - On confirm: triggers a generation run **without requiring typed intent**.

3. `/export`
   - Description: “Export a prior run payload to JSON/YAML.”
   - Opens a popup to choose:
     - selector (`last`, `last:N`, `N`)
     - format (`json`, `yaml`)
     - output path

Explicitly not in TUI (recommended):

- `/compose`: This is a deterministic “plumbing” tool intended for shell/editor integration (`src/compose-command.ts`). Keeping it CLI-only avoids cluttering the TUI’s generate-focused UX. Provide a help note that it exists.

### 4.2 New/updated popups

All new popups must:

- Be added to `src/tui/types.ts` popup union.
- Have explicit transitions in `src/tui/popup-reducer.ts`.
- Render via `src/tui/screens/command/components/PopupArea.tsx`.
- Own input (no fallthrough) per input routing invariants.

**A) Budgets popup** (`PopupState.type: 'budgets'`)

Fields:

- `maxContextTokens` (optional integer; empty = unset)
- `maxInputTokens` (optional integer; empty = unset)
- `contextOverflowStrategy` (enum: `fail`, `drop-smart`, `drop-url`, `drop-largest`, `drop-oldest`)

Validation:

- Non-empty tokens must be positive integers.
- If either budget is set, overflow strategy defaults to `fail` unless explicitly set.

UX:

- “Enable budgets” is implicit when either token field is set.
- “Disable budgets” = clear both token fields.
- Show inline preview of effective values (and whether config defaults are being overridden).

**B) Resume popup** (`PopupState.type: 'resume'`)

Fields:

- `sourceKind`: `history` | `file`
- If history:
  - `selector`: string (`last`, `last:N`, `N`)
- If file:
  - `payloadPath`: string (with suggestions scan like file/image popups)
- `mode`: `best-effort` | `strict`

UX:

- Confirm triggers a run.
- The popup itself should not perform heavy IO; it only gathers params.
- After the run starts, the popup closes and the run reports `resume.loaded` in history.

**C) Export popup** (`PopupState.type: 'export'`)

Fields:

- `selector`: `last` / `last:N` / `N`
- `format`: `json` | `yaml`
- `outPath`: string

UX:

- Confirm triggers export and prints a concise success/failure message to history (and optionally a toast).
- Prefer writing via a shared helper rather than invoking `runExportCommand()` (see Architecture section).

### 4.3 Help overlay updates

Update `src/tui/help-config.ts` to include:

- A brief “Budgets / Resume / Export” section.
- A one-line note that `/compose` exists as a CLI-only subcommand.

---

## 5. Architecture & state changes

### 5.1 State additions (suggested)

Add “run configuration” state that the generation pipeline can consume.

Recommended location:

- Extend the context state in `src/tui/context-store.ts` (or introduce a parallel store if you want to keep it “run config” vs “context”).

Suggested new fields:

- `budgetSettings`:
  - `maxInputTokens: number | null`
  - `maxContextTokens: number | null`
  - `contextOverflow: ContextOverflowStrategy | null`
- `resumeSettings` (ephemeral for the next run unless the maintainer wants persistence):
  - `resumeKind: 'none' | 'history' | 'file'`
  - `resumeSelector: string | null`
  - `resumeFromPath: string | null`
  - `resumeMode: 'best-effort' | 'strict'`
- `lastBudgetOverflow` (for `/tokens` popup):
  - `strategy`, `droppedPaths[]`, `before/after telemetry`
- `lastResumeLoaded` (for `/tokens` and audit):
  - `source`, `reusedContextPaths[]`, `missingContextPaths[]`

Alternatively (smaller surface area): store `lastBudgetOverflow` and `lastResumeLoaded` inside `src/tui/generation-pipeline-reducer.ts` since they’re stream-event driven.

### 5.2 Pipeline integration changes

Update `src/tui/hooks/useGenerationPipeline.ts`:

- Pass `maxInputTokens`, `maxContextTokens`, `contextOverflow`, and resume-related args into `GenerateArgs` when set.
- Modify `runGeneration` intent validation:
  - Today it blocks if no typed intent and no intent file.
  - New behavior: allow empty intent when **resume is explicitly requested**.

Handle new stream events in `handleStreamEvent`:

- `resume.loaded`:
  - Push a summary line into history (e.g., reused count, missing count).
  - Store the payload in state for `/tokens`.
  - If `resumeMode === 'strict'` and missing file paths exist, the pipeline already errors; ensure the TUI error message is surfaced cleanly.

- `context.overflow`:
  - Push a warning line into history: strategy + dropped count.
  - Optionally push a second line showing the first N dropped paths (avoid huge history spam).
  - Store the overflow details in state for `/tokens`.

### 5.3 Popup plumbing

Update the popup state machine:

- Add new popup types in `src/tui/types.ts`.
- Add new open actions in `src/tui/popup-reducer.ts` and wire them in `src/tui/hooks/usePopupManager.ts`.
- Extend `src/tui/hooks/popup-manager/command-mapping.ts` to map `/budgets`, `/resume`, and `/export` into open/submit steps.

### 5.4 Shared helpers (to avoid CLI-only coupling)

Avoid calling the CLI subcommand entrypoints from the TUI:

- `runExportCommand()` and `runComposeCommand()` are designed for process-level execution (yargs parsing + `process.exitCode`).

Instead, add small shared helpers:

- `src/history/generate-history.ts` (new) — pure functions to:
  - read `history.jsonl`
  - select “from end” via selector
  - validate payload schema via `src/generate/payload-io.ts` validators
- `src/export/export-generate-payload.ts` (new) — pure function that writes JSON/YAML given a payload + format + output path.

Then:

- CLI `src/export-command.ts` uses the helpers.
- TUI uses the helpers.

This keeps changes small and avoids duplicating “read history + validate payload + serialize” logic.

### 5.5 Async work + correctness risks

- **Scan ID guards**: if Resume popup adds file-path suggestions, follow the existing scan-orchestrator pattern (`src/tui/hooks/popup-manager/scan-orchestrator.ts`) and preserve scanId guards from `src/tui/popup-reducer.ts`.
- **Stale closures**: stream handlers should remain stable; use refs where needed (pattern documented in `src/tui/DEVELOPER_NOTE.md` and used in `src/tui/hooks/useGenerationPipeline.ts`).
- **Large lists**: `context.overflow.droppedPaths` can be large; cap preview output and render in a windowed list component if shown in a popup.

---

## 6. Phased implementation plan

Phases are designed to be small, testable increments (per `AGENTS.md` hygiene guidance).

### Phase 0 — Surface new stream events (no new commands)

**Scope**

- Add support for `resume.loaded` and `context.overflow` in the TUI’s event stream handler.

**Primary files**

- `src/tui/hooks/useGenerationPipeline.ts`
- `src/tui/generation-pipeline-reducer.ts` (if adding state for last overflow/resume)
- `src/__tests__/tui/generation-pipeline-reducer.test.ts` (new or updated)

**Steps**

- Add `case 'resume.loaded'` and `case 'context.overflow'` to `handleStreamEvent`.
- Store the last overflow/resume info for later display.
- Ensure history output is concise and capped.

**Acceptance criteria**

- When budgets trigger trimming, the TUI shows a clear “overflow happened” message.
- When resume is used (via CLI args when launching TUI, or future commands), the TUI displays reused/missing counts.
- No input routing regressions (help/popup still own input).

### Phase 1 — Add budgets UI and pipeline args

**Scope**

- Let users configure budgets + overflow strategy inside the TUI.

**Primary files**

- `src/tui/config.ts` (add `/budgets` command)
- `src/tui/types.ts` (add popup union member)
- `src/tui/popup-reducer.ts` (open + transitions)
- `src/tui/hooks/usePopupManager.ts` + `src/tui/hooks/popup-manager/command-mapping.ts`
- `src/tui/screens/command/components/PopupArea.tsx`
- `src/tui/components/popups/` (new `BudgetsPopup.tsx`)
- `src/tui/context-store.ts` (store budget settings)
- `src/tui/hooks/useGenerationPipeline.ts` (pass args)

**Steps**

- Add `BudgetsPopup` with validation and predictable `Esc` dismissal.
- Persist budget settings in TUI state (session-scoped initially).
- Pass `maxInputTokens`, `maxContextTokens`, `contextOverflow` to `runGeneratePipeline()`.

**Acceptance criteria**

- Setting budgets changes behavior deterministically (overflow event appears when expected).
- Clearing budgets returns to pre-budget behavior.
- `/tokens` reflects the latest telemetry and overflow outcome.

### Phase 2 — Add resume UI (history selector + payload file)

**Scope**

- Let users resume from:
  - last history entry
  - a selected history entry
  - an exported payload file

**Primary files**

- `src/tui/config.ts` (add `/resume` command)
- `src/tui/types.ts`, `src/tui/popup-reducer.ts`, `src/tui/hooks/usePopupManager.ts`
- `src/tui/hooks/useGenerationPipeline.ts` (allow empty intent when resuming)
- `src/tui/components/popups/` (new `ResumePopup.tsx`)

**Steps**

- Implement `ResumePopup`:
  - choose source
  - choose selector or file
  - choose mode
- Extend `runGeneration` guard so resume runs without typed intent.
- Ensure history clearly shows:
  - “resumed” status
  - missing paths summary
  - strict-mode failure messaging

**Acceptance criteria**

- Resume from history works with empty typed intent.
- Best-effort mode continues when files are missing; strict mode fails with an actionable message.
- Popup input ownership is preserved (no key fallthrough).

### Phase 3 — Add export UI (write JSON/YAML)

**Scope**

- Export last or selected payload from history.

**Primary files**

- `src/tui/config.ts` (add `/export` command)
- `src/tui/components/popups/ExportPopup.tsx` (new)
- New shared helpers:
  - `src/history/generate-history.ts` (new)
  - `src/export/export-generate-payload.ts` (new)
- CLI update:
  - `src/export-command.ts` updated to use helpers

**Steps**

- Implement an export helper with no process-level side effects.
- Implement `ExportPopup` that calls the helper.
- Print success to history and optionally a toast.

**Acceptance criteria**

- Export produces a file identical in content to CLI export for the same selector.
- Errors are actionable (missing history file, selector out of range, permission issues).

### Phase 4 — Polish + docs/help consistency

**Scope**

- Update help overlay and ensure discoverability.

**Primary files**

- `src/tui/help-config.ts`
- `docs/tui-design.md` (optional follow-up; not required for implementation)

**Acceptance criteria**

- Help overlay mentions budgets/resume/export.
- Commands are discoverable via `Ctrl+G` palette and `/` filtering.

---

## 7. Tests & verification

### Unit tests (Jest)

Add/update reducer-focused tests under `src/**/__tests__/**` (per `AGENTS.md`).

Recommended tests:

- `src/__tests__/tui/generation-pipeline-reducer.test.ts`
  - New actions/state for “last overflow” and “last resume loaded” (if stored in reducer).
  - Ensure `generation-start` clears previous run’s overflow/resume details.

- `src/__tests__/popup-reducer.test.ts`
  - Add transitions for new popup types (`budgets`, `resume`, `export`).
  - Ensure scan-id behavior is preserved if resume adds suggestion scanning.

- `src/__tests__/tui/command-mapping.test.ts` (new)
  - Verify `/budgets`, `/resume`, `/export` map to the intended popup open steps.
  - Validate error handling (invalid selector, invalid integers) remains deterministic.

- `src/__tests__/tui/use-generation-pipeline-events.test.ts` (optional)
  - Narrow unit tests for `handleStreamEvent` formatting for `context.overflow` and `resume.loaded`.

### Manual verification checklist

Use the existing TUI checklist in `src/tui/DEVELOPER_NOTE.md` and add PR #14-specific checks:

Input routing invariants:

- Help overlay open suppresses screen + popup input.
- Popup open suppresses screen input (typing, submit, shortcuts).
- `Esc` closes popups but never exits.

Budgets:

- Enable budgets with a tiny `max-context-tokens` and confirm:
  - a `context.overflow` message appears
  - `/tokens` shows overflow strategy + dropped paths summary
- Disable budgets and confirm overflow no longer triggers.

Resume:

- Resume last entry with `best-effort`:
  - missing file paths produce warnings but run continues
- Resume with `strict`:
  - missing file paths fail fast with a clear error

Export:

- Export last run to JSON and YAML:
  - ensure files are written
  - ensure payload includes `schemaVersion`

Performance:

- Confirm large dropped-paths lists do not freeze the UI (cap preview, window large lists).

---

## 8. Open questions / decisions needed

1. **Persistence**: Should budgets/resume/export defaults be persisted into `~/.config/prompt-maker-cli/config.json`?
   - Today `src/config.ts` supports reading promptGenerator budgets, but the repo only has a writer for theme settings.
   - If we want persistence, we likely need a safe “promptGenerator settings patch” writer (small, focused addition).

2. **Series budgets**: Should `/series` apply budgets/overflow trimming too?
   - Today series generation uses `generatePromptSeries()` directly in `src/tui/hooks/useGenerationPipeline.ts` and resolves context itself.
   - For consistency, apply `evaluateContextBudget()` to series context as well (same semantics as generate).

3. **Resume parity**: Should the TUI follow CLI resume semantics exactly (only reuse file paths), or should it optionally rehydrate URL/smart context?
   - Matching CLI behavior reduces surprise and keeps parity with `docs/neovim-plugin-integration.md`.
   - Rehydrating URLs/smart could be “TUI convenience” but risks divergence.

4. **Export selector UX**: Do we need a picker UI over history entries, or is typed selector (`last:N`) sufficient?
   - A picker is nicer UX but requires reading/parsing history (and possibly rendering timestamps/intents).
   - A typed selector keeps implementation smaller.

5. **Schema future-proofing**: How should the TUI behave when `schemaVersion` increments?
   - Option A: refuse resume/export with an actionable message.
   - Option B: allow export of unknown versions but restrict resume.
