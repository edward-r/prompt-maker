# Refactor Triage Report — Ink/React TUI (TypeScript)

This report **intentionally ignores anything under `legacy docs/`**.

## Scope

Primary refactor scope is the Ink/React TUI under `src/tui/**`. Related “call-into” code is included only when directly implicated:

- `src/prompt-generator-service.ts`
- (`src/generate-command.ts` exists but is only re-exports)

Global constraints respected in recommendations:

- Preserve user-visible behavior by default.
- Keep entry behavior stable: `src/index.ts`, `src/tui/index.tsx`.
- Strict TS (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), **no `any`**.
- Avoid heavy new dependencies.
- Keep TUI functional in TTY and non-TTY contexts.

## Summary

- Biggest “god modules” by size and concern-mixing: `src/tui/hooks/usePopupManager.ts` (989 LOC), `src/tui/hooks/useGenerationPipeline.ts` (951 LOC), `src/tui/screens/command/hooks/useContextPopupGlue.ts` (933 LOC).
- Highest correctness risk cluster: input routing + popup ownership + async scan results (fallthrough and race potential).
- Highest performance risk cluster: typing hot paths that do sync IO or heavy recomputation; streaming history formatting emitting many entries.
- Largest UI surface-area hotspots: `src/tui/components/popups/ListPopup.tsx` (457 LOC) and `src/tui/screens/command/components/PopupArea.tsx` (351 LOC).
- Cross-cutting behavior hotspot with an explicit TODO: `src/tui/notifier.ts` (293 LOC) toast dedupe semantics.
- Theme stack is correctness-sensitive and borderline oversized: `src/tui/theme/theme-loader.ts` (398 LOC), `src/tui/theme/theme-provider.tsx` (295 LOC).

## Prompt Plan (single, dependency-ordered)

Each prompt is a discrete “tests + refactor” effort. The prompts are ordered so later work builds on earlier extracted/tested helpers, with **no duplicated steps**.

1. **Prompt 01 — Popup reducer hardening (baseline)**
   - Add tests that lock popup scan staleness gating and `set`/scan preservation rules; do minimal reducer cleanup only if it improves testability.
   - Validate: `npm test`, `npm run typecheck`.
2. **Prompt 02 — Extract + test list windowing primitives**
   - Extract pure windowing/selection/header-visibility helpers used by popups; add unit tests.
   - Validate: `npm test`, `npm run typecheck`.
3. **Prompt 03 — Remove sync FS IO from typing hot path**
   - Replace `fs.statSync`/sync checks in `src/tui/screens/command/hooks/useCommandScreenShell.ts` with cached/async detection; add tests for parsing + detector behavior.
   - Validate: `npm test`, `npm run typecheck`; manual: rapid typing + drag/drop paste.
4. **Prompt 04 — Decompose `PopupArea` (mechanical split)**
   - Split `src/tui/screens/command/components/PopupArea.tsx` into per-popup renderers or a `switch`-based dispatcher; no behavior changes.
   - Validate: `npm test`, `npm run typecheck`; manual: open each popup and verify keys.
5. **Prompt 05 — Refactor `ListPopup` to view-model + renderer**
   - Use helpers from Prompt 02; unify “suggestions” vs “simple” paths in `src/tui/components/popups/ListPopup.tsx`.
   - Validate: `npm test`, `npm run typecheck`; manual: file/image/video popups, focus/selection.
6. **Prompt 06 — Refactor `ModelPopup` row/window logic**
   - Use helpers from Prompt 02; extract row-building/windowing from `src/tui/components/popups/ModelPopup.tsx` and add tests.
   - Validate: `npm test`, `npm run typecheck`.
7. **Prompt 07 — Reduce command-screen plumbing surface**
   - Normalize/cluster types and return shapes in `src/tui/screens/command/hooks/useCommandScreenPopupBindings.ts` and simplify high-churn bundling in `src/tui/screens/command/hooks/useCommandScreenController.ts` (no behavioral changes); add a “shape contract” test.
   - Validate: `npm test`, `npm run typecheck`.
8. **Prompt 08 — Split `useContextPopupGlue` by popup type**
   - Decompose `src/tui/screens/command/hooks/useContextPopupGlue.ts` into per-popup hooks; extract pure popup-mutation helpers; add tests for helpers.
   - Validate: `npm test`, `npm run typecheck`; manual: add/remove + suggestions + auto-add path detection.
9. **Prompt 09 — Split `usePopupManager` (commands vs scans vs effects)**
   - Decompose `src/tui/hooks/usePopupManager.ts` into command→intent mapping + scan orchestration + effectful executors; add tests for mapping + scan staleness.
   - Validate: `npm test`, `npm run typecheck`; manual: fast popup switching while scans in flight.
10. **Prompt 10 — Stabilize `useGenerationPipeline` (buffering + isolation)**

- Extract pure formatting helpers + tests; add buffered history writes while preserving order/content; isolate series artifact IO; update any directly implicated call-into code in `src/prompt-generator-service.ts` only if required.
- Validate: `npm test`, `npm run typecheck`; manual: long streaming generation + refinement.

11. **Prompt 11 — Theme subsystem split (loader/provider)**

- Split `src/tui/theme/theme-loader.ts` into discovery/validate/adapt modules; add fixture-driven tests; small provider extraction in `src/tui/theme/theme-provider.tsx` if it improves testability.
- Validate: `npm test`, `npm run typecheck`; manual: switch theme/mode and restart.

12. **Prompt 12 — Notifier/toast refactor (tests-first within prompt)**

- Add tests locking current toast behavior; refactor internals into pure transition helpers + timer wiring (no UX change unless explicitly requested).
- Validate: `npm test`, `npm run typecheck`; manual: toasts during generation.

## Inventory & Size Scan

LOC method: counted newline-separated lines from files under `src/tui/**` plus related files listed above.

Thresholds:

- Warn: > 250 LOC
- High priority: > 400 LOC
- Critical: > 700 LOC

Current counts:

- Files scanned: 159
- > 250 LOC: 19
- > 400 LOC: 5
- > 700 LOC: 3

## Ranked Refactor Candidate Table

| Rank | File path                                                        | LOC | Category         | Key issues                                                                                                         | Evidence (concrete)                                                                                                                                                                                                                                                                                              | Suggested refactor direction                                                                                                                                                                                                                                              | Suggested prompt(s)                |
| ---: | ---------------------------------------------------------------- | --: | ---------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
|    1 | `src/tui/hooks/usePopupManager.ts`                               | 989 | Both             | God-hook: popup state + command semantics + IO + scanning<br>Very wide dependency surface increases change risk    | Huge `UsePopupManagerOptions` surface (many setters + state)<br>Large command handler switch (`handleCommandSelection(...)`) opens popups, toggles settings, triggers flows (series/test/exit)<br>Reads intent file via `fs.readFile(...)` inside the handler<br>Starts async scans via `runSuggestionScan(...)` | Split into: (1) pure command→intent mapping, (2) scan orchestration boundary, (3) effectful executors<br>Keep popup transitions in reducer; migrate ad-hoc `setPopupState(prev => ...)` mutations to explicit actions<br>Add tests for command mapping and scan staleness | Prompt 09 (builds on Prompt 01)    |
|    2 | `src/tui/hooks/useGenerationPipeline.ts`                         | 951 | Both             | Mixed concerns: orchestration + formatting + IO + state<br>Potential render/update churn during streaming          | `handleStreamEvent(...)` wraps/splits (`wrapAnsi`) and pushes many history entries per event<br>JSON display path emits wrapped lines<br>Series artifact IO uses `fs.mkdir`/`fs.writeFile`                                                                                                                       | Extract pure formatting helpers + tests; introduce buffered history writes (preserve order/content); isolate series artifact IO                                                                                                                                           | Prompt 10                          |
|    3 | `src/tui/screens/command/hooks/useContextPopupGlue.ts`           | 933 | Both             | God-hook for file/url/image/video/smart popups<br>Repeated `setPopupState` mutation patterns and per-popup effects | Screen-level key handler uses `useInput(..., { isActive: !isPopupOpen && !helpOpen })`<br>Auto-add effects for media drafts (drag-drop parsing)<br>Repeated suggestion filtering + “defocus if empty” effects                                                                                                    | Split into per-popup hooks; extract pure popup-mutation helpers; add unit tests                                                                                                                                                                                           | Prompt 08 (builds on Prompt 02/05) |
|    4 | `src/tui/components/popups/ListPopup.tsx`                        | 457 | Both             | Duplicated rendering paths (“suggestions” vs “simple”)<br>Large component with UI/layout logic baked in            | Two major render branches with overlapping structure<br>Windowing logic embedded at component level                                                                                                                                                                                                              | Extract pure view-model builder + tests; unify render path with optional suggestions panel                                                                                                                                                                                | Prompt 02 → Prompt 05              |
|    5 | `src/tui/screens/command/hooks/useCommandScreenPopupBindings.ts` | 404 | Size             | Large option/result types; high plumbing overhead                                                                  | Options mix unrelated groups (paste/popup/menu/generation/context)<br>Returns a large flattened object surface                                                                                                                                                                                                   | Group options/returns; add a “shape contract” test; reduce dependency-churn risk                                                                                                                                                                                          | Prompt 07                          |
|    6 | `src/tui/theme/theme-loader.ts`                                  | 398 | Size             | Mixed discovery + parsing + validation + schema adaptation                                                         | Embedded validation + opencode-schema adaptation<br>`loadThemes(...)` orchestrates builtin/global/project scanning                                                                                                                                                                                               | Split into focused modules; add fixture-driven tests                                                                                                                                                                                                                      | Prompt 11                          |
|    7 | `src/tui/screens/command/components/PopupArea.tsx`               | 351 | Anti-pattern     | Large prop drilling surface<br>Long conditional chain to pick popup UI                                             | `PopupAreaProps` contains many per-popup fields/handlers<br>Large conditional selection by `popupState.type`                                                                                                                                                                                                     | Split into per-popup renderer helpers/components; reduce prop surface via view-model objects where possible                                                                                                                                                               | Prompt 04                          |
|    8 | `src/tui/components/popups/ModelPopup.tsx`                       | 317 | Size             | UI formatting and list-building logic bundled into one component                                                   | `buildRows(...)` groups “Recent” and provider headers<br>Windowing + “header visibility” logic local to component                                                                                                                                                                                                | Extract pure row building/windowing helpers + tests                                                                                                                                                                                                                       | Prompt 02 → Prompt 06              |
|    9 | `src/tui/screens/command/hooks/useCommandScreenController.ts`    | 310 | Size             | Large “options bundling” with long dependency arrays                                                               | Many large `useMemo` option objects + long dep lists                                                                                                                                                                                                                                                             | Reduce bundling surface and dependency churn; keep behavior stable                                                                                                                                                                                                        | Prompt 07                          |
|   10 | `src/tui/popup-reducer.ts`                                       | 302 | Size             | Large but pure; risk is maintainability, not correctness                                                           | Many popup types/actions handled in one `switch`                                                                                                                                                                                                                                                                 | Add/expand reducer tests; optional small refactor to reduce duplication                                                                                                                                                                                                   | Prompt 01                          |
|   11 | `src/tui/theme/theme-provider.tsx`                               | 295 | Both             | Effectful init + persistence + preview logic in one provider                                                       | Initial load effect has multi-branch error handling<br>Provides `previewTheme`, `setTheme`, `setMode`                                                                                                                                                                                                            | Extract pure selectors from effectful persistence; add fallback tests                                                                                                                                                                                                     | Prompt 11                          |
|   12 | `src/tui/notifier.ts`                                            | 293 | Anti-pattern     | Known semantics issue: toast dedupe likely wrong for progress updates<br>Timer bookkeeping complexity              | Top-of-file TODO calls out dedupe is wrong<br>`showToast(...)` reuses latest toast when message+kind match                                                                                                                                                                                                       | Add tests to lock current semantics; refactor internals into pure transitions + timer wiring                                                                                                                                                                              | Prompt 12                          |
|   13 | `src/tui/screens/command/hooks/useCommandScreenShell.ts`         | 276 | Anti-pattern     | Synchronous filesystem IO on typing hot-path                                                                       | `droppedFilePath` uses `fs.statSync(...)` inside a `useMemo` depending on `inputValue`                                                                                                                                                                                                                           | Replace with cached/async detection; test parsing and detector behavior                                                                                                                                                                                                   | Prompt 03                          |
|   14 | `src/tui/components/core/InputBar.tsx`                           | 274 | Size             | Some render-time string/layout work is non-trivial<br>Many derived computations from `statusChips`                 | Status line width computation and segment extraction per render                                                                                                                                                                                                                                                  | Optional: extract pure status-summary helper + tests if touched while reducing command-screen plumbing                                                                                                                                                                    | Prompt 07 (optional)               |
|   15 | `src/prompt-generator-service.ts`                                | 257 | Both (call-into) | Correctness-sensitive series repair flow embedded in service                                                       | `generatePromptSeries(...)` repair loop with `MAX_SERIES_REPAIR_ATTEMPTS`                                                                                                                                                                                                                                        | Only refactor if directly implicated by pipeline changes; add unit tests around attempt counting/error surfacing (no network)                                                                                                                                             | Prompt 10 (only if needed)         |

## Quick Wins (low risk, high value)

- Prompt 01: add popup reducer tests (high leverage, low risk).
- Prompt 03: remove sync `fs.statSync` from the `inputValue` hot path.
- Prompt 04: split `PopupArea` into per-popup renderers.
- Prompt 02 → Prompt 05: extract list helpers then unify `ListPopup` rendering.

## Deep Work Items (higher risk / broad impact)

- Prompt 09 (`src/tui/hooks/usePopupManager.ts`): highest coupling to input routing + async scans.
- Prompt 10 (`src/tui/hooks/useGenerationPipeline.ts`): streaming correctness and performance-sensitive.
- Prompt 08 (`src/tui/screens/command/hooks/useContextPopupGlue.ts`): many per-popup behaviors and effects; regressions are subtle.

## Validation Guidance

Commands (from `AGENTS.md`):

- `npm run typecheck`
- `npm test`
- `npm run build`

Manual checks (high value for TUI refactors):

- Input routing priority: help overlay suppresses popup and screen input; popup owns keyboard when open.
- Typing responsiveness: quickly type and open/close popups; look for lag.
- Paste behavior: bracketed paste large input; ensure no double-insert and token label rendering stays correct.
- Streaming generation: ensure history updates are ordered and not duplicated.
- Non-TTY contexts: run in a non-interactive environment and ensure no crashes.

---

## Prompt 01 — Popup reducer hardening (baseline)

## Role

You are a senior TypeScript engineer working in an Ink/React TUI codebase.

## Goal

Lock in existing popup state machine behavior with unit tests and do a minimal refactor **only if it improves testability/readability**. **No user-visible behavior changes.**

## Scope (only these files, unless truly necessary)

- Primary implementation file: `src/tui/popup-reducer.ts`
- Tests: `src/__tests__/tui/**` (create a new test file if needed)

## What to accomplish

### 1) Add/extend unit tests for `popupReducer`

Add tests that cover these behaviors **explicitly and concretely**:

#### A. Scan staleness gating

When `popupReducer` receives `scan-suggestions-success`, it must only apply suggestions if:

- `state.activeScan` is non-null AND
- `state.activeScan.kind === action.kind` AND
- `state.activeScan.id === action.scanId`

If any of those don’t match, reducer must return the **same state object** (or at least preserve `popupState` and `activeScan` unchanged).

Test at least:

- Mismatched `kind` does not apply suggestions.
- Mismatched `scanId` does not apply suggestions.
- Null `activeScan` does not apply suggestions.

#### B. Scan success clears activeScan and applies suggestions to the right popup type

When it _does_ match, reducer must:

- Apply `suggestions` to the correct popup state fields for that popup type
- Reset `suggestedSelectionIndex` to `0`
- Set `suggestedFocused` to `false`
- Set `activeScan` to `null`

Test at least one of:

- `open-file` → `scan-suggestions-success`(file) updates file popup suggestedItems
- `open-image` → `scan-suggestions-success`(image) updates image popup suggestedItems

#### C. `set` action preserves scan only when popup type does not change

Behavior to lock in:

- If `action.type === 'set'` and the popup **type stays the same**, preserve `activeScan`.
- If popup **type changes**, clear `activeScan`.

Test at least:

- Start with a file popup + activeScan `{kind:'file', id: 123}`.
- Run `set` that updates the file popup (type remains `'file'`) and verify `activeScan` is preserved.
- Run `set` that changes popup to another type (e.g. `'smart'` or `'model'`) and verify `activeScan` becomes `null`.

### 2) Minimal refactor (optional, must be behavior-preserving)

You may do a small refactor in `src/tui/popup-reducer.ts` if and only if it:

- reduces duplication (e.g. suggestion application),
- improves clarity,
- and keeps behavior identical (tests must prove it).

Do **not** add dependencies. Do **not** change popup schemas.

## Test file naming/location

Create something like:

- `src/__tests__/tui/popup-reducer.test.ts`

Follow existing Jest patterns in `src/__tests__/tui/`.

## Validation requirements

- `npm test`
- `npm run typecheck`

## Constraints

- TypeScript strict; **no `any`**.
- Preserve behavior; no UX changes.
- Reducer must remain pure (no Ink/React imports).
- Prefer tests that assert specific fields (`suggestedItems`, `suggestedSelectionIndex`, `suggestedFocused`, `activeScan`) rather than snapshot testing.

## Deliverable

- Tests added/updated and passing.
- Any refactor is minimal and justified by reduced duplication or improved readability.
- Summarize what the tests now guarantee.
