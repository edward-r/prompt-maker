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

## Staging Model (used in “Suggested stage”)

This replaces the previous “atomic prompts” mapping.

- **Stage 0 — Baseline safety**: lock in behavior with tests around pure helpers/reducers and critical routing.
- **Stage 1 — Input routing invariants**: enforce priority order (help overlay → popup → screen → global keys); reduce double-handling risks.
- **Stage 2 — Popup state + suggestion scans**: make popup transitions explicit/testable; harden async scan staleness rules.
- **Stage 3 — Generation pipeline orchestration**: isolate effects, batch history writes, reduce churn, keep interactive/refinement stable.
- **Stage 4 — UI decomposition**: break large components/hooks into smaller modules with stable prop surfaces.
- **Stage 5 — Cross-cutting services**: notifier/toasts, theme loading/selection, and other shared subsystems.

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

|                                                                        Rank | File path                                                                | LOC | Category         | Key issues                                                                                                         | Evidence (concrete)                                                                                                                                                                                                                                                                                                                                 | Suggested refactor direction                                                                                                                                                                                                                                                                                                                                                 | Suggested stage                                            |
| --------------------------------------------------------------------------: | ------------------------------------------------------------------------ | --: | ---------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
|                                                                           1 | `src/tui/hooks/usePopupManager.ts`                                       | 989 | Both             | God-hook: popup state + command semantics + IO + scanning<br>Very wide dependency surface increases change risk    | Huge `UsePopupManagerOptions` surface (many setters + state)<br>Large command handler switch (`handleCommandSelection(...)`) opens popups, toggles settings, triggers flows (series/test/exit)<br>Reads intent file via `fs.readFile(...)` inside the handler<br>Starts async scans via `runSuggestionScan(...)`                                    | Split into: (1) pure command→action mapping, (2) scan orchestration hook/service, (3) effectful command executors<br>Keep popup transitions in reducer (`src/tui/popup-reducer.ts`) and gradually migrate ad-hoc `setPopupState(prev => ...)` mutations into explicit actions<br>Add unit tests for command→action mapping and scan staleness gating in `src/__tests__/tui/` | Stage 2 (popup state/scans), Stage 1 (routing)             |
|                                                                           2 | `src/tui/hooks/useGenerationPipeline.ts`                                 | 951 | Both             | Mixed concerns: orchestration + formatting + IO + state<br>Potential render/update churn during streaming          | `handleStreamEvent(...)` wraps/splits (`wrapAnsi`) and pushes many history entries per event<br>Generation runner builds large payloads; JSON display path emits wrapped lines<br>Contains series artifact IO (`writeSeriesArtifacts(...)`, `fs.mkdir`, `fs.writeFile`)                                                                             | Introduce “event buffering” (batch history writes per tick/frame) while preserving order<br>Extract pure formatting helpers (wrap/split + display shaping) and test them<br>Move series artifact IO behind a small boundary (call remains in TUI layer, but logic is isolated/testable)                                                                                      | Stage 3 (generation pipeline)                              |
|                                                                           3 | `src/tui/screens/command/hooks/useContextPopupGlue.ts`                   | 933 | Both             | God-hook for file/url/image/video/smart popups<br>Repeated `setPopupState` mutation patterns and per-popup effects | Screen-level key handler (`useInput(handleSeriesShortcut, { isActive: !isPopupOpen && !helpOpen })`)<br>Auto-add behaviors via effects for file/image/video drafts (drag-drop parsing)<br>Repeated suggestion filtering patterns plus “defocus if empty” effects<br>Many inline `setPopupState(prev => prev?.type === 'X' ? {...} : prev)` branches | Split into focused hooks per popup type (`useFilePopupGlue`, `useUrlPopupGlue`, `useMediaPopupGlue`, `useSmartPopupGlue`)<br>Extract pure helpers for list popup mutations (focus/selection clamp, add/remove behaviors)<br>Add unit tests for pure helpers in `src/__tests__/tui/`                                                                                          | Stage 2 (popup behavior), Stage 4 (hook decomposition)     |
|                                                                           4 | `src/tui/components/popups/ListPopup.tsx`                                | 457 | Both             | Duplicated rendering paths (“suggestions” vs “simple”)<br>Large component with UI/layout logic baked in            | Two major render branches with overlapping structure<br>Windowing logic embedded at component level<br>Selection style prop objects rebuilt each render                                                                                                                                                                                             | Extract a pure “view model” builder (rows/layout/window) and keep component mostly presentational<br>Unify rendering path with optional suggestions panel<br>Consider splitting into `ListPopupLayout` + pure `list-popup-model.ts`                                                                                                                                          | Stage 4 (UI decomposition), Stage 0 (tests for view model) |
|                                                                           5 | `src/tui/screens/command/hooks/useCommandScreenPopupBindings.ts`         | 404 | Size             | Large option/result types; high plumbing overhead                                                                  | Options mix unrelated groups (paste/popup/menu/generation/context)<br>Returns a large flattened object surface                                                                                                                                                                                                                                      | Keep behavior; refactor types/returns into grouped objects (`context`, `history`, `popup`, `generation`, …)<br>Prefer stable callback refs to shrink dependency arrays<br>Add a focused “shape contract” test                                                                                                                                                                | Stage 4 (UI decomposition)                                 |
|                                                                           6 | `src/tui/theme/theme-loader.ts`                                          | 398 | Size             | Mixed discovery + parsing + validation + schema adaptation                                                         | Embedded `validateThemeJson(...)` and `adaptOpencodeThemeJson(...)`<br>`loadThemes(...)` orchestrates builtin/global/project scanning with ordering rules<br>Multiple error kinds (`read`/`parse`/`validate`)                                                                                                                                       | Split into focused modules: validation, adapter, discovery; keep `loadThemes(...)` as orchestration<br>Add tests for validate/adapt behavior using existing fixtures under `src/__tests__/__fixtures__/themes/`                                                                                                                                                              | Stage 5 (services), Stage 0 (tests first)                  |
|                                                                           7 | `src/tui/screens/command/components/PopupArea.tsx`                       | 351 | Anti-pattern     | Large prop drilling surface<br>Long conditional chain to pick popup UI                                             | `PopupAreaProps` contains many per-popup fields/handlers<br>Large conditional selection by `popupState.type` with repeated wiring patterns                                                                                                                                                                                                          | Split into subcomponents per popup type (or a `switch` with small renderer helpers)<br>Reduce prop surface by passing a popup “view model” object instead of many individual props                                                                                                                                                                                           | Stage 4 (UI decomposition)                                 |
|                                                                           8 | `src/tui/components/popups/ModelPopup.tsx`                               | 317 | Size             | UI formatting and list-building logic bundled into one component                                                   | `buildRows(...)` groups “Recent” and provider headers<br>Windowing + “header visibility” logic is local to this component                                                                                                                                                                                                                           | Extract pure row building + windowing helpers to a sibling module<br>Add unit tests that lock in grouping/windowing behavior                                                                                                                                                                                                                                                 | Stage 4 (UI decomposition), Stage 0 (tests)                |
|                                                                           9 | `src/tui/screens/command/hooks/useCommandScreenController.ts`            | 310 | Size             | Large “options bundling” with long dependency arrays                                                               | Builds multiple `useMemo` option objects with long dep lists<br>High risk of accidental identity churn or missed deps                                                                                                                                                                                                                               | Move bundling to a single owner (either the view-model hook or controller)<br>Consider stable callback wrappers + refs to reduce dependency surface while preserving semantics                                                                                                                                                                                               | Stage 4 (UI decomposition)                                 |
|                                                                          10 | `src/tui/popup-reducer.ts`                                               | 302 | Size             | Large but pure; risk is maintainability, not correctness                                                           | Many popup types and fields handled in one `switch`<br>Duplicate `buildXPopupState` patterns                                                                                                                                                                                                                                                        | Optional: split action handlers by popup type into smaller pure functions<br>Add/expand reducer tests to lock behavior before structural refactors                                                                                                                                                                                                                           | Stage 2 (popup state), Stage 0 (tests)                     |
|                                                                          11 | `src/tui/theme/theme-provider.tsx`                                       | 295 | Both             | Effectful init + persistence + preview logic in one provider                                                       | Initial load effect has multi-branch error handling<br>Provides `previewTheme`, `setTheme`, `setMode` with persistence + runtime detection                                                                                                                                                                                                          | Extract pure selectors (resolve by name, fallback rules) from effectful persistence<br>Add tests around fallback behavior and system-mode detection fallback                                                                                                                                                                                                                 | Stage 5 (services), Stage 0 (tests)                        |
|                                                                          12 | `src/tui/notifier.ts`                                                    | 293 | Anti-pattern     | Known semantics issue: toast dedupe likely wrong for progress updates<br>Timer bookkeeping complexity              | Top-of-file TODO explicitly calls out dedupe is wrong<br>`showToast(...)` reuses latest toast when message+kind match<br>Maintains timer maps                                                                                                                                                                                                       | Write tests to lock current behavior first<br>Then refactor toward explicit toast “update/upsert” semantics without changing UX unless explicitly opted-in<br>Move toast state transitions into pure helpers                                                                                                                                                                 | Stage 5 (services), Stage 0 (tests)                        |
|                                                                          13 | `src/tui/screens/command/hooks/useCommandScreenShell.ts`                 | 276 | Anti-pattern     | Synchronous filesystem IO on typing hot-path                                                                       | `droppedFilePath` uses `fs.statSync(...)` inside a `useMemo` depending on `inputValue`                                                                                                                                                                                                                                                              | Move IO to an effect + cached state (ensure behavior remains responsive)                                                                                                                                                                                                                                                                                                     |
|                           <br>Extract pure “candidate path parsing” from IO | Stage 1 (input responsiveness), Stage 4 (cleanup)                        |
|                                                                          14 | `src/tui/components/core/InputBar.tsx`                                   | 274 | Size             | Some render-time string/layout work is non-trivial                                                                 | Status line width calculation and segment extraction run each render (memoized, but still chunky)                                                                                                                                                                                                                                                   |
|                            <br>Many derived computations from `statusChips` | Optional: extract pure status-summary computation + tests                |
| <br>Primary focus: ensure stable props and avoid rerender churn in children | Stage 4 (component audit)                                                |
|                                                                          15 | `src/prompt-generator-service.ts`                                        | 257 | Both (call-into) | Correctness-sensitive series repair flow embedded in service                                                       | `generatePromptSeries(...)` repair loop with `MAX_SERIES_REPAIR_ATTEMPTS`                                                                                                                                                                                                                                                                           |
|                  <br>Multiple parse/validate/repair branches plus callbacks | Keep behavior; extract repair loop into a helper returning typed results |
| <br>Add unit tests around attempt counting and error surfacing (no network) | Stage 0 (tests), Stage 5 (service cleanup)                               |

## Quick Wins (low risk, high value)

1. `src/tui/screens/command/components/PopupArea.tsx`: convert long conditional to `switch` and/or per-popup subcomponents.
2. `src/tui/components/popups/ListPopup.tsx`: unify render paths; extract a pure view model.
3. `src/tui/screens/command/hooks/useCommandScreenShell.ts`: remove sync `fs.statSync` from the `inputValue` hot path (validate carefully).
4. `src/tui/components/popups/ModelPopup.tsx`: extract and test row/window logic (locks behavior and reduces complexity).
5. `src/tui/popup-reducer.ts`: add/expand reducer tests before any structural split.

## Deep Work Items (higher risk / broad impact)

1. `src/tui/hooks/usePopupManager.ts` (Stage 2)
   - Risks: input routing fallthrough, stale scan updates applied to wrong popup, subtle state regressions.
   - Validate: stress open/close popups quickly; switch popup types while scans in flight; verify help overlay suppresses popup/screen input.
2. `src/tui/hooks/useGenerationPipeline.ts` (Stage 3)
   - Risks: ordering of history output changes, interactive refinement hangs, excessive rerenders.
   - Validate: generation with long outputs; refinement flow; JSON output mode; ensure no duplicated history lines.
3. `src/tui/screens/command/hooks/useContextPopupGlue.ts` (Stages 2/4)
   - Risks: focus/index behavior drift, auto-add path detection changes, suggestion selection regressions.
   - Validate: manual checks for each popup type; unit tests for extracted pure helpers.

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
