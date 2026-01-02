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

1. **Prompt 01 — Popup reducer hardening (baseline)** — Add tests for scan staleness gating + `set` scan preservation in `src/tui/popup-reducer.ts`; minimal reducer cleanup only if it improves testability. Validate: `npm test`, `npm run typecheck`.
2. **Prompt 02 — Extract + test list windowing primitives** — Extract pure windowing/selection/header-visibility helpers used by popups; add unit tests. Validate: `npm test`, `npm run typecheck`.
3. **Prompt 03 — Remove sync FS IO from typing hot path** — Replace `fs.statSync`/sync checks in `src/tui/screens/command/hooks/useCommandScreenShell.ts` with cached/async detection; add tests for parsing + detector behavior. Validate: `npm test`, `npm run typecheck`. Manual: rapid typing + drag/drop paste.
4. **Prompt 04 — Decompose `PopupArea` (mechanical split)** — Split `src/tui/screens/command/components/PopupArea.tsx` into per-popup renderers or a `switch`-based dispatcher; no behavior changes. Validate: `npm test`, `npm run typecheck`. Manual: open each popup and verify keys.
5. **Prompt 05 — Refactor `ListPopup` to view-model + renderer** — Use helpers from Prompt 02; unify “suggestions” vs “simple” paths in `src/tui/components/popups/ListPopup.tsx`; add view-model tests. Validate: `npm test`, `npm run typecheck`. Manual: file/image/video popups, focus/selection.
6. **Prompt 06 — Refactor `ModelPopup` row/window logic** — Use helpers from Prompt 02; extract row-building/windowing from `src/tui/components/popups/ModelPopup.tsx` and add tests. Validate: `npm test`, `npm run typecheck`.
7. **Prompt 07 — Reduce command-screen plumbing surface** — Normalize/cluster types and return shapes in `src/tui/screens/command/hooks/useCommandScreenPopupBindings.ts` + simplify bundling in `src/tui/screens/command/hooks/useCommandScreenController.ts` (no behavioral changes); add a “shape contract” test. Validate: `npm test`, `npm run typecheck`.
8. **Prompt 08 — Split `useContextPopupGlue` by popup type** — Decompose `src/tui/screens/command/hooks/useContextPopupGlue.ts` into per-popup hooks; extract pure popup-mutation helpers; add helper tests. Validate: `npm test`, `npm run typecheck`. Manual: add/remove + suggestions + auto-add path detection.
9. **Prompt 09 — Split `usePopupManager` (commands vs scans vs effects)** — Decompose `src/tui/hooks/usePopupManager.ts` into command→intent mapping + scan orchestration + effectful executors; add tests for mapping + scan staleness. Validate: `npm test`, `npm run typecheck`. Manual: fast popup switching while scans in flight.
10. **Prompt 10 — Stabilize `useGenerationPipeline` (buffering + isolation)** — Extract pure formatting helpers + tests; add buffered history writes while preserving order/content; isolate series artifact IO; update `src/prompt-generator-service.ts` only if directly implicated. Validate: `npm test`, `npm run typecheck`. Manual: long streaming generation + refinement.
11. **Prompt 11 — Theme subsystem split (loader/provider)** — Split `src/tui/theme/theme-loader.ts` into discovery/validate/adapt modules; add fixture-driven tests; small provider extraction in `src/tui/theme/theme-provider.tsx` if it improves testability. Validate: `npm test`, `npm run typecheck`. Manual: switch theme/mode and restart.
12. **Prompt 12 — Notifier/toast refactor (tests-first within prompt)** — Add tests locking current toast behavior; refactor internals into pure transition helpers + timer wiring (no UX change unless explicitly requested). Validate: `npm test`, `npm run typecheck`. Manual: toasts during generation.

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

---

## Prompt 02 — Extract + test list windowing primitives

## Role

You are a senior TypeScript engineer working in an Ink/React TUI codebase.

## Goal

Extract shared, **pure** list windowing/selection helpers used by popups so list behavior is testable and future refactors (Prompt 05/06) are lower risk. **No user-visible behavior changes.**

## Scope (only these files, unless truly necessary)

- Implementation targets (logic extraction only):
  - `src/tui/components/popups/ListPopup.tsx`
  - `src/tui/components/popups/ModelPopup.tsx`
- New pure helper module(s) (your choice of exact filenames, but keep them under `src/tui/components/popups/`):
  - Example: `src/tui/components/popups/list-windowing.ts`
- Tests:
  - `src/__tests__/tui/**` (create a new test file if needed)

## What to accomplish

### 1) Identify the shared primitives

From `ListPopup` and `ModelPopup`, extract pure helpers for (as applicable):

- “Visible window” calculations (given `items`, `selectionIndex`, `maxRows` → `{ start, end, visibleItems }`).
- Selection clamping (never allow selection outside bounds).
- Header/section visibility rules (e.g., keep headers visible when window moves).

### 2) Refactor components to use helpers

- Keep JSX output the same.
- Keep data shaping the same (do not change item ordering, grouping, or focus behavior).
- Ensure helpers don’t import Ink/React.

### 3) Add unit tests for the helpers

Add tests that lock current behavior for edge cases:

- Empty items.
- Single item.
- Selection at start/end.
- Small window sizes (e.g. 1–3 rows).
- Window movement when selection changes.

## Validation requirements

- `npm test`
- `npm run typecheck`

## Constraints

- TypeScript strict; **no `any`**.
- Helpers must be pure (no IO; no Ink/React imports).
- Preserve existing ordering and rendering semantics.

## Deliverable

- Shared helper module(s) added under `src/tui/components/popups/`.
- `ListPopup` and `ModelPopup` updated to use helpers.
- Tests added that lock current windowing behavior.

---

## Prompt 03 — Remove sync FS IO from typing hot path

## Role

You are a senior TypeScript engineer optimizing TUI responsiveness.

## Goal

Eliminate synchronous filesystem checks during typing (render hot path) while preserving behavior.

## Scope (only these files, unless truly necessary)

- `src/tui/screens/command/hooks/useCommandScreenShell.ts`
- New hook module (under the same directory):
  - Example: `src/tui/screens/command/hooks/useDroppedFileDetection.ts`
- Optional: pure parsing helper module if extracted
- Tests: `src/__tests__/tui/**`

## What to accomplish

### 1) Remove sync stat from render-time path

- Replace any `fs.statSync(...)`/similar sync IO triggered by `inputValue` changes with:
  - a cached state value (ref/state), and
  - an async effect that updates the cache.

### 2) Preserve current UX semantics

- Dropped-path detection should still work for the same inputs.
- If timing can differ slightly due to async IO, ensure it’s not user-visible (or call it out clearly as a small risk and provide manual validation steps).

### 3) Add tests

- Unit test any pure “candidate parsing” logic (string → maybe path).
- If you introduce a hook, test its behavior using mocks (no real FS dependency).

## Validation requirements

- `npm test`
- `npm run typecheck`

## Manual validation

- Rapidly type in the input bar with long history; confirm no lag.
- Paste/drag-drop an absolute path and confirm it’s detected the same way.

## Constraints

- Strict TS; **no `any`**.
- No behavior changes.
- No new heavy dependencies.

## Deliverable

- No synchronous FS IO in the typing hot path.
- Tests added to lock parsing/detection semantics.

---

## Prompt 04 — Decompose `PopupArea` (mechanical split)

## Role

You are a senior Ink/React TUI engineer focused on maintainability.

## Goal

Refactor `PopupArea` into smaller renderer units without changing behavior.

## Scope (only these files, unless truly necessary)

- `src/tui/screens/command/components/PopupArea.tsx`
- Optional new subcomponents in `src/tui/screens/command/components/` (or a subfolder)
- Tests: `src/__tests__/tui/**` (only if there’s an appropriate existing pattern)

## What to accomplish

### 1) Replace the mega-conditional

- Convert the long conditional chain into a clear dispatcher (prefer `switch (popupState.type)`), delegating each popup type to a small renderer function/component.

### 2) Reduce prop plumbing risk (without behavior change)

- If possible, introduce a small “view model” per popup type (object containing exactly what that renderer needs).
- Do not change existing popup logic; this is a rendering-level refactor.

### 3) Add lightweight guard tests (optional)

- If the repo has existing tests around popup rendering selection, extend them.
- Otherwise, skip tests here and rely on typechecking + existing integration tests.

## Validation requirements

- `npm test`
- `npm run typecheck`

## Manual validation

- Open each popup type and confirm key handling matches (popup owns keyboard; screen doesn’t receive keys).

## Constraints

- No UX changes.
- No new dependencies.

## Deliverable

- `PopupArea` is shorter and delegates per popup type.

---

## Prompt 05 — Refactor `ListPopup` to view-model + renderer

## Role

You are a senior Ink/React TUI engineer.

## Goal

Remove duplication in `ListPopup` by using a single render path driven by a pure view-model builder, while preserving behavior.

## Scope (only these files, unless truly necessary)

- `src/tui/components/popups/ListPopup.tsx`
- New pure helper(s):
  - Example: `src/tui/components/popups/list-popup-model.ts`
- Tests: `src/__tests__/tui/**`

## What to accomplish

### 1) Create a pure view-model builder

Inputs should include everything `ListPopup` currently uses (items, suggestions, selection indices, focus flags, max heights, etc.).
Output should include:

- The computed visible rows/sections.
- The computed selection cursor positioning.
- Any derived flags that influence rendering.

### 2) Use one rendering path

- Unify “has suggestions” and “no suggestions” rendering.
- Preserve ordering, focus semantics, selection semantics, and labels.

### 3) Add unit tests for the view-model

Lock behavior:

- Suggestions present vs absent.
- Selection clamping.
- Focus switching between suggested/selected.
- Windowing behavior (from Prompt 02 helpers).

## Validation requirements

- `npm test`
- `npm run typecheck`

## Constraints

- Strict TS; **no `any`**.
- No behavior changes.

## Deliverable

- `ListPopup` duplication removed.
- View-model tests added.

---

## Prompt 06 — Refactor `ModelPopup` row/window logic

## Role

You are a senior Ink/React TUI engineer.

## Goal

Extract and test the row building/windowing logic in `ModelPopup` so it’s easier to extend safely.

## Scope (only these files, unless truly necessary)

- `src/tui/components/popups/ModelPopup.tsx`
- New pure helper(s):
  - Example: `src/tui/components/popups/model-popup-model.ts`
- Tests: `src/__tests__/tui/**`

## What to accomplish

### 1) Extract pure row building

- Convert “recent models”, provider grouping, and header rows into a pure function.
- Keep the output identical.

### 2) Extract pure windowing/visibility rules

- Ensure headers behave the same (visibility as selection moves).

### 3) Add unit tests

Lock behavior:

- Grouping of recent vs provider sections.
- Ordering.
- Selection movement and windowing behavior.

## Validation requirements

- `npm test`
- `npm run typecheck`

## Constraints

- No behavior changes.
- Helpers must be pure.

## Deliverable

- `ModelPopup` is smaller and delegates to testable pure helpers.

---

## Prompt 07 — Reduce command-screen plumbing surface

## Role

You are a senior TypeScript engineer improving maintainability and reducing rerender churn risk.

## Goal

Make command-screen plumbing safer to modify by grouping large option/return shapes and adding a contract test, while keeping behavior stable.

## Scope (only these files, unless truly necessary)

- `src/tui/screens/command/hooks/useCommandScreenPopupBindings.ts`
- `src/tui/screens/command/hooks/useCommandScreenController.ts`
- Tests: `src/__tests__/tui/**`

## What to accomplish

### 1) Group options/returns (type-level + structure)

- Refactor the public options type into nested groups (`popup`, `input`, `history`, `generation`, etc.).
- Refactor the return type similarly, so callers destructure grouped objects.
- Avoid behavior changes; this is structural.

### 2) Reduce identity churn risk

- Prefer stable callback patterns (`useStableCallback`, refs) where it reduces dependency array complexity.
- Do not change logic; only stabilize surfaces.

### 3) Add a “shape contract” test

- Add a unit test that asserts the hook returns required sub-objects/handlers (e.g. `popup`, `submit`, etc.) and that key functions are stable enough to call.
- Avoid snapshotting large objects; assert presence + basic call safety with mocked dependencies.

## Validation requirements

- `npm test`
- `npm run typecheck`

## Constraints

- No UX changes.
- Strict TS; **no `any`**.

## Deliverable

- Smaller, grouped hook surfaces.
- Contract test added.

---

## Prompt 08 — Split `useContextPopupGlue` by popup type

## Role

You are a senior TUI architect.

## Goal

Decompose `useContextPopupGlue` into per-popup hooks and shared pure helpers to reduce complexity and prevent regressions.

## Scope (only these files, unless truly necessary)

- `src/tui/screens/command/hooks/useContextPopupGlue.ts`
- New hook modules under `src/tui/screens/command/hooks/` (or a subfolder), e.g.:
  - `useFilePopupGlue.ts`, `useUrlPopupGlue.ts`, `useMediaPopupGlue.ts`, `useSmartPopupGlue.ts`
- New pure helper module(s) for repeated popup-state mutations
- Tests: `src/__tests__/tui/**`

## What to accomplish

### 1) Split by popup type without changing behavior

- Each hook owns one popup type’s effects + derived values.
- Keep input routing invariants: when a popup is open, it owns keyboard input.

### 2) Extract pure popup mutation helpers

- Consolidate repeated `setPopupState(prev => ...)` patterns into pure functions (input: prev state + event; output: next state).

### 3) Add unit tests for pure helpers

Lock behavior for:

- Selection/focus clamping.
- Auto-add behaviors (where draft parses to an absolute path).
- “Defocus suggestions when empty” behavior.

## Validation requirements

- `npm test`
- `npm run typecheck`

## Manual validation

- For each popup type: add/remove items; navigate suggestions; ensure focus behavior is unchanged.

## Constraints

- No UX changes.
- No new dependencies.

## Deliverable

- `useContextPopupGlue.ts` is thin composition.
- Per-popup hooks + pure helper tests exist.

---

## Prompt 09 — Split `usePopupManager` (commands vs scans vs effects)

## Role

You are a senior TypeScript engineer focused on correctness under input routing and async scan races.

## Goal

Decompose `usePopupManager` into clearer boundaries while preserving behavior.

## Scope (only these files, unless truly necessary)

- `src/tui/hooks/usePopupManager.ts`
- New helper/module(s) under `src/tui/hooks/` (or a subfolder), e.g.:
  - `popup-manager/command-mapping.ts`
  - `popup-manager/scan-orchestrator.ts`
- Tests: `src/__tests__/tui/**`

## What to accomplish

### 1) Extract command → intent/action mapping

- Move the large command-selection switch into a pure-ish mapper that returns typed actions.
- Keep IO (reading intent files) and side effects outside the mapper.

### 2) Isolate scan orchestration

- Move “start scan, apply results, ignore stale results” logic behind a focused boundary.
- Ensure popup-type matching checks remain intact (builds on Prompt 01 tests).

### 3) Add unit tests

- Tests for command mapping (for a few high-risk commands).
- Tests for scan staleness behavior in the new boundary.

## Validation requirements

- `npm test`
- `npm run typecheck`

## Manual validation

- Open popups and switch types quickly while scans are running; ensure no cross-application of suggestions.

## Constraints

- Strict TS; **no `any`**.
- Preserve input routing priority: help overlay → popup → screen → global.

## Deliverable

- `usePopupManager.ts` is smaller; responsibilities are separated.
- Tests added for mapping and scan staleness.

---

## Prompt 10 — Stabilize `useGenerationPipeline` (buffering + isolation)

## Role

You are a senior TypeScript engineer focusing on streaming correctness and performance.

## Goal

Reduce churn and improve testability of `useGenerationPipeline` while preserving output order/content.

## Scope (only these files, unless truly necessary)

- `src/tui/hooks/useGenerationPipeline.ts`
- New pure helper module(s) for formatting/history shaping
- Optional small helper module for buffered history writes
- Tests: `src/__tests__/tui/**`
- Related call-into code only if directly implicated:
  - `src/prompt-generator-service.ts`

## What to accomplish

### 1) Extract pure formatting/history shaping helpers

- Wrap/split logic (including `wrapAnsi`) should be behind testable functions.
- Preserve exact output text as much as possible.

### 2) Buffer history updates (behavior-preserving)

- Introduce buffering so a burst of stream events does not cause excessive state updates.
- Preserve ordering and content.

### 3) Isolate series artifact IO

- Keep file IO out of the core orchestration logic (move into a small boundary function/module).

### 4) Add tests

- Unit tests for formatting helpers.
- Unit tests for buffering behavior (ordering preserved, no drops).

## Validation requirements

- `npm test`
- `npm run typecheck`

## Manual validation

- Run a long streaming generation; verify history order/content and that refinement flow still works.

## Constraints

- No behavior changes.
- No new dependencies.

## Deliverable

- `useGenerationPipeline.ts` is smaller and more testable.
- Tests lock formatting/buffering semantics.

---

## Prompt 11 — Theme subsystem split (loader/provider)

## Role

You are a senior TypeScript engineer focused on correctness-sensitive configuration flows.

## Goal

Split theme loading into focused modules and add fixture-driven tests, without changing theme selection behavior.

## Scope (only these files, unless truly necessary)

- `src/tui/theme/theme-loader.ts`
- `src/tui/theme/theme-provider.tsx` (only for small extractions improving testability)
- New theme modules in `src/tui/theme/`:
  - Example: `theme-discovery.ts`, `theme-validate.ts`, `theme-adapter.ts`
- Tests: `src/__tests__/tui/**` and/or existing theme tests

## What to accomplish

### 1) Split the loader by concern

- Discovery: locating theme files.
- Parsing/validation: schema validation.
- Adaptation: transforming external theme JSON formats.

### 2) Add fixture-driven tests

- Use existing fixtures under `src/__tests__/__fixtures__/themes/`.
- Add tests for adaptation and validation edge cases.

### 3) Keep provider behavior stable

- Only extract pure resolution helpers if it improves testability.

## Validation requirements

- `npm test`
- `npm run typecheck`

## Manual validation

- Switch theme/mode and restart; confirm persistence and fallback behavior.

## Constraints

- No new dependencies.
- Preserve current fallback ordering and error messaging.

## Deliverable

- Theme loading is modularized.
- Tests cover validate/adapt behavior.

---

## Prompt 12 — Notifier/toast refactor (tests-first within prompt)

## Role

You are a senior TypeScript engineer improving correctness of transient UI state.

## Goal

Add tests that lock current toast behavior, then refactor `notifier.ts` into pure transition helpers + timer wiring, without changing UX.

## Scope (only these files, unless truly necessary)

- `src/tui/notifier.ts`
- Optional new pure helper module: `src/tui/toast-state.ts` (or similar)
- Tests: `src/__tests__/tui/**`

## What to accomplish

### 1) Add tests that lock current semantics

- Cover dedupe/reuse behavior as it exists today.
- Cover dismissal/expiration timing behavior using fake timers.

### 2) Refactor internals

- Move toast state transitions into pure functions (add/dismiss/expire).
- Keep timer wiring in the hook/module that needs it.

### 3) Optional UX changes must be explicitly labeled

- If you think dedupe behavior is wrong (there’s a TODO), do not change it unless explicitly requested.

## Validation requirements

- `npm test`
- `npm run typecheck`

## Manual validation

- Trigger toasts during generation and ensure behavior matches pre-refactor.

## Constraints

- Strict TS; **no `any`**.
- No new dependencies.
- Preserve behavior.

## Deliverable

- `notifier.ts` is simpler and test-backed.
- Toast behavior is locked in by unit tests.
