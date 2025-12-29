# tui-styling-guide: Ink styling across screens and components

**Session ID:** ses_494076dc6fferR9K1QclnepOzi
**Created:** 12/29/2025, 3:16:51 PM
**Updated:** 12/29/2025, 3:41:39 PM

---

## User

# Title
Create a comprehensive Ink TUI styling tutorial and repo-specific modification guide (`tui-styling-guide.md`)

## Role
You are a senior TypeScript + React (Ink) engineer, TUI UX maintainer, and technical writer.

## Context
You are documenting how to understand and modify styling across an Ink-based TUI in this repository.

You must ground the guide in the repo’s current architecture and theming system using these context files:
- `docs/tui-design.md` (UX goals, input routing, screen model, theming pointers)
- `src/tui/DEVELOPER_NOTE.md` (architecture, performance notes, component boundaries)
- `docs/prompt-maker-cli-tui-encyclopedia.md` (module map, theming, boot sequence)
- `src/tui/components/popups/InstructionsPopup.tsx` (concrete example of theme usage + Ink styling props)

Note: Some docs reference alternate paths under `apps/prompt-maker-cli/src/tui/**`. Determine which path is authoritative in this repo by inspecting the filesystem. Prefer the actual existing path(s) in this checkout ; if both exist, document both and explain which is used by the build.

The reader:
- Has **no experience with Ink**.
- Wants a **fully detailed tutorial** to understand and modify styling for **every screen component** (and shared components used by screens).

## Goals & Tasks
1. **Teach Ink styling fundamentals** for a beginner:
   - What Ink is (React for CLIs) and how it renders.
   - Core primitives used for layout/styling (`<Box>`, `<Text>`) and key style props (colors, background colors, borders, padding/margins, width/height, flex layout).
   - How terminal constraints affect styling (monospace, column width, color support).

2. **Explain this repo’s styling architecture**:
   - Where themes live (use the exact paths you find; docs suggest `src/tui/theme/*`).
   - How `ThemeProvider` works and how `useTheme()` is used.
   - How theme tokens map to Ink props (e.g., helper functions like `inkColorProps`, `inkBackgroundColorProps`, `inkBorderColorProps`).
   - How theme settings persist (docs mention `src/config.ts` storing `theme` and `themeMode`).

3. **Provide a screen-by-screen and component-by-component styling map**:
   - Identify all screens (docs name Generate/Command and Test Runner; confirm actual file paths).
   - For each screen, list:
     - Primary component entry file(s).
     - Subcomponents used for layout.
     - What parts are themed (background, text colors, accents, borders, status chips, etc.).
     - Where to change styles safely (which token/file/function).
   - Also cover shared component categories:
     - `src/tui/components/core/*`
     - `src/tui/components/popups/*`
     - Any screen-specific `components/*` folders if present.

4. **Include practical “how to change X” recipes** with examples:
   - Changing popup background/border colors.
   - Changing accent/muted text styles.
   - Adjusting widths responsively based on terminal columns.
   - Adding a new theme token and threading it through.
   - Creating a new theme JSON example (docs mention `src/tui/theme/examples/ `).

5. **Use `src/tui/components/popups/InstructionsPopup.tsx` as a worked example**:
   - Explain `clamp`, terminal width usage (`useStdout().stdout.columns`), padding calculations, and how theme helpers apply.
   - Show before/after style modifications as code snippets (documentation only; do not edit code).

6. **Document pitfalls and invariants relevant to styling**:
   - Input routing invariants (help overlay/popup ownership) from `docs/tui-design.md` and `docs/prompt-maker-cli-tui-encyclopedia.md`—explain how styling changes might interact with focus and overlays.
   - Performance concerns from `src/tui/DEVELOPER_NOTE.md` (avoid heavy work in render, stable props, memoization guidance) and how styling choices can affect render cost.
   - Cross-platform terminal differences (colors, unicode borders, width measurements).

7. **Write the final tutorial to a new markdown file** at the project root:
   - Output path: `tui-styling-guide.md`

## Inputs
- Context files (must be referenced explicitly in the guide where relevant):
  - `docs/tui-design.md`
  - `src/tui/DEVELOPER_NOTE.md`
  - `docs/prompt-maker-cli-tui-encyclopedia.md`
  - `src/tui/components/popups/InstructionsPopup.tsx`
- Repository source tree (you may inspect files to accurately enumerate screens/components and styling tokens):
  - `src/tui/**` (and also check if `apps/prompt-maker-cli/src/tui/**` exists)
  - `src/tui/theme/**`
  - `src/config.ts`

## Constraints
- **Do not implement code changes.** Produce documentation only.
- **Do not invent file paths or APIs.** If something isn’t found, say so and describe how to locate it.
- Keep explanations **beginner-friendly** (assume no Ink knowledge), but remain technically accurate.
- Use **TypeScript-oriented** examples/snippets where relevant.
- Preserve the repo’s design intent:
  - Theming is centralized; components should use theme tokens rather than hardcoded colors.
  - Avoid guidance that would break input routing layers or performance.

## Execution Plan
1. Read the provided context files to establish architecture and invariants.
2. Inspect the repo to confirm:
   - Actual TUI root path (`src/tui/**` vs `apps/prompt-maker-cli/src/tui/**`).
   - Theme system files (`theme-provider`, theme types, token definitions, examples).
   - Screen components and their subcomponents.
   - Core and popup components and common styling helpers.
3. Build an inventory table:
   - Screens → files → main styled regions → theme tokens used → safe modification points.
4. Draft the tutorial:
   - Start with Ink fundamentals.
   - Move to repo-specific theming.
   - Then the inventory and recipes.
   - Close with troubleshooting and a “safe change checklist”.
5. Ensure all claims are traceable to actual files and the provided docs.
6. Write `tui-styling-guide.md` in the project root.

## Output Format
- Create a single markdown document at: `tui-styling-guide.md`
- The document must include, at minimum, these sections:
  1. Overview (what this guide covers)
  2. Ink Basics (layout + styling primi tives)
  3. How Styling Works in This Repo (theme provider, tokens, helpers)
  4. Where Styles Live (file path map)
  5. Screen-by-Screen Styling Guide (each screen as a subsection)
  6. Shared Components Styling Guide (core + popups)
  7. Worked Example: `InstructionsPopup.tsx`
  8. Common Customizations (step-by-step recipes)
  9. Troubleshooting & Pitfalls
  10. Safe Styling Change Checklist

- Include:
  - Code snippets (fenced blocks) that illustrate changes, labeled clearly as examples.
  - Tables for inventories (screens/components/tokens).
  - Explicit file path references throughout.

## Quality Checks
- **Completeness:** Every discovered screen component and major shared component category (`components/core`, `components/popups`) is covered with styling guidance.
- **Beginner clarity:** Ink concepts are explained before repo-specific instructions.
- **Repo accuracy:** All referenced paths, exports, and tokens exist in the repo; no fabricated modules.
- **Actionability:** For each style goal (color s, borders, spacing, widths), the guide points to the exact token/function/file to edit.
- **Consistency:** Recommends using theme tokens/helpers rather than ad-hoc inline styles.
- **Safety:** Guidance does not conflict with input routing invariants (help/popup layering) or performance notes (avoid heavy work in render). 

---

## Assistant

_Thinking:_



I’ll first inventory the existing TUI/theme code and read the referenced docs, then I’ll synthesize everything into a repo-accurate `tui-styling-guide.md` at the project root.

```
Tool: todowrite

**Input:**
```json
{
  "todos": [
    {
      "content": "Read required context docs/files",
      "status": "in_progress",
      "priority": "high",
      "id": "1"
    },
    {
      "content": "Verify TUI paths and modules",
      "status": "pending",
      "priority": "high",
      "id": "2"
    },
    {
      "content": "Inventory screens and components",
      "status": "pending",
      "priority": "high",
      "id": "3"
    },
    {
      "content": "Inventory theme system and persistence",
      "status": "pending",
      "priority": "high",
      "id": "4"
    },
    {
      "content": "Write tui-styling-guide.md tutorial",
      "status": "pending",
      "priority": "high",
      "id": "5"
    },
    {
      "content": "Cross-check paths and claims",
      "status": "pending",
      "priority": "high",
      "id": "6"
    }
  ]
}
```
**Output:**
```
[
  {
    "content": "Read required context docs/files",
    "status": "in_progress",
    "priority": "high",
    "id": "1"
  },
  {
    "content": "Verify TUI paths and modules",
    "status": "pending",
    "priority": "high",
    "id": "2"
  },
  {
    "content": "Inventory screens and components",
    "status": "pending",
    "priority": "high",
    "id": "3"
  },
  {
    "content": "Inventory theme system and persistence",
    "status": "pending",
    "priority": "high",
    "id": "4"
  },
  {
    "content": "Write tui-styling-guide.md tutorial",
    "status": "pending",
    "priority": "high",
    "id": "5"
  },
  {
    "content": "Cross-check paths and claims",
    "status": "pending",
    "priority": "high",
    "id": "6"
  }
]
```
```

---

## Assistant

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/docs/tui-design.md"
}
```
**Output:**
```
<file>
00001| # Prompt Maker CLI TUI Design
00002| 
00003| This document describes the _current_ Ink-based TUI: its UX goals, input routing invariants, and how the code is organized.
00004| 
00005| If you’re looking for a user guide, the fastest way to learn the TUI is to run it and hit `?`.
00006| 
00007| ## Goals
00008| 
00009| - **Keyboard-first**: no mouse required; command palette + popups cover most actions.
00010| - **Safe input routing**: help/popup layers must “own” the keyboard (no fallthrough).
00011| - **Shared core logic**: the TUI calls the same generation/test pipeline as the CLI.
00012| - **Automation-friendly**: the CLI continues to support JSON/JSONL output; the TUI is optional.
00013| 
00014| ## Entry points
00015| 
00016| - CLI routing: `src/index.ts`
00017|   - No args defaults to `ui`.
00018|   - `test` runs the prompt test runner.
00019|   - Everything else runs the generate workflow.
00020| - TUI renderer: `src/tui/index.tsx` (parses `--interactive-transport`, then mounts `AppContainer`).
00021| 
00022| ## Global keybinds
00023| 
00024| Defined by `src/tui/app-container-keymap.ts` and shown in help (`?`).
00025| 
00026| - `Ctrl+G`: open command palette (Generate view)
00027| - `Ctrl+T`: switch to Test Runner view
00028| - `?`: toggle help overlay
00029| - `Ctrl+C`: exit
00030| - `Esc`: dismiss UI elements (never exits)
00031| 
00032| ## Input routing invariants
00033| 
00034| Priority order (highest wins):
00035| 
00036| 1. **Help overlay**: when help is open, it consumes almost all keys.
00037| 2. **Popup input**: when a popup is open, it “owns” the keyboard.
00038| 3. **Screen input**: active screen handles keys (history scrolling, typing, submission).
00039| 4. **AppContainer global keys**: only truly-global shortcuts should run here.
00040| 
00041| This is enforced by:
00042| 
00043| - `AppContainer` tracking `isHelpOpen` + `isPopupOpen` and gating global actions.
00044| - Screens using `useInput(..., { isActive })` to ensure only the top layer handles keys.
00045| 
00046| ## Screen model
00047| 
00048| The TUI has two views:
00049| 
00050| - **Generate** (`src/tui/screens/command/CommandScreen.tsx`)
00051| - **Test Runner** (`src/tui/screens/test-runner/TestRunnerScreen.tsx`)
00052| 
00053| The view is managed by `src/tui/AppContainer.tsx`.
00054| 
00055| ## Generate view UX
00056| 
00057| The Generate view is a scrollable history pane plus a single input bar:
00058| 
00059| - Type normal text → treated as an intent.
00060| - Type `/` → command mode (command palette opens and filters).
00061| - Drag & drop an absolute file path, then press `Tab` to attach it.
00062| 
00063| Commands are defined in `src/tui/config.ts` (`COMMAND_DESCRIPTORS`). The palette uses matching helpers in `src/tui/command-filter.ts`.
00064| 
00065| ### Popups
00066| 
00067| Most commands open a popup:
00068| 
00069| - `/model`, `/target` → model selection
00070| - `/file`, `/url`, `/image`, `/video` → add context items
00071| - `/smart`, `/smart-root` → smart context controls
00072| - `/theme`, `/theme-mode` → theme controls
00073| - `/tokens`, `/settings`, `/history`, `/reasoning` → informational views
00074| 
00075| Popup transitions are managed with a pure reducer (`src/tui/popup-reducer.ts`) and a hook for effects (`src/tui/hooks/usePopupManager.ts`).
00076| 
00077| ### Series generation
00078| 
00079| `/series` (or pressing `Tab`) produces a set of standalone “atomic prompts” (no cross references between steps). It writes the artifacts under a timestamped folder (see `src/tui/hooks/useGenerationPipeline.ts`).
00080| 
00081| ## Test Runner UX
00082| 
00083| The Test Runner view runs suites defined by `prompt-tests.yaml` (or another YAML file). It uses the same underlying runner exported by `src/test-command.ts`.
00084| 
00085| ## Theming
00086| 
00087| - Theme definitions and loader: `src/tui/theme/*`
00088| - Theme settings persisted into CLI config via `src/config.ts` (`theme` and `themeMode`).
00089| 
00090| Theme JSON examples live in `src/tui/theme/examples/`.
00091| 

(End of file - total 91 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/DEVELOPER_NOTE.md"
}
```
**Output:**
```
<file>
00001| # prompt-maker-cli TUI Developer Note
00002| 
00003| This document explains the _current_ Ink TUI architecture in `apps/prompt-maker-cli/src/tui/**` after the refactor series.
00004| 
00005| Goals of this architecture:
00006| 
00007| - Keep UI behavior stable while making state flow explicit.
00008| - Reduce avoidable re-renders by stabilizing props/callbacks.
00009| - Make complex state transitions unit-testable (pure reducers).
00010| 
00011| ## Directory structure
00012| 
00013| ### Entry points (thin re-exports)
00014| 
00015| These files stay intentionally small so “big screens” don’t live in the root `tui/` folder:
00016| 
00017| - `apps/prompt-maker-cli/src/tui/CommandScreen.tsx`
00018| - `apps/prompt-maker-cli/src/tui/TestRunnerScreen.tsx`
00019| 
00020| ### Screens
00021| 
00022| Each screen owns orchestration + rendering, and delegates state transitions to a reducer.
00023| 
00024| - Command screen
00025|   - `apps/prompt-maker-cli/src/tui/screens/command/CommandScreen.tsx`
00026|   - `apps/prompt-maker-cli/src/tui/screens/command/useCommandScreen.ts`
00027|   - `apps/prompt-maker-cli/src/tui/screens/command/command-screen-reducer.ts`
00028|   - `apps/prompt-maker-cli/src/tui/screens/command/components/*`
00029| 
00030| - Test runner
00031|   - `apps/prompt-maker-cli/src/tui/screens/test-runner/TestRunnerScreen.tsx`
00032|   - `apps/prompt-maker-cli/src/tui/screens/test-runner/useTestRunnerScreen.ts`
00033|   - `apps/prompt-maker-cli/src/tui/screens/test-runner/test-runner-reducer.ts`
00034|   - `apps/prompt-maker-cli/src/tui/screens/test-runner/components/*`
00035| 
00036| ### Cross-screen hooks and reducers
00037| 
00038| These modules are shared “feature hooks” used by screens:
00039| 
00040| - Popup state machine
00041|   - Pure reducer: `apps/prompt-maker-cli/src/tui/popup-reducer.ts`
00042|   - Hook + effects: `apps/prompt-maker-cli/src/tui/hooks/usePopupManager.ts`
00043| 
00044| - Generation pipeline
00045|   - Pure reducer: `apps/prompt-maker-cli/src/tui/generation-pipeline-reducer.ts`
00046|   - Hook + effects: `apps/prompt-maker-cli/src/tui/hooks/useGenerationPipeline.ts`
00047| 
00048| ### Core UI components
00049| 
00050| Reusable Ink components live in:
00051| 
00052| - `apps/prompt-maker-cli/src/tui/components/core/*`
00053| - `apps/prompt-maker-cli/src/tui/components/popups/*`
00054| 
00055| Rule of thumb:
00056| 
00057| - **Core components** should be mostly presentational: props in, render out.
00058| - Side effects (timers, subscriptions, async work) belong in hooks/screens.
00059| 
00060| ## Input routing invariants
00061| 
00062| Input routing is one of the easiest places for TUIs to regress.
00063| 
00064| The intended priority order is:
00065| 
00066| 1. **Help overlay**: when help is open, most screen input should be suppressed.
00067| 2. **Popup input**: when any popup is open, it should “own” the keyboard.
00068| 3. **Screen input**: otherwise, the active screen handles keys.
00069| 4. **AppContainer global keys**: keys like exit remain truly global.
00070| 
00071| Implementation notes:
00072| 
00073| - `usePopupManager` exposes `popupState` and popup actions; screens should use `popupState !== null` to decide whether screen-level inputs should be active.
00074| - Avoid “fallthrough” key handling where the same key can be interpreted by both a popup and the screen.
00075| 
00076| ## Reducers: responsibilities and patterns
00077| 
00078| Why reducers are used here (plain terms):
00079| 
00080| - Instead of calling many different `setState(...)` functions from many callbacks, we send a single “action” describing what happened.
00081| - The reducer is a pure function that returns the next state.
00082| 
00083| Benefits:
00084| 
00085| - Easier to reason about state transitions.
00086| - Easier to test (no Ink/TTY required).
00087| - Often fewer renders because multiple fields can change in one dispatch.
00088| 
00089| Patterns used in this codebase:
00090| 
00091| - Pure reducers live in `*-reducer.ts` files with no React/Ink imports.
00092| - Hooks (e.g. `usePopupManager`, `useGenerationPipeline`) wrap reducers and are responsible for effects.
00093| 
00094| ### Stale closure (important React/Ink concept)
00095| 
00096| A “stale closure” happens when a callback captures old values.
00097| 
00098| Example:
00099| 
00100| - If a stable `handleStreamEvent` callback closes over an old terminal width, it would keep wrapping output at the wrong width after resize.
00101| 
00102| Fix pattern used here:
00103| 
00104| - Keep callbacks stable, but read changing values from refs (e.g. `terminalColumnsRef.current`).
00105| 
00106| ## Performance notes
00107| 
00108| ### Windowing and log/history rendering
00109| 
00110| - Main history rendering is windowed using `ScrollableOutput` which slices to the visible rows.
00111| - List/windowing primitives live in `apps/prompt-maker-cli/src/tui/components/popups/list-window.ts`.
00112| - Test runner logs are capped by `useLogBuffer` (default 20 entries) in `apps/prompt-maker-cli/src/tui/useLogBuffer.ts`.
00113| 
00114| ### Where re-renders come from
00115| 
00116| Typical rerender causes in this TUI:
00117| 
00118| - Passing newly-created arrays/objects as props (e.g. `statusChips`, filtered lists).
00119| - Recreating callbacks each render.
00120| - Doing heavy formatting work in render paths.
00121| 
00122| Mitigations used:
00123| 
00124| - Memoize derived arrays when it actually prevents work.
00125| - Use reducer dispatches to group related state updates.
00126| - Use refs to avoid stale closures when callbacks must stay stable.
00127| 
00128| ### Before vs after (high-level)
00129| 
00130| Before:
00131| 
00132| - `CommandScreen.tsx` and popup/generation logic mixed together in large, hard-to-test modules.
00133| - More state “fan out” across many `useState` hooks.
00134| - Async popup suggestion scans relied on implicit “prev.type === …” guards.
00135| 
00136| After:
00137| 
00138| - Popups and pipeline have explicit reducers and tests.
00139| - Screens are organized under `screens/*` with presentational subcomponents.
00140| - Async suggestion scans are guarded with scan IDs to avoid stale updates.
00141| 
00142| Why it matters:
00143| 
00144| - Less accidental rerender churn during typing.
00145| - Fewer subtle regressions when splitting UI or moving logic.
00146| - Faster onboarding: new contributors can locate “state vs effects vs rendering” more easily.
00147| 
00148| ## How to add a new popup safely
00149| 
00150| 1. Add a new popup union member in `apps/prompt-maker-cli/src/tui/types.ts`.
00151| 2. Add explicit transitions in `apps/prompt-maker-cli/src/tui/popup-reducer.ts`.
00152| 3. Add the render branch in `apps/prompt-maker-cli/src/tui/screens/command/components/PopupArea.tsx`.
00153| 4. Add a reducer unit test in `apps/prompt-maker-cli/src/__tests__/popup-reducer.test.ts`.
00154| 
00155| Keep behavior stable:
00156| 
00157| - Prefer “open-\*” actions for initial state.
00158| - If the popup loads async suggestions, ensure scan results are only applied when popup type + scan id still match.
00159| 
00160| ## How to add a new screen safely
00161| 
00162| 1. Create `apps/prompt-maker-cli/src/tui/screens/<name>/`.
00163| 2. Add a pure reducer `*-reducer.ts`.
00164| 3. Add a screen hook `use<Name>Screen.ts` to expose a view-model API.
00165| 4. Keep the root-level entry file (`apps/prompt-maker-cli/src/tui/<Name>Screen.tsx`) as a small re-export.
00166| 
00167| ## Manual verification checklist
00168| 
00169| These checks are intentionally “human-visible” and catch most regressions quickly:
00170| 
00171| - Responsiveness while typing quickly in the command input.
00172| - Large history:
00173|   - generate a long output and scroll; ensure no lag.
00174| - Large model list:
00175|   - open model popup and type queries quickly.
00176| - Popup churn:
00177|   - open/close popups repeatedly; ensure no delayed updates after switching.
00178| - Test runner:
00179|   - tab between fields, run tests, confirm statuses + logs update.
00180| 

(End of file - total 180 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/docs/prompt-maker-cli-tui-encyclopedia.md"
}
```
**Output:**
```
<file>
00001| # prompt-maker-cli TUI Encyclopedia
00002| 
00003| This is a technical overview of the Ink TUI: how it boots, how keyboard input is routed, how commands and popups work, and how the TUI delegates to the same generation/test pipelines as the CLI.
00004| 
00005| This doc intentionally prefers _stable file references_ (paths) over fragile line-number anchors.
00006| 
00007| ## High-level architecture
00008| 
00009| There are three CLI modes:
00010| 
00011| - `ui`: Ink TUI (default when no args)
00012| - `generate`: prompt generation pipeline (default for most args)
00013| - `test`: prompt test runner
00014| 
00015| Routing is implemented in `src/index.ts`.
00016| 
00017| ### Module map
00018| 
00019| - CLI routing and pipelines
00020|   - CLI entry: `src/index.ts`
00021|   - Generate pipeline: `src/generate-command.ts`
00022|   - Test pipeline: `src/test-command.ts`
00023| - TUI shell
00024|   - Ink render entry: `src/tui/index.tsx`
00025|   - Root layout + global keys: `src/tui/AppContainer.tsx`
00026|   - Global key resolution: `src/tui/app-container-keymap.ts`
00027| - Generate screen (“command screen”)
00028|   - Screen entry: `src/tui/screens/command/CommandScreen.tsx`
00029|   - Implementation: `src/tui/screens/command/CommandScreenImpl.tsx`
00030|   - Screen reducer: `src/tui/screens/command/command-screen-reducer.ts`
00031| - Test runner screen
00032|   - Screen: `src/tui/screens/test-runner/TestRunnerScreen.tsx`
00033|   - Reducer: `src/tui/screens/test-runner/test-runner-reducer.ts`
00034| - Command palette
00035|   - Command list: `src/tui/config.ts` (`COMMAND_DESCRIPTORS`)
00036|   - Filtering/scoring: `src/tui/command-filter.ts`
00037| - Popups
00038|   - Popup state machine: `src/tui/popup-reducer.ts`
00039|   - Popup effects + command dispatch: `src/tui/hooks/usePopupManager.ts`
00040|   - Popup components: `src/tui/components/popups/*`
00041| 
00042| ## Boot sequence (CLI → TUI)
00043| 
00044| 1. `prompt-maker-cli` executes `src/index.ts`.
00045| 2. If argv is empty, `resolveCommand()` chooses `ui`.
00046| 3. `ui` dynamically imports `src/tui/index.tsx` and runs `runTuiCommand()`.
00047| 4. `runTuiCommand()` parses `--interactive-transport` and mounts `<AppContainer />` with Ink.
00048| 
00049| This dynamic import keeps the non-TUI path fast and avoids Ink initialization for generate/test runs.
00050| 
00051| ## AppContainer responsibilities
00052| 
00053| `src/tui/AppContainer.tsx` is the TUI “shell”:
00054| 
00055| - Wraps the app in:
00056|   - `ThemeProvider` (`src/tui/theme/theme-provider.tsx`)
00057|   - `ToastProvider` (`src/tui/notifier.ts`)
00058|   - `ContextProvider` (`src/tui/context.tsx`) for shared generate inputs (files/urls/media/smart context settings, etc.)
00059| - Tracks which view is active (`generate` vs `tests`).
00060| - Owns the help overlay (`?`) and ensures it suppresses normal input.
00061| - Owns global key handling (Ctrl+G, Ctrl+T, Ctrl+C).
00062| 
00063| ### Help overlay
00064| 
00065| Help content is generated from `src/tui/help-config.ts`, which pulls its command list from `COMMAND_DESCRIPTORS`.
00066| 
00067| The help overlay is deliberately the highest-priority input layer.
00068| 
00069| ## Input routing (the “no fallthrough” rule)
00070| 
00071| The TUI is designed to avoid a common terminal-UI bug: _one keypress triggering multiple handlers_.
00072| 
00073| The intended priority order is:
00074| 
00075| 1. Help overlay (when open)
00076| 2. Popup input (when open)
00077| 3. Screen input (typing, scrolling, command palette navigation)
00078| 4. Global keys (exit, view switching)
00079| 
00080| The key mechanism that enforces this is Ink’s `useInput(..., { isActive })` plus explicit state flags (`helpOpen`, popup visibility) passed down from `AppContainer`.
00081| 
00082| Global key resolution happens in `src/tui/app-container-keymap.ts`.
00083| 
00084| ## Command palette
00085| 
00086| Commands are:
00087| 
00088| - Declared in `src/tui/config.ts` as `COMMAND_DESCRIPTORS`.
00089| - Rendered via the Generate screen.
00090| - Filtered/scored by `src/tui/command-filter.ts`.
00091| 
00092| ### Matching behavior
00093| 
00094| `filterCommandDescriptors()` implements simple scoring rules:
00095| 
00096| - Case-insensitive matching.
00097| - Prefix matches (id/alias/label) rank above substring matches.
00098| - Stable ordering when scores tie.
00099| 
00100| This logic is intentionally pure and unit-testable.
00101| 
00102| ## Popups
00103| 
00104| Most commands open a popup rather than performing a one-shot action.
00105| 
00106| ### State machine
00107| 
00108| Popup state is managed by a reducer:
00109| 
00110| - `src/tui/popup-reducer.ts` (pure reducer; no Ink/TTY assumptions)
00111| - `src/tui/hooks/usePopupManager.ts` (effects + command dispatch)
00112| 
00113| The hook is responsible for:
00114| 
00115| - Opening popups
00116| - Running async workspace scans for suggestions (files/images/videos)
00117| - Applying user selections back to the shared context or screen toggles
00118| - Enforcing guardrails (example: JSON output cannot be enabled when interactive transport is active)
00119| 
00120| ### Popup types
00121| 
00122| Popup components live under `src/tui/components/popups/*`.
00123| 
00124| Common ones:
00125| 
00126| - Model selection (`/model`, `/target`)
00127| - Context lists (`/file`, `/url`, `/image`, `/video`, `/history`)
00128| - Informational (`/tokens`, `/settings`, `/reasoning`)
00129| - Theme (`/theme`, `/theme-mode`)
00130| 
00131| ## Generation pipeline integration
00132| 
00133| The TUI does not implement model calls directly.
00134| 
00135| Instead, it delegates to the same pipeline used by the CLI:
00136| 
00137| - `src/generate-command.ts` exports `runGeneratePipeline(args, options)`.
00138| 
00139| The Generate screen uses a hook that:
00140| 
00141| - Builds a `GenerateArgs` structure from the current UI state (intent source, selected model, context lists, toggles).
00142| - Hooks into the pipeline’s structured stream events and maps them into:
00143|   - history entries
00144|   - status text
00145|   - token usage statistics
00146| 
00147| Relevant modules:
00148| 
00149| - `src/tui/hooks/useGenerationPipeline.ts`
00150| - `src/tui/generation-pipeline-reducer.ts`
00151| 
00152| ### Stream events
00153| 
00154| The generate pipeline can emit JSONL stream events (`--stream jsonl` on the CLI). The TUI reuses the same event schema internally to keep the UI’s history/status consistent.
00155| 
00156| Event types are defined in `src/generate-command.ts` (examples: `progress.update`, `context.telemetry`, `generation.iteration.*`, `upload.state`).
00157| 
00158| ## Series generation
00159| 
00160| Series generation is a TUI-only workflow intended for “atomic prompts” (independent steps).
00161| 
00162| - Triggered by `/series` or by pressing `Tab` (when not adding a dropped file path).
00163| - Writes artifacts to a timestamped folder under `generated/series`.
00164| 
00165| Implementation lives in `src/tui/hooks/useGenerationPipeline.ts`.
00166| 
00167| ## Prompt tests (TUI + CLI)
00168| 
00169| The test runner exists in two places:
00170| 
00171| - CLI: `prompt-maker-cli test [file]`
00172| - TUI: Test Runner view (`Ctrl+T`)
00173| 
00174| Both use the same underlying functions from `src/test-command.ts`:
00175| 
00176| - `runPromptTestSuite(filePath, { reporter })`
00177| 
00178| Test definitions are YAML and validated by Zod:
00179| 
00180| - Schema: `src/testing/test-schema.ts`
00181| - Evaluator: `src/testing/evaluator.ts`
00182| 
00183| ## Persistence
00184| 
00185| The TUI and CLI persist several artifacts:
00186| 
00187| - Generation history (JSONL): `~/.config/prompt-maker-cli/history.jsonl` (written by `src/history-logger.ts`)
00188| - TUI command history: `~/.config/prompt-maker-cli/tui-history.json` (used by `/history`)
00189| - Smart context embeddings cache: `~/.config/prompt-maker-cli/embeddings_cache.json` (see `src/rag/vector-store.ts`)
00190| - Theme settings: stored in the CLI config (`theme`, `themeMode`) via `src/config.ts`
00191| 
00192| ## Extending the TUI
00193| 
00194| ### Add a new `/command`
00195| 
00196| 1. Add a descriptor to `src/tui/config.ts`.
00197| 2. Add behavior in `src/tui/hooks/usePopupManager.ts` (dispatch popup open, toggle state, or run an action).
00198| 3. If a popup is needed:
00199|    - Add a union member in `src/tui/types.ts`.
00200|    - Add transitions in `src/tui/popup-reducer.ts`.
00201|    - Add a popup component under `src/tui/components/popups/`.
00202| 
00203| ### Add a new popup safely
00204| 
00205| Follow the reducer-first pattern:
00206| 
00207| - Put state transitions in `src/tui/popup-reducer.ts`.
00208| - Keep async work in `src/tui/hooks/usePopupManager.ts`.
00209| - Add/adjust unit tests under `src/__tests__/tui/` when behavior changes.
00210| 

(End of file - total 210 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/InstructionsPopup.tsx"
}
```
**Output:**
```
<file>
00001| import { Box, Text, useStdout } from 'ink'
00002| 
00003| import { SingleLineTextInput } from '../core/SingleLineTextInput'
00004| import { useTheme } from '../../theme/theme-provider'
00005| import {
00006|   inkBackgroundColorProps,
00007|   inkBorderColorProps,
00008|   inkColorProps,
00009| } from '../../theme/theme-types'
00010| 
00011| const clamp = (value: number, min: number, max: number): number =>
00012|   Math.max(min, Math.min(value, max))
00013| 
00014| const padRight = (value: string, width: number): string => {
00015|   if (width <= 0) {
00016|     return ''
00017|   }
00018| 
00019|   const trimmed = value.length > width ? value.slice(0, width) : value
00020|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00021| }
00022| 
00023| export type InstructionsPopupProps = {
00024|   draft: string
00025|   onDraftChange: (value: string) => void
00026|   onSubmitDraft: (value: string) => void
00027| }
00028| 
00029| export const InstructionsPopup = ({
00030|   draft,
00031|   onDraftChange,
00032|   onSubmitDraft,
00033| }: InstructionsPopupProps) => {
00034|   const { theme } = useTheme()
00035|   const { stdout } = useStdout()
00036| 
00037|   const terminalColumns = stdout?.columns ?? 80
00038|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00039| 
00040|   const borderColumns = 2
00041|   const paddingColumns = 2
00042|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00043| 
00044|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00045| 
00046|   return (
00047|     <Box
00048|       flexDirection="column"
00049|       borderStyle="round"
00050|       paddingX={1}
00051|       paddingY={0}
00052|       width={popupWidth}
00053|       {...inkBorderColorProps(theme.border)}
00054|       {...backgroundProps}
00055|     >
00056|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00057|         {padRight('Meta Instructions', contentWidth)}
00058|       </Text>
00059|       <Box flexDirection="column" marginTop={1}>
00060|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00061|           {padRight('Add optional guidance (blank clears; Enter applies)', contentWidth)}
00062|         </Text>
00063|         <SingleLineTextInput
00064|           value={draft}
00065|           onChange={onDraftChange}
00066|           onSubmit={() => onSubmitDraft(draft)}
00067|           placeholder="Be concise and focus on security"
00068|           focus
00069|           width={contentWidth}
00070|           backgroundColor={theme.popupBackground}
00071|         />
00072|       </Box>
00073|       <Box marginTop={1}>
00074|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00075|           {padRight('Esc closes · Enter saves', contentWidth)}
00076|         </Text>
00077|       </Box>
00078|     </Box>
00079|   )
00080| }
00081| 

(End of file - total 81 lines)
</file>
```
```

```
Tool: glob

**Input:**
```json
{
  "pattern": "apps/**/src/tui/**"
}
```
**Output:**
```
No files found
```
```

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/tui/screens/**"
}
```
**Output:**
```
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/CommandScreenImpl.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenLayout.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/PopupArea.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerFileInput.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/HistoryPane.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useContextPopupGlue.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPopupBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/usePopupKeyboardShortcuts.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPopupManager.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/command-screen-reducer.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenController.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandGenerationPipeline.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenModelGeneration.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPopupAndView.types.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/CommandInput.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPopupAndView.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenViewModel.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/useCommandScreen.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenInputState.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useIntentPopupGlue.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/usePasteManager.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useHistoryScrollKeys.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandMenuManager.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenShell.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/usePromptTestRunner.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenHistoryAndTests.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useThemeModePopupGlue.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useThemePopupGlue.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/TestRunnerScreen.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerSummary.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerLogs.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestList.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerError.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerActions.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenContextPopupBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useDroppedFilePath.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPopupVisibility.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenHistoryIntentPopupBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPasteBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenSubmitBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenChips.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/usePopupSelectionClamp.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useTerminalEffects.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useSessionCommands.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/utils/submit-plan.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useIntentSubmitHandler.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useReasoningPopup.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useModelPopupData.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useHistoryPopupGlue.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useMiscPopupDraftHandlers.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useModelProviderState.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/CommandScreen.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/utils/paste-tokens.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/utils/control-key.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/utils/debug-keys.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/CommandMenuPane.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/test-runner-reducer.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/useTestRunnerScreen.ts
```
```

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/tui/theme/**"
}
```
**Output:**
```
/Users/eroberts/Projects/prompt-maker/src/tui/theme/examples/ocean-example.json
/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-provider.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/theme/terminal-appearance.ts
/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-loader.ts
/Users/eroberts/Projects/prompt-maker/src/tui/theme/color-audit.ts
/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-types.ts
/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-settings-service.ts
/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-registry.ts
/Users/eroberts/Projects/prompt-maker/src/tui/theme/builtins/pm-light.ts
/Users/eroberts/Projects/prompt-maker/src/tui/theme/builtins/pm-dark.ts
/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-resolver.ts
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/config.ts"
}
```
**Output:**
```
<file>
00001| import fs from 'node:fs/promises'
00002| import os from 'node:os'
00003| import path from 'node:path'
00004| 
00005| import type { ModelDefinition, ModelProvider } from './model-providers'
00006| import type { ThemeMode } from './tui/theme/theme-types'
00007| 
00008| export type PromptGeneratorConfig = {
00009|   defaultModel?: string
00010|   defaultGeminiModel?: string
00011|   models?: ModelDefinition[]
00012| }
00013| 
00014| export type PromptMakerCliConfig = {
00015|   openaiApiKey?: string
00016|   openaiBaseUrl?: string
00017|   geminiApiKey?: string
00018|   geminiBaseUrl?: string
00019|   promptGenerator?: PromptGeneratorConfig
00020|   contextTemplates?: Record<string, string>
00021| 
00022|   // TUI theme settings (persisted).
00023|   theme?: string
00024|   themeMode?: ThemeMode
00025| }
00026| 
00027| let cachedConfig: PromptMakerCliConfig | null | undefined
00028| let cachedConfigPath: string | null | undefined
00029| 
00030| const getCandidateConfigPaths = (): string[] => {
00031|   const explicit = process.env.PROMPT_MAKER_CLI_CONFIG?.trim()
00032|   const home = os.homedir()
00033|   const defaults = [
00034|     path.join(home, '.config', 'prompt-maker-cli', 'config.json'),
00035|     path.join(home, '.prompt-maker-cli.json'),
00036|   ]
00037| 
00038|   return [explicit, ...defaults].filter((value): value is string => Boolean(value))
00039| }
00040| 
00041| const getDefaultConfigPath = (): string => {
00042|   const home = os.homedir()
00043|   return path.join(home, '.config', 'prompt-maker-cli', 'config.json')
00044| }
00045| 
00046| const resolveConfigPathForWrite = async (): Promise<string> => {
00047|   const explicit = process.env.PROMPT_MAKER_CLI_CONFIG?.trim()
00048|   if (explicit) {
00049|     return explicit
00050|   }
00051| 
00052|   if (cachedConfigPath) {
00053|     return cachedConfigPath
00054|   }
00055| 
00056|   for (const candidate of getCandidateConfigPaths()) {
00057|     try {
00058|       await fs.stat(candidate)
00059|       return candidate
00060|     } catch (error) {
00061|       if (isFileMissingError(error)) {
00062|         continue
00063|       }
00064|       const message = error instanceof Error ? error.message : 'Unknown config error.'
00065|       throw new Error(`Failed to access config at ${candidate}: ${message}`)
00066|     }
00067|   }
00068| 
00069|   return getDefaultConfigPath()
00070| }
00071| 
00072| export const loadCliConfig = async (): Promise<PromptMakerCliConfig | null> => {
00073|   if (cachedConfig !== undefined) {
00074|     return cachedConfig
00075|   }
00076| 
00077|   for (const filePath of getCandidateConfigPaths()) {
00078|     try {
00079|       const contents = await fs.readFile(filePath, 'utf8')
00080|       const parsed = JSON.parse(contents) as unknown
00081|       const config = parseConfig(parsed)
00082|       cachedConfig = config
00083|       cachedConfigPath = filePath
00084|       return config
00085|     } catch (error) {
00086|       if (isFileMissingError(error)) {
00087|         continue
00088|       }
00089| 
00090|       const message = error instanceof Error ? error.message : 'Unknown config error.'
00091|       throw new Error(`Failed to load config at ${filePath}: ${message}`)
00092|     }
00093|   }
00094| 
00095|   cachedConfig = null
00096|   cachedConfigPath = null
00097|   return null
00098| }
00099| 
00100| export const resolveOpenAiCredentials = async (): Promise<{
00101|   apiKey: string
00102|   baseUrl?: string
00103| }> => {
00104|   const envKey = process.env.OPENAI_API_KEY?.trim()
00105|   const envBaseUrl = process.env.OPENAI_BASE_URL?.trim()
00106| 
00107|   if (envKey) {
00108|     const credentials: { apiKey: string; baseUrl?: string } = { apiKey: envKey }
00109|     if (envBaseUrl) {
00110|       credentials.baseUrl = envBaseUrl
00111|     }
00112|     return credentials
00113|   }
00114| 
00115|   const config = await loadCliConfig()
00116|   const apiKey = config?.openaiApiKey?.trim()
00117| 
00118|   if (apiKey) {
00119|     const baseUrl = config?.openaiBaseUrl?.trim()
00120|     const credentials: { apiKey: string; baseUrl?: string } = { apiKey }
00121|     if (baseUrl) {
00122|       credentials.baseUrl = baseUrl
00123|     }
00124|     return credentials
00125|   }
00126| 
00127|   throw new Error(
00128|     'Missing OpenAI credentials. Set OPENAI_API_KEY or add "openaiApiKey" to ~/.config/prompt-maker-cli/config.json.',
00129|   )
00130| }
00131| 
00132| export const resolveGeminiCredentials = async (): Promise<{
00133|   apiKey: string
00134|   baseUrl?: string
00135| }> => {
00136|   const envKey = process.env.GEMINI_API_KEY?.trim()
00137|   const envBaseUrl = process.env.GEMINI_BASE_URL?.trim()
00138| 
00139|   if (envKey) {
00140|     const credentials: { apiKey: string; baseUrl?: string } = { apiKey: envKey }
00141|     if (envBaseUrl) {
00142|       credentials.baseUrl = envBaseUrl
00143|     }
00144|     return credentials
00145|   }
00146| 
00147|   const config = await loadCliConfig()
00148|   const apiKey = config?.geminiApiKey?.trim()
00149| 
00150|   if (apiKey) {
00151|     const baseUrl = config?.geminiBaseUrl?.trim()
00152|     const credentials: { apiKey: string; baseUrl?: string } = { apiKey }
00153|     if (baseUrl) {
00154|       credentials.baseUrl = baseUrl
00155|     }
00156|     return credentials
00157|   }
00158| 
00159|   throw new Error(
00160|     'Missing Gemini credentials. Set GEMINI_API_KEY or add "geminiApiKey" to ~/.config/prompt-maker-cli/config.json.',
00161|   )
00162| }
00163| 
00164| export type ThemeSettingsPatch = {
00165|   theme?: string | null
00166|   themeMode?: ThemeMode | null
00167| }
00168| 
00169| export const updateCliThemeSettings = async (
00170|   patch: ThemeSettingsPatch,
00171|   options?: { configPath?: string },
00172| ): Promise<void> => {
00173|   const configPath = options?.configPath ?? (await resolveConfigPathForWrite())
00174|   const directory = path.dirname(configPath)
00175|   await fs.mkdir(directory, { recursive: true })
00176| 
00177|   let raw: unknown = {}
00178|   try {
00179|     const contents = await fs.readFile(configPath, 'utf8')
00180|     raw = JSON.parse(contents) as unknown
00181|   } catch (error) {
00182|     if (!isFileMissingError(error)) {
00183|       const message = error instanceof Error ? error.message : 'Unknown config error.'
00184|       throw new Error(`Failed to read config at ${configPath}: ${message}`)
00185|     }
00186|   }
00187| 
00188|   if (!isRecord(raw)) {
00189|     throw new Error(`Failed to update config at ${configPath}: root must be a JSON object.`)
00190|   }
00191| 
00192|   const next: Record<string, unknown> = { ...raw }
00193| 
00194|   if ('theme' in patch) {
00195|     if (patch.theme === null || patch.theme === undefined || patch.theme.trim() === '') {
00196|       delete next.theme
00197|     } else {
00198|       next.theme = patch.theme.trim()
00199|     }
00200|   }
00201| 
00202|   if ('themeMode' in patch) {
00203|     if (patch.themeMode === null || patch.themeMode === undefined) {
00204|       delete next.themeMode
00205|     } else {
00206|       next.themeMode = patch.themeMode
00207|     }
00208|   }
00209| 
00210|   const contents = JSON.stringify(next, null, 2)
00211|   const tempFile = `${configPath}.${process.pid}.tmp`
00212|   await fs.writeFile(tempFile, `${contents}\n`, 'utf8')
00213| 
00214|   try {
00215|     await fs.rename(tempFile, configPath)
00216|   } catch {
00217|     await fs.writeFile(configPath, `${contents}\n`, 'utf8')
00218|   }
00219| 
00220|   cachedConfig = parseConfig(next)
00221|   cachedConfigPath = configPath
00222| }
00223| 
00224| const parseConfig = (raw: unknown): PromptMakerCliConfig => {
00225|   if (!isRecord(raw)) {
00226|     throw new Error('CLI config must be a JSON object.')
00227|   }
00228| 
00229|   const config: PromptMakerCliConfig = {}
00230| 
00231|   if (raw.openaiApiKey !== undefined) {
00232|     config.openaiApiKey = expectString(raw.openaiApiKey, 'openaiApiKey')
00233|   }
00234| 
00235|   if (raw.openaiBaseUrl !== undefined) {
00236|     config.openaiBaseUrl = expectString(raw.openaiBaseUrl, 'openaiBaseUrl')
00237|   }
00238| 
00239|   if (raw.geminiApiKey !== undefined) {
00240|     config.geminiApiKey = expectString(raw.geminiApiKey, 'geminiApiKey')
00241|   }
00242| 
00243|   if (raw.geminiBaseUrl !== undefined) {
00244|     config.geminiBaseUrl = expectString(raw.geminiBaseUrl, 'geminiBaseUrl')
00245|   }
00246| 
00247|   if (raw.promptGenerator !== undefined) {
00248|     if (!isRecord(raw.promptGenerator)) {
00249|       throw new Error('"promptGenerator" must be an object if provided.')
00250|     }
00251| 
00252|     const promptGenerator: PromptGeneratorConfig = {}
00253|     if (raw.promptGenerator.defaultModel !== undefined) {
00254|       promptGenerator.defaultModel = expectString(
00255|         raw.promptGenerator.defaultModel,
00256|         'promptGenerator.defaultModel',
00257|       )
00258|     }
00259|     if (raw.promptGenerator.defaultGeminiModel !== undefined) {
00260|       promptGenerator.defaultGeminiModel = expectString(
00261|         raw.promptGenerator.defaultGeminiModel,
00262|         'promptGenerator.defaultGeminiModel',
00263|       )
00264|     }
00265|     if (raw.promptGenerator.models !== undefined) {
00266|       promptGenerator.models = parsePromptGeneratorModels(raw.promptGenerator.models)
00267|     }
00268|     config.promptGenerator = promptGenerator
00269|   }
00270| 
00271|   if (raw.contextTemplates !== undefined) {
00272|     if (!isRecord(raw.contextTemplates)) {
00273|       throw new Error('"contextTemplates" must be an object if provided.')
00274|     }
00275|     const templates: Record<string, string> = {}
00276|     for (const [key, value] of Object.entries(raw.contextTemplates)) {
00277|       templates[key] = expectString(value, `contextTemplates.${key}`)
00278|     }
00279|     config.contextTemplates = templates
00280|   }
00281| 
00282|   if (raw.theme !== undefined) {
00283|     const theme = expectString(raw.theme, 'theme').trim()
00284|     if (theme) {
00285|       config.theme = theme
00286|     }
00287|   }
00288| 
00289|   if (raw.themeMode !== undefined) {
00290|     config.themeMode = expectThemeMode(raw.themeMode, 'themeMode')
00291|   }
00292| 
00293|   return config
00294| }
00295| 
00296| const parsePromptGeneratorModels = (value: unknown): ModelDefinition[] => {
00297|   if (!Array.isArray(value)) {
00298|     throw new Error('"promptGenerator.models" must be an array when provided.')
00299|   }
00300|   return value.map((entry, index) => parsePromptGeneratorModel(entry, index))
00301| }
00302| 
00303| const parsePromptGeneratorModel = (value: unknown, index: number): ModelDefinition => {
00304|   if (!isRecord(value)) {
00305|     throw new Error(`promptGenerator.models[${index}] must be an object.`)
00306|   }
00307|   const id = expectString(value.id, `promptGenerator.models[${index}].id`).trim()
00308|   if (!id) {
00309|     throw new Error(`promptGenerator.models[${index}].id must not be empty.`)
00310|   }
00311|   const model: ModelDefinition = { id }
00312|   if (value.label !== undefined) {
00313|     const label = expectString(value.label, `promptGenerator.models[${index}].label`).trim()
00314|     if (label) {
00315|       model.label = label
00316|     }
00317|   }
00318|   if (value.provider !== undefined) {
00319|     model.provider = expectProvider(value.provider, `promptGenerator.models[${index}].provider`)
00320|   }
00321|   if (value.description !== undefined) {
00322|     const description = expectString(
00323|       value.description,
00324|       `promptGenerator.models[${index}].description`,
00325|     ).trim()
00326|     if (description) {
00327|       model.description = description
00328|     }
00329|   }
00330|   if (value.notes !== undefined) {
00331|     const notes = expectString(value.notes, `promptGenerator.models[${index}].notes`).trim()
00332|     if (notes) {
00333|       model.notes = notes
00334|     }
00335|   }
00336|   if (value.capabilities !== undefined) {
00337|     const capabilities = parseCapabilitiesField(
00338|       value.capabilities,
00339|       `promptGenerator.models[${index}].capabilities`,
00340|     )
00341|     if (capabilities.length > 0) {
00342|       model.capabilities = capabilities
00343|     }
00344|   }
00345|   if (value.default !== undefined) {
00346|     model.default = expectBoolean(value.default, `promptGenerator.models[${index}].default`)
00347|   }
00348|   return model
00349| }
00350| 
00351| const parseCapabilitiesField = (value: unknown, label: string): string[] => {
00352|   if (typeof value === 'string') {
00353|     const normalized = value.trim()
00354|     return normalized ? [normalized] : []
00355|   }
00356|   if (Array.isArray(value)) {
00357|     return value
00358|       .map((entry, idx) => expectString(entry, `${label}[${idx}]`).trim())
00359|       .filter((entry) => entry.length > 0)
00360|   }
00361|   throw new Error(`${label} must be a string or array of strings.`)
00362| }
00363| 
00364| const expectBoolean = (value: unknown, label: string): boolean => {
00365|   if (typeof value !== 'boolean') {
00366|     throw new Error(`${label} must be a boolean.`)
00367|   }
00368|   return value
00369| }
00370| 
00371| const expectProvider = (value: unknown, label: string): ModelProvider => {
00372|   if (typeof value !== 'string') {
00373|     throw new Error(`${label} must be one of openai, gemini, or other.`)
00374|   }
00375|   const normalized = value.trim().toLowerCase()
00376|   if (normalized === 'openai' || normalized === 'gemini' || normalized === 'other') {
00377|     return normalized as ModelProvider
00378|   }
00379|   throw new Error(`${label} must be one of openai, gemini, or other.`)
00380| }
00381| 
00382| const expectString = (value: unknown, label: string): string => {
00383|   if (typeof value !== 'string') {
00384|     throw new Error(`${label} must be a string.`)
00385|   }
00386|   return value
00387| }
00388| 
00389| const expectThemeMode = (value: unknown, label: string): ThemeMode => {
00390|   if (typeof value !== 'string') {
00391|     throw new Error(`${label} must be one of light, dark, system, or auto.`)
00392|   }
00393|   const normalized = value.trim().toLowerCase()
00394|   if (normalized === 'auto') {
00395|     return 'system'
00396|   }
00397|   if (normalized === 'light' || normalized === 'dark' || normalized === 'system') {
00398|     return normalized as ThemeMode
00399|   }
00400|   throw new Error(`${label} must be one of light, dark, system, or auto.`)
00401| }
00402| 
00403| function isRecord(value: unknown): value is Record<string, unknown> {
00404|   return typeof value === 'object' && value !== null && !Array.isArray(value)
00405| }
00406| 
00407| function hasErrnoCode(value: unknown): value is { code: string } {
00408|   return (
00409|     typeof value === 'object' &&
00410|     value !== null &&
00411|     'code' in value &&
00412|     typeof (value as { code: unknown }).code === 'string'
00413|   )
00414| }
00415| 
00416| function isFileMissingError(error: unknown): boolean {
00417|   return hasErrnoCode(error) && error.code === 'ENOENT'
00418| }
00419| 

(End of file - total 419 lines)
</file>
```
```

---

## Assistant

_Thinking:_



Next I’ll inspect the theme system and enumerate screens/components so the guide can reference real paths, tokens, and styling helpers without guessing.

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/tui/components/core/**/*.tsx"
}
```
**Output:**
```
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/ToastOverlay.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/CommandMenu.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/ScrollableOutput.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/SingleLineTextInput.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/HelpOverlay.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/Toast.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/InputBar.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/BackgroundFill.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/PastedSnippetCard.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/StatusIndicators.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/MultilineTextInput.tsx
```
```

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/tui/components/core/**/*.ts"
}
```
**Output:**
```
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/status-indicators-layout.ts
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/input-bar-presentation.ts
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/bracketed-paste.ts
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/command-menu-keymap.ts
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/help-overlay-scroll.ts
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/multiline-text-buffer.ts
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/tokenized-text.ts
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/text-input-keys.ts
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/single-line-text-input-keymap.ts
```
```

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/tui/components/popups/**/*.tsx"
}
```
**Output:**
```
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ModelPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ListPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/IntentFilePopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ReasoningPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/TokenUsagePopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/SettingsPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ThemeModePopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/TogglePopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/SeriesIntentPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/TestPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/InstructionsPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/SmartPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ThemePickerPopup.tsx
```
```

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/tui/components/popups/**/*.ts"
}
```
**Output:**
```
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/list-window.ts
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/list-popup-layout.ts
```
```

```
Tool: grep

**Input:**
```json
{
  "pattern": "useTheme\\(",
  "path": "src/tui"
}
```
**Output:**
```
Found 42 matches
src/tui/screens/command/CommandScreenImpl.tsx:
  Line 60:       const { theme } = useTheme()

src/tui/ContextPanel.tsx:
  Line 18:   const { theme } = useTheme()
  Line 29:   const { theme } = useTheme()
  Line 43:   const { theme } = useTheme()

src/tui/MediaPanel.tsx:
  Line 18:   const { theme } = useTheme()
  Line 29:   const { theme } = useTheme()
  Line 43:   const { theme } = useTheme()

src/tui/screens/test-runner/components/TestRunnerFileInput.tsx:
  Line 43:   const { theme } = useTheme()

src/tui/components/core/CommandMenu.tsx:
  Line 30:   const { theme } = useTheme()

src/tui/screens/command/components/HistoryPane.tsx:
  Line 28:   const { theme } = useTheme()

src/tui/components/popups/ModelPopup.tsx:
  Line 144:   const { theme } = useTheme()

src/tui/components/popups/ListPopup.tsx:
  Line 105:   const { theme } = useTheme()

src/tui/components/popups/IntentFilePopup.tsx:
  Line 75:   const { theme } = useTheme()

src/tui/components/popups/ReasoningPopup.tsx:
  Line 31:   const { theme } = useTheme()

src/tui/components/popups/TokenUsagePopup.tsx:
  Line 68:   const { theme } = useTheme()

src/tui/components/popups/SettingsPopup.tsx:
  Line 32:   const { theme } = useTheme()

src/tui/components/popups/ThemeModePopup.tsx:
  Line 38:   const { theme, mode, error } = useTheme()

src/tui/components/popups/TogglePopup.tsx:
  Line 30:   const { theme } = useTheme()

src/tui/components/popups/SeriesIntentPopup.tsx:
  Line 38:   const { theme } = useTheme()

src/tui/components/popups/TestPopup.tsx:
  Line 31:   const { theme } = useTheme()

src/tui/components/popups/InstructionsPopup.tsx:
  Line 34:   const { theme } = useTheme()

src/tui/components/popups/SmartPopup.tsx:
  Line 77:   const { theme } = useTheme()

src/tui/components/core/ScrollableOutput.tsx:
  Line 28:     const { theme } = useTheme()

src/tui/components/core/SingleLineTextInput.tsx:
  Line 69:   const { theme } = useTheme()

src/tui/components/core/HelpOverlay.tsx:
  Line 46:   const { theme } = useTheme()

src/tui/components/core/Toast.tsx:
  Line 56:   const { theme } = useTheme()

src/tui/screens/command/hooks/useCommandScreenPopupManager.ts:
  Line 124:   const { activeThemeName, mode, themes } = useTheme()

src/tui/AppContainer.tsx:
  Line 22:   const { theme } = useTheme()

src/tui/components/core/InputBar.tsx:
  Line 67:   const { theme } = useTheme()

src/tui/components/popups/ThemePickerPopup.tsx:
  Line 49:   const { theme, themes, activeThemeName, error } = useTheme()

src/tui/components/core/PastedSnippetCard.tsx:
  Line 16:   const { theme } = useTheme()

src/tui/screens/command/hooks/useThemeModePopupGlue.ts:
  Line 25:   const { setMode } = useTheme()

src/tui/screens/command/hooks/useThemePopupGlue.ts:
  Line 24:   const { themes, previewTheme, setTheme } = useTheme()

src/tui/theme/color-audit.ts:
  Line 10: // After migrating the TUI to `useTheme()`, this list should stay empty.

src/tui/screens/test-runner/components/TestRunnerSummary.tsx:
  Line 18:   const { theme } = useTheme()

src/tui/screens/test-runner/components/TestRunnerLogs.tsx:
  Line 18:   const { theme } = useTheme()

src/tui/screens/test-runner/components/TestList.tsx:
  Line 27:   const { theme } = useTheme()

src/tui/screens/test-runner/components/TestRunnerError.tsx:
  Line 17:   const { theme } = useTheme()

src/tui/screens/test-runner/TestRunnerScreen.tsx:
  Line 40:     const { theme } = useTheme()

src/tui/screens/test-runner/components/TestRunnerActions.tsx:
  Line 19:   const { theme } = useTheme()

src/tui/components/core/StatusIndicators.tsx:
  Line 19:   const { theme } = useTheme()

src/tui/components/core/MultilineTextInput.tsx:
  Line 73:   const { theme } = useTheme()
```
```

```
Tool: grep

**Input:**
```json
{
  "pattern": "inkColorProps|inkBackgroundColorProps|inkBorderColorProps",
  "path": "src/tui"
}
```
**Output:**
```
Found 100 matches
src/tui/screens/command/CommandScreenImpl.tsx:
  Line 14: import { inkBackgroundColorProps, inkColorProps } from '../../theme/theme-types'
  Line 75:         <Box flexGrow={1} width="100%" {...inkBackgroundColorProps(theme.background)}>
  Line 79:                 <Text {...inkColorProps(theme.warning)}>{transportMessage}</Text>

src/tui/ContextPanel.tsx:
  Line 7: import { inkBackgroundColorProps, inkBorderColorProps, inkColorProps } from './theme/theme-types'
  Line 19:   return focused ? <Text {...inkColorProps(theme.accent)}>{label}</Text> : <Text>{label}</Text>
  Line 32:     <Text {...inkColorProps(theme.warning)}>
  Line 119:       {...inkBorderColorProps(theme.border)}
  Line 120:       {...inkBackgroundColorProps(theme.panelBackground)}
  Line 138:           <Text {...inkColorProps(theme.mutedText)}>No file globs added</Text>
  Line 149:           <Text {...inkColorProps(theme.mutedText)}>Use ↑/↓ to select, Del to remove</Text>
  Line 170:             <Text {...inkColorProps(theme.mutedText)}>No URLs added</Text>
  Line 181:             <Text {...inkColorProps(theme.mutedText)}>Use ↑/↓ to select, Del to remove</Text>
  Line 198:           <Text {...inkColorProps(theme.mutedText)}>Current root: {smartContextRoot}</Text>

src/tui/MediaPanel.tsx:
  Line 7: import { inkBackgroundColorProps, inkBorderColorProps, inkColorProps } from './theme/theme-types'
  Line 19:   return focused ? <Text {...inkColorProps(theme.accent)}>{label}</Text> : <Text>{label}</Text>
  Line 32:     <Text {...inkColorProps(theme.warning)}>
  Line 101:       {...inkBorderColorProps(theme.border)}
  Line 102:       {...inkBackgroundColorProps(theme.panelBackground)}
  Line 120:           <Text {...inkColorProps(theme.mutedText)}>No images attached</Text>
  Line 131:           <Text {...inkColorProps(theme.mutedText)}>Use ↑/↓ to select, Del to remove</Text>
  Line 152:             <Text {...inkColorProps(theme.mutedText)}>No videos attached</Text>
  Line 163:             <Text {...inkColorProps(theme.mutedText)}>Use ↑/↓ to select, Del to remove</Text>
  Line 166:             <Text {...inkColorProps(theme.mutedText)}>

src/tui/screens/test-runner/components/TestRunnerFileInput.tsx:
  Line 12:   inkBackgroundColorProps,
  Line 13:   inkBorderColorProps,
  Line 14:   inkColorProps,
  Line 53:   const backgroundProps = inkBackgroundColorProps(theme.panelBackground)
  Line 59:       <Text {...backgroundProps} {...inkColorProps(isFocused ? theme.accent : theme.text)}>
  Line 66:         {...inkBorderColorProps(borderColor)}

src/tui/components/core/CommandMenu.tsx:
  Line 7:   inkBackgroundColorProps,
  Line 8:   inkBorderColorProps,
  Line 9:   inkColorProps,
  Line 42:   const backgroundProps = inkBackgroundColorProps(theme.panelBackground)
  Line 60:       {...inkBorderColorProps(theme.border)}
  Line 63:       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
  Line 67:         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 76:                 ...inkColorProps(theme.selectionText),
  Line 77:                 ...inkBackgroundColorProps(theme.selectionBackground),
  Line 79:             : { ...backgroundProps, ...inkColorProps(theme.text) }

src/tui/screens/command/components/HistoryPane.tsx:
  Line 15: import { inkBackgroundColorProps } from '../../../theme/theme-types'
  Line 45:       {...inkBackgroundColorProps(theme.panelBackground)}

src/tui/components/popups/ModelPopup.tsx:
  Line 9:   inkBackgroundColorProps,
  Line 10:   inkBorderColorProps,
  Line 11:   inkColorProps,
  Line 154:   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
  Line 214:     ...inkColorProps(theme.selectionText),
  Line 215:     ...inkBackgroundColorProps(theme.selectionBackground),
  Line 229:       {...inkBorderColorProps(theme.border)}
  Line 233:         <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
  Line 237:         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 257:             <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 281:                   {...inkColorProps(theme.accent)}
  Line 293:               : { ...backgroundProps, ...inkColorProps(resolveOptionColor(row.option)) }
  Line 307:         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>

src/tui/components/popups/ListPopup.tsx:
  Line 7:   inkBackgroundColorProps,
  Line 8:   inkBorderColorProps,
  Line 9:   inkColorProps,
  Line 115:   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
  Line 126:     ...inkColorProps(theme.selectionText),
  Line 127:     ...inkBackgroundColorProps(theme.selectionBackground),
  Line 131:     ...inkColorProps(theme.chipText),
  Line 132:     ...inkBackgroundColorProps(theme.chipBackground),
  Line 167:         props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
  Line 174:           props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
  Line 184:           : { ...backgroundProps, ...inkColorProps(theme.text) }
  Line 193:           props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
  Line 229:         props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
  Line 241:         : { ...backgroundProps, ...inkColorProps(theme.text) }
  Line 250:         props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
  Line 281:       {...inkBorderColorProps(theme.border)}
  Line 286:       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
  Line 291:         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 311:         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 323:           <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 335:         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 347:       {...inkBorderColorProps(theme.border)}
  Line 350:       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
  Line 354:         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 369:           <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 375:               <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 384:                 : { ...backgroundProps, ...inkColorProps(theme.text) }
  Line 392:               <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 401:         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>

src/tui/components/popups/IntentFilePopup.tsx:
  Line 7:   inkBackgroundColorProps,
  Line 8:   inkBorderColorProps,
  Line 9:   inkColorProps,
  Line 85:   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
  Line 111:     ...inkColorProps(theme.selectionText),
  Line 112:     ...inkBackgroundColorProps(theme.selectionBackground),
  Line 116:     ...inkColorProps(theme.chipText),
  Line 117:     ...inkBackgroundColorProps(theme.chipBackground),
  Line 127:         props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
  Line 134:           props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
  Line 145:           : { ...backgroundProps, ...inkColorProps(theme.text) }
  Line 154:           props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
  Line 190:       {...inkBorderColorProps(theme.border)}
  Line 195:       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
  Line 200:         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
  Line 225:         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>

src/tui/components/popups/ReasoningPopup.tsx:
  Line 6:   inkBackgroundColorProps,

(Results are truncated. Consider using a more specific path or pattern.)
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-types.ts"
}
```
**Output:**
```
<file>
00001| // Theme types for the Ink TUI.
00002| //
00003| // This module intentionally has *no* imports from `ink` (or any components).
00004| // It defines the data model only; resolution/loading happens elsewhere.
00005| 
00006| /**
00007|  * User-facing mode preference.
00008|  *
00009|  * We use `system` (not `auto`) to mirror the upstream OpenCode TUI concept:
00010|  * "system" resolves to the terminal's current background/appearance.
00011|  */
00012| export type ThemeMode = 'light' | 'dark' | 'system'
00013| 
00014| /**
00015|  * Ink-compatible color value.
00016|  *
00017|  * Ink accepts named colors (e.g. `cyanBright`) and can also accept 0–255 ANSI codes.
00018|  * We keep this loose for now; later we can narrow based on the resolver we add.
00019|  */
00020| export type InkColorValue = string | number | undefined
00021| 
00022| export const asInkColor = (value: InkColorValue): string | undefined =>
00023|   value === undefined ? undefined : (value as unknown as string)
00024| 
00025| export const inkColorProps = (value: InkColorValue): { color?: string } => {
00026|   const resolved = asInkColor(value)
00027|   return resolved === undefined ? {} : { color: resolved }
00028| }
00029| 
00030| export const inkBackgroundColorProps = (value: InkColorValue): { backgroundColor?: string } => {
00031|   const resolved = asInkColor(value)
00032|   return resolved === undefined ? {} : { backgroundColor: resolved }
00033| }
00034| 
00035| export const inkBorderColorProps = (value: InkColorValue): { borderColor?: string } => {
00036|   const resolved = asInkColor(value)
00037|   return resolved === undefined ? {} : { borderColor: resolved }
00038| }
00039| 
00040| export type ThemeSlot =
00041|   | 'background'
00042|   | 'text'
00043|   | 'mutedText'
00044|   | 'border'
00045|   | 'accent'
00046|   | 'accentText'
00047|   | 'warning'
00048|   | 'error'
00049|   | 'success'
00050|   | 'panelBackground'
00051|   | 'popupBackground'
00052|   | 'selectionBackground'
00053|   | 'selectionText'
00054|   | 'chipBackground'
00055|   | 'chipText'
00056|   | 'chipMutedText'
00057| 
00058| export const REQUIRED_THEME_SLOTS: readonly ThemeSlot[] = [
00059|   'background',
00060|   'text',
00061|   'mutedText',
00062|   'border',
00063|   'accent',
00064|   'accentText',
00065|   'warning',
00066|   'error',
00067|   'success',
00068|   'panelBackground',
00069|   'popupBackground',
00070|   'selectionBackground',
00071|   'selectionText',
00072|   'chipBackground',
00073|   'chipText',
00074|   'chipMutedText',
00075| ]
00076| 
00077| export type ResolvedTheme = Record<ThemeSlot, InkColorValue>
00078| 
00079| // Concrete appearance mode after resolving `system`.
00080| export type ThemeAppearanceMode = Exclude<ThemeMode, 'system'>
00081| 
00082| // Theme JSON model (structure only): modeled after OpenCode's TUI themes.
00083| 
00084| export type ThemeColorVariant = {
00085|   dark: ThemeColorValue
00086|   light: ThemeColorValue
00087| }
00088| 
00089| /**
00090|  * A single color value in theme JSON.
00091|  *
00092|  * Mirrors OpenCode behavior:
00093|  * - hex strings ("#RRGGBB")
00094|  * - reference strings (defs key or another theme slot key)
00095|  * - ANSI code numbers (0–255)
00096|  * - variants `{ dark, light }`
00097|  * - special strings like "none" / "transparent" (resolver handles meaning)
00098|  */
00099| export type ThemeColorValue = string | number | ThemeColorVariant
00100| 
00101| export type ThemeJson<TSlots extends string = ThemeSlot> = {
00102|   defs?: Record<string, ThemeColorValue>
00103|   theme: Partial<Record<TSlots, ThemeColorValue>> & Record<string, ThemeColorValue>
00104| }
00105| 

(End of file - total 105 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-provider.tsx"
}
```
**Output:**
```
<file>
00001| import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
00002| 
00003| import { detectTerminalAppearanceMode } from './terminal-appearance'
00004| 
00005| import { DEFAULT_THEME_NAME, getThemeJson } from './theme-registry'
00006| import type { ThemeDescriptor } from './theme-loader'
00007| import { resolveTheme } from './theme-resolver'
00008| import {
00009|   loadThemeSelection,
00010|   saveThemeSelection,
00011|   type ThemeSelectionWarning,
00012| } from './theme-settings-service'
00013| import {
00014|   REQUIRED_THEME_SLOTS,
00015|   type ResolvedTheme,
00016|   type ThemeAppearanceMode,
00017|   type ThemeJson,
00018|   type ThemeMode,
00019| } from './theme-types'
00020| 
00021| export type ThemeProviderError = {
00022|   kind: 'load-failed' | 'resolve-failed' | 'save-failed'
00023|   message: string
00024| }
00025| 
00026| export type ThemeContextValue = {
00027|   theme: ResolvedTheme
00028|   mode: ThemeMode
00029|   setMode: (mode: ThemeMode) => Promise<boolean>
00030|   activeThemeName: string
00031|   setTheme: (name: string) => Promise<boolean>
00032|   previewTheme: (name: string) => boolean
00033|   themes: readonly ThemeDescriptor[]
00034|   warnings: readonly ThemeSelectionWarning[]
00035|   error: ThemeProviderError | null
00036| }
00037| 
00038| const ThemeContext = createContext<ThemeContextValue | null>(null)
00039| 
00040| export const useTheme = (): ThemeContextValue => {
00041|   const context = useContext(ThemeContext)
00042|   if (!context) {
00043|     throw new Error('useTheme must be used within ThemeProvider')
00044|   }
00045|   return context
00046| }
00047| 
00048| const FALLBACK_THEME: ResolvedTheme = Object.fromEntries(
00049|   REQUIRED_THEME_SLOTS.map((slot) => [slot, undefined]),
00050| ) as ResolvedTheme
00051| 
00052| const resolveThemeOrThrow = (themeJson: ThemeJson, mode: ThemeAppearanceMode): ResolvedTheme =>
00053|   resolveTheme(themeJson, mode)
00054| 
00055| const resolveAppearanceMode = (mode: ThemeMode): ThemeAppearanceMode => {
00056|   if (mode === 'light') {
00057|     return 'light'
00058|   }
00059| 
00060|   if (mode === 'dark') {
00061|     return 'dark'
00062|   }
00063| 
00064|   // Pragmatic "system" mode: if we can't reliably detect the terminal background,
00065|   // we deterministically fall back to `dark`.
00066|   return detectTerminalAppearanceMode(process.env) ?? 'dark'
00067| }
00068| 
00069| const resolveThemeFromName = (params: {
00070|   themes: readonly ThemeDescriptor[]
00071|   name: string
00072|   appearanceMode: ThemeAppearanceMode
00073| }): { theme: ResolvedTheme; themeName: string } => {
00074|   const descriptor = params.themes.find((theme) => theme.name === params.name)
00075|   if (descriptor) {
00076|     return {
00077|       theme: resolveThemeOrThrow(descriptor.theme, params.appearanceMode),
00078|       themeName: params.name,
00079|     }
00080|   }
00081| 
00082|   const fallbackJson = getThemeJson(DEFAULT_THEME_NAME)
00083|   if (!fallbackJson) {
00084|     return { theme: FALLBACK_THEME, themeName: DEFAULT_THEME_NAME }
00085|   }
00086| 
00087|   return {
00088|     theme: resolveThemeOrThrow(fallbackJson, params.appearanceMode),
00089|     themeName: DEFAULT_THEME_NAME,
00090|   }
00091| }
00092| 
00093| const resolveThemeFromNameStrict = (params: {
00094|   themes: readonly ThemeDescriptor[]
00095|   name: string
00096|   appearanceMode: ThemeAppearanceMode
00097| }): { theme: ResolvedTheme; themeName: string } => {
00098|   const descriptor = params.themes.find((theme) => theme.name === params.name)
00099|   if (!descriptor) {
00100|     throw new Error(`Unknown theme '${params.name}'.`)
00101|   }
00102| 
00103|   return {
00104|     theme: resolveThemeOrThrow(descriptor.theme, params.appearanceMode),
00105|     themeName: descriptor.name,
00106|   }
00107| }
00108| 
00109| export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
00110|   const [themes, setThemes] = useState<readonly ThemeDescriptor[]>([])
00111|   const [activeThemeName, setActiveThemeName] = useState(DEFAULT_THEME_NAME)
00112|   const [mode, setModeState] = useState<ThemeMode>('dark')
00113|   const [warnings, setWarnings] = useState<readonly ThemeSelectionWarning[]>([])
00114|   const [error, setError] = useState<ThemeProviderError | null>(null)
00115| 
00116|   const [theme, setThemeState] = useState<ResolvedTheme>(() => {
00117|     const base = getThemeJson(DEFAULT_THEME_NAME)
00118|     if (!base) {
00119|       return FALLBACK_THEME
00120|     }
00121|     try {
00122|       return resolveThemeOrThrow(base, 'dark')
00123|     } catch {
00124|       return FALLBACK_THEME
00125|     }
00126|   })
00127| 
00128|   useEffect(() => {
00129|     let cancelled = false
00130| 
00131|     const run = async (): Promise<void> => {
00132|       try {
00133|         const loaded = await loadThemeSelection()
00134|         if (cancelled) {
00135|           return
00136|         }
00137| 
00138|         setThemes(loaded.themes)
00139|         setWarnings(loaded.warnings)
00140|         setModeState(loaded.selection.themeMode)
00141| 
00142|         const appearanceMode = resolveAppearanceMode(loaded.selection.themeMode)
00143| 
00144|         try {
00145|           const resolved = resolveThemeFromName({
00146|             themes: loaded.themes,
00147|             name: loaded.selection.themeName,
00148|             appearanceMode,
00149|           })
00150| 
00151|           setActiveThemeName(resolved.themeName)
00152|           setThemeState(resolved.theme)
00153| 
00154|           if (resolved.themeName !== loaded.selection.themeName) {
00155|             void saveThemeSelection({ themeName: resolved.themeName })
00156|           }
00157| 
00158|           setError(null)
00159|         } catch (resolveError) {
00160|           const message =
00161|             resolveError instanceof Error ? resolveError.message : 'Unknown theme resolution error.'
00162|           setError({ kind: 'resolve-failed', message })
00163| 
00164|           const fallbackJson = getThemeJson(DEFAULT_THEME_NAME)
00165|           if (fallbackJson) {
00166|             setActiveThemeName(DEFAULT_THEME_NAME)
00167|             setThemeState(resolveThemeOrThrow(fallbackJson, appearanceMode))
00168|             void saveThemeSelection({ themeName: DEFAULT_THEME_NAME })
00169|           }
00170|         }
00171|       } catch (loadError) {
00172|         const message = loadError instanceof Error ? loadError.message : 'Unknown theme load error.'
00173|         setError({ kind: 'load-failed', message })
00174|       }
00175|     }
00176| 
00177|     void run()
00178| 
00179|     return () => {
00180|       cancelled = true
00181|     }
00182|   }, [])
00183| 
00184|   const previewTheme = useCallback(
00185|     (name: string): boolean => {
00186|       if (themes.length === 0) {
00187|         setError({ kind: 'resolve-failed', message: 'No themes loaded.' })
00188|         return false
00189|       }
00190| 
00191|       const appearanceMode = resolveAppearanceMode(mode)
00192| 
00193|       try {
00194|         const resolved = resolveThemeFromNameStrict({ themes, name, appearanceMode })
00195|         setActiveThemeName(resolved.themeName)
00196|         setThemeState(resolved.theme)
00197|         setError(null)
00198|         return true
00199|       } catch (resolveError) {
00200|         const message =
00201|           resolveError instanceof Error ? resolveError.message : 'Unknown theme resolution error.'
00202|         setError({ kind: 'resolve-failed', message })
00203|         return false
00204|       }
00205|     },
00206|     [mode, themes],
00207|   )
00208| 
00209|   const setTheme = useCallback(
00210|     async (name: string): Promise<boolean> => {
00211|       if (themes.length === 0) {
00212|         setError({ kind: 'resolve-failed', message: 'No themes loaded.' })
00213|         return false
00214|       }
00215| 
00216|       const appearanceMode = resolveAppearanceMode(mode)
00217| 
00218|       let resolved: { theme: ResolvedTheme; themeName: string }
00219|       try {
00220|         resolved = resolveThemeFromNameStrict({ themes, name, appearanceMode })
00221|       } catch (resolveError) {
00222|         const message =
00223|           resolveError instanceof Error ? resolveError.message : 'Unknown theme resolution error.'
00224|         setError({ kind: 'resolve-failed', message })
00225|         return false
00226|       }
00227| 
00228|       try {
00229|         await saveThemeSelection({ themeName: resolved.themeName })
00230|       } catch (saveError) {
00231|         const message = saveError instanceof Error ? saveError.message : 'Unknown theme save error.'
00232|         setError({ kind: 'save-failed', message })
00233|         return false
00234|       }
00235| 
00236|       setActiveThemeName(resolved.themeName)
00237|       setThemeState(resolved.theme)
00238|       setError(null)
00239|       return true
00240|     },
00241|     [mode, themes],
00242|   )
00243| 
00244|   const setMode = useCallback(
00245|     async (nextMode: ThemeMode): Promise<boolean> => {
00246|       if (themes.length === 0) {
00247|         setError({ kind: 'resolve-failed', message: 'No themes loaded.' })
00248|         return false
00249|       }
00250| 
00251|       const appearanceMode = resolveAppearanceMode(nextMode)
00252| 
00253|       let resolved: { theme: ResolvedTheme; themeName: string }
00254|       try {
00255|         resolved = resolveThemeFromNameStrict({ themes, name: activeThemeName, appearanceMode })
00256|       } catch (resolveError) {
00257|         const message =
00258|           resolveError instanceof Error ? resolveError.message : 'Unknown theme resolution error.'
00259|         setError({ kind: 'resolve-failed', message })
00260|         return false
00261|       }
00262| 
00263|       try {
00264|         await saveThemeSelection({ themeMode: nextMode })
00265|       } catch (saveError) {
00266|         const message = saveError instanceof Error ? saveError.message : 'Unknown theme save error.'
00267|         setError({ kind: 'save-failed', message })
00268|         return false
00269|       }
00270| 
00271|       setModeState(nextMode)
00272|       setThemeState(resolved.theme)
00273|       setError(null)
00274|       return true
00275|     },
00276|     [activeThemeName, themes],
00277|   )
00278| 
00279|   const value = useMemo<ThemeContextValue>(
00280|     () => ({
00281|       theme,
00282|       mode,
00283|       setMode,
00284|       activeThemeName,
00285|       setTheme,
00286|       previewTheme,
00287|       themes,
00288|       warnings,
00289|       error,
00290|     }),
00291|     [activeThemeName, error, mode, previewTheme, setMode, setTheme, theme, themes, warnings],
00292|   )
00293| 
00294|   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
00295| }
00296| 

(End of file - total 296 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-settings-service.ts"
}
```
**Output:**
```
<file>
00001| import { loadCliConfig, updateCliThemeSettings, type PromptMakerCliConfig } from '../../config'
00002| 
00003| import { DEFAULT_THEME_NAME } from './theme-registry'
00004| import {
00005|   loadThemes,
00006|   type LoadThemesOptions,
00007|   type ThemeDescriptor,
00008|   type ThemeLoadError,
00009| } from './theme-loader'
00010| import type { ThemeMode } from './theme-types'
00011| 
00012| export const DEFAULT_THEME_MODE: ThemeMode = 'dark'
00013| 
00014| export type ThemeSelection = {
00015|   themeName: string
00016|   themeMode: ThemeMode
00017| }
00018| 
00019| export type ThemeSelectionWarning = {
00020|   kind: 'unknown-theme'
00021|   requested: string
00022|   fallback: string
00023|   message: string
00024| }
00025| 
00026| const resolveThemeMode = (config: PromptMakerCliConfig | null): ThemeMode =>
00027|   config?.themeMode ?? DEFAULT_THEME_MODE
00028| 
00029| const resolveThemeName = (
00030|   config: PromptMakerCliConfig | null,
00031|   themes: readonly ThemeDescriptor[],
00032| ): { themeName: string; warnings: ThemeSelectionWarning[] } => {
00033|   const requested = config?.theme?.trim()
00034|   if (!requested) {
00035|     return { themeName: DEFAULT_THEME_NAME, warnings: [] }
00036|   }
00037| 
00038|   const exists = themes.some((theme) => theme.name === requested)
00039|   if (exists) {
00040|     return { themeName: requested, warnings: [] }
00041|   }
00042| 
00043|   return {
00044|     themeName: DEFAULT_THEME_NAME,
00045|     warnings: [
00046|       {
00047|         kind: 'unknown-theme',
00048|         requested,
00049|         fallback: DEFAULT_THEME_NAME,
00050|         message: `Unknown theme '${requested}', falling back to '${DEFAULT_THEME_NAME}'.`,
00051|       },
00052|     ],
00053|   }
00054| }
00055| 
00056| export const resolveThemeSelectionFromConfig = (params: {
00057|   config: PromptMakerCliConfig | null
00058|   themes: readonly ThemeDescriptor[]
00059| }): { selection: ThemeSelection; warnings: ThemeSelectionWarning[] } => {
00060|   const themeMode = resolveThemeMode(params.config)
00061|   const resolved = resolveThemeName(params.config, params.themes)
00062| 
00063|   return {
00064|     selection: {
00065|       themeName: resolved.themeName,
00066|       themeMode,
00067|     },
00068|     warnings: resolved.warnings,
00069|   }
00070| }
00071| 
00072| export const loadThemeSelection = async (params?: {
00073|   themeLoadOptions?: LoadThemesOptions
00074| }): Promise<{
00075|   themes: ThemeDescriptor[]
00076|   loadErrors: ThemeLoadError[]
00077|   selection: ThemeSelection
00078|   warnings: ThemeSelectionWarning[]
00079| }> => {
00080|   const [config, loaded] = await Promise.all([
00081|     loadCliConfig(),
00082|     loadThemes(params?.themeLoadOptions ?? {}),
00083|   ])
00084| 
00085|   const resolved = resolveThemeSelectionFromConfig({ config, themes: loaded.themes })
00086| 
00087|   return {
00088|     themes: loaded.themes,
00089|     loadErrors: loaded.errors,
00090|     selection: resolved.selection,
00091|     warnings: resolved.warnings,
00092|   }
00093| }
00094| 
00095| export const saveThemeSelection = async (selection: Partial<ThemeSelection>): Promise<void> => {
00096|   await updateCliThemeSettings({
00097|     ...(selection.themeName !== undefined ? { theme: selection.themeName } : {}),
00098|     ...(selection.themeMode !== undefined ? { themeMode: selection.themeMode } : {}),
00099|   })
00100| }
00101| 

(End of file - total 101 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-loader.ts"
}
```
**Output:**
```
<file>
00001| import fs from 'node:fs/promises'
00002| import type { Dirent } from 'node:fs'
00003| import os from 'node:os'
00004| import path from 'node:path'
00005| 
00006| import { listThemes, type ThemeRegistryEntry } from './theme-registry'
00007| import {
00008|   REQUIRED_THEME_SLOTS,
00009|   type ThemeColorValue,
00010|   type ThemeJson,
00011|   type ThemeSlot,
00012| } from './theme-types'
00013| 
00014| export type ThemeSource = 'builtin' | 'global' | 'project'
00015| 
00016| export type ThemeDescriptor = {
00017|   name: string
00018|   label: string
00019|   source: ThemeSource
00020|   theme: ThemeJson
00021|   filePath?: string
00022| }
00023| 
00024| export type ThemeLoadErrorKind = 'read' | 'parse' | 'validate'
00025| 
00026| export type ThemeLoadError = {
00027|   kind: ThemeLoadErrorKind
00028|   filePath: string
00029|   message: string
00030| }
00031| 
00032| export type LoadThemesOptions = {
00033|   cwd?: string
00034|   stopAt?: string | undefined
00035|   homedir?: string
00036|   globalThemesDir?: string
00037| }
00038| 
00039| type ThemeCandidate = {
00040|   name: string
00041|   theme: ThemeJson
00042| }
00043| 
00044| const isRecord = (value: unknown): value is Record<string, unknown> =>
00045|   typeof value === 'object' && value !== null
00046| 
00047| const isThemeColorVariant = (value: unknown): value is { dark: unknown; light: unknown } => {
00048|   if (!isRecord(value)) {
00049|     return false
00050|   }
00051|   return 'dark' in value && 'light' in value
00052| }
00053| 
00054| const isThemeColorValue = (value: unknown): value is ThemeColorValue => {
00055|   if (typeof value === 'string') {
00056|     return true
00057|   }
00058|   if (typeof value === 'number') {
00059|     return Number.isFinite(value)
00060|   }
00061|   if (isThemeColorVariant(value)) {
00062|     return isThemeColorValue(value.dark) && isThemeColorValue(value.light)
00063|   }
00064|   return false
00065| }
00066| 
00067| const validateThemeJson = (
00068|   value: unknown,
00069| ): { ok: true; theme: ThemeJson } | { ok: false; message: string } => {
00070|   if (!isRecord(value)) {
00071|     return { ok: false, message: 'Theme JSON must be an object.' }
00072|   }
00073| 
00074|   const theme = value.theme
00075|   if (!isRecord(theme)) {
00076|     return { ok: false, message: 'Theme JSON must include a `theme` object.' }
00077|   }
00078| 
00079|   const defs = value.defs
00080|   if (defs !== undefined) {
00081|     if (!isRecord(defs)) {
00082|       return { ok: false, message: '`defs` must be an object when present.' }
00083|     }
00084| 
00085|     for (const [key, defValue] of Object.entries(defs)) {
00086|       if (!isThemeColorValue(defValue)) {
00087|         return { ok: false, message: `Invalid defs color value for key: ${key}` }
00088|       }
00089|     }
00090|   }
00091| 
00092|   const missingSlots: ThemeSlot[] = []
00093|   for (const slot of REQUIRED_THEME_SLOTS) {
00094|     const slotValue = theme[slot]
00095|     if (slotValue === undefined) {
00096|       missingSlots.push(slot)
00097|       continue
00098|     }
00099|     if (!isThemeColorValue(slotValue)) {
00100|       return { ok: false, message: `Invalid theme color value for slot: ${slot}` }
00101|     }
00102|   }
00103| 
00104|   if (missingSlots.length > 0) {
00105|     return {
00106|       ok: false,
00107|       message: `Theme JSON missing required slots: ${missingSlots.join(', ')}`,
00108|     }
00109|   }
00110| 
00111|   for (const [key, slotValue] of Object.entries(theme)) {
00112|     if (!isThemeColorValue(slotValue)) {
00113|       return { ok: false, message: `Invalid theme color value for key: ${key}` }
00114|     }
00115|   }
00116| 
00117|   return { ok: true, theme: value as ThemeJson }
00118| }
00119| 
00120| const adaptOpencodeThemeJson = (value: unknown): unknown | null => {
00121|   if (!isRecord(value)) {
00122|     return null
00123|   }
00124| 
00125|   const themeRaw = value.theme
00126|   if (!isRecord(themeRaw)) {
00127|     return null
00128|   }
00129| 
00130|   const looksLikeOpencode =
00131|     'textMuted' in themeRaw ||
00132|     'backgroundPanel' in themeRaw ||
00133|     'backgroundElement' in themeRaw ||
00134|     'primary' in themeRaw
00135| 
00136|   if (!looksLikeOpencode) {
00137|     return null
00138|   }
00139| 
00140|   const theme: Record<string, unknown> = { ...themeRaw }
00141| 
00142|   if (theme.mutedText === undefined && themeRaw.textMuted !== undefined) {
00143|     theme.mutedText = 'textMuted'
00144|   }
00145| 
00146|   if (theme.panelBackground === undefined && themeRaw.backgroundPanel !== undefined) {
00147|     theme.panelBackground = 'backgroundPanel'
00148|   }
00149| 
00150|   if (theme.popupBackground === undefined && theme.panelBackground !== undefined) {
00151|     theme.popupBackground = 'panelBackground'
00152|   }
00153| 
00154|   if (theme.accent === undefined && themeRaw.primary !== undefined) {
00155|     theme.accent = 'primary'
00156|   }
00157| 
00158|   if (theme.accentText === undefined && themeRaw.background !== undefined) {
00159|     theme.accentText = 'background'
00160|   }
00161| 
00162|   if (theme.selectionBackground === undefined) {
00163|     if (themeRaw.backgroundElement !== undefined) {
00164|       theme.selectionBackground = 'backgroundElement'
00165|     } else if (themeRaw.backgroundPanel !== undefined) {
00166|       theme.selectionBackground = 'backgroundPanel'
00167|     }
00168|   }
00169| 
00170|   if (theme.selectionText === undefined && themeRaw.text !== undefined) {
00171|     theme.selectionText = 'text'
00172|   }
00173| 
00174|   if (theme.chipBackground === undefined) {
00175|     if (themeRaw.backgroundElement !== undefined) {
00176|       theme.chipBackground = 'backgroundElement'
00177|     } else if (themeRaw.backgroundPanel !== undefined) {
00178|       theme.chipBackground = 'backgroundPanel'
00179|     }
00180|   }
00181| 
00182|   if (theme.chipText === undefined && themeRaw.text !== undefined) {
00183|     theme.chipText = 'text'
00184|   }
00185| 
00186|   if (theme.chipMutedText === undefined) {
00187|     if (themeRaw.textMuted !== undefined) {
00188|       theme.chipMutedText = 'textMuted'
00189|     } else if (themeRaw.text !== undefined) {
00190|       theme.chipMutedText = 'text'
00191|     }
00192|   }
00193| 
00194|   const adapted: Record<string, unknown> = { theme }
00195|   if ('defs' in value) {
00196|     adapted.defs = value.defs
00197|   }
00198| 
00199|   return adapted
00200| }
00201| 
00202| const defaultGlobalThemesDir = (homedir: string): string =>
00203|   path.join(homedir, '.config', 'prompt-maker-cli', 'themes')
00204| 
00205| const pathExists = async (targetPath: string): Promise<boolean> => {
00206|   try {
00207|     await fs.stat(targetPath)
00208|     return true
00209|   } catch {
00210|     return false
00211|   }
00212| }
00213| 
00214| const readJsonFile = async (filePath: string): Promise<unknown> => {
00215|   const raw = await fs.readFile(filePath, 'utf8')
00216|   return JSON.parse(raw) as unknown
00217| }
00218| 
00219| const loadThemeCandidateFromFile = async (
00220|   filePath: string,
00221| ): Promise<{ ok: true; candidate: ThemeCandidate } | { ok: false; error: ThemeLoadError }> => {
00222|   const name = path.basename(filePath, '.json')
00223| 
00224|   let parsed: unknown
00225|   try {
00226|     parsed = await readJsonFile(filePath)
00227|   } catch (error) {
00228|     const message = error instanceof Error ? error.message : 'Unknown theme file read error.'
00229|     const kind: ThemeLoadErrorKind = error instanceof SyntaxError ? 'parse' : 'read'
00230|     return { ok: false, error: { kind, filePath, message } }
00231|   }
00232| 
00233|   const validated = validateThemeJson(parsed)
00234|   if (validated.ok) {
00235|     return { ok: true, candidate: { name, theme: validated.theme } }
00236|   }
00237| 
00238|   const adapted = adaptOpencodeThemeJson(parsed)
00239|   if (adapted) {
00240|     const adaptedValidated = validateThemeJson(adapted)
00241|     if (adaptedValidated.ok) {
00242|       return { ok: true, candidate: { name, theme: adaptedValidated.theme } }
00243|     }
00244| 
00245|     return {
00246|       ok: false,
00247|       error: {
00248|         kind: 'validate',
00249|         filePath,
00250|         message: `Theme JSON invalid (after adapting opencode schema): ${adaptedValidated.message}`,
00251|       },
00252|     }
00253|   }
00254| 
00255|   return { ok: false, error: { kind: 'validate', filePath, message: validated.message } }
00256| }
00257| 
00258| const listThemeJsonFiles = async (
00259|   themesDir: string,
00260| ): Promise<{ files: string[]; errors: ThemeLoadError[] }> => {
00261|   const errors: ThemeLoadError[] = []
00262| 
00263|   if (!(await pathExists(themesDir))) {
00264|     return { files: [], errors }
00265|   }
00266| 
00267|   let entries: Dirent[]
00268|   try {
00269|     entries = await fs.readdir(themesDir, { withFileTypes: true })
00270|   } catch (error) {
00271|     const message = error instanceof Error ? error.message : 'Unknown directory read error.'
00272|     errors.push({ kind: 'read', filePath: themesDir, message })
00273|     return { files: [], errors }
00274|   }
00275| 
00276|   const files = entries
00277|     .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
00278|     .map((entry) => path.join(themesDir, entry.name))
00279|     .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))
00280| 
00281|   return { files, errors }
00282| }
00283| 
00284| const discoverProjectThemesDirs = async (
00285|   cwd: string,
00286|   stopAt?: string | undefined,
00287| ): Promise<string[]> => {
00288|   const discovered: string[] = []
00289| 
00290|   const resolvedStopAt = stopAt ? path.resolve(stopAt) : null
00291|   let current: string | null = path.resolve(cwd)
00292| 
00293|   while (current !== null) {
00294|     const candidate = path.join(current, '.prompt-maker-cli', 'themes')
00295|     if (await pathExists(candidate)) {
00296|       discovered.push(candidate)
00297|     }
00298| 
00299|     if (resolvedStopAt && current === resolvedStopAt) {
00300|       current = null
00301|       continue
00302|     }
00303| 
00304|     const parent = path.dirname(current)
00305|     if (parent === current) {
00306|       current = null
00307|       continue
00308|     }
00309| 
00310|     current = parent
00311|   }
00312| 
00313|   return discovered
00314| }
00315| 
00316| const toBuiltinDescriptor = (entry: ThemeRegistryEntry): ThemeDescriptor => ({
00317|   name: entry.name,
00318|   label: entry.label,
00319|   source: 'builtin',
00320|   theme: entry.theme,
00321| })
00322| 
00323| const toCustomDescriptor = (
00324|   candidate: ThemeCandidate,
00325|   source: Exclude<ThemeSource, 'builtin'>,
00326|   filePath: string,
00327|   existing?: ThemeDescriptor,
00328| ): ThemeDescriptor => ({
00329|   name: candidate.name,
00330|   label: existing?.label ?? candidate.name,
00331|   source,
00332|   theme: candidate.theme,
00333|   filePath,
00334| })
00335| 
00336| export const loadThemes = async (
00337|   options: LoadThemesOptions = {},
00338| ): Promise<{ themes: ThemeDescriptor[]; errors: ThemeLoadError[] }> => {
00339|   const cwd = options.cwd ?? process.cwd()
00340|   const homedir = options.homedir ?? os.homedir()
00341|   const globalThemesDir = options.globalThemesDir ?? defaultGlobalThemesDir(homedir)
00342| 
00343|   const builtins = listThemes()
00344|   const order: string[] = builtins.map((theme) => theme.name)
00345|   const extras = new Set<string>()
00346| 
00347|   const themesByName = new Map<string, ThemeDescriptor>()
00348|   for (const entry of builtins) {
00349|     themesByName.set(entry.name, toBuiltinDescriptor(entry))
00350|   }
00351| 
00352|   const errors: ThemeLoadError[] = []
00353| 
00354|   const applyThemeFiles = async (
00355|     source: Exclude<ThemeSource, 'builtin'>,
00356|     themesDir: string,
00357|   ): Promise<void> => {
00358|     const listing = await listThemeJsonFiles(themesDir)
00359|     errors.push(...listing.errors)
00360| 
00361|     for (const filePath of listing.files) {
00362|       const loaded = await loadThemeCandidateFromFile(filePath)
00363|       if (!loaded.ok) {
00364|         errors.push(loaded.error)
00365|         continue
00366|       }
00367| 
00368|       const existing = themesByName.get(loaded.candidate.name)
00369|       themesByName.set(
00370|         loaded.candidate.name,
00371|         toCustomDescriptor(loaded.candidate, source, filePath, existing),
00372|       )
00373| 
00374|       if (!order.includes(loaded.candidate.name)) {
00375|         extras.add(loaded.candidate.name)
00376|       }
00377|     }
00378|   }
00379| 
00380|   await applyThemeFiles('global', globalThemesDir)
00381| 
00382|   const projectDirs = await discoverProjectThemesDirs(cwd, options.stopAt)
00383|   const orderedProjectDirs = [...projectDirs].reverse()
00384| 
00385|   for (const dir of orderedProjectDirs) {
00386|     await applyThemeFiles('project', dir)
00387|   }
00388| 
00389|   const extrasSorted = Array.from(extras).sort((a, b) => a.localeCompare(b))
00390|   const finalNames = [...order, ...extrasSorted]
00391| 
00392|   return {
00393|     themes: finalNames
00394|       .map((name) => themesByName.get(name))
00395|       .filter((theme): theme is ThemeDescriptor => Boolean(theme)),
00396|     errors,
00397|   }
00398| }
00399| 

(End of file - total 399 lines)
</file>
```
```

---

## Assistant

_Thinking:_

**Continuing theme updates**

I need to decide whether to continue reading the remainder, as it’s enough for the theme loader. I’ll mark step one as completed now and note that the DEVELOPER_NOTE might need an update since it references outdated components. Next, I’ll focus on reading key files like AppContainer, ContextPanel, and others for styling details, scanning these in chunks of 250 lines or less. I plan to extract theme tokens used to build a reference table. Let's proceed with scanning core files and screens in parallel.

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/AppContainer.tsx"
}
```
**Output:**
```
<file>
00001| import React, { useEffect, useMemo, useRef, useState } from 'react'
00002| import { Box, Text, useApp, useInput, useStdout } from 'ink'
00003| import cliCursor from 'cli-cursor'
00004| 
00005| import { CommandScreen, type CommandScreenHandle } from './CommandScreen'
00006| import { TestRunnerScreen, type TestRunnerScreenHandle } from './TestRunnerScreen'
00007| import { ContextProvider } from './context'
00008| import { ToastProvider, useNotifier } from './notifier'
00009| import { ThemeProvider, useTheme } from './theme/theme-provider'
00010| import { inkBackgroundColorProps, inkColorProps } from './theme/theme-types'
00011| import { HelpOverlay } from './components/core/HelpOverlay'
00012| import { ToastOverlay } from './components/core/ToastOverlay'
00013| import { COMMAND_DESCRIPTORS } from './config'
00014| import { createHelpSections, estimateHelpOverlayHeight } from './help-config'
00015| import { resolveAppContainerKeyAction } from './app-container-keymap'
00016| 
00017| export type AppContainerProps = {
00018|   interactiveTransport?: string | undefined
00019| }
00020| 
00021| const AppContainerInner: React.FC<AppContainerProps> = ({ interactiveTransport }) => {
00022|   const { theme } = useTheme()
00023|   const { exit } = useApp()
00024|   const { stdout } = useStdout()
00025|   const [view, setView] = useState<'generate' | 'tests'>('generate')
00026|   const [isPopupOpen, setIsPopupOpen] = useState(false)
00027|   const [isHelpOpen, setIsHelpOpen] = useState(false)
00028|   const [pendingCommandMenu, setPendingCommandMenu] = useState(false)
00029|   const [commandMenuSignal, setCommandMenuSignal] = useState(0)
00030|   const { notify } = useNotifier({ autoDismissMs: 2200 })
00031|   const commandScreenRef = useRef<CommandScreenHandle | null>(null)
00032|   const testRunnerRef = useRef<TestRunnerScreenHandle | null>(null)
00033| 
00034|   useEffect(() => {
00035|     if (!process.stdout.isTTY) {
00036|       return
00037|     }
00038| 
00039|     cliCursor.hide()
00040|     return () => {
00041|       cliCursor.show()
00042|     }
00043|   }, [])
00044| 
00045|   useEffect(() => {
00046|     if (view !== 'generate') {
00047|       setIsPopupOpen(false)
00048|     }
00049|   }, [view])
00050| 
00051|   useEffect(() => {
00052|     if (view === 'generate' && pendingCommandMenu) {
00053|       commandScreenRef.current?.suppressNextInput()
00054|       setCommandMenuSignal((prev) => prev + 1)
00055|       setPendingCommandMenu(false)
00056|       return
00057|     }
00058|     if (view !== 'generate' && pendingCommandMenu) {
00059|       setPendingCommandMenu(false)
00060|     }
00061|   }, [pendingCommandMenu, view])
00062| 
00063|   useInput((input, key) => {
00064|     const action = resolveAppContainerKeyAction({
00065|       input,
00066|       key,
00067|       view,
00068|       isPopupOpen,
00069|       isHelpOpen,
00070|     })
00071| 
00072|     if (action.type === 'none') {
00073|       return
00074|     }
00075| 
00076|     if (action.type === 'toggle-help') {
00077|       if (!isHelpOpen && action.nextIsHelpOpen) {
00078|         if (view === 'generate') {
00079|           commandScreenRef.current?.suppressNextInput()
00080|         } else {
00081|           testRunnerRef.current?.suppressNextInput()
00082|         }
00083|       }
00084|       setIsHelpOpen(action.nextIsHelpOpen)
00085|       return
00086|     }
00087| 
00088|     if (action.type === 'exit') {
00089|       if (view === 'generate') {
00090|         commandScreenRef.current?.suppressNextInput()
00091|       }
00092|       exit()
00093|       return
00094|     }
00095| 
00096|     if (action.type === 'open-command-palette') {
00097|       commandScreenRef.current?.suppressNextInput()
00098|       setCommandMenuSignal((prev) => prev + 1)
00099|       return
00100|     }
00101| 
00102|     if (action.type === 'switch-to-generate-and-open-command-palette') {
00103|       setPendingCommandMenu(true)
00104|       setView('generate')
00105|       return
00106|     }
00107| 
00108|     if (action.type === 'switch-to-tests') {
00109|       if (view === 'generate') {
00110|         commandScreenRef.current?.suppressNextInput()
00111|       }
00112|       setView('tests')
00113|     }
00114|   })
00115| 
00116|   const terminalRows = stdout?.rows ?? 24
00117|   const helpMaxHeight = Math.max(10, terminalRows - 6)
00118| 
00119|   const helpSections = useMemo(
00120|     () => createHelpSections({ commandDescriptors: COMMAND_DESCRIPTORS }),
00121|     [],
00122|   )
00123|   const helpIdealHeight = useMemo(() => estimateHelpOverlayHeight(helpSections), [helpSections])
00124|   const helpOverlayHeight = Math.min(helpIdealHeight, helpMaxHeight)
00125|   const reservedRows = isHelpOpen ? helpOverlayHeight + 1 : 0
00126| 
00127|   return (
00128|     <ContextProvider>
00129|       <Box
00130|         flexDirection="column"
00131|         paddingX={2}
00132|         paddingY={1}
00133|         height="100%"
00134|         width="100%"
00135|         {...inkBackgroundColorProps(theme.background)}
00136|       >
00137|         <Text {...inkColorProps(theme.accent)}>Prompt Maker · Command Palette Preview</Text>
00138|         <Text {...inkColorProps(theme.mutedText)}>
00139|           Ctrl+G → Command Palette · Ctrl+T → Test Runner · ? → Help · Ctrl+C or /exit to exit.
00140|         </Text>
00141|         <Box flexDirection="column" flexGrow={1} marginTop={1}>
00142|           {view === 'generate' ? (
00143|             <>
00144|               <Text {...inkColorProps(theme.mutedText)}>
00145|                 Type intents freely or prefix with /command. Use arrow keys to browse history.
00146|               </Text>
00147|               {interactiveTransport ? (
00148|                 <Text {...inkColorProps(theme.mutedText)}>
00149|                   Interactive transport listening on {interactiveTransport}. Remote refinements will
00150|                   appear in history.
00151|                 </Text>
00152|               ) : null}
00153|               <Box flexDirection="column" flexGrow={1} marginTop={1}>
00154|                 <CommandScreen
00155|                   ref={commandScreenRef}
00156|                   interactiveTransportPath={interactiveTransport}
00157|                   onPopupVisibilityChange={setIsPopupOpen}
00158|                   commandMenuSignal={commandMenuSignal}
00159|                   helpOpen={isHelpOpen}
00160|                   reservedRows={reservedRows}
00161|                   notify={notify}
00162|                 />
00163|               </Box>
00164|             </>
00165|           ) : (
00166|             <>
00167|               <Text {...inkColorProps(theme.mutedText)}>
00168|                 Enter a test file and press Enter to run suites.
00169|               </Text>
00170|               <TestRunnerScreen ref={testRunnerRef} helpOpen={isHelpOpen} />
00171|             </>
00172|           )}
00173|         </Box>
00174|         {isHelpOpen ? (
00175|           <Box marginTop={1}>
00176|             <HelpOverlay activeView={view} maxHeight={helpMaxHeight} />
00177|           </Box>
00178|         ) : null}
00179|         <ToastOverlay />
00180|       </Box>
00181|     </ContextProvider>
00182|   )
00183| }
00184| 
00185| export const AppContainer: React.FC<AppContainerProps> = ({ interactiveTransport }) => (
00186|   <ThemeProvider>
00187|     <ToastProvider>
00188|       <AppContainerInner interactiveTransport={interactiveTransport} />
00189|     </ToastProvider>
00190|   </ThemeProvider>
00191| )
00192| 

(End of file - total 192 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/CommandScreen.tsx"
}
```
**Output:**
```
<file>
00001| export { CommandScreen } from './CommandScreenImpl'
00002| export type { CommandScreenHandle } from './CommandScreenImpl'
00003| 

(End of file - total 3 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/CommandScreenImpl.tsx"
}
```
**Output:**
```
<file>
00001| import { forwardRef, memo, useImperativeHandle } from 'react'
00002| import { Box, Text, useStdout } from 'ink'
00003| 
00004| import { BackgroundFill } from '../../components/core/BackgroundFill'
00005| 
00006| import { CommandInput } from './components/CommandInput'
00007| import { CommandMenuPane } from './components/CommandMenuPane'
00008| import { HistoryPane } from './components/HistoryPane'
00009| import { PopupArea } from './components/PopupArea'
00010| import { useCommandScreenController } from './hooks/useCommandScreenController'
00011| 
00012| import type { NotifyOptions } from '../../notifier'
00013| import { useTheme } from '../../theme/theme-provider'
00014| import { inkBackgroundColorProps, inkColorProps } from '../../theme/theme-types'
00015| 
00016| type CommandScreenProps = {
00017|   interactiveTransportPath?: string | undefined
00018|   onPopupVisibilityChange?: (isOpen: boolean) => void
00019|   commandMenuSignal?: number
00020|   helpOpen?: boolean
00021|   reservedRows?: number
00022|   notify: (message: string, options?: NotifyOptions) => void
00023| }
00024| 
00025| export type CommandScreenHandle = {
00026|   suppressNextInput: () => void
00027| }
00028| 
00029| export const CommandScreen = memo(
00030|   forwardRef<CommandScreenHandle, CommandScreenProps>(
00031|     (
00032|       {
00033|         interactiveTransportPath,
00034|         onPopupVisibilityChange,
00035|         commandMenuSignal,
00036|         helpOpen = false,
00037|         reservedRows = 0,
00038|         notify,
00039|       },
00040|       ref,
00041|     ) => {
00042|       const {
00043|         transportMessage,
00044|         historyPaneProps,
00045|         popupAreaProps,
00046|         commandMenuPaneProps,
00047|         commandInputProps,
00048|         suppressNextInput,
00049|       } = useCommandScreenController({
00050|         ...(interactiveTransportPath ? { interactiveTransportPath } : {}),
00051|         ...(onPopupVisibilityChange ? { onPopupVisibilityChange } : {}),
00052|         ...(commandMenuSignal !== undefined ? { commandMenuSignal } : {}),
00053|         helpOpen,
00054|         reservedRows,
00055|         notify,
00056|       })
00057| 
00058|       useImperativeHandle(ref, () => ({ suppressNextInput }), [suppressNextInput])
00059| 
00060|       const { theme } = useTheme()
00061|       const { stdout } = useStdout()
00062| 
00063|       const terminalRows = stdout?.rows ?? 24
00064|       const terminalColumns = stdout?.columns ?? 80
00065| 
00066|       // AppContainer applies `paddingX={2}` (left + right), which reduces the
00067|       // actual renderable width available to CommandScreen. If we try to render
00068|       // a full-width `BackgroundFill` at `stdout.columns`, Ink will truncate the
00069|       // line and paint `...` in the last cells.
00070|       const backdropColumns = Math.max(0, terminalColumns - 4)
00071| 
00072|       const showPopupOverlay = Boolean(popupAreaProps.popupState) && !popupAreaProps.helpOpen
00073| 
00074|       return (
00075|         <Box flexGrow={1} width="100%" {...inkBackgroundColorProps(theme.background)}>
00076|           <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1} width="100%">
00077|             {transportMessage ? (
00078|               <Box flexShrink={0}>
00079|                 <Text {...inkColorProps(theme.warning)}>{transportMessage}</Text>
00080|               </Box>
00081|             ) : null}
00082| 
00083|             <HistoryPane {...historyPaneProps} />
00084|             <CommandMenuPane {...commandMenuPaneProps} />
00085|             <CommandInput {...commandInputProps} />
00086|           </Box>
00087| 
00088|           {showPopupOverlay ? (
00089|             <Box position="absolute" width="100%" height="100%">
00090|               <Box position="absolute" width="100%" height="100%" overflow="hidden">
00091|                 <BackgroundFill
00092|                   rows={terminalRows}
00093|                   columns={backdropColumns}
00094|                   background={theme.panelBackground}
00095|                 />
00096|               </Box>
00097|               <Box
00098|                 position="absolute"
00099|                 width="100%"
00100|                 height="100%"
00101|                 justifyContent="center"
00102|                 alignItems="center"
00103|               >
00104|                 <PopupArea {...popupAreaProps} />
00105|               </Box>
00106|             </Box>
00107|           ) : null}
00108|         </Box>
00109|       )
00110|     },
00111|   ),
00112| )
00113| 
00114| CommandScreen.displayName = 'CommandScreen'
00115| 

(End of file - total 115 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/HistoryPane.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * HistoryPane
00003|  *
00004|  * Presentational component: renders the scrollable history/log output.
00005|  *
00006|  * Keeping this separate from `CommandScreen` makes the screen easier to scan:
00007|  * the screen model decides *what* to show, and this component decides *how* it
00008|  * is laid out.
00009|  */
00010| 
00011| import { Box, useStdout } from 'ink'
00012| 
00013| import { ScrollableOutput } from '../../../components/core/ScrollableOutput'
00014| import { useTheme } from '../../../theme/theme-provider'
00015| import { inkBackgroundColorProps } from '../../../theme/theme-types'
00016| 
00017| const APP_CONTAINER_PADDING_X = 2
00018| const COMMAND_SCREEN_PADDING_X = 1
00019| import type { HistoryEntry } from '../../../types'
00020| 
00021| export type HistoryPaneProps = {
00022|   lines: HistoryEntry[]
00023|   visibleRows: number
00024|   scrollOffset: number
00025| }
00026| 
00027| export const HistoryPane = ({ lines, visibleRows, scrollOffset }: HistoryPaneProps) => {
00028|   const { theme } = useTheme()
00029|   const { stdout } = useStdout()
00030| 
00031|   const terminalColumns = stdout?.columns ?? 80
00032|   const contentWidth = Math.max(
00033|     0,
00034|     terminalColumns - 2 * (APP_CONTAINER_PADDING_X + COMMAND_SCREEN_PADDING_X),
00035|   )
00036| 
00037|   return (
00038|     <Box
00039|       flexDirection="column"
00040|       height={visibleRows}
00041|       width="100%"
00042|       flexShrink={0}
00043|       overflow="hidden"
00044|       marginBottom={1}
00045|       {...inkBackgroundColorProps(theme.panelBackground)}
00046|     >
00047|       <ScrollableOutput
00048|         lines={lines}
00049|         visibleRows={visibleRows}
00050|         scrollOffset={scrollOffset}
00051|         contentWidth={contentWidth}
00052|         backgroundColor={theme.panelBackground}
00053|       />
00054|     </Box>
00055|   )
00056| }
00057| 

(End of file - total 57 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/CommandMenuPane.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * CommandMenuPane
00003|  *
00004|  * Presentational wrapper for the command palette list.
00005|  */
00006| 
00007| import { Box } from 'ink'
00008| 
00009| import { CommandMenu } from '../../../components/core/CommandMenu'
00010| import type { CommandDescriptor } from '../../../types'
00011| 
00012| export type CommandMenuPaneProps = {
00013|   isActive: boolean
00014|   height: number
00015|   commands: readonly CommandDescriptor[]
00016|   selectedIndex: number
00017| }
00018| 
00019| export const CommandMenuPane = ({
00020|   isActive,
00021|   height,
00022|   commands,
00023|   selectedIndex,
00024| }: CommandMenuPaneProps) => {
00025|   if (!isActive) {
00026|     return null
00027|   }
00028| 
00029|   return (
00030|     <Box marginBottom={1} height={height} flexShrink={0} overflow="hidden">
00031|       <CommandMenu commands={commands} selectedIndex={selectedIndex} />
00032|     </Box>
00033|   )
00034| }
00035| 

(End of file - total 35 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/PopupArea.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * PopupArea
00003|  *
00004|  * Presentational component: renders whichever popup is currently active.
00005|  *
00006|  * This keeps the large popup JSX switch out of `CommandScreen` so the main
00007|  * screen file is mostly orchestration.
00008|  */
00009| 
00010| import { Box } from 'ink'
00011| 
00012| import { ListPopup } from '../../../components/popups/ListPopup'
00013| import { ModelPopup } from '../../../components/popups/ModelPopup'
00014| import { SmartPopup } from '../../../components/popups/SmartPopup'
00015| import { TokenUsagePopup } from '../../../components/popups/TokenUsagePopup'
00016| import { SettingsPopup } from '../../../components/popups/SettingsPopup'
00017| import { ReasoningPopup } from '../../../components/popups/ReasoningPopup'
00018| import { TestPopup } from '../../../components/popups/TestPopup'
00019| import { TogglePopup } from '../../../components/popups/TogglePopup'
00020| import { IntentFilePopup } from '../../../components/popups/IntentFilePopup'
00021| import { InstructionsPopup } from '../../../components/popups/InstructionsPopup'
00022| import { SeriesIntentPopup } from '../../../components/popups/SeriesIntentPopup'
00023| import { ThemePickerPopup } from '../../../components/popups/ThemePickerPopup'
00024| import { ThemeModePopup } from '../../../components/popups/ThemeModePopup'
00025| import type { HistoryEntry, ModelOption, PopupState, ProviderStatusMap } from '../../../types'
00026| import type { TokenUsageBreakdown, TokenUsageRun } from '../../../token-usage-store'
00027| 
00028| export type PopupAreaProps = {
00029|   popupState: PopupState
00030|   helpOpen: boolean
00031|   overlayHeight: number
00032| 
00033|   // Model popup
00034|   modelPopupOptions: ModelOption[]
00035|   modelPopupSelection: number
00036|   modelPopupRecentCount: number
00037|   providerStatuses: ProviderStatusMap
00038|   onModelPopupQueryChange: (next: string) => void
00039|   onModelPopupSubmit: (option?: ModelOption) => void
00040| 
00041|   // Toggle popup
00042|   // (toggle popup is self-contained; selection is stored in `popupState`)
00043| 
00044|   // File popup
00045|   files: string[]
00046|   filePopupSuggestions: string[]
00047|   filePopupSuggestionSelectionIndex: number
00048|   filePopupSuggestionsFocused: boolean
00049|   onFilePopupDraftChange: (next: string) => void
00050|   onAddFile: (value: string) => void
00051| 
00052|   // URL popup
00053|   urls: string[]
00054|   onUrlPopupDraftChange: (next: string) => void
00055|   onAddUrl: (value: string) => void
00056| 
00057|   // Image popup
00058|   images: string[]
00059|   imagePopupSuggestions: string[]
00060|   imagePopupSuggestionSelectionIndex: number
00061|   imagePopupSuggestionsFocused: boolean
00062|   onImagePopupDraftChange: (next: string) => void
00063|   onAddImage: (value: string) => void
00064| 
00065|   // Video popup
00066|   videos: string[]
00067|   videoPopupSuggestions: string[]
00068|   videoPopupSuggestionSelectionIndex: number
00069|   videoPopupSuggestionsFocused: boolean
00070|   onVideoPopupDraftChange: (next: string) => void
00071|   onAddVideo: (value: string) => void
00072| 
00073|   // History popup
00074|   historyPopupItems: string[]
00075|   onHistoryPopupDraftChange: (next: string) => void
00076|   onHistoryPopupSubmit: (value: string) => void
00077| 
00078|   // Intent popup
00079|   intentPopupSuggestions: string[]
00080|   intentPopupSuggestionSelectionIndex: number
00081|   intentPopupSuggestionsFocused: boolean
00082|   onIntentPopupDraftChange: (next: string) => void
00083|   onIntentFileSubmit: (value: string) => void
00084| 
00085|   // Instructions
00086|   onInstructionsDraftChange: (next: string) => void
00087|   onInstructionsSubmit: (value: string) => void
00088| 
00089|   // Series
00090|   isGenerating: boolean
00091|   onSeriesDraftChange: (next: string) => void
00092|   onSeriesSubmit: (value: string) => void
00093| 
00094|   // Test
00095|   isTestCommandRunning: boolean
00096|   onTestDraftChange: (next: string) => void
00097|   onTestSubmit: (value: string) => void
00098| 
00099|   // Tokens
00100|   tokenUsageRun: TokenUsageRun | null
00101|   tokenUsageBreakdown: TokenUsageBreakdown | null
00102| 
00103|   // Settings
00104|   statusChips: string[]
00105| 
00106|   // Reasoning
00107|   reasoningPopupLines: HistoryEntry[]
00108|   reasoningPopupVisibleRows: number
00109| 
00110|   // Smart context
00111|   smartContextEnabled: boolean
00112|   smartContextRoot: string | null
00113|   smartPopupSuggestions: string[]
00114|   smartPopupSuggestionSelectionIndex: number
00115|   smartPopupSuggestionsFocused: boolean
00116|   onSmartPopupDraftChange: (next: string) => void
00117|   onSmartRootSubmit: (value: string) => void
00118| }
00119| 
00120| export const PopupArea = ({
00121|   popupState,
00122|   helpOpen,
00123|   overlayHeight,
00124|   modelPopupOptions,
00125|   modelPopupSelection,
00126|   modelPopupRecentCount,
00127|   providerStatuses,
00128|   onModelPopupQueryChange,
00129|   onModelPopupSubmit,
00130|   files,
00131|   filePopupSuggestions,
00132|   filePopupSuggestionSelectionIndex,
00133|   filePopupSuggestionsFocused,
00134|   onFilePopupDraftChange,
00135|   onAddFile,
00136|   urls,
00137|   onUrlPopupDraftChange,
00138|   onAddUrl,
00139|   images,
00140|   imagePopupSuggestions,
00141|   imagePopupSuggestionSelectionIndex,
00142|   imagePopupSuggestionsFocused,
00143|   onImagePopupDraftChange,
00144|   onAddImage,
00145|   videos,
00146|   videoPopupSuggestions,
00147|   videoPopupSuggestionSelectionIndex,
00148|   videoPopupSuggestionsFocused,
00149|   onVideoPopupDraftChange,
00150|   onAddVideo,
00151|   historyPopupItems,
00152|   onHistoryPopupDraftChange,
00153|   onHistoryPopupSubmit,
00154|   intentPopupSuggestions,
00155|   intentPopupSuggestionSelectionIndex,
00156|   intentPopupSuggestionsFocused,
00157|   onIntentPopupDraftChange,
00158|   onIntentFileSubmit,
00159|   onInstructionsDraftChange,
00160|   onInstructionsSubmit,
00161|   isGenerating,
00162|   onSeriesDraftChange,
00163|   onSeriesSubmit,
00164|   isTestCommandRunning,
00165|   onTestDraftChange,
00166|   onTestSubmit,
00167|   tokenUsageRun,
00168|   tokenUsageBreakdown,
00169|   statusChips,
00170|   reasoningPopupLines,
00171|   reasoningPopupVisibleRows,
00172|   smartContextEnabled,
00173|   smartContextRoot,
00174|   smartPopupSuggestions,
00175|   smartPopupSuggestionSelectionIndex,
00176|   smartPopupSuggestionsFocused,
00177|   onSmartPopupDraftChange,
00178|   onSmartRootSubmit,
00179| }: PopupAreaProps) => {
00180|   if (!popupState || helpOpen) {
00181|     return null
00182|   }
00183| 
00184|   return popupState.type === 'model' ? (
00185|     <ModelPopup
00186|       title={popupState.kind === 'target' ? 'Select target model' : 'Select model'}
00187|       query={popupState.query}
00188|       options={modelPopupOptions}
00189|       selectedIndex={modelPopupSelection}
00190|       recentCount={modelPopupRecentCount}
00191|       maxHeight={overlayHeight}
00192|       providerStatuses={providerStatuses}
00193|       onQueryChange={onModelPopupQueryChange}
00194|       onSubmit={onModelPopupSubmit}
00195|     />
00196|   ) : popupState.type === 'toggle' ? (
00197|     <TogglePopup field={popupState.field} selectionIndex={popupState.selectionIndex} />
00198|   ) : popupState.type === 'file' ? (
00199|     <ListPopup
00200|       title="File Context"
00201|       placeholder="src/**/*.ts"
00202|       draft={popupState.draft}
00203|       items={files}
00204|       selectedIndex={popupState.selectionIndex}
00205|       emptyLabel="No file globs added"
00206|       instructions="Enter to add · Tab/↓ suggestions · ↑/↓ select · Del remove (Backspace when empty) · Esc close"
00207|       suggestedItems={filePopupSuggestions}
00208|       suggestedSelectionIndex={filePopupSuggestionSelectionIndex}
00209|       suggestedFocused={filePopupSuggestionsFocused}
00210|       maxHeight={overlayHeight}
00211|       onDraftChange={onFilePopupDraftChange}
00212|       onSubmitDraft={onAddFile}
00213|     />
00214|   ) : popupState.type === 'url' ? (
00215|     <ListPopup
00216|       title="URL Context"
00217|       placeholder="https://github.com/..."
00218|       draft={popupState.draft}
00219|       items={urls}
00220|       selectedIndex={popupState.selectionIndex}
00221|       emptyLabel="No URLs added"
00222|       instructions="Enter to add · ↑/↓ to select · Del to remove · Esc to close"
00223|       onDraftChange={onUrlPopupDraftChange}
00224|       onSubmitDraft={onAddUrl}
00225|     />
00226|   ) : popupState.type === 'image' ? (
00227|     <ListPopup
00228|       title="Images"
00229|       placeholder="path/to/image.png"
00230|       draft={popupState.draft}
00231|       items={images}
00232|       selectedIndex={popupState.selectionIndex}
00233|       emptyLabel="No images attached"
00234|       instructions="Enter to add · Tab/↓ suggestions · ↑/↓ select · Del remove (Backspace when empty) · Esc close"
00235|       suggestedItems={imagePopupSuggestions}
00236|       suggestedSelectionIndex={imagePopupSuggestionSelectionIndex}
00237|       suggestedFocused={imagePopupSuggestionsFocused}
00238|       maxHeight={overlayHeight}
00239|       onDraftChange={onImagePopupDraftChange}
00240|       onSubmitDraft={onAddImage}
00241|     />
00242|   ) : popupState.type === 'video' ? (
00243|     <ListPopup
00244|       title="Videos"
00245|       placeholder="path/to/video.mp4"
00246|       draft={popupState.draft}
00247|       items={videos}
00248|       selectedIndex={popupState.selectionIndex}
00249|       emptyLabel="No videos attached"
00250|       instructions="Enter to add · Tab/↓ suggestions · ↑/↓ select · Del remove (Backspace when empty) · Esc close"
00251|       suggestedItems={videoPopupSuggestions}
00252|       suggestedSelectionIndex={videoPopupSuggestionSelectionIndex}
00253|       suggestedFocused={videoPopupSuggestionsFocused}
00254|       maxHeight={overlayHeight}
00255|       onDraftChange={onVideoPopupDraftChange}
00256|       onSubmitDraft={onAddVideo}
00257|     />
00258|   ) : popupState.type === 'history' ? (
00259|     <ListPopup
00260|       title="History"
00261|       placeholder="Search commands & intents"
00262|       draft={popupState.draft}
00263|       items={historyPopupItems}
00264|       selectedIndex={popupState.selectionIndex}
00265|       emptyLabel="No history saved"
00266|       instructions="Enter to reuse · ↑/↓ navigate · Esc to close"
00267|       onDraftChange={onHistoryPopupDraftChange}
00268|       onSubmitDraft={onHistoryPopupSubmit}
00269|     />
00270|   ) : popupState.type === 'intent' ? (
00271|     <IntentFilePopup
00272|       draft={popupState.draft}
00273|       suggestions={intentPopupSuggestions}
00274|       suggestedSelectionIndex={intentPopupSuggestionSelectionIndex}
00275|       suggestedFocused={intentPopupSuggestionsFocused}
00276|       maxHeight={overlayHeight}
00277|       onDraftChange={onIntentPopupDraftChange}
00278|       onSubmitDraft={onIntentFileSubmit}
00279|     />
00280|   ) : popupState.type === 'instructions' ? (
00281|     <InstructionsPopup
00282|       draft={popupState.draft}
00283|       onDraftChange={onInstructionsDraftChange}
00284|       onSubmitDraft={onInstructionsSubmit}
00285|     />
00286|   ) : popupState.type === 'series' ? (
00287|     <SeriesIntentPopup
00288|       draft={popupState.draft}
00289|       hint={popupState.hint}
00290|       isRunning={isGenerating}
00291|       onDraftChange={onSeriesDraftChange}
00292|       onSubmitDraft={onSeriesSubmit}
00293|     />
00294|   ) : popupState.type === 'test' ? (
00295|     <TestPopup
00296|       draft={popupState.draft}
00297|       isRunning={isTestCommandRunning}
00298|       onDraftChange={onTestDraftChange}
00299|       onSubmitDraft={onTestSubmit}
00300|     />
00301|   ) : popupState.type === 'tokens' ? (
00302|     <TokenUsagePopup run={tokenUsageRun} breakdown={tokenUsageBreakdown} />
00303|   ) : popupState.type === 'settings' ? (
00304|     <SettingsPopup chips={statusChips} />
00305|   ) : popupState.type === 'theme' ? (
00306|     <ThemePickerPopup
00307|       selectionIndex={popupState.selectionIndex}
00308|       initialThemeName={popupState.initialThemeName}
00309|       maxHeight={overlayHeight}
00310|     />
00311|   ) : popupState.type === 'themeMode' ? (
00312|     <ThemeModePopup
00313|       selectionIndex={popupState.selectionIndex}
00314|       initialMode={popupState.initialMode}
00315|     />
00316|   ) : popupState.type === 'reasoning' ? (
00317|     <ReasoningPopup
00318|       lines={reasoningPopupLines}
00319|       visibleRows={reasoningPopupVisibleRows}
00320|       scrollOffset={popupState.scrollOffset}
00321|     />
00322|   ) : popupState.type === 'smart' ? (
00323|     <SmartPopup
00324|       savedRoot={smartContextRoot}
00325|       draft={popupState.draft}
00326|       suggestedItems={smartPopupSuggestions}
00327|       suggestedSelectionIndex={smartPopupSuggestionSelectionIndex}
00328|       suggestedFocused={smartPopupSuggestionsFocused}
00329|       maxHeight={overlayHeight}
00330|       onDraftChange={onSmartPopupDraftChange}
00331|       onSubmitRoot={onSmartRootSubmit}
00332|     />
00333|   ) : null
00334| }
00335| 

(End of file - total 335 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/CommandInput.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * CommandInput
00003|  *
00004|  * Presentational wrapper around the core `InputBar`.
00005|  *
00006|  * Why wrap it?
00007|  * - `CommandScreen` has a lot of orchestration logic; extracting this makes the
00008|  *   render tree more readable.
00009|  * - The wrapper also makes it clearer which props are part of the "screen model".
00010|  */
00011| 
00012| import { InputBar } from '../../../components/core/InputBar'
00013| import type { DebugKeyEvent } from '../../../components/core/MultilineTextInput'
00014| 
00015| export type CommandInputProps = {
00016|   value: string
00017|   onChange: (next: string) => void
00018|   onSubmit: (value: string) => void
00019|   mode: 'intent' | 'refinement'
00020|   isDisabled: boolean
00021|   isPasteActive: boolean
00022|   isBusy: boolean
00023|   statusChips: string[]
00024|   hint?: string | undefined
00025|   debugLine?: string | undefined
00026|   tokenLabel: (token: string) => string | null
00027|   onDebugKeyEvent?: ((event: DebugKeyEvent) => void) | undefined
00028|   placeholder: string
00029| }
00030| 
00031| export const CommandInput = ({
00032|   value,
00033|   onChange,
00034|   onSubmit,
00035|   mode,
00036|   isDisabled,
00037|   isPasteActive,
00038|   isBusy,
00039|   statusChips,
00040|   hint,
00041|   debugLine,
00042|   tokenLabel,
00043|   onDebugKeyEvent,
00044|   placeholder,
00045| }: CommandInputProps) => {
00046|   return (
00047|     <InputBar
00048|       value={value}
00049|       onChange={onChange}
00050|       onSubmit={onSubmit}
00051|       mode={mode}
00052|       isDisabled={isDisabled}
00053|       isPasteActive={isPasteActive}
00054|       isBusy={isBusy}
00055|       statusChips={statusChips}
00056|       hint={hint}
00057|       debugLine={debugLine}
00058|       tokenLabel={tokenLabel}
00059|       onDebugKeyEvent={onDebugKeyEvent}
00060|       placeholder={placeholder}
00061|     />
00062|   )
00063| }
00064| 

(End of file - total 64 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/TestRunnerScreen.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * TestRunnerScreen
00003|  *
00004|  * This screen runs `prompt-tests.yaml` (or another file) and shows progress.
00005|  *
00006|  * Architecture note:
00007|  * - Ink screens tend to accumulate lots of tiny state updates.
00008|  * - We keep state transitions explicit via a reducer (`test-runner-reducer.ts`).
00009|  * - This screen component stays focused on orchestration:
00010|  *   input handling + calling `runPromptTestSuite`.
00011|  */
00012| 
00013| import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
00014| import path from 'node:path'
00015| import { Box, Text, useInput } from 'ink'
00016| 
00017| import { runPromptTestSuite, type PromptTestRunReporter } from '../../../test-command'
00018| import { useLogBuffer } from '../../useLogBuffer'
00019| import { useTheme } from '../../theme/theme-provider'
00020| import { inkColorProps } from '../../theme/theme-types'
00021| import { useTestRunnerScreen } from './useTestRunnerScreen'
00022| 
00023| import { TestRunnerActions } from './components/TestRunnerActions'
00024| import { TestRunnerError } from './components/TestRunnerError'
00025| import { TestRunnerFileInput } from './components/TestRunnerFileInput'
00026| import { TestRunnerLogs } from './components/TestRunnerLogs'
00027| import { TestList } from './components/TestList'
00028| import { TestRunnerSummary } from './components/TestRunnerSummary'
00029| 
00030| export type TestRunnerScreenHandle = {
00031|   suppressNextInput: () => void
00032| }
00033| 
00034| export type TestRunnerScreenProps = {
00035|   helpOpen?: boolean
00036| }
00037| 
00038| export const TestRunnerScreen = forwardRef<TestRunnerScreenHandle, TestRunnerScreenProps>(
00039|   ({ helpOpen = false }, ref) => {
00040|     const { theme } = useTheme()
00041| 
00042|     const {
00043|       state,
00044|       canRun,
00045|       setFilePath,
00046|       setFocus,
00047|       focusNext,
00048|       focusPrevious,
00049|       startRun,
00050|       suiteLoaded,
00051|       testStarted,
00052|       testCompleted,
00053|       runCompleted,
00054|       runErrored,
00055|     } = useTestRunnerScreen()
00056| 
00057|     const { logs, log, clearLogs } = useLogBuffer()
00058| 
00059|     const suppressNextInputRef = useRef(false)
00060| 
00061|     useImperativeHandle(
00062|       ref,
00063|       () => ({
00064|         suppressNextInput: () => {
00065|           suppressNextInputRef.current = true
00066|         },
00067|       }),
00068|       [],
00069|     )
00070| 
00071|     const consumeSuppressedTextInputChange = useCallback((): boolean => {
00072|       if (!suppressNextInputRef.current) {
00073|         return false
00074|       }
00075|       suppressNextInputRef.current = false
00076|       return true
00077|     }, [])
00078| 
00079|     const handleFilePathChange = useCallback(
00080|       (next: string) => {
00081|         if (consumeSuppressedTextInputChange()) {
00082|           return
00083|         }
00084|         setFilePath(next)
00085|       },
00086|       [consumeSuppressedTextInputChange, setFilePath],
00087|     )
00088| 
00089|     const reporter = useMemo<PromptTestRunReporter>(
00090|       () => ({
00091|         onSuiteLoaded: (suite, loadedPath) => {
00092|           suiteLoaded(
00093|             loadedPath,
00094|             suite.tests.map((test) => test.name),
00095|           )
00096|           clearLogs()
00097|           log.info(`Loaded ${suite.tests.length} test(s) from ${loadedPath}`)
00098|         },
00099|         onTestStart: (ordinal, test) => {
00100|           testStarted(ordinal, test.name)
00101|         },
00102|         onTestComplete: (ordinal, result) => {
00103|           testCompleted(ordinal, result.name, result.pass, result.reason ?? null)
00104| 
00105|           if (!result.pass) {
00106|             log.warn(`[${result.name}] ${result.reason}`)
00107|           }
00108|         },
00109|         onComplete: (results) => {
00110|           const passed = results.filter((result) => result.pass).length
00111|           const failed = results.length - passed
00112| 
00113|           runCompleted(passed, failed)
00114| 
00115|           if (failed === 0) {
00116|             log.info('All tests passed')
00117|           } else {
00118|             log.error(`${failed} test(s) failed`)
00119|           }
00120|         },
00121|       }),
00122|       [clearLogs, log, runCompleted, suiteLoaded, testCompleted, testStarted],
00123|     )
00124| 
00125|     const handleRun = useCallback(async () => {
00126|       if (!canRun) {
00127|         return
00128|       }
00129| 
00130|       startRun()
00131| 
00132|       const resolvedPath = path.resolve(process.cwd(), state.filePath.trim())
00133| 
00134|       try {
00135|         await runPromptTestSuite(resolvedPath, { reporter })
00136|       } catch (error) {
00137|         const message = error instanceof Error ? error.message : 'Unknown test execution error.'
00138|         runErrored(message)
00139|         log.error(message)
00140|       }
00141|     }, [canRun, log, reporter, runErrored, startRun, state.filePath])
00142| 
00143|     useInput(
00144|       (_, key) => {
00145|         if (state.status === 'running') {
00146|           return
00147|         }
00148| 
00149|         if (key.tab && key.shift) {
00150|           focusPrevious()
00151|           return
00152|         }
00153| 
00154|         if (key.tab) {
00155|           focusNext()
00156|           return
00157|         }
00158| 
00159|         if (state.focus === 'actions' && key.return && canRun) {
00160|           void handleRun()
00161|         }
00162|       },
00163|       { isActive: !helpOpen },
00164|     )
00165| 
00166|     return (
00167|       <Box flexDirection="column" marginTop={1}>
00168|         <TestRunnerFileInput
00169|           filePath={state.filePath}
00170|           isFocused={state.focus === 'file'}
00171|           helpOpen={helpOpen}
00172|           onChange={handleFilePathChange}
00173|           onSubmit={() => setFocus('actions')}
00174|         />
00175| 
00176|         <TestRunnerActions
00177|           isFocused={state.focus === 'actions'}
00178|           status={state.status}
00179|           lastRunFile={state.lastRunFile}
00180|         />
00181| 
00182|         <Box marginTop={1} flexDirection="column">
00183|           <Text {...inkColorProps(theme.accent)}>Tests</Text>
00184|           <TestList tests={state.tests} />
00185|         </Box>
00186| 
00187|         <TestRunnerSummary summary={state.summary} />
00188|         <TestRunnerLogs logs={logs} />
00189|         <TestRunnerError message={state.error} />
00190|       </Box>
00191|     )
00192|   },
00193| )
00194| 
00195| TestRunnerScreen.displayName = 'TestRunnerScreen'
00196| 

(End of file - total 196 lines)
</file>
```
```

---

## Assistant

_Thinking:_

**Organizing file listings**

That’s significant! I see we have a truncated file listing from the developer message. I think I'll focus on the components folder, especially the ContextPanel and MediaPanel, and possibly the providers too. I want to list them out clearly using `glob` patterns. Specifically, I plan to include: `src/tui/*.tsx`, `src/tui/components/**/*.tsx`, and `src/tui/screens/**/*.tsx`. This should help clarify our directory structure and components!

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/tui/*.tsx"
}
```
**Output:**
```
/Users/eroberts/Projects/prompt-maker/src/tui/ContextPanel.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/MediaPanel.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/AppContainer.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/CommandScreen.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/TestRunnerScreen.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/context.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/index.tsx
```
```

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/tui/components/**/*.tsx"
}
```
**Output:**
```
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/ToastOverlay.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/CommandMenu.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ModelPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ListPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/IntentFilePopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ReasoningPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/TokenUsagePopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/SettingsPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ThemeModePopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/TogglePopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/SeriesIntentPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/TestPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/InstructionsPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/SmartPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/ScrollableOutput.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/SingleLineTextInput.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/HelpOverlay.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/Toast.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/InputBar.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/OpencodeSpinner.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/BackgroundFill.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ThemePickerPopup.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/PastedSnippetCard.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/StatusIndicators.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/components/core/MultilineTextInput.tsx
```
```

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/tui/screens/**/*.tsx"
}
```
**Output:**
```
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/CommandScreenImpl.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/PopupArea.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerFileInput.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/HistoryPane.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/CommandInput.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/TestRunnerScreen.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerSummary.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerLogs.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestList.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerError.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerActions.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/CommandScreen.tsx
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/components/CommandMenuPane.tsx
```
```

```
Tool: glob

**Input:**
```json
{
  "pattern": "src/tui/screens/**/*.ts"
}
```
**Output:**
```
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenLayout.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useContextPopupGlue.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPopupBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/usePopupKeyboardShortcuts.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPopupManager.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/command-screen-reducer.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenModelGeneration.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandGenerationPipeline.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenController.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPopupAndView.types.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPopupAndView.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenViewModel.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/useCommandScreen.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenInputState.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useIntentPopupGlue.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/usePasteManager.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useHistoryScrollKeys.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandMenuManager.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenShell.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/usePromptTestRunner.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenHistoryAndTests.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useThemeModePopupGlue.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useThemePopupGlue.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenContextPopupBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useDroppedFilePath.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPopupVisibility.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenHistoryIntentPopupBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenPasteBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenSubmitBindings.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useCommandScreenChips.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/usePopupSelectionClamp.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useTerminalEffects.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useSessionCommands.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/utils/submit-plan.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useIntentSubmitHandler.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useReasoningPopup.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useModelPopupData.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useHistoryPopupGlue.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useMiscPopupDraftHandlers.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/hooks/useModelProviderState.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/utils/paste-tokens.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/utils/control-key.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/command/utils/debug-keys.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/test-runner-reducer.ts
/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/useTestRunnerScreen.ts
```
```

---

## Assistant

_Thinking:_



```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/CommandScreen.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * CommandScreen entry point.
00003|  *
00004|  * This file intentionally stays small.
00005|  * The real implementation lives under `src/tui/screens/command/*` so we can
00006|  * split the screen into a reducer-driven model + smaller components over time.
00007|  */
00008| 
00009| export { CommandScreen } from './screens/command/CommandScreen'
00010| export type { CommandScreenHandle } from './screens/command/CommandScreen'
00011| 

(End of file - total 11 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/TestRunnerScreen.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * TestRunnerScreen entry point.
00003|  *
00004|  * This file intentionally stays small.
00005|  * The implementation lives under `src/tui/screens/test-runner/*` so it can share
00006|  * the same reducer-driven architecture as the command screen.
00007|  */
00008| 
00009| export { TestRunnerScreen } from './screens/test-runner/TestRunnerScreen'
00010| export type {
00011|   TestRunnerScreenHandle,
00012|   TestRunnerScreenProps,
00013| } from './screens/test-runner/TestRunnerScreen'
00014| 

(End of file - total 14 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/ContextPanel.tsx"
}
```
**Output:**
```
<file>
00001| import React, { useEffect, useState } from 'react'
00002| import { Box, Text, useInput } from 'ink'
00003| 
00004| import { SingleLineTextInput } from './components/core/SingleLineTextInput'
00005| import { isBackspaceKey } from './components/core/text-input-keys'
00006| import { useTheme } from './theme/theme-provider'
00007| import { inkBackgroundColorProps, inkBorderColorProps, inkColorProps } from './theme/theme-types'
00008| import { useContextDispatch, useContextState } from './context-store'
00009| 
00010| export type ContextPanelFocus = 'files' | 'urls' | 'smart' | 'none'
00011| 
00012| type SectionHeaderProps = {
00013|   label: string
00014|   focused: boolean
00015| }
00016| 
00017| const SectionHeader: React.FC<SectionHeaderProps> = ({ label, focused }) => {
00018|   const { theme } = useTheme()
00019|   return focused ? <Text {...inkColorProps(theme.accent)}>{label}</Text> : <Text>{label}</Text>
00020| }
00021| 
00022| type ListEntryProps = {
00023|   label: string
00024|   highlighted: boolean
00025|   index: number
00026| }
00027| 
00028| const ListEntry: React.FC<ListEntryProps> = ({ label, highlighted, index }) => {
00029|   const { theme } = useTheme()
00030| 
00031|   return highlighted ? (
00032|     <Text {...inkColorProps(theme.warning)}>
00033|       {index + 1}. {label}
00034|     </Text>
00035|   ) : (
00036|     <Text>
00037|       {index + 1}. {label}
00038|     </Text>
00039|   )
00040| }
00041| 
00042| export const ContextPanel: React.FC<{ focus: ContextPanelFocus }> = ({ focus }) => {
00043|   const { theme } = useTheme()
00044|   const { files, urls, smartContextEnabled, smartContextRoot } = useContextState()
00045|   const { addFile, removeFile, addUrl, removeUrl, toggleSmartContext, setSmartRoot } =
00046|     useContextDispatch()
00047| 
00048|   const [fileDraft, setFileDraft] = useState('')
00049|   const [urlDraft, setUrlDraft] = useState('')
00050|   const [smartRootDraft, setSmartRootDraft] = useState(smartContextRoot ?? '')
00051|   const [selectedFile, setSelectedFile] = useState(0)
00052|   const [selectedUrl, setSelectedUrl] = useState(0)
00053| 
00054|   useEffect(() => {
00055|     setSmartRootDraft(smartContextRoot ?? '')
00056|   }, [smartContextRoot])
00057| 
00058|   useEffect(() => {
00059|     setSelectedFile((prev) => Math.min(prev, Math.max(files.length - 1, 0)))
00060|   }, [files.length])
00061| 
00062|   useEffect(() => {
00063|     setSelectedUrl((prev) => Math.min(prev, Math.max(urls.length - 1, 0)))
00064|   }, [urls.length])
00065| 
00066|   useInput((input, key) => {
00067|     const filesFocused = focus === 'files'
00068|     const urlsFocused = focus === 'urls'
00069|     const smartFocused = focus === 'smart'
00070| 
00071|     if (filesFocused && files.length > 0) {
00072|       if (key.upArrow) {
00073|         setSelectedFile((prev) => Math.max(prev - 1, 0))
00074|         return
00075|       }
00076|       if (key.downArrow) {
00077|         setSelectedFile((prev) => Math.min(prev + 1, files.length - 1))
00078|         return
00079|       }
00080|       if (key.delete || isBackspaceKey(input, key)) {
00081|         removeFile(selectedFile)
00082|         return
00083|       }
00084|     }
00085| 
00086|     if (urlsFocused && urls.length > 0) {
00087|       if (key.upArrow) {
00088|         setSelectedUrl((prev) => Math.max(prev - 1, 0))
00089|         return
00090|       }
00091|       if (key.downArrow) {
00092|         setSelectedUrl((prev) => Math.min(prev + 1, urls.length - 1))
00093|         return
00094|       }
00095|       if (key.delete || isBackspaceKey(input, key)) {
00096|         removeUrl(selectedUrl)
00097|         return
00098|       }
00099|     }
00100| 
00101|     if (smartFocused) {
00102|       const lower = input.toLowerCase()
00103|       if (lower === 's') {
00104|         toggleSmartContext()
00105|         return
00106|       }
00107|       if (lower === 'r' || key.return) {
00108|         setSmartRoot(smartRootDraft)
00109|       }
00110|     }
00111|   })
00112| 
00113|   return (
00114|     <Box
00115|       flexDirection="column"
00116|       borderStyle="round"
00117|       paddingX={1}
00118|       paddingY={0}
00119|       {...inkBorderColorProps(theme.border)}
00120|       {...inkBackgroundColorProps(theme.panelBackground)}
00121|     >
00122|       <SectionHeader label="File Context" focused={focus === 'files'} />
00123|       <SingleLineTextInput
00124|         value={fileDraft}
00125|         onChange={setFileDraft}
00126|         placeholder="src/**/*.ts"
00127|         focus={focus === 'files'}
00128|         backgroundColor={theme.panelBackground}
00129|         onSubmit={() => {
00130|           if (fileDraft.trim()) {
00131|             addFile(fileDraft)
00132|             setFileDraft('')
00133|           }
00134|         }}
00135|       />
00136|       <Box flexDirection="column" marginTop={1}>
00137|         {files.length === 0 ? (
00138|           <Text {...inkColorProps(theme.mutedText)}>No file globs added</Text>
00139|         ) : null}
00140|         {files.map((value, index) => (
00141|           <ListEntry
00142|             key={`${value}-${index}`}
00143|             label={value}
00144|             highlighted={focus === 'files' && index === selectedFile}
00145|             index={index}
00146|           />
00147|         ))}
00148|         {files.length > 0 ? (
00149|           <Text {...inkColorProps(theme.mutedText)}>Use ↑/↓ to select, Del to remove</Text>
00150|         ) : null}
00151|       </Box>
00152| 
00153|       <Box flexDirection="column" marginTop={1}>
00154|         <SectionHeader label="URLs" focused={focus === 'urls'} />
00155|         <SingleLineTextInput
00156|           value={urlDraft}
00157|           onChange={setUrlDraft}
00158|           placeholder="https://github.com/..."
00159|           focus={focus === 'urls'}
00160|           backgroundColor={theme.panelBackground}
00161|           onSubmit={() => {
00162|             if (urlDraft.trim()) {
00163|               addUrl(urlDraft)
00164|               setUrlDraft('')
00165|             }
00166|           }}
00167|         />
00168|         <Box flexDirection="column" marginTop={1}>
00169|           {urls.length === 0 ? (
00170|             <Text {...inkColorProps(theme.mutedText)}>No URLs added</Text>
00171|           ) : null}
00172|           {urls.map((value, index) => (
00173|             <ListEntry
00174|               key={`${value}-${index}`}
00175|               label={value}
00176|               highlighted={focus === 'urls' && index === selectedUrl}
00177|               index={index}
00178|             />
00179|           ))}
00180|           {urls.length > 0 ? (
00181|             <Text {...inkColorProps(theme.mutedText)}>Use ↑/↓ to select, Del to remove</Text>
00182|           ) : null}
00183|         </Box>
00184|       </Box>
00185| 
00186|       <Box flexDirection="column" marginTop={1}>
00187|         <SectionHeader label="Smart Context" focused={focus === 'smart'} />
00188|         <Text>Status: {smartContextEnabled ? 'enabled' : 'disabled'} (press "s" to toggle)</Text>
00189|         <Text>Root override (Enter to apply):</Text>
00190|         <SingleLineTextInput
00191|           value={smartRootDraft}
00192|           onChange={setSmartRootDraft}
00193|           focus={focus === 'smart'}
00194|           backgroundColor={theme.panelBackground}
00195|           onSubmit={() => setSmartRoot(smartRootDraft)}
00196|         />
00197|         {smartContextRoot ? (
00198|           <Text {...inkColorProps(theme.mutedText)}>Current root: {smartContextRoot}</Text>
00199|         ) : null}
00200|       </Box>
00201|     </Box>
00202|   )
00203| }
00204| 

(End of file - total 204 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/MediaPanel.tsx"
}
```
**Output:**
```
<file>
00001| import React, { useEffect, useState } from 'react'
00002| import { Box, Text, useInput } from 'ink'
00003| 
00004| import { SingleLineTextInput } from './components/core/SingleLineTextInput'
00005| import { isBackspaceKey } from './components/core/text-input-keys'
00006| import { useTheme } from './theme/theme-provider'
00007| import { inkBackgroundColorProps, inkBorderColorProps, inkColorProps } from './theme/theme-types'
00008| import { useContextDispatch, useContextState } from './context-store'
00009| 
00010| export type MediaPanelFocus = 'images' | 'videos' | 'none'
00011| 
00012| type SectionHeaderProps = {
00013|   label: string
00014|   focused: boolean
00015| }
00016| 
00017| const SectionHeader: React.FC<SectionHeaderProps> = ({ label, focused }) => {
00018|   const { theme } = useTheme()
00019|   return focused ? <Text {...inkColorProps(theme.accent)}>{label}</Text> : <Text>{label}</Text>
00020| }
00021| 
00022| type ListEntryProps = {
00023|   label: string
00024|   highlighted: boolean
00025|   index: number
00026| }
00027| 
00028| const ListEntry: React.FC<ListEntryProps> = ({ label, highlighted, index }) => {
00029|   const { theme } = useTheme()
00030| 
00031|   return highlighted ? (
00032|     <Text {...inkColorProps(theme.warning)}>
00033|       {index + 1}. {label}
00034|     </Text>
00035|   ) : (
00036|     <Text>
00037|       {index + 1}. {label}
00038|     </Text>
00039|   )
00040| }
00041| 
00042| export const MediaPanel: React.FC<{ focus: MediaPanelFocus }> = ({ focus }) => {
00043|   const { theme } = useTheme()
00044|   const { images, videos } = useContextState()
00045|   const { addImage, removeImage, addVideo, removeVideo } = useContextDispatch()
00046| 
00047|   const [imageDraft, setImageDraft] = useState('')
00048|   const [videoDraft, setVideoDraft] = useState('')
00049|   const [selectedImage, setSelectedImage] = useState(0)
00050|   const [selectedVideo, setSelectedVideo] = useState(0)
00051| 
00052|   useEffect(() => {
00053|     setSelectedImage((prev) => Math.min(prev, Math.max(images.length - 1, 0)))
00054|   }, [images.length])
00055| 
00056|   useEffect(() => {
00057|     setSelectedVideo((prev) => Math.min(prev, Math.max(videos.length - 1, 0)))
00058|   }, [videos.length])
00059| 
00060|   useInput((input, key) => {
00061|     const imagesFocused = focus === 'images'
00062|     const videosFocused = focus === 'videos'
00063| 
00064|     if (imagesFocused && images.length > 0) {
00065|       if (key.upArrow) {
00066|         setSelectedImage((prev) => Math.max(prev - 1, 0))
00067|         return
00068|       }
00069|       if (key.downArrow) {
00070|         setSelectedImage((prev) => Math.min(prev + 1, images.length - 1))
00071|         return
00072|       }
00073|       if (key.delete || isBackspaceKey(input, key)) {
00074|         removeImage(selectedImage)
00075|         return
00076|       }
00077|     }
00078| 
00079|     if (videosFocused && videos.length > 0) {
00080|       if (key.upArrow) {
00081|         setSelectedVideo((prev) => Math.max(prev - 1, 0))
00082|         return
00083|       }
00084|       if (key.downArrow) {
00085|         setSelectedVideo((prev) => Math.min(prev + 1, videos.length - 1))
00086|         return
00087|       }
00088|       if (key.delete || isBackspaceKey(input, key)) {
00089|         removeVideo(selectedVideo)
00090|         return
00091|       }
00092|     }
00093|   })
00094| 
00095|   return (
00096|     <Box
00097|       flexDirection="column"
00098|       borderStyle="round"
00099|       paddingX={1}
00100|       paddingY={0}
00101|       {...inkBorderColorProps(theme.border)}
00102|       {...inkBackgroundColorProps(theme.panelBackground)}
00103|     >
00104|       <SectionHeader label="Images" focused={focus === 'images'} />
00105|       <SingleLineTextInput
00106|         value={imageDraft}
00107|         onChange={setImageDraft}
00108|         placeholder="assets/example.png"
00109|         focus={focus === 'images'}
00110|         backgroundColor={theme.panelBackground}
00111|         onSubmit={() => {
00112|           if (imageDraft.trim()) {
00113|             addImage(imageDraft)
00114|             setImageDraft('')
00115|           }
00116|         }}
00117|       />
00118|       <Box flexDirection="column" marginTop={1}>
00119|         {images.length === 0 ? (
00120|           <Text {...inkColorProps(theme.mutedText)}>No images attached</Text>
00121|         ) : null}
00122|         {images.map((value, index) => (
00123|           <ListEntry
00124|             key={`${value}-${index}`}
00125|             label={value}
00126|             highlighted={focus === 'images' && index === selectedImage}
00127|             index={index}
00128|           />
00129|         ))}
00130|         {images.length > 0 ? (
00131|           <Text {...inkColorProps(theme.mutedText)}>Use ↑/↓ to select, Del to remove</Text>
00132|         ) : null}
00133|       </Box>
00134| 
00135|       <Box flexDirection="column" marginTop={1}>
00136|         <SectionHeader label="Videos" focused={focus === 'videos'} />
00137|         <SingleLineTextInput
00138|           value={videoDraft}
00139|           onChange={setVideoDraft}
00140|           placeholder="assets/demo.mp4"
00141|           focus={focus === 'videos'}
00142|           backgroundColor={theme.panelBackground}
00143|           onSubmit={() => {
00144|             if (videoDraft.trim()) {
00145|               addVideo(videoDraft)
00146|               setVideoDraft('')
00147|             }
00148|           }}
00149|         />
00150|         <Box flexDirection="column" marginTop={1}>
00151|           {videos.length === 0 ? (
00152|             <Text {...inkColorProps(theme.mutedText)}>No videos attached</Text>
00153|           ) : null}
00154|           {videos.map((value, index) => (
00155|             <ListEntry
00156|               key={`${value}-${index}`}
00157|               label={value}
00158|               highlighted={focus === 'videos' && index === selectedVideo}
00159|               index={index}
00160|             />
00161|           ))}
00162|           {videos.length > 0 ? (
00163|             <Text {...inkColorProps(theme.mutedText)}>Use ↑/↓ to select, Del to remove</Text>
00164|           ) : null}
00165|           {videos.length > 0 ? (
00166|             <Text {...inkColorProps(theme.mutedText)}>
00167|               Videos require Gemini models; switching happens automatically.
00168|             </Text>
00169|           ) : null}
00170|         </Box>
00171|       </Box>
00172|     </Box>
00173|   )
00174| }
00175| 

(End of file - total 175 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-registry.ts"
}
```
**Output:**
```
<file>
00001| import type { ThemeJson } from './theme-types'
00002| 
00003| import { PM_DARK_THEME } from './builtins/pm-dark'
00004| import { PM_LIGHT_THEME } from './builtins/pm-light'
00005| 
00006| export type ThemeRegistryEntry = {
00007|   name: string
00008|   label: string
00009|   theme: ThemeJson
00010| }
00011| 
00012| export const DEFAULT_THEME_NAME = 'pm-dark'
00013| 
00014| const BUILTIN_THEMES: readonly ThemeRegistryEntry[] = [
00015|   {
00016|     name: 'pm-dark',
00017|     label: 'Prompt Maker Dark',
00018|     theme: PM_DARK_THEME,
00019|   },
00020|   {
00021|     name: 'pm-light',
00022|     label: 'Prompt Maker Light',
00023|     theme: PM_LIGHT_THEME,
00024|   },
00025| ]
00026| 
00027| export const listThemes = (): readonly ThemeRegistryEntry[] => BUILTIN_THEMES
00028| 
00029| export const getTheme = (name: string): ThemeRegistryEntry | undefined =>
00030|   BUILTIN_THEMES.find((theme) => theme.name === name)
00031| 
00032| export const getThemeJson = (name: string): ThemeJson | undefined => getTheme(name)?.theme
00033| 

(End of file - total 33 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/theme/theme-resolver.ts"
}
```
**Output:**
```
<file>
00001| import {
00002|   REQUIRED_THEME_SLOTS,
00003|   type InkColorValue,
00004|   type ResolvedTheme,
00005|   type ThemeAppearanceMode,
00006|   type ThemeColorValue,
00007|   type ThemeJson,
00008|   type ThemeSlot,
00009| } from './theme-types'
00010| 
00011| export type ResolveColorContext = {
00012|   mode: ThemeAppearanceMode
00013|   defs: Record<string, ThemeColorValue>
00014|   theme: Record<string, ThemeColorValue>
00015| }
00016| 
00017| type ResolutionState = {
00018|   stack: string[]
00019|   cache: Map<string, InkColorValue>
00020| }
00021| 
00022| const HEX_6_RE = /^#[0-9a-fA-F]{6}$/
00023| const HEX_8_RE = /^#[0-9a-fA-F]{8}$/
00024| 
00025| const ANSI_16_HEX: readonly string[] = [
00026|   '#000000',
00027|   '#800000',
00028|   '#008000',
00029|   '#808000',
00030|   '#000080',
00031|   '#800080',
00032|   '#008080',
00033|   '#c0c0c0',
00034|   '#808080',
00035|   '#ff0000',
00036|   '#00ff00',
00037|   '#ffff00',
00038|   '#0000ff',
00039|   '#ff00ff',
00040|   '#00ffff',
00041|   '#ffffff',
00042| ]
00043| 
00044| const ANSI_CUBE_LEVELS: readonly number[] = [0, 95, 135, 175, 215, 255]
00045| 
00046| const toHexByte = (value: number): string => value.toString(16).padStart(2, '0')
00047| 
00048| const rgbToHex = (r: number, g: number, b: number): string =>
00049|   `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`
00050| 
00051| export const ansiToHex = (code: number): string => {
00052|   if (!Number.isInteger(code) || code < 0 || code > 255) {
00053|     throw new Error(`ANSI color must be an integer 0..255 (received: ${String(code)})`)
00054|   }
00055| 
00056|   if (code < 16) {
00057|     const value = ANSI_16_HEX[code]
00058|     if (!value) {
00059|       throw new Error(`Internal ANSI mapping missing for code ${code}`)
00060|     }
00061|     return value
00062|   }
00063| 
00064|   if (code < 232) {
00065|     const index = code - 16
00066|     const rIndex = Math.floor(index / 36)
00067|     const gIndex = Math.floor((index % 36) / 6)
00068|     const bIndex = index % 6
00069| 
00070|     const r = ANSI_CUBE_LEVELS[rIndex]
00071|     const g = ANSI_CUBE_LEVELS[gIndex]
00072|     const b = ANSI_CUBE_LEVELS[bIndex]
00073| 
00074|     if (r === undefined || g === undefined || b === undefined) {
00075|       throw new Error(`Internal ANSI color cube mapping failed for code ${code}`)
00076|     }
00077| 
00078|     return rgbToHex(r, g, b)
00079|   }
00080| 
00081|   const gray = 8 + 10 * (code - 232)
00082|   return rgbToHex(gray, gray, gray)
00083| }
00084| 
00085| const normalizeSpecial = (value: string): InkColorValue | null => {
00086|   const lowered = value.toLowerCase()
00087|   if (lowered === 'none' || lowered === 'transparent') {
00088|     return undefined
00089|   }
00090|   return null
00091| }
00092| 
00093| const normalizeHex = (value: string): InkColorValue | null => {
00094|   if (HEX_6_RE.test(value)) {
00095|     return value.toLowerCase()
00096|   }
00097| 
00098|   if (HEX_8_RE.test(value)) {
00099|     const rgb = value.slice(0, 7).toLowerCase()
00100|     const alpha = value.slice(7, 9).toLowerCase()
00101|     return alpha === '00' ? undefined : rgb
00102|   }
00103| 
00104|   return null
00105| }
00106| 
00107| const isVariant = (
00108|   value: ThemeColorValue,
00109| ): value is { dark: ThemeColorValue; light: ThemeColorValue } =>
00110|   typeof value === 'object' && value !== null && 'dark' in value && 'light' in value
00111| 
00112| const resolveNamed = (
00113|   key: string,
00114|   raw: ThemeColorValue,
00115|   ctx: ResolveColorContext,
00116|   state: ResolutionState,
00117| ) => {
00118|   const cached = state.cache.get(key)
00119|   if (cached !== undefined || state.cache.has(key)) {
00120|     return cached
00121|   }
00122| 
00123|   const cycleStart = state.stack.indexOf(key)
00124|   if (cycleStart >= 0) {
00125|     const cyclePath = [...state.stack.slice(cycleStart), key].join(' -> ')
00126|     throw new Error(`Theme reference cycle detected: ${cyclePath}`)
00127|   }
00128| 
00129|   state.stack.push(key)
00130|   const resolved = resolveColorInternal(raw, ctx, state)
00131|   state.stack.pop()
00132|   state.cache.set(key, resolved)
00133|   return resolved
00134| }
00135| 
00136| const resolveReference = (
00137|   name: string,
00138|   ctx: ResolveColorContext,
00139|   state: ResolutionState,
00140| ): InkColorValue => {
00141|   const def = ctx.defs[name]
00142|   if (def !== undefined) {
00143|     return resolveNamed(`defs.${name}`, def, ctx, state)
00144|   }
00145| 
00146|   const themeValue = ctx.theme[name]
00147|   if (themeValue !== undefined) {
00148|     return resolveNamed(`theme.${name}`, themeValue, ctx, state)
00149|   }
00150| 
00151|   throw new Error(`Unknown theme color reference: ${name}`)
00152| }
00153| 
00154| const resolveColorInternal = (
00155|   value: ThemeColorValue,
00156|   ctx: ResolveColorContext,
00157|   state: ResolutionState,
00158| ): InkColorValue => {
00159|   if (typeof value === 'number') {
00160|     return ansiToHex(value)
00161|   }
00162| 
00163|   if (typeof value === 'string') {
00164|     const special = normalizeSpecial(value)
00165|     if (special !== null) {
00166|       return special
00167|     }
00168| 
00169|     const hex = normalizeHex(value)
00170|     if (hex !== null) {
00171|       return hex
00172|     }
00173| 
00174|     return resolveReference(value, ctx, state)
00175|   }
00176| 
00177|   if (isVariant(value)) {
00178|     const selected = value[ctx.mode]
00179|     return resolveColorInternal(selected, ctx, state)
00180|   }
00181| 
00182|   const exhaustive: never = value
00183|   return exhaustive
00184| }
00185| 
00186| export const resolveColor = (value: ThemeColorValue, ctx: ResolveColorContext): InkColorValue => {
00187|   return resolveColorInternal(value, ctx, { stack: [], cache: new Map() })
00188| }
00189| 
00190| const resolveRequiredSlot = (
00191|   slot: ThemeSlot,
00192|   ctx: ResolveColorContext,
00193|   state: ResolutionState,
00194| ): InkColorValue => {
00195|   const raw = ctx.theme[slot]
00196|   if (raw === undefined) {
00197|     throw new Error(`Theme is missing required slot: ${slot}`)
00198|   }
00199| 
00200|   return resolveNamed(`theme.${slot}`, raw, ctx, state)
00201| }
00202| 
00203| export const resolveTheme = (themeJson: ThemeJson, mode: ThemeAppearanceMode): ResolvedTheme => {
00204|   const missing = REQUIRED_THEME_SLOTS.filter((slot) => themeJson.theme[slot] === undefined)
00205|   if (missing.length > 0) {
00206|     throw new Error(`Theme is missing required slots: ${missing.join(', ')}`)
00207|   }
00208| 
00209|   const ctx: ResolveColorContext = {
00210|     mode,
00211|     defs: themeJson.defs ?? {},
00212|     theme: themeJson.theme,
00213|   }
00214| 
00215|   const state: ResolutionState = { stack: [], cache: new Map() }
00216| 
00217|   const resolved: Partial<ResolvedTheme> = {}
00218|   for (const slot of REQUIRED_THEME_SLOTS) {
00219|     resolved[slot] = resolveRequiredSlot(slot, ctx, state)
00220|   }
00221| 
00222|   return resolved as ResolvedTheme
00223| }
00224| 

(End of file - total 224 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/theme/builtins/pm-dark.ts"
}
```
**Output:**
```
<file>
00001| import type { ThemeJson } from '../theme-types'
00002| 
00003| export const PM_DARK_THEME = {
00004|   defs: {
00005|     bg: '#0b0f14',
00006|     panelBg: '#111820',
00007|     text: '#e6edf3',
00008|     muted: '#8b949e',
00009|     border: '#30363d',
00010|     accent: '#58a6ff',
00011|     warning: '#d29922',
00012|     error: '#f85149',
00013|     success: '#3fb950',
00014|     selectionBg: '#1f6feb',
00015|   },
00016|   theme: {
00017|     background: 'bg',
00018|     text: 'text',
00019|     mutedText: 'muted',
00020|     border: 'border',
00021| 
00022|     accent: 'accent',
00023|     accentText: 'bg',
00024| 
00025|     warning: 'warning',
00026|     error: 'error',
00027|     success: 'success',
00028| 
00029|     panelBackground: 'panelBg',
00030|     popupBackground: 'panelBackground',
00031| 
00032|     selectionBackground: 'selectionBg',
00033|     selectionText: 'bg',
00034| 
00035|     chipBackground: 'panelBackground',
00036|     chipText: 'text',
00037|     chipMutedText: 'mutedText',
00038|   },
00039| } as const satisfies ThemeJson
00040| 

(End of file - total 40 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/theme/builtins/pm-light.ts"
}
```
**Output:**
```
<file>
00001| import type { ThemeJson } from '../theme-types'
00002| 
00003| export const PM_LIGHT_THEME = {
00004|   defs: {
00005|     bg: '#ffffff',
00006|     panelBg: '#f6f8fa',
00007|     text: '#24292f',
00008|     muted: '#57606a',
00009|     border: '#d0d7de',
00010|     accent: '#0969da',
00011|     warning: '#9a6700',
00012|     error: '#cf222e',
00013|     success: '#1a7f37',
00014|     selectionBg: '#ddf4ff',
00015|   },
00016|   theme: {
00017|     background: 'bg',
00018|     text: 'text',
00019|     mutedText: 'muted',
00020|     border: 'border',
00021| 
00022|     accent: 'accent',
00023|     accentText: 'bg',
00024| 
00025|     warning: 'warning',
00026|     error: 'error',
00027|     success: 'success',
00028| 
00029|     panelBackground: 'panelBg',
00030|     popupBackground: 'panelBackground',
00031| 
00032|     selectionBackground: 'selectionBg',
00033|     selectionText: 'text',
00034| 
00035|     chipBackground: 'panelBackground',
00036|     chipText: 'text',
00037|     chipMutedText: 'mutedText',
00038|   },
00039| } as const satisfies ThemeJson
00040| 

(End of file - total 40 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/theme/examples/ocean-example.json"
}
```
**Output:**
```
<file>
00001| {
00002|   "defs": {
00003|     "bg": { "dark": "#10141a", "light": "#fafcff" },
00004|     "panel": { "dark": "#1a2029", "light": "#eef3f8" },
00005|     "text": { "dark": "#e6edf3", "light": "#1f2328" },
00006|     "muted": { "dark": "#9aa4b2", "light": "#66707f" },
00007|     "border": { "dark": "#30363d", "light": "#d0d7de" },
00008|     "accent": { "dark": "#6cb6ff", "light": "#0969da" },
00009|     "warning": "#f2cc60",
00010|     "error": "#ff6b6b",
00011|     "success": "#3fb950"
00012|   },
00013|   "theme": {
00014|     "background": "bg",
00015|     "text": "text",
00016|     "mutedText": "muted",
00017|     "border": "border",
00018| 
00019|     "accent": "accent",
00020|     "accentText": "background",
00021| 
00022|     "warning": "warning",
00023|     "error": "error",
00024|     "success": "success",
00025| 
00026|     "panelBackground": "panel",
00027|     "popupBackground": "panelBackground",
00028| 
00029|     "selectionBackground": { "dark": 60, "light": 153 },
00030|     "selectionText": "text",
00031| 
00032|     "chipBackground": "panelBackground",
00033|     "chipText": "text",
00034|     "chipMutedText": "muted"
00035|   }
00036| }
00037| 

(End of file - total 37 lines)
</file>
```
```

---

## Assistant

_Thinking:_



Now I’ll skim the core/popup components to capture exactly which theme tokens and Ink props each uses, so the guide can include a reliable “where to change what” map.

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/core/BackgroundFill.tsx"
}
```
**Output:**
```
<file>
00001| import React, { useMemo } from 'react'
00002| import { Box, Text } from 'ink'
00003| 
00004| const NBSP = '\u00A0'
00005| 
00006| import type { InkColorValue } from '../../theme/theme-types'
00007| import { inkBackgroundColorProps } from '../../theme/theme-types'
00008| 
00009| export type BackgroundFillProps = {
00010|   rows: number
00011|   columns: number
00012|   background: InkColorValue
00013| }
00014| 
00015| export const BackgroundFill: React.FC<BackgroundFillProps> = ({ rows, columns, background }) => {
00016|   const safeRows = Math.max(0, Math.floor(rows))
00017|   const safeColumns = Math.max(0, Math.floor(columns))
00018| 
00019|   const line = useMemo(() => {
00020|     if (safeColumns === 0) {
00021|       return ''
00022|     }
00023|     return NBSP.repeat(safeColumns)
00024|   }, [safeColumns])
00025| 
00026|   if (safeRows === 0 || safeColumns === 0) {
00027|     return null
00028|   }
00029| 
00030|   return (
00031|     <Box flexDirection="column" width={safeColumns} height={safeRows} overflow="hidden">
00032|       {Array.from({ length: safeRows }).map((_, index) => (
00033|         <Text key={`bg-${index}`} {...inkBackgroundColorProps(background)} wrap="truncate">
00034|           {line}
00035|         </Text>
00036|       ))}
00037|     </Box>
00038|   )
00039| }
00040| 

(End of file - total 40 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/core/InputBar.tsx"
}
```
**Output:**
```
<file>
00001| import React from 'react'
00002| import { Box, Text } from 'ink'
00003| 
00004| import { MultilineTextInput, type DebugKeyEvent } from './MultilineTextInput'
00005| import { resolveIndicatorSegments } from './status-indicators-layout'
00006| import { resolveInputBarPresentation, type InputBarMode } from './input-bar-presentation'
00007| import type { TokenLabelLookup } from './tokenized-text'
00008| import { getLineCount } from './multiline-text-buffer'
00009| 
00010| import { OpencodeSpinner } from '../OpencodeSpinner'
00011| 
00012| import { useTheme } from '../../theme/theme-provider'
00013| import {
00014|   inkBackgroundColorProps,
00015|   inkBorderColorProps,
00016|   inkColorProps,
00017| } from '../../theme/theme-types'
00018| 
00019| export type InputBarProps = {
00020|   value: string
00021|   onChange: (next: string) => void
00022|   onSubmit: (value: string) => void
00023|   mode?: InputBarMode
00024|   isDisabled?: boolean
00025|   isPasteActive?: boolean
00026|   isBusy?: boolean
00027|   statusChips: readonly string[]
00028|   placeholder?: string
00029|   hint?: string | undefined
00030|   debugLine?: string | undefined
00031|   tokenLabel?: TokenLabelLookup | undefined
00032|   onDebugKeyEvent?: ((event: DebugKeyEvent) => void) | undefined
00033| }
00034| 
00035| export type InputBarRowEstimateOptions = {
00036|   value: string
00037|   hint?: string | undefined
00038|   debugLine?: string | undefined
00039| }
00040| 
00041| export const estimateInputBarRows = ({
00042|   value,
00043|   hint,
00044|   debugLine,
00045| }: InputBarRowEstimateOptions): number => {
00046|   const lineCount = getLineCount(value)
00047|   const contentRows = 2 + (hint ? 1 : 0) + (debugLine ? 1 : 0) + lineCount
00048|   const borderRows = 2
00049|   return Math.max(6, borderRows + contentRows)
00050| }
00051| 
00052| export const InputBar: React.FC<InputBarProps> = ({
00053|   value,
00054|   onChange,
00055|   onSubmit,
00056|   mode = 'intent',
00057|   isDisabled = false,
00058|   isPasteActive = false,
00059|   isBusy = false,
00060|   statusChips,
00061|   placeholder,
00062|   hint,
00063|   debugLine,
00064|   tokenLabel,
00065|   onDebugKeyEvent,
00066| }) => {
00067|   const { theme } = useTheme()
00068| 
00069|   // `resolveInputBarPresentation` is pure but involves string/config mapping.
00070|   // Memoizing it keeps the render path a bit more predictable.
00071|   const presentation = React.useMemo(() => resolveInputBarPresentation(mode), [mode])
00072| 
00073|   const summary = React.useMemo(() => {
00074|     const segments = resolveIndicatorSegments(statusChips)
00075|     const status = segments.find((segment) => segment.label === 'Status')
00076|     const model = segments.find((segment) => segment.label === 'Model')
00077|     const target = segments.find((segment) => segment.label === 'Target')
00078|     return { status, model, target }
00079|   }, [statusChips])
00080| 
00081|   const borderColor = presentation.borderTone === 'warning' ? theme.warning : theme.border
00082|   const labelColor = presentation.labelTone === 'warning' ? theme.warning : theme.mutedText
00083| 
00084|   return (
00085|     <Box
00086|       flexDirection="column"
00087|       borderStyle="round"
00088|       paddingX={1}
00089|       paddingY={0}
00090|       width="100%"
00091|       {...inkBorderColorProps(borderColor)}
00092|       {...inkBackgroundColorProps(theme.panelBackground)}
00093|     >
00094|       <Text {...inkColorProps(labelColor)} bold={presentation.labelBold}>
00095|         {presentation.label}
00096|       </Text>
00097|       {hint ? <Text {...inkColorProps(theme.mutedText)}>{hint}</Text> : null}
00098|       {debugLine ? <Text {...inkColorProps(theme.mutedText)}>{debugLine}</Text> : null}
00099|       <MultilineTextInput
00100|         value={value}
00101|         onChange={onChange}
00102|         onSubmit={onSubmit}
00103|         placeholder={placeholder ?? 'Describe your goal or type /command'}
00104|         focus={!isDisabled}
00105|         isDisabled={isDisabled}
00106|         isPasteActive={isPasteActive}
00107|         tokenLabel={tokenLabel}
00108|         onDebugKeyEvent={onDebugKeyEvent}
00109|       />
00110| 
00111|       {summary.status || summary.model || summary.target ? (
00112|         <Box flexDirection="row" flexWrap="wrap">
00113|           {summary.status ? (
00114|             <Box flexDirection="row" flexShrink={0}>
00115|               <Text {...inkColorProps(theme.mutedText)}>Status: </Text>
00116|               {isBusy ? (
00117|                 <Box flexDirection="row" flexShrink={0}>
00118|                   <OpencodeSpinner />
00119|                   <Text {...inkColorProps(theme.mutedText)}> </Text>
00120|                   <Text {...inkColorProps(theme.accent)}>{summary.status.value}</Text>
00121|                 </Box>
00122|               ) : (
00123|                 <Text {...inkColorProps(theme.accent)}>{summary.status.value}</Text>
00124|               )}
00125|             </Box>
00126|           ) : null}
00127|           {summary.status && (summary.model || summary.target) ? (
00128|             <Text {...inkColorProps(theme.mutedText)}> · </Text>
00129|           ) : null}
00130|           {summary.model ? (
00131|             <Box flexDirection="row" flexShrink={0}>
00132|               <Text {...inkColorProps(theme.mutedText)}>Model: </Text>
00133|               <Text {...inkColorProps(theme.text)}>{summary.model.value}</Text>
00134|             </Box>
00135|           ) : null}
00136|           {summary.model && summary.target ? (
00137|             <Text {...inkColorProps(theme.mutedText)}> · </Text>
00138|           ) : null}
00139|           {summary.target ? (
00140|             <Box flexDirection="row" flexShrink={0}>
00141|               <Text {...inkColorProps(theme.mutedText)}>Target: </Text>
00142|               <Text {...inkColorProps(theme.text)}>{summary.target.value}</Text>
00143|             </Box>
00144|           ) : null}
00145|         </Box>
00146|       ) : null}
00147|     </Box>
00148|   )
00149| }
00150| 

(End of file - total 150 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/core/StatusIndicators.tsx"
}
```
**Output:**
```
<file>
00001| import React, { useMemo } from 'react'
00002| import { Box, Text, useStdout } from 'ink'
00003| 
00004| import {
00005|   formatIndicatorLines,
00006|   type IndicatorSegment,
00007|   type IndicatorStyle,
00008| } from './status-indicators-layout'
00009| 
00010| import { useTheme } from '../../theme/theme-provider'
00011| import { inkColorProps } from '../../theme/theme-types'
00012| import type { InkColorValue } from '../../theme/theme-types'
00013| 
00014| export type StatusIndicatorsProps = {
00015|   chips: readonly string[]
00016| }
00017| 
00018| export const StatusIndicators: React.FC<StatusIndicatorsProps> = ({ chips }) => {
00019|   const { theme } = useTheme()
00020|   const { stdout } = useStdout()
00021| 
00022|   const resolveSegmentColor = (style: IndicatorStyle): InkColorValue => {
00023|     switch (style) {
00024|       case 'success':
00025|         return theme.success
00026|       case 'warning':
00027|         return theme.warning
00028|       case 'danger':
00029|         return theme.error
00030|       case 'primary':
00031|         return theme.accent
00032|       case 'muted':
00033|       default:
00034|         return theme.mutedText
00035|     }
00036|   }
00037| 
00038|   const renderSegment = (segment: IndicatorSegment): React.ReactNode => (
00039|     <>
00040|       <Text {...inkColorProps(theme.mutedText)}>{segment.label}: </Text>
00041|       <Text {...inkColorProps(resolveSegmentColor(segment.style))}>{segment.value}</Text>
00042|     </>
00043|   )
00044| 
00045|   const maxWidth = useMemo(() => {
00046|     const columns = stdout?.columns ?? 80
00047|     return Math.max(24, columns - 6)
00048|   }, [stdout])
00049| 
00050|   const lines = useMemo(
00051|     () =>
00052|       formatIndicatorLines({
00053|         chips,
00054|         maxWidth,
00055|       }),
00056|     [chips, maxWidth],
00057|   )
00058| 
00059|   return (
00060|     <Box flexDirection="column">
00061|       {lines.map((line, lineIndex) => (
00062|         <Text key={`status-line-${lineIndex}`} wrap="wrap">
00063|           {line.segments.map((segment, segmentIndex) => (
00064|             <React.Fragment key={segment.id}>
00065|               {segmentIndex > 0 ? <Text {...inkColorProps(theme.mutedText)}> · </Text> : null}
00066|               {renderSegment(segment)}
00067|             </React.Fragment>
00068|           ))}
00069|         </Text>
00070|       ))}
00071|     </Box>
00072|   )
00073| }
00074| 

(End of file - total 74 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/core/CommandMenu.tsx"
}
```
**Output:**
```
<file>
00001| import { memo, useMemo } from 'react'
00002| import { Box, Text, useStdout } from 'ink'
00003| 
00004| import type { CommandDescriptor } from '../../types'
00005| import { useTheme } from '../../theme/theme-provider'
00006| import {
00007|   inkBackgroundColorProps,
00008|   inkBorderColorProps,
00009|   inkColorProps,
00010| } from '../../theme/theme-types'
00011| 
00012| const APP_CONTAINER_PADDING_X = 2
00013| const COMMAND_SCREEN_PADDING_X = 1
00014| 
00015| const padRight = (value: string, width: number): string => {
00016|   if (width <= 0) {
00017|     return ''
00018|   }
00019| 
00020|   const trimmed = value.length > width ? value.slice(0, width) : value
00021|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00022| }
00023| 
00024| export type CommandMenuProps = {
00025|   commands: readonly CommandDescriptor[]
00026|   selectedIndex: number
00027| }
00028| 
00029| export const CommandMenu = memo(({ commands, selectedIndex }: CommandMenuProps) => {
00030|   const { theme } = useTheme()
00031|   const { stdout } = useStdout()
00032| 
00033|   const terminalColumns = stdout?.columns ?? 80
00034|   const borderColumns = 2
00035|   const paddingColumns = 2
00036|   const boxWidth = Math.max(
00037|     0,
00038|     terminalColumns - 2 * (APP_CONTAINER_PADDING_X + COMMAND_SCREEN_PADDING_X),
00039|   )
00040|   const contentWidth = Math.max(0, boxWidth - borderColumns - paddingColumns)
00041| 
00042|   const backgroundProps = inkBackgroundColorProps(theme.panelBackground)
00043| 
00044|   const commandLines = useMemo(
00045|     () =>
00046|       commands.map((command) => {
00047|         const shortcut = `/${command.id}`.padEnd(10)
00048|         return padRight(`${shortcut} ${command.description}`, contentWidth)
00049|       }),
00050|     [commands, contentWidth],
00051|   )
00052| 
00053|   return (
00054|     <Box
00055|       flexDirection="column"
00056|       borderStyle="round"
00057|       paddingX={1}
00058|       paddingY={0}
00059|       width="100%"
00060|       {...inkBorderColorProps(theme.border)}
00061|       {...backgroundProps}
00062|     >
00063|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00064|         {padRight('Commands', contentWidth)}
00065|       </Text>
00066|       {commandLines.length === 0 ? (
00067|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00068|           {padRight('No commands match.', contentWidth)}
00069|         </Text>
00070|       ) : (
00071|         commandLines.map((line, index) => {
00072|           const isSelected = index === selectedIndex
00073| 
00074|           const textProps = isSelected
00075|             ? {
00076|                 ...inkColorProps(theme.selectionText),
00077|                 ...inkBackgroundColorProps(theme.selectionBackground),
00078|               }
00079|             : { ...backgroundProps, ...inkColorProps(theme.text) }
00080| 
00081|           return (
00082|             <Text key={commands[index]?.id ?? String(index)} {...textProps}>
00083|               {line}
00084|             </Text>
00085|           )
00086|         })
00087|       )}
00088|     </Box>
00089|   )
00090| })
00091| 
00092| CommandMenu.displayName = 'CommandMenu'
00093| 

(End of file - total 93 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/core/ScrollableOutput.tsx"
}
```
**Output:**
```
<file>
00001| import { memo, useMemo } from 'react'
00002| import { Box, Text } from 'ink'
00003| 
00004| import type { HistoryEntry } from '../../types'
00005| import { useTheme } from '../../theme/theme-provider'
00006| import { inkBackgroundColorProps, inkColorProps, type InkColorValue } from '../../theme/theme-types'
00007| 
00008| const padRight = (value: string, width: number | undefined): string => {
00009|   if (typeof width !== 'number' || width <= 0) {
00010|     return value
00011|   }
00012| 
00013|   const trimmed = value.length > width ? value.slice(0, width) : value
00014|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00015| }
00016| 
00017| export type ScrollableOutputProps = {
00018|   lines: readonly HistoryEntry[]
00019|   visibleRows: number
00020|   scrollOffset: number
00021| 
00022|   contentWidth?: number | undefined
00023|   backgroundColor?: InkColorValue
00024| }
00025| 
00026| export const ScrollableOutput = memo(
00027|   ({ lines, visibleRows, scrollOffset, contentWidth, backgroundColor }: ScrollableOutputProps) => {
00028|     const { theme } = useTheme()
00029| 
00030|     const startIndex = Math.max(0, Math.min(scrollOffset, Math.max(0, lines.length - visibleRows)))
00031|     const endIndex = Math.min(lines.length, startIndex + visibleRows)
00032|     const visibleLines = useMemo(
00033|       () => lines.slice(startIndex, endIndex),
00034|       [lines, startIndex, endIndex],
00035|     )
00036| 
00037|     const backgroundProps = inkBackgroundColorProps(backgroundColor)
00038| 
00039|     const padded = useMemo(() => {
00040|       const next: Array<HistoryEntry | null> = [...visibleLines]
00041|       while (next.length < visibleRows) {
00042|         next.push(null)
00043|       }
00044|       return next
00045|     }, [visibleLines, visibleRows])
00046| 
00047|     return (
00048|       <Box flexDirection="column" height={visibleRows} overflow="hidden">
00049|         {padded.map((entry, index) => {
00050|           if (!entry) {
00051|             return (
00052|               <Text key={`blank-${startIndex + index}`} {...backgroundProps}>
00053|                 {padRight('', contentWidth)}
00054|               </Text>
00055|             )
00056|           }
00057| 
00058|           const key = `${entry.id}-${startIndex + index}`
00059| 
00060|           const color =
00061|             entry.kind === 'user'
00062|               ? theme.accent
00063|               : entry.kind === 'progress'
00064|                 ? theme.warning
00065|                 : theme.text
00066| 
00067|           return (
00068|             <Text key={key} {...backgroundProps} {...inkColorProps(color)}>
00069|               {padRight(entry.content, contentWidth)}
00070|             </Text>
00071|           )
00072|         })}
00073|       </Box>
00074|     )
00075|   },
00076| )
00077| 
00078| ScrollableOutput.displayName = 'ScrollableOutput'
00079| 

(End of file - total 79 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/core/HelpOverlay.tsx"
}
```
**Output:**
```
<file>
00001| import React, { useEffect, useMemo, useState } from 'react'
00002| import { Box, Text, useInput, useStdout } from 'ink'
00003| 
00004| import { COMMAND_DESCRIPTORS } from '../../config'
00005| import { createHelpSections, estimateHelpOverlayHeight } from '../../help-config'
00006| import {
00007|   clampHelpOverlayScrollOffset,
00008|   getHelpOverlayContentRows,
00009|   getHelpOverlayMaxScroll,
00010|   scrollHelpOverlayBy,
00011| } from './help-overlay-scroll'
00012| 
00013| import { useTheme } from '../../theme/theme-provider'
00014| import {
00015|   inkBackgroundColorProps,
00016|   inkBorderColorProps,
00017|   inkColorProps,
00018| } from '../../theme/theme-types'
00019| 
00020| const APP_CONTAINER_PADDING_X = 2
00021| 
00022| const padRight = (value: string, width: number): string => {
00023|   if (width <= 0) {
00024|     return ''
00025|   }
00026| 
00027|   const trimmed = value.length > width ? value.slice(0, width) : value
00028|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00029| }
00030| 
00031| const padLeft = (value: string, width: number): string => {
00032|   if (width <= 0) {
00033|     return ''
00034|   }
00035| 
00036|   const trimmed = value.length > width ? value.slice(0, width) : value
00037|   return trimmed.length === width ? trimmed : trimmed.padStart(width, ' ')
00038| }
00039| 
00040| export type HelpOverlayProps = {
00041|   activeView: 'generate' | 'tests'
00042|   maxHeight?: number
00043| }
00044| 
00045| export const HelpOverlay: React.FC<HelpOverlayProps> = ({ activeView: _activeView, maxHeight }) => {
00046|   const { theme } = useTheme()
00047|   const { stdout } = useStdout()
00048| 
00049|   const terminalColumns = stdout?.columns ?? 80
00050|   const overlayWidth = Math.max(40, terminalColumns - 2 * APP_CONTAINER_PADDING_X)
00051| 
00052|   const borderColumns = 2
00053|   const paddingColumns = 2
00054|   const contentWidth = Math.max(0, overlayWidth - borderColumns - paddingColumns)
00055| 
00056|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00057| 
00058|   const sections = useMemo(
00059|     () => createHelpSections({ commandDescriptors: COMMAND_DESCRIPTORS }),
00060|     [],
00061|   )
00062| 
00063|   const idealHeight = estimateHelpOverlayHeight(sections)
00064|   const clampedHeight = maxHeight ? Math.min(idealHeight, maxHeight) : idealHeight
00065|   const height = Math.max(10, clampedHeight)
00066| 
00067|   const contentLines = useMemo(() => {
00068|     const lines: string[] = []
00069|     for (const section of sections) {
00070|       lines.push(section.title)
00071|       lines.push(...section.lines)
00072|       lines.push('')
00073|     }
00074|     while (lines.length > 0 && lines[lines.length - 1] === '') {
00075|       lines.pop()
00076|     }
00077|     return lines
00078|   }, [sections])
00079| 
00080|   const contentRows = getHelpOverlayContentRows(height)
00081|   const maxScroll = getHelpOverlayMaxScroll(contentLines.length, contentRows)
00082|   const [scrollOffset, setScrollOffset] = useState(0)
00083| 
00084|   useEffect(() => {
00085|     setScrollOffset((prev) => clampHelpOverlayScrollOffset(prev, contentLines.length, contentRows))
00086|   }, [contentLines.length, contentRows])
00087| 
00088|   useInput((_, key) => {
00089|     if (key.upArrow) {
00090|       setScrollOffset((prev) => scrollHelpOverlayBy(prev, -1, contentLines.length, contentRows))
00091|       return
00092|     }
00093|     if (key.downArrow) {
00094|       setScrollOffset((prev) => scrollHelpOverlayBy(prev, 1, contentLines.length, contentRows))
00095|       return
00096|     }
00097|     if (key.pageUp) {
00098|       setScrollOffset((prev) =>
00099|         scrollHelpOverlayBy(prev, -contentRows, contentLines.length, contentRows),
00100|       )
00101|       return
00102|     }
00103|     if (key.pageDown) {
00104|       setScrollOffset((prev) =>
00105|         scrollHelpOverlayBy(prev, contentRows, contentLines.length, contentRows),
00106|       )
00107|     }
00108|   })
00109| 
00110|   const sectionTitles = useMemo(() => new Set(sections.map((section) => section.title)), [sections])
00111| 
00112|   const clampedOffset = clampHelpOverlayScrollOffset(scrollOffset, contentLines.length, contentRows)
00113| 
00114|   const visibleLines = useMemo(() => {
00115|     const slice = contentLines.slice(clampedOffset, clampedOffset + contentRows)
00116|     if (slice.length >= contentRows) {
00117|       return slice
00118|     }
00119| 
00120|     const padded = [...slice]
00121|     while (padded.length < contentRows) {
00122|       padded.push('')
00123|     }
00124| 
00125|     return padded
00126|   }, [clampedOffset, contentLines, contentRows])
00127| 
00128|   const showScrollHint = maxScroll > 0
00129|   const scrollLabel = showScrollHint
00130|     ? `↑/↓ scroll (${clampedOffset + 1}-${Math.min(clampedOffset + contentRows, contentLines.length)}/${contentLines.length})`
00131|     : ''
00132| 
00133|   const headerLeft = 'Help'
00134|   const headerRight = 'Esc / ? to close'
00135|   const headerGap = Math.max(0, contentWidth - headerLeft.length - headerRight.length)
00136| 
00137|   return (
00138|     <Box
00139|       flexDirection="column"
00140|       borderStyle="round"
00141|       paddingX={1}
00142|       paddingY={0}
00143|       height={height}
00144|       width={overlayWidth}
00145|       overflow="hidden"
00146|       {...inkBorderColorProps(theme.border)}
00147|       {...backgroundProps}
00148|     >
00149|       <Box flexDirection="row">
00150|         <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00151|           {headerLeft}
00152|         </Text>
00153|         <Text {...backgroundProps}>{' '.repeat(headerGap)}</Text>
00154|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00155|           {headerRight}
00156|         </Text>
00157|       </Box>
00158| 
00159|       <Box flexDirection="column" marginTop={1} height={contentRows} overflow="hidden">
00160|         {visibleLines.map((line, index) => {
00161|           const isSectionTitle = sectionTitles.has(line)
00162|           const color = isSectionTitle ? theme.accent : theme.mutedText
00163|           return (
00164|             <Text key={`${scrollOffset}-${index}`} {...backgroundProps} {...inkColorProps(color)}>
00165|               {padRight(line, contentWidth)}
00166|             </Text>
00167|           )
00168|         })}
00169|       </Box>
00170| 
00171|       <Box flexDirection="row">
00172|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00173|           {padLeft(scrollLabel, contentWidth)}
00174|         </Text>
00175|       </Box>
00176|     </Box>
00177|   )
00178| }
00179| 

(End of file - total 179 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/core/Toast.tsx"
}
```
**Output:**
```
<file>
00001| import { Box, Text, useStdout } from 'ink'
00002| 
00003| import type { ToastKind } from '../../notifier'
00004| import { TOAST_HEIGHT, TOAST_HORIZONTAL_INSET_COLUMNS } from '../../toast-constants'
00005| import { useTheme } from '../../theme/theme-provider'
00006| import {
00007|   inkBackgroundColorProps,
00008|   inkBorderColorProps,
00009|   inkColorProps,
00010| } from '../../theme/theme-types'
00011| 
00012| const APP_CONTAINER_PADDING_X = 2
00013| 
00014| const padRight = (value: string, width: number): string => {
00015|   if (width <= 0) {
00016|     return ''
00017|   }
00018| 
00019|   const trimmed = value.length > width ? value.slice(0, width) : value
00020|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00021| }
00022| 
00023| export type ToastProps = {
00024|   message: string
00025|   kind: ToastKind
00026| }
00027| 
00028| type ToastChromeTone = 'default' | 'warning' | 'error'
00029| 
00030| type ToastChrome = {
00031|   borderTone: ToastChromeTone
00032|   titleTone: ToastChromeTone
00033|   title: string
00034| }
00035| 
00036| const toastChrome = (kind: ToastKind): ToastChrome => {
00037|   switch (kind) {
00038|     case 'info':
00039|       return { borderTone: 'default', titleTone: 'default', title: 'Notice' }
00040|     case 'progress':
00041|       return { borderTone: 'warning', titleTone: 'warning', title: 'Working' }
00042|     case 'warning':
00043|       return { borderTone: 'warning', titleTone: 'warning', title: 'Warning' }
00044|     case 'error':
00045|       return { borderTone: 'error', titleTone: 'error', title: 'Error' }
00046|     default: {
00047|       const exhaustive: never = kind
00048|       return exhaustive
00049|     }
00050|   }
00051| }
00052| 
00053| export { TOAST_HEIGHT }
00054| 
00055| export const Toast = ({ message, kind }: ToastProps) => {
00056|   const { theme } = useTheme()
00057|   const { stdout } = useStdout()
00058|   const chrome = toastChrome(kind)
00059| 
00060|   // Ink doesn't paint "empty" cells when rendering overlapping/absolute layers.
00061|   // To keep the toast opaque, we explicitly pad each content line to the
00062|   // available inner width so it prints background-colored spaces.
00063|   const terminalColumns = stdout?.columns ?? 80
00064|   const toastWidth = Math.max(
00065|     20,
00066|     terminalColumns - 2 * (APP_CONTAINER_PADDING_X + TOAST_HORIZONTAL_INSET_COLUMNS),
00067|   )
00068| 
00069|   const borderColumns = 2
00070|   const paddingColumns = 2
00071|   const contentWidth = Math.max(0, toastWidth - borderColumns - paddingColumns)
00072| 
00073|   const borderColor =
00074|     chrome.borderTone === 'warning'
00075|       ? theme.warning
00076|       : chrome.borderTone === 'error'
00077|         ? theme.error
00078|         : theme.border
00079| 
00080|   const titleColor =
00081|     chrome.titleTone === 'warning'
00082|       ? theme.warning
00083|       : chrome.titleTone === 'error'
00084|         ? theme.error
00085|         : theme.mutedText
00086| 
00087|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00088| 
00089|   return (
00090|     <Box
00091|       flexDirection="column"
00092|       borderStyle="round"
00093|       paddingX={1}
00094|       paddingY={0}
00095|       height={TOAST_HEIGHT}
00096|       width={toastWidth}
00097|       overflow="hidden"
00098|       {...inkBorderColorProps(borderColor)}
00099|       {...backgroundProps}
00100|     >
00101|       <Text {...backgroundProps} {...inkColorProps(titleColor)}>
00102|         {padRight(chrome.title, contentWidth)}
00103|       </Text>
00104|       <Text {...backgroundProps} {...inkColorProps(theme.text)}>
00105|         {padRight(message, contentWidth)}
00106|       </Text>
00107|     </Box>
00108|   )
00109| }
00110| 

(End of file - total 110 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/core/ToastOverlay.tsx"
}
```
**Output:**
```
<file>
00001| import { Box } from 'ink'
00002| import React, { memo, useEffect } from 'react'
00003| 
00004| import {
00005|   TOAST_ANIMATION_TICK_MS,
00006|   TOAST_HEIGHT,
00007|   TOAST_HORIZONTAL_INSET_COLUMNS,
00008|   TOAST_TOP_OFFSET_ROWS,
00009| } from '../../toast-constants'
00010| import type { ToastId, ToastItem } from '../../notifier'
00011| import { useToastContext } from '../../notifier'
00012| 
00013| import { Toast } from './Toast'
00014| 
00015| const useAnimatedInt = (targetValue: number, initialValue: number) => {
00016|   const [value, setValue] = React.useState(initialValue)
00017| 
00018|   useEffect(() => {
00019|     if (value === targetValue) {
00020|       return
00021|     }
00022| 
00023|     const timer = setTimeout(() => {
00024|       setValue((prev) => {
00025|         if (prev === targetValue) {
00026|           return prev
00027|         }
00028| 
00029|         const direction = prev < targetValue ? 1 : -1
00030|         return prev + direction
00031|       })
00032|     }, TOAST_ANIMATION_TICK_MS)
00033| 
00034|     return () => {
00035|       clearTimeout(timer)
00036|     }
00037|   }, [targetValue, value])
00038| 
00039|   return {
00040|     value,
00041|     isComplete: value === targetValue,
00042|   }
00043| }
00044| 
00045| type ToastOverlayItemProps = {
00046|   toast: ToastItem
00047|   onExitComplete: (id: ToastId) => void
00048| }
00049| 
00050| const ToastOverlayItem = ({ toast, onExitComplete }: ToastOverlayItemProps) => {
00051|   const targetHeight = toast.isExiting ? 0 : TOAST_HEIGHT
00052|   const { value: height, isComplete } = useAnimatedInt(targetHeight, 0)
00053| 
00054|   useEffect(() => {
00055|     if (!toast.isExiting) {
00056|       return
00057|     }
00058| 
00059|     if (!isComplete) {
00060|       return
00061|     }
00062| 
00063|     onExitComplete(toast.id)
00064|   }, [isComplete, onExitComplete, toast.id, toast.isExiting])
00065| 
00066|   if (height === 0 && toast.isExiting) {
00067|     return null
00068|   }
00069| 
00070|   return (
00071|     <Box height={height} overflow="hidden">
00072|       <Toast message={toast.message} kind={toast.kind} />
00073|     </Box>
00074|   )
00075| }
00076| 
00077| export const ToastOverlay = memo(() => {
00078|   const { toasts, removeToast } = useToastContext()
00079| 
00080|   return (
00081|     <Box
00082|       position="absolute"
00083|       width="100%"
00084|       height="100%"
00085|       flexDirection="column"
00086|       justifyContent="flex-start"
00087|       alignItems="flex-end"
00088|       paddingX={TOAST_HORIZONTAL_INSET_COLUMNS}
00089|       paddingTop={TOAST_TOP_OFFSET_ROWS}
00090|     >
00091|       {toasts.map((toast) => (
00092|         <ToastOverlayItem key={toast.id} toast={toast} onExitComplete={removeToast} />
00093|       ))}
00094|     </Box>
00095|   )
00096| })
00097| 
00098| ToastOverlay.displayName = 'ToastOverlay'
00099| 

(End of file - total 99 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/core/SingleLineTextInput.tsx"
}
```
**Output:**
```
<file>
00001| import React, { useEffect, useMemo, useRef, useState } from 'react'
00002| import { Box, Text, useInput, type Key } from 'ink'
00003| 
00004| import { clampCursor, type MultilineTextBufferState } from './multiline-text-buffer'
00005| import { resolveSingleLineKeyAction } from './single-line-text-input-keymap'
00006| 
00007| import { useTheme } from '../../theme/theme-provider'
00008| import { inkBackgroundColorProps, inkColorProps, type InkColorValue } from '../../theme/theme-types'
00009| 
00010| export type DebugKeyEvent = {
00011|   input: string
00012|   key: Key
00013| }
00014| 
00015| export type SingleLineTextInputProps = {
00016|   value: string
00017|   onChange: (next: string) => void
00018|   onSubmit: (value: string) => void
00019|   placeholder?: string | undefined
00020|   focus?: boolean
00021|   isDisabled?: boolean
00022|   onDebugKeyEvent?: ((event: DebugKeyEvent) => void) | undefined
00023| 
00024|   // Optional rendering constraints (useful for overlays that must paint their full width).
00025|   width?: number | undefined
00026|   backgroundColor?: InkColorValue
00027| }
00028| 
00029| type RenderLine = {
00030|   before: string
00031|   cursorCharacter: string
00032|   after: string
00033|   isPlaceholder: boolean
00034| }
00035| 
00036| const toRenderLine = (
00037|   value: string,
00038|   placeholder: string | undefined,
00039|   cursor: number,
00040| ): RenderLine => {
00041|   if (!value) {
00042|     const placeholderText = placeholder ?? ''
00043|     const safeCursor = Math.min(Math.max(cursor, 0), placeholderText.length)
00044|     const before = placeholderText.slice(0, safeCursor)
00045|     const cursorCharacter =
00046|       safeCursor < placeholderText.length ? placeholderText.charAt(safeCursor) : ' '
00047|     const after = safeCursor < placeholderText.length ? placeholderText.slice(safeCursor + 1) : ''
00048|     return { before, cursorCharacter, after, isPlaceholder: true }
00049|   }
00050| 
00051|   const safeCursor = Math.min(Math.max(cursor, 0), value.length)
00052|   const before = value.slice(0, safeCursor)
00053|   const cursorCharacter = safeCursor < value.length ? value.charAt(safeCursor) : ' '
00054|   const after = safeCursor < value.length ? value.slice(safeCursor + 1) : ''
00055|   return { before, cursorCharacter, after, isPlaceholder: false }
00056| }
00057| 
00058| export const SingleLineTextInput: React.FC<SingleLineTextInputProps> = ({
00059|   value,
00060|   onChange,
00061|   onSubmit,
00062|   placeholder,
00063|   focus = false,
00064|   isDisabled = false,
00065|   onDebugKeyEvent,
00066|   width,
00067|   backgroundColor,
00068| }) => {
00069|   const { theme } = useTheme()
00070|   const [cursor, setCursor] = useState<number>(value.length)
00071|   const internalUpdateRef = useRef(false)
00072| 
00073|   const state: MultilineTextBufferState = useMemo(
00074|     () => ({ value, cursor: clampCursor(cursor, value) }),
00075|     [cursor, value],
00076|   )
00077| 
00078|   const applyNextState = (nextState: MultilineTextBufferState): void => {
00079|     internalUpdateRef.current = true
00080|     setCursor(nextState.cursor)
00081|     onChange(nextState.value)
00082|   }
00083| 
00084|   useEffect(() => {
00085|     if (internalUpdateRef.current) {
00086|       internalUpdateRef.current = false
00087|       return
00088|     }
00089| 
00090|     setCursor(value.length)
00091|   }, [value])
00092| 
00093|   useInput(
00094|     (input, key) => {
00095|       if (!focus || isDisabled) {
00096|         return
00097|       }
00098| 
00099|       if (onDebugKeyEvent) {
00100|         onDebugKeyEvent({ input, key })
00101|       }
00102| 
00103|       const action = resolveSingleLineKeyAction({ input, key, state })
00104|       if (action.type === 'none') {
00105|         return
00106|       }
00107| 
00108|       if (action.type === 'submit') {
00109|         onSubmit(value)
00110|         return
00111|       }
00112| 
00113|       applyNextState(action.nextState)
00114|     },
00115|     { isActive: focus && !isDisabled },
00116|   )
00117| 
00118|   const rendered = useMemo(
00119|     () => toRenderLine(value, placeholder, state.cursor),
00120|     [placeholder, state.cursor, value],
00121|   )
00122| 
00123|   const backgroundProps = inkBackgroundColorProps(backgroundColor)
00124| 
00125|   const colorProps = rendered.isPlaceholder ? inkColorProps(theme.mutedText) : {}
00126| 
00127|   const renderedLength =
00128|     rendered.before.length + rendered.cursorCharacter.length + rendered.after.length
00129|   const filler =
00130|     typeof width === 'number' && width > renderedLength ? ' '.repeat(width - renderedLength) : ''
00131| 
00132|   return (
00133|     <Box>
00134|       <Text {...backgroundProps} {...colorProps}>
00135|         {rendered.before}
00136|       </Text>
00137|       <Text inverse {...backgroundProps} {...colorProps}>
00138|         {rendered.cursorCharacter}
00139|       </Text>
00140|       <Text {...backgroundProps} {...colorProps}>
00141|         {rendered.after}
00142|       </Text>
00143|       {filler ? <Text {...backgroundProps}>{filler}</Text> : null}
00144|     </Box>
00145|   )
00146| }
00147| 

(End of file - total 147 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/core/MultilineTextInput.tsx"
}
```
**Output:**
```
<file>
00001| import React, { useEffect, useMemo, useRef, useState } from 'react'
00002| import { Box, Text, useInput, type Key } from 'ink'
00003| 
00004| import {
00005|   backspace,
00006|   clampCursor,
00007|   deleteForward,
00008|   insertText,
00009|   moveCursorLeft,
00010|   moveCursorRight,
00011|   type MultilineTextBufferState,
00012| } from './multiline-text-buffer'
00013| import { isBackspaceKey } from './text-input-keys'
00014| import {
00015|   expandTokenizedLines,
00016|   getTokenizedCursorCoordinates,
00017|   type TokenLabelLookup,
00018| } from './tokenized-text'
00019| 
00020| import { useTheme } from '../../theme/theme-provider'
00021| import { inkColorProps } from '../../theme/theme-types'
00022| 
00023| export type DebugKeyEvent = {
00024|   input: string
00025|   key: Key
00026| }
00027| 
00028| export type MultilineTextInputProps = {
00029|   value: string
00030|   onChange: (next: string) => void
00031|   onSubmit: (value: string) => void
00032|   placeholder?: string | undefined
00033|   focus?: boolean
00034|   isDisabled?: boolean
00035|   isPasteActive?: boolean
00036|   tokenLabel?: TokenLabelLookup | undefined
00037|   onDebugKeyEvent?: ((event: DebugKeyEvent) => void) | undefined
00038| }
00039| 
00040| const PROMPT = '› '
00041| const PROMPT_SPACER = '  '
00042| 
00043| type RenderLine = {
00044|   id: string
00045|   content: string
00046|   isPlaceholder: boolean
00047| }
00048| 
00049| const toRenderLines = (
00050|   value: string,
00051|   placeholder: string | undefined,
00052|   tokenLabel: TokenLabelLookup,
00053| ): RenderLine[] => {
00054|   if (!value) {
00055|     return [{ id: 'placeholder', content: placeholder ?? '', isPlaceholder: true }]
00056|   }
00057| 
00058|   const lines = expandTokenizedLines(value, tokenLabel)
00059|   return lines.map((line, index) => ({ id: `line-${index}`, content: line, isPlaceholder: false }))
00060| }
00061| 
00062| export const MultilineTextInput: React.FC<MultilineTextInputProps> = ({
00063|   value,
00064|   onChange,
00065|   onSubmit,
00066|   placeholder,
00067|   focus = false,
00068|   isDisabled = false,
00069|   isPasteActive = false,
00070|   tokenLabel,
00071|   onDebugKeyEvent,
00072| }) => {
00073|   const { theme } = useTheme()
00074|   const [cursor, setCursor] = useState<number>(value.length)
00075|   const internalUpdateRef = useRef(false)
00076| 
00077|   const state: MultilineTextBufferState = useMemo(
00078|     () => ({ value, cursor: clampCursor(cursor, value) }),
00079|     [cursor, value],
00080|   )
00081| 
00082|   const applyNextState = (nextState: MultilineTextBufferState): void => {
00083|     internalUpdateRef.current = true
00084|     setCursor(nextState.cursor)
00085|     onChange(nextState.value)
00086|   }
00087| 
00088|   useEffect(() => {
00089|     if (internalUpdateRef.current) {
00090|       internalUpdateRef.current = false
00091|       return
00092|     }
00093| 
00094|     setCursor(value.length)
00095|   }, [value])
00096| 
00097|   useInput(
00098|     (input, key) => {
00099|       if (!focus || isDisabled || isPasteActive) {
00100|         return
00101|       }
00102| 
00103|       if (onDebugKeyEvent) {
00104|         onDebugKeyEvent({ input, key })
00105|       }
00106| 
00107|       const isCtrlJ = key.ctrl && input.toLowerCase() === 'j'
00108|       const isAltEnter =
00109|         key.meta && (key.return || input === '\r' || input === '\n' || input === '')
00110|       const isEscapedAltEnter = input === '\u001b\r' || input === '\u001b\n'
00111| 
00112|       if (isCtrlJ || isAltEnter || isEscapedAltEnter) {
00113|         applyNextState(insertText(state, '\n'))
00114|         return
00115|       }
00116| 
00117|       if (key.return) {
00118|         onSubmit(value)
00119|         return
00120|       }
00121| 
00122|       if (isBackspaceKey(input, key)) {
00123|         applyNextState(backspace(state))
00124|         return
00125|       }
00126| 
00127|       if (key.delete) {
00128|         applyNextState(deleteForward(state))
00129|         return
00130|       }
00131| 
00132|       if (key.leftArrow) {
00133|         setCursor(moveCursorLeft(state).cursor)
00134|         return
00135|       }
00136| 
00137|       if (key.rightArrow) {
00138|         setCursor(moveCursorRight(state).cursor)
00139|         return
00140|       }
00141| 
00142|       if (!input) {
00143|         return
00144|       }
00145| 
00146|       if (key.ctrl || key.meta) {
00147|         return
00148|       }
00149| 
00150|       applyNextState(insertText(state, input))
00151|     },
00152|     { isActive: focus && !isDisabled },
00153|   )
00154| 
00155|   const resolvedTokenLabel = useMemo<TokenLabelLookup>(
00156|     () => tokenLabel ?? (() => null),
00157|     [tokenLabel],
00158|   )
00159| 
00160|   const lines = useMemo(
00161|     () => toRenderLines(value, placeholder, resolvedTokenLabel),
00162|     [placeholder, resolvedTokenLabel, value],
00163|   )
00164|   const { row: cursorRow, column: cursorColumn } = useMemo(
00165|     () => getTokenizedCursorCoordinates(value, cursor, resolvedTokenLabel),
00166|     [cursor, resolvedTokenLabel, value],
00167|   )
00168| 
00169|   return (
00170|     <Box flexDirection="column" height={lines.length}>
00171|       {lines.map((line, lineIndex) => {
00172|         const isCursorLine = lineIndex === cursorRow
00173|         const safeColumn = isCursorLine ? Math.min(cursorColumn, line.content.length) : 0
00174|         const before = isCursorLine ? line.content.slice(0, safeColumn) : line.content
00175|         const cursorCharacter = isCursorLine
00176|           ? safeColumn < line.content.length
00177|             ? line.content.charAt(safeColumn)
00178|             : ' '
00179|           : ''
00180|         const after =
00181|           isCursorLine && safeColumn < line.content.length ? line.content.slice(safeColumn + 1) : ''
00182| 
00183|         const prefix = lineIndex === 0 ? PROMPT : PROMPT_SPACER
00184|         const lineColorProps = line.isPlaceholder ? inkColorProps(theme.mutedText) : {}
00185| 
00186|         return (
00187|           <Box key={line.id}>
00188|             <Text {...inkColorProps(theme.accent)}>{prefix}</Text>
00189|             {isCursorLine ? (
00190|               <>
00191|                 <Text {...lineColorProps}>{before}</Text>
00192|                 <Text inverse {...lineColorProps}>
00193|                   {cursorCharacter}
00194|                 </Text>
00195|                 <Text {...lineColorProps}>{after}</Text>
00196|               </>
00197|             ) : (
00198|               <Text {...lineColorProps}>{before}</Text>
00199|             )}
00200|           </Box>
00201|         )
00202|       })}
00203|     </Box>
00204|   )
00205| }
00206| 

(End of file - total 206 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/core/PastedSnippetCard.tsx"
}
```
**Output:**
```
<file>
00001| import { Box, Text } from 'ink'
00002| 
00003| import type { PastedSnippet } from '../../paste-snippet'
00004| import { useTheme } from '../../theme/theme-provider'
00005| import {
00006|   inkBackgroundColorProps,
00007|   inkBorderColorProps,
00008|   inkColorProps,
00009| } from '../../theme/theme-types'
00010| 
00011| export type PastedSnippetCardProps = {
00012|   snippet: PastedSnippet
00013| }
00014| 
00015| export const PastedSnippetCard = ({ snippet }: PastedSnippetCardProps) => {
00016|   const { theme } = useTheme()
00017| 
00018|   return (
00019|     <Box
00020|       flexDirection="column"
00021|       borderStyle="round"
00022|       paddingX={1}
00023|       paddingY={0}
00024|       {...inkBorderColorProps(theme.border)}
00025|       {...inkBackgroundColorProps(theme.popupBackground)}
00026|     >
00027|       <Text {...inkColorProps(theme.warning)}>{snippet.label}</Text>
00028|       {snippet.previewLines.map((line, index) => (
00029|         <Text key={`${index}-${line}`} {...inkColorProps(theme.mutedText)}>
00030|           {line}
00031|         </Text>
00032|       ))}
00033|       {snippet.lineCount > snippet.previewLines.length ? (
00034|         <Text {...inkColorProps(theme.mutedText)}>…</Text>
00035|       ) : null}
00036|       <Text {...inkColorProps(theme.mutedText)}>Enter to submit · Esc to discard</Text>
00037|     </Box>
00038|   )
00039| }
00040| 

(End of file - total 40 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/OpencodeSpinner.tsx"
}
```
**Output:**
```
<file>
00001| import React, { useEffect, useMemo, useState } from 'react'
00002| import { Text } from 'ink'
00003| 
00004| const DEFAULT_LENGTH = 12
00005| const DEFAULT_INTERVAL_MS = 80
00006| const DEFAULT_TRAIL_LENGTH = 3
00007| 
00008| export type OpencodeSpinnerProps = {
00009|   length?: number
00010|   intervalMs?: number
00011|   trailLength?: number
00012| }
00013| 
00014| export const OpencodeSpinner: React.FC<OpencodeSpinnerProps> = ({
00015|   length = DEFAULT_LENGTH,
00016|   intervalMs = DEFAULT_INTERVAL_MS,
00017|   trailLength = DEFAULT_TRAIL_LENGTH,
00018| }) => {
00019|   const [frame, setFrame] = useState(0)
00020| 
00021|   useEffect(() => {
00022|     const timer = setInterval(() => {
00023|       setFrame((prev) => prev + 1)
00024|     }, intervalMs)
00025| 
00026|     return () => {
00027|       clearInterval(timer)
00028|     }
00029|   }, [intervalMs])
00030| 
00031|   const segments = useMemo(() => {
00032|     const safeLength = Math.max(1, Math.floor(length))
00033|     const safeTrail = Math.max(0, Math.floor(trailLength))
00034| 
00035|     const span = safeLength - 1
00036|     const period = span <= 0 ? 1 : span * 2
00037|     const phase = frame % period
00038| 
00039|     const headIndex = span <= 0 ? 0 : phase <= span ? phase : period - phase
00040|     const direction = span <= 0 ? 1 : phase < span ? 1 : -1
00041| 
00042|     return Array.from({ length: safeLength }, (_, index) => {
00043|       const distanceBehind = direction === 1 ? headIndex - index : index - headIndex
00044| 
00045|       if (distanceBehind === 0) {
00046|         return (
00047|           <Text key={index} color="#A78BFA">
00048|             ▄
00049|           </Text>
00050|         )
00051|       }
00052| 
00053|       if (distanceBehind === 1 && safeTrail >= 1) {
00054|         return (
00055|           <Text key={index} color="#7C3AED">
00056|             ▄
00057|           </Text>
00058|         )
00059|       }
00060| 
00061|       if (distanceBehind === 2 && safeTrail >= 2) {
00062|         return (
00063|           <Text key={index} color="#5B21B6">
00064|             ▄
00065|           </Text>
00066|         )
00067|       }
00068| 
00069|       if (distanceBehind === 3 && safeTrail >= 3) {
00070|         return (
00071|           <Text key={index} color="#3B0764">
00072|             ▄
00073|           </Text>
00074|         )
00075|       }
00076| 
00077|       return (
00078|         <Text key={index} color="#333333">
00079|           _
00080|         </Text>
00081|       )
00082|     })
00083|   }, [frame, length, trailLength])
00084| 
00085|   return <Text>{segments}</Text>
00086| }
00087| 

(End of file - total 87 lines)
</file>
```
```

---

## Assistant

_Thinking:_

**Planning component review**

I’m noticing that OpencodeSpinner uses hardcoded colors instead of theming, which seems like a potential pitfall in styling architecture that I should mention. Next, I’ll need to read the popup and test-runner component files. There are quite a few popups, each around 100-300 lines long. I’ll read through them and also the test-runner subcomponents, like logs and summary. I think I’ll set up parallel reads—maybe limit it to 10 tools at once—so I can efficiently handle it all!

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ListPopup.tsx"
}
```
**Output:**
```
<file>
00001| import { useMemo, type ComponentProps } from 'react'
00002| import { Box, Text, useStdout } from 'ink'
00003| 
00004| import { SingleLineTextInput } from '../core/SingleLineTextInput'
00005| import { useTheme } from '../../theme/theme-provider'
00006| import {
00007|   inkBackgroundColorProps,
00008|   inkBorderColorProps,
00009|   inkColorProps,
00010| } from '../../theme/theme-types'
00011| import { resolveListPopupHeights, DEFAULT_MAX_VISIBLE_LIST_ITEMS } from './list-popup-layout'
00012| import { resolveWindowedList } from './list-window'
00013| 
00014| const clamp = (value: number, min: number, max: number): number =>
00015|   Math.max(min, Math.min(value, max))
00016| 
00017| const padRight = (value: string, width: number): string => {
00018|   if (width <= 0) {
00019|     return ''
00020|   }
00021| 
00022|   const trimmed = value.length > width ? value.slice(0, width) : value
00023|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00024| }
00025| 
00026| export type ListPopupProps = {
00027|   title: string
00028|   placeholder: string
00029|   draft: string
00030|   items: readonly string[]
00031|   selectedIndex: number
00032|   emptyLabel: string
00033|   instructions: string
00034|   suggestedItems?: readonly string[]
00035|   suggestedSelectionIndex?: number
00036|   suggestedFocused?: boolean
00037|   maxHeight?: number
00038|   onDraftChange: (value: string) => void
00039|   onSubmitDraft: (value: string) => void
00040| }
00041| 
00042| const resolveSelectedVisible = (
00043|   items: readonly string[],
00044|   selectedIndex: number,
00045|   maxRows: number,
00046| ): { start: number; values: readonly string[]; showBefore: boolean; showAfter: boolean } => {
00047|   if (items.length === 0) {
00048|     return { start: 0, values: [], showBefore: false, showAfter: false }
00049|   }
00050| 
00051|   const window = resolveWindowedList({
00052|     itemCount: items.length,
00053|     selectedIndex,
00054|     maxVisibleRows: maxRows,
00055|     lead: 2,
00056|   })
00057| 
00058|   return {
00059|     start: window.start,
00060|     values: items.slice(window.start, window.end),
00061|     showBefore: window.showBefore,
00062|     showAfter: window.showAfter,
00063|   }
00064| }
00065| 
00066| const resolveSuggestedVisible = (
00067|   suggestions: readonly string[],
00068|   selectedIndex: number,
00069|   maxRows: number,
00070| ): { start: number; values: readonly string[]; showBefore: boolean; showAfter: boolean } => {
00071|   if (suggestions.length === 0) {
00072|     return { start: 0, values: [], showBefore: false, showAfter: false }
00073|   }
00074| 
00075|   const window = resolveWindowedList({
00076|     itemCount: suggestions.length,
00077|     selectedIndex,
00078|     maxVisibleRows: maxRows,
00079|     lead: 1,
00080|   })
00081| 
00082|   return {
00083|     start: window.start,
00084|     values: suggestions.slice(window.start, window.end),
00085|     showBefore: window.showBefore,
00086|     showAfter: window.showAfter,
00087|   }
00088| }
00089| 
00090| export const ListPopup = ({
00091|   title,
00092|   placeholder,
00093|   draft,
00094|   items,
00095|   selectedIndex,
00096|   emptyLabel,
00097|   instructions,
00098|   suggestedItems,
00099|   suggestedSelectionIndex,
00100|   suggestedFocused,
00101|   maxHeight,
00102|   onDraftChange,
00103|   onSubmitDraft,
00104| }: ListPopupProps) => {
00105|   const { theme } = useTheme()
00106|   const { stdout } = useStdout()
00107| 
00108|   const terminalColumns = stdout?.columns ?? 80
00109|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00110| 
00111|   const borderColumns = 2
00112|   const paddingColumns = 2
00113|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00114| 
00115|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00116| 
00117|   const hasSuggestions = (suggestedItems?.length ?? 0) > 0
00118| 
00119|   const safeSuggestedSelection = Math.max(
00120|     0,
00121|     Math.min(suggestedSelectionIndex ?? 0, Math.max((suggestedItems?.length ?? 0) - 1, 0)),
00122|   )
00123|   const effectiveSuggestedFocused = Boolean(hasSuggestions && suggestedFocused)
00124| 
00125|   const focusedSelectionProps = {
00126|     ...inkColorProps(theme.selectionText),
00127|     ...inkBackgroundColorProps(theme.selectionBackground),
00128|   }
00129| 
00130|   const unfocusedSelectionProps = {
00131|     ...inkColorProps(theme.chipText),
00132|     ...inkBackgroundColorProps(theme.chipBackground),
00133|   }
00134| 
00135|   // Hooks must run consistently across renders (suggestions can arrive async).
00136|   const heights = useMemo(
00137|     () => resolveListPopupHeights({ maxHeight, hasSuggestions }),
00138|     [hasSuggestions, maxHeight],
00139|   )
00140| 
00141|   const selectedVisible = useMemo(
00142|     () => resolveSelectedVisible(items, selectedIndex, heights.selectedRows),
00143|     [heights.selectedRows, items, selectedIndex],
00144|   )
00145| 
00146|   const suggestionRows = heights.suggestionRows
00147| 
00148|   const suggestedVisible = useMemo(() => {
00149|     if (!hasSuggestions || suggestionRows <= 0) {
00150|       return { start: 0, values: [], showBefore: false, showAfter: false }
00151|     }
00152| 
00153|     return resolveSuggestedVisible(suggestedItems ?? [], safeSuggestedSelection, suggestionRows)
00154|   }, [hasSuggestions, safeSuggestedSelection, suggestedItems, suggestionRows])
00155| 
00156|   const upperBound = Math.max(items.length - DEFAULT_MAX_VISIBLE_LIST_ITEMS, 0)
00157|   const start = Math.max(0, Math.min(selectedIndex - 2, upperBound))
00158|   const visibleItems = items.slice(start, start + DEFAULT_MAX_VISIBLE_LIST_ITEMS)
00159| 
00160|   const selectedLines = useMemo(() => {
00161|     const lines: Array<{ key: string; label: string; props: ComponentProps<typeof Text> }> = []
00162| 
00163|     if (items.length === 0) {
00164|       lines.push({
00165|         key: 'empty',
00166|         label: emptyLabel,
00167|         props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
00168|       })
00169|     } else {
00170|       if (selectedVisible.showBefore) {
00171|         lines.push({
00172|           key: 'before',
00173|           label: '… earlier entries …',
00174|           props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
00175|         })
00176|       }
00177| 
00178|       selectedVisible.values.forEach((value, index) => {
00179|         const actualIndex = selectedVisible.start + index
00180|         const isSelected = actualIndex === selectedIndex
00181|         const rowLabel = `${actualIndex + 1}. ${value}`
00182|         const textProps = isSelected
00183|           ? focusedSelectionProps
00184|           : { ...backgroundProps, ...inkColorProps(theme.text) }
00185| 
00186|         lines.push({ key: `${value}-${actualIndex}`, label: rowLabel, props: textProps })
00187|       })
00188| 
00189|       if (selectedVisible.showAfter) {
00190|         lines.push({
00191|           key: 'after',
00192|           label: '… later entries …',
00193|           props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
00194|         })
00195|       }
00196|     }
00197| 
00198|     while (lines.length < heights.selectedRows) {
00199|       lines.push({ key: `pad-${lines.length}`, label: '', props: backgroundProps })
00200|     }
00201| 
00202|     return lines
00203|   }, [
00204|     backgroundProps,
00205|     emptyLabel,
00206|     focusedSelectionProps,
00207|     heights.selectedRows,
00208|     items.length,
00209|     selectedIndex,
00210|     selectedVisible.showAfter,
00211|     selectedVisible.showBefore,
00212|     selectedVisible.start,
00213|     selectedVisible.values,
00214|     theme.mutedText,
00215|     theme.text,
00216|   ])
00217| 
00218|   const suggestionLines = useMemo(() => {
00219|     const lines: Array<{ key: string; label: string; props: ComponentProps<typeof Text> }> = []
00220| 
00221|     if (suggestionRows <= 0) {
00222|       return lines
00223|     }
00224| 
00225|     if (suggestedVisible.showBefore) {
00226|       lines.push({
00227|         key: 'before',
00228|         label: '… earlier suggestions …',
00229|         props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
00230|       })
00231|     }
00232| 
00233|     suggestedVisible.values.forEach((value, index) => {
00234|       const actualIndex = suggestedVisible.start + index
00235|       const isSelected = actualIndex === safeSuggestedSelection
00236| 
00237|       const textProps = isSelected
00238|         ? effectiveSuggestedFocused
00239|           ? focusedSelectionProps
00240|           : unfocusedSelectionProps
00241|         : { ...backgroundProps, ...inkColorProps(theme.text) }
00242| 
00243|       lines.push({ key: `${value}-${actualIndex}`, label: value, props: textProps })
00244|     })
00245| 
00246|     if (suggestedVisible.showAfter) {
00247|       lines.push({
00248|         key: 'after',
00249|         label: '… later suggestions …',
00250|         props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
00251|       })
00252|     }
00253| 
00254|     while (lines.length < suggestionRows) {
00255|       lines.push({ key: `pad-${lines.length}`, label: '', props: backgroundProps })
00256|     }
00257| 
00258|     return lines
00259|   }, [
00260|     backgroundProps,
00261|     effectiveSuggestedFocused,
00262|     focusedSelectionProps,
00263|     safeSuggestedSelection,
00264|     suggestionRows,
00265|     suggestedVisible.showAfter,
00266|     suggestedVisible.showBefore,
00267|     suggestedVisible.start,
00268|     suggestedVisible.values,
00269|     theme.mutedText,
00270|     theme.text,
00271|     unfocusedSelectionProps,
00272|   ])
00273| 
00274|   return hasSuggestions ? (
00275|     <Box
00276|       flexDirection="column"
00277|       borderStyle="round"
00278|       paddingX={1}
00279|       paddingY={0}
00280|       width={popupWidth}
00281|       {...inkBorderColorProps(theme.border)}
00282|       {...backgroundProps}
00283|       {...(typeof maxHeight === 'number' ? { height: maxHeight } : {})}
00284|       overflow="hidden"
00285|     >
00286|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00287|         {padRight(title, contentWidth)}
00288|       </Text>
00289| 
00290|       <Box flexDirection="row">
00291|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00292|           Add:
00293|         </Text>
00294|         <SingleLineTextInput
00295|           value={draft}
00296|           onChange={onDraftChange}
00297|           placeholder={placeholder}
00298|           onSubmit={() => onSubmitDraft(draft)}
00299|           focus={!effectiveSuggestedFocused}
00300|           width={Math.max(1, contentWidth - 'Add: '.length)}
00301|           backgroundColor={theme.popupBackground}
00302|         />
00303|       </Box>
00304| 
00305|       <Box
00306|         flexDirection="column"
00307|         height={1 + heights.selectedRows}
00308|         flexShrink={0}
00309|         overflow="hidden"
00310|       >
00311|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00312|           {padRight('Selected', contentWidth)}
00313|         </Text>
00314|         {selectedLines.map((line) => (
00315|           <Text key={line.key} {...line.props}>
00316|             {padRight(line.label, contentWidth)}
00317|           </Text>
00318|         ))}
00319|       </Box>
00320| 
00321|       {suggestionRows > 0 ? (
00322|         <Box flexDirection="column" height={1 + suggestionRows} flexShrink={0} overflow="hidden">
00323|           <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00324|             {padRight('Suggestions', contentWidth)}
00325|           </Text>
00326|           {suggestionLines.map((line) => (
00327|             <Text key={line.key} {...line.props}>
00328|               {padRight(line.label, contentWidth)}
00329|             </Text>
00330|           ))}
00331|         </Box>
00332|       ) : null}
00333| 
00334|       <Box flexShrink={0}>
00335|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00336|           {padRight(instructions, contentWidth)}
00337|         </Text>
00338|       </Box>
00339|     </Box>
00340|   ) : (
00341|     <Box
00342|       flexDirection="column"
00343|       borderStyle="round"
00344|       paddingX={1}
00345|       paddingY={0}
00346|       width={popupWidth}
00347|       {...inkBorderColorProps(theme.border)}
00348|       {...backgroundProps}
00349|     >
00350|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00351|         {padRight(title, contentWidth)}
00352|       </Text>
00353|       <Box flexDirection="column" marginTop={1}>
00354|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00355|           {padRight('Add new', contentWidth)}
00356|         </Text>
00357|         <SingleLineTextInput
00358|           value={draft}
00359|           onChange={onDraftChange}
00360|           placeholder={placeholder}
00361|           onSubmit={() => onSubmitDraft(draft)}
00362|           focus
00363|           width={contentWidth}
00364|           backgroundColor={theme.popupBackground}
00365|         />
00366|       </Box>
00367|       <Box flexDirection="column" marginTop={1}>
00368|         {items.length === 0 ? (
00369|           <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00370|             {padRight(emptyLabel, contentWidth)}
00371|           </Text>
00372|         ) : (
00373|           <>
00374|             {start > 0 ? (
00375|               <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00376|                 {padRight('… earlier entries …', contentWidth)}
00377|               </Text>
00378|             ) : null}
00379|             {visibleItems.map((value, index) => {
00380|               const actualIndex = start + index
00381|               const isSelected = actualIndex === selectedIndex
00382|               const textProps = isSelected
00383|                 ? focusedSelectionProps
00384|                 : { ...backgroundProps, ...inkColorProps(theme.text) }
00385|               return (
00386|                 <Text key={`${value}-${actualIndex}`} {...textProps}>
00387|                   {padRight(`${actualIndex + 1}. ${value}`, contentWidth)}
00388|                 </Text>
00389|               )
00390|             })}
00391|             {start + DEFAULT_MAX_VISIBLE_LIST_ITEMS < items.length ? (
00392|               <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00393|                 {padRight('… later entries …', contentWidth)}
00394|               </Text>
00395|             ) : null}
00396|           </>
00397|         )}
00398|       </Box>
00399| 
00400|       <Box marginTop={1}>
00401|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00402|           {padRight(instructions, contentWidth)}
00403|         </Text>
00404|       </Box>
00405|     </Box>
00406|   )
00407| }
00408| 

(End of file - total 408 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/list-popup-layout.ts"
}
```
**Output:**
```
<file>
00001| export const DEFAULT_MAX_VISIBLE_LIST_ITEMS = 6
00002| export const DEFAULT_MAX_VISIBLE_SUGGESTIONS = 4
00003| 
00004| export type ListPopupHeights = {
00005|   selectedRows: number
00006|   suggestionRows: number
00007| }
00008| 
00009| type ResolveListPopupHeightsOptions = {
00010|   maxHeight: number | undefined
00011|   hasSuggestions: boolean
00012| }
00013| 
00014| export const resolveListPopupHeights = ({
00015|   maxHeight,
00016|   hasSuggestions,
00017| }: ResolveListPopupHeightsOptions): ListPopupHeights => {
00018|   if (!hasSuggestions) {
00019|     return { selectedRows: DEFAULT_MAX_VISIBLE_LIST_ITEMS, suggestionRows: 0 }
00020|   }
00021| 
00022|   const fallbackHeight = 16
00023|   const resolvedHeight = maxHeight ?? fallbackHeight
00024|   const borderRows = 2
00025|   const contentHeight = Math.max(1, resolvedHeight - borderRows)
00026| 
00027|   const fixedRows = 5
00028|   const availableRows = Math.max(contentHeight - fixedRows, 1)
00029| 
00030|   const selectedMin = Math.min(3, availableRows)
00031|   const suggestionRows = Math.min(
00032|     DEFAULT_MAX_VISIBLE_SUGGESTIONS,
00033|     Math.max(0, availableRows - selectedMin),
00034|   )
00035|   const selectedRows = Math.max(1, availableRows - suggestionRows)
00036| 
00037|   return { selectedRows, suggestionRows }
00038| }
00039| 

(End of file - total 39 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/list-window.ts"
}
```
**Output:**
```
<file>
00001| /*
00002|  * List “windowing” primitives.
00003|  *
00004|  * In a TUI, rendering huge lists is both slow and visually noisy.
00005|  * These helpers answer: “Given N items and a selection cursor, which slice
00006|  * should we render, and should we show ‘… earlier …’ / ‘… later …’ indicators?”
00007|  *
00008|  * This module is intentionally:
00009|  * - Pure (no React/Ink imports)
00010|  * - Deterministic (same input => same output)
00011|  * - Unit-testable (used by popups and other scrolling views)
00012|  */
00013| 
00014| export type WindowedList = {
00015|   start: number
00016|   end: number
00017|   showBefore: boolean
00018|   showAfter: boolean
00019| }
00020| 
00021| export type WindowRange = {
00022|   startIndex: number
00023|   endIndexExclusive: number
00024| }
00025| 
00026| type ResolveWindowedListOptions = {
00027|   itemCount: number
00028|   selectedIndex: number
00029|   maxVisibleRows: number
00030|   lead?: number
00031| }
00032| 
00033| const clamp = (value: number, min: number, max: number): number => {
00034|   if (value < min) {
00035|     return min
00036|   }
00037|   if (value > max) {
00038|     return max
00039|   }
00040|   return value
00041| }
00042| 
00043| const normalizeSelectedIndex = (itemCount: number, selectedIndex: number): number => {
00044|   if (itemCount <= 0) {
00045|     return 0
00046|   }
00047| 
00048|   return clamp(selectedIndex, 0, itemCount - 1)
00049| }
00050| 
00051| const resolveCursorWindowInternal = (
00052|   itemCount: number,
00053|   cursorIndex: number,
00054|   windowSize: number,
00055|   lead: number,
00056| ): WindowRange => {
00057|   if (itemCount <= 0 || windowSize <= 0) {
00058|     return { startIndex: 0, endIndexExclusive: 0 }
00059|   }
00060| 
00061|   const normalizedCursor = normalizeSelectedIndex(itemCount, cursorIndex)
00062|   const safeLead = Math.max(0, lead)
00063| 
00064|   const upperBound = Math.max(itemCount - windowSize, 0)
00065|   const startIndex = clamp(
00066|     normalizedCursor - Math.min(safeLead, Math.max(windowSize - 1, 0)),
00067|     0,
00068|     upperBound,
00069|   )
00070| 
00071|   return {
00072|     startIndex,
00073|     endIndexExclusive: Math.min(startIndex + windowSize, itemCount),
00074|   }
00075| }
00076| 
00077| /**
00078|  * The simplest windowing primitive.
00079|  *
00080|  * Required by the refactor plan: `(itemCount, cursorIndex, windowSize) -> range`.
00081|  * We keep a small “lead” (2 rows) so the cursor stays slightly below the top,
00082|  * matching the current popup UX.
00083|  */
00084| export const resolveCursorWindow = (
00085|   itemCount: number,
00086|   cursorIndex: number,
00087|   windowSize: number,
00088| ): WindowRange => resolveCursorWindowInternal(itemCount, cursorIndex, windowSize, 2)
00089| 
00090| export const resolveWindowedList = ({
00091|   itemCount,
00092|   selectedIndex,
00093|   maxVisibleRows,
00094|   lead = 2,
00095| }: ResolveWindowedListOptions): WindowedList => {
00096|   if (itemCount <= 0 || maxVisibleRows <= 0) {
00097|     return { start: 0, end: 0, showBefore: false, showAfter: false }
00098|   }
00099| 
00100|   const normalizedSelected = normalizeSelectedIndex(itemCount, selectedIndex)
00101|   const safeLead = Math.max(0, lead)
00102| 
00103|   let showBefore = true
00104|   let showAfter = true
00105|   let start = 0
00106|   let end = 0
00107| 
00108|   // We may need a couple iterations because the presence/absence of the
00109|   // “earlier/later” indicator lines reduces the number of actual items that fit.
00110|   for (let iteration = 0; iteration < 4; iteration += 1) {
00111|     const indicatorRows = (showBefore ? 1 : 0) + (showAfter ? 1 : 0)
00112|     const visibleItems = Math.max(1, maxVisibleRows - indicatorRows)
00113| 
00114|     const range =
00115|       safeLead === 2
00116|         ? resolveCursorWindow(itemCount, normalizedSelected, visibleItems)
00117|         : resolveCursorWindowInternal(itemCount, normalizedSelected, visibleItems, safeLead)
00118| 
00119|     start = range.startIndex
00120|     end = range.endIndexExclusive
00121| 
00122|     const nextShowBefore = start > 0
00123|     const nextShowAfter = end < itemCount
00124| 
00125|     if (nextShowBefore === showBefore && nextShowAfter === showAfter) {
00126|       showBefore = nextShowBefore
00127|       showAfter = nextShowAfter
00128|       break
00129|     }
00130| 
00131|     showBefore = nextShowBefore
00132|     showAfter = nextShowAfter
00133|   }
00134| 
00135|   return { start, end, showBefore, showAfter }
00136| }
00137| 

(End of file - total 137 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ModelPopup.tsx"
}
```
**Output:**
```
<file>
00001| import { useMemo } from 'react'
00002| import { Box, Text, useStdout } from 'ink'
00003| 
00004| import { SingleLineTextInput } from '../core/SingleLineTextInput'
00005| 
00006| import { MODEL_PROVIDER_LABELS } from '../../../model-providers'
00007| import { useTheme } from '../../theme/theme-provider'
00008| import {
00009|   inkBackgroundColorProps,
00010|   inkBorderColorProps,
00011|   inkColorProps,
00012| } from '../../theme/theme-types'
00013| import type { InkColorValue } from '../../theme/theme-types'
00014| import { resolveWindowedList } from './list-window'
00015| import type { ModelOption, ProviderStatusMap } from '../../types'
00016| 
00017| const clamp = (value: number, min: number, max: number): number =>
00018|   Math.max(min, Math.min(value, max))
00019| 
00020| const padRight = (value: string, width: number): string => {
00021|   if (width <= 0) {
00022|     return ''
00023|   }
00024| 
00025|   const trimmed = value.length > width ? value.slice(0, width) : value
00026|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00027| }
00028| 
00029| const joinColumns = (left: string, right: string, width: number): string => {
00030|   const safeWidth = Math.max(0, width)
00031|   if (safeWidth === 0) {
00032|     return ''
00033|   }
00034| 
00035|   const leftTrimmed = left.length > safeWidth ? left.slice(0, safeWidth) : left
00036|   const remaining = Math.max(0, safeWidth - leftTrimmed.length)
00037| 
00038|   const rightTrimmed = right.length > remaining ? right.slice(0, remaining) : right
00039|   const gap = Math.max(1, safeWidth - leftTrimmed.length - rightTrimmed.length)
00040| 
00041|   return `${leftTrimmed}${' '.repeat(gap)}${rightTrimmed}`
00042| }
00043| 
00044| export type ModelPopupProps = {
00045|   title?: string
00046|   query: string
00047|   options: readonly ModelOption[]
00048|   selectedIndex: number
00049|   recentCount: number
00050|   maxHeight?: number
00051|   providerStatuses: ProviderStatusMap
00052|   onQueryChange: (value: string) => void
00053|   onSubmit: (option?: ModelOption) => void
00054| }
00055| 
00056| type ModelRow =
00057|   | { type: 'header'; title: string }
00058|   | { type: 'spacer' }
00059|   | { type: 'option'; option: ModelOption; optionIndex: number }
00060| 
00061| const resolveListRows = (maxHeight: number | undefined): number => {
00062|   const fallbackHeight = 16
00063|   const resolvedHeight = maxHeight ?? fallbackHeight
00064|   const borderRows = 2
00065|   const contentHeight = Math.max(1, resolvedHeight - borderRows)
00066| 
00067|   const fixedRows = 3
00068|   return Math.max(1, contentHeight - fixedRows)
00069| }
00070| 
00071| const buildRows = (options: readonly ModelOption[], recentCount: number): ModelRow[] => {
00072|   if (options.length === 0) {
00073|     return []
00074|   }
00075| 
00076|   const rows: ModelRow[] = []
00077| 
00078|   const safeRecentCount = Math.max(0, Math.min(recentCount, options.length))
00079|   if (safeRecentCount > 0) {
00080|     rows.push({ type: 'header', title: 'Recent' })
00081|     for (let index = 0; index < safeRecentCount; index += 1) {
00082|       const option = options[index]
00083|       if (!option) {
00084|         continue
00085|       }
00086|       rows.push({ type: 'option', option, optionIndex: index })
00087|     }
00088|     if (safeRecentCount < options.length) {
00089|       rows.push({ type: 'spacer' })
00090|     }
00091|   }
00092| 
00093|   let lastProvider: string | null = null
00094|   for (let index = safeRecentCount; index < options.length; index += 1) {
00095|     const option = options[index]
00096|     if (!option) {
00097|       continue
00098|     }
00099| 
00100|     const providerLabel = MODEL_PROVIDER_LABELS[option.provider]
00101|     if (providerLabel !== lastProvider) {
00102|       rows.push({ type: 'header', title: providerLabel })
00103|       lastProvider = providerLabel
00104|     }
00105| 
00106|     rows.push({ type: 'option', option, optionIndex: index })
00107|   }
00108| 
00109|   return rows
00110| }
00111| 
00112| const ensureHeaderVisible = (
00113|   rows: readonly ModelRow[],
00114|   start: number,
00115|   end: number,
00116|   maxRows: number,
00117| ): { start: number; end: number } => {
00118|   if (start <= 0 || end - start >= maxRows) {
00119|     return { start, end }
00120|   }
00121| 
00122|   const first = rows[start]
00123|   const previous = rows[start - 1]
00124|   if (first?.type === 'option' && previous?.type === 'header') {
00125|     const nextStart = start - 1
00126|     const nextEnd = Math.min(rows.length, nextStart + maxRows)
00127|     return { start: nextStart, end: nextEnd }
00128|   }
00129| 
00130|   return { start, end }
00131| }
00132| 
00133| export const ModelPopup = ({
00134|   title,
00135|   query,
00136|   options,
00137|   selectedIndex,
00138|   recentCount,
00139|   maxHeight,
00140|   providerStatuses,
00141|   onQueryChange,
00142|   onSubmit,
00143| }: ModelPopupProps) => {
00144|   const { theme } = useTheme()
00145|   const { stdout } = useStdout()
00146| 
00147|   const terminalColumns = stdout?.columns ?? 80
00148|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00149| 
00150|   const borderColumns = 2
00151|   const paddingColumns = 2
00152|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00153| 
00154|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00155| 
00156|   const resolveOptionColor = (option: ModelOption): InkColorValue => {
00157|     const status = providerStatuses[option.provider]?.status
00158|     if (status === 'missing') {
00159|       return theme.warning
00160|     }
00161|     if (status === 'error') {
00162|       return theme.error
00163|     }
00164|     return theme.text
00165|   }
00166| 
00167|   const selectedOption = options[selectedIndex]
00168|   const listRows = useMemo(() => resolveListRows(maxHeight), [maxHeight])
00169| 
00170|   const rows = useMemo(() => buildRows(options, recentCount), [options, recentCount])
00171| 
00172|   const selectedRowIndex = useMemo(() => {
00173|     if (rows.length === 0) {
00174|       return 0
00175|     }
00176| 
00177|     const index = rows.findIndex(
00178|       (row) => row.type === 'option' && row.optionIndex === selectedIndex,
00179|     )
00180|     return index >= 0 ? index : 0
00181|   }, [rows, selectedIndex])
00182| 
00183|   const window = useMemo(
00184|     () =>
00185|       resolveWindowedList({
00186|         itemCount: rows.length,
00187|         selectedIndex: selectedRowIndex,
00188|         maxVisibleRows: listRows,
00189|         lead: 2,
00190|       }),
00191|     [listRows, rows.length, selectedRowIndex],
00192|   )
00193| 
00194|   const slice = useMemo(
00195|     () => ensureHeaderVisible(rows, window.start, window.end, listRows),
00196|     [listRows, rows, window.end, window.start],
00197|   )
00198| 
00199|   const visibleRows = useMemo(() => {
00200|     const base = rows.slice(slice.start, slice.end)
00201|     if (base.length >= listRows) {
00202|       return base
00203|     }
00204| 
00205|     const padded: ModelRow[] = [...base]
00206|     while (padded.length < listRows) {
00207|       padded.push({ type: 'spacer' })
00208|     }
00209| 
00210|     return padded
00211|   }, [listRows, rows, slice.end, slice.start])
00212| 
00213|   const selectedTextProps = {
00214|     ...inkColorProps(theme.selectionText),
00215|     ...inkBackgroundColorProps(theme.selectionBackground),
00216|   }
00217| 
00218|   const headerLeft = title ?? 'Select model'
00219|   const headerRight = 'esc'
00220|   const headerGap = Math.max(0, contentWidth - headerLeft.length - headerRight.length)
00221| 
00222|   return (
00223|     <Box
00224|       flexDirection="column"
00225|       borderStyle="round"
00226|       paddingX={1}
00227|       paddingY={0}
00228|       width={popupWidth}
00229|       {...inkBorderColorProps(theme.border)}
00230|       {...backgroundProps}
00231|     >
00232|       <Box flexDirection="row">
00233|         <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00234|           {headerLeft}
00235|         </Text>
00236|         <Text {...backgroundProps}>{' '.repeat(headerGap)}</Text>
00237|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00238|           {headerRight}
00239|         </Text>
00240|       </Box>
00241| 
00242|       <Box marginTop={1}>
00243|         <SingleLineTextInput
00244|           value={query}
00245|           onChange={onQueryChange}
00246|           onSubmit={() => onSubmit(selectedOption)}
00247|           placeholder="Search"
00248|           focus
00249|           width={contentWidth}
00250|           backgroundColor={theme.popupBackground}
00251|         />
00252|       </Box>
00253| 
00254|       <Box flexDirection="column" marginTop={1} height={listRows} overflow="hidden">
00255|         {rows.length === 0 ? (
00256|           <>
00257|             <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00258|               {padRight('No models match.', contentWidth)}
00259|             </Text>
00260|             {Array.from({ length: Math.max(0, listRows - 1) }).map((_, index) => (
00261|               <Text key={`empty-${index}`} {...backgroundProps}>
00262|                 {padRight('', contentWidth)}
00263|               </Text>
00264|             ))}
00265|           </>
00266|         ) : (
00267|           visibleRows.map((row, rowIndex) => {
00268|             if (row.type === 'spacer') {
00269|               return (
00270|                 <Text key={`spacer-${slice.start + rowIndex}`} {...backgroundProps}>
00271|                   {padRight('', contentWidth)}
00272|                 </Text>
00273|               )
00274|             }
00275| 
00276|             if (row.type === 'header') {
00277|               return (
00278|                 <Text
00279|                   key={`header-${row.title}-${slice.start + rowIndex}`}
00280|                   {...backgroundProps}
00281|                   {...inkColorProps(theme.accent)}
00282|                 >
00283|                   {padRight(row.title, contentWidth)}
00284|                 </Text>
00285|               )
00286|             }
00287| 
00288|             const isSelected = row.optionIndex === selectedIndex
00289|             const providerLabel = MODEL_PROVIDER_LABELS[row.option.provider]
00290| 
00291|             const rowTextProps = isSelected
00292|               ? selectedTextProps
00293|               : { ...backgroundProps, ...inkColorProps(resolveOptionColor(row.option)) }
00294| 
00295|             const line = joinColumns(row.option.label, providerLabel, contentWidth)
00296| 
00297|             return (
00298|               <Text key={`option-${row.option.id}`} {...rowTextProps}>
00299|                 {padRight(line, contentWidth)}
00300|               </Text>
00301|             )
00302|           })
00303|         )}
00304|       </Box>
00305| 
00306|       <Box marginTop={1}>
00307|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00308|           {padRight('Enter to select', contentWidth)}
00309|         </Text>
00310|       </Box>
00311|     </Box>
00312|   )
00313| }
00314| 

(End of file - total 314 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ThemePickerPopup.tsx"
}
```
**Output:**
```
<file>
00001| import { useMemo } from 'react'
00002| import { Box, Text, useStdout } from 'ink'
00003| 
00004| import { useTheme } from '../../theme/theme-provider'
00005| import {
00006|   inkBackgroundColorProps,
00007|   inkBorderColorProps,
00008|   inkColorProps,
00009| } from '../../theme/theme-types'
00010| import { resolveWindowedList } from './list-window'
00011| 
00012| export type ThemePickerPopupProps = {
00013|   selectionIndex: number
00014|   initialThemeName: string
00015|   maxHeight?: number
00016| }
00017| 
00018| const resolveListRows = (maxHeight: number | undefined, hasError: boolean): number => {
00019|   const fallbackHeight = 16
00020|   const resolvedHeight = maxHeight ?? fallbackHeight
00021|   const borderRows = 2
00022|   const contentHeight = Math.max(1, resolvedHeight - borderRows)
00023| 
00024|   const fixedRows = 4 + (hasError ? 1 : 0)
00025|   return Math.max(1, contentHeight - fixedRows)
00026| }
00027| 
00028| const clamp = (value: number, min: number, max: number): number =>
00029|   Math.max(min, Math.min(value, max))
00030| 
00031| const padRight = (value: string, width: number): string => {
00032|   if (width <= 0) {
00033|     return ''
00034|   }
00035| 
00036|   const trimmed = value.length > width ? value.slice(0, width) : value
00037|   if (trimmed.length === width) {
00038|     return trimmed
00039|   }
00040| 
00041|   return `${trimmed}${' '.repeat(width - trimmed.length)}`
00042| }
00043| 
00044| export const ThemePickerPopup = ({
00045|   selectionIndex,
00046|   initialThemeName,
00047|   maxHeight,
00048| }: ThemePickerPopupProps) => {
00049|   const { theme, themes, activeThemeName, error } = useTheme()
00050|   const { stdout } = useStdout()
00051| 
00052|   const terminalColumns = stdout?.columns ?? 80
00053| 
00054|   // Keep the popup reasonably sized and deterministic.
00055|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00056|   const contentWidth = Math.max(10, popupWidth - 2)
00057| 
00058|   const listRows = useMemo(() => resolveListRows(maxHeight, Boolean(error)), [error, maxHeight])
00059| 
00060|   const names = useMemo(() => themes.map((descriptor) => descriptor.name), [themes])
00061|   const labelsByName = useMemo(() => {
00062|     const entries = themes.map((descriptor) => [descriptor.name, descriptor.label] as const)
00063|     return new Map(entries)
00064|   }, [themes])
00065| 
00066|   const initialLabel = labelsByName.get(initialThemeName) ?? initialThemeName
00067| 
00068|   const clampedSelection = Math.min(selectionIndex, Math.max(names.length - 1, 0))
00069| 
00070|   const window = useMemo(
00071|     () =>
00072|       resolveWindowedList({
00073|         itemCount: names.length,
00074|         selectedIndex: clampedSelection,
00075|         maxVisibleRows: listRows,
00076|         lead: 2,
00077|       }),
00078|     [clampedSelection, listRows, names.length],
00079|   )
00080| 
00081|   const selectedTextProps = {
00082|     ...inkColorProps(theme.selectionText),
00083|     ...inkBackgroundColorProps(theme.selectionBackground),
00084|   }
00085| 
00086|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00087| 
00088|   const renderFill = (width: number): string => (width > 0 ? ' '.repeat(width) : '')
00089| 
00090|   const headerLeft = 'Theme'
00091|   const headerRight = 'esc'
00092|   const headerGap = Math.max(0, contentWidth - headerLeft.length - headerRight.length)
00093| 
00094|   const currentLabel = `Current: ${initialLabel}`
00095| 
00096|   const listLines = useMemo((): Array<{ key: string; label: string; isSelected: boolean }> => {
00097|     const lines: Array<{ key: string; label: string; isSelected: boolean }> = []
00098| 
00099|     if (names.length === 0) {
00100|       lines.push({
00101|         key: 'empty',
00102|         label: padRight('No themes loaded.', contentWidth),
00103|         isSelected: false,
00104|       })
00105|       while (lines.length < listRows) {
00106|         lines.push({
00107|           key: `pad-${lines.length}`,
00108|           label: padRight('', contentWidth),
00109|           isSelected: false,
00110|         })
00111|       }
00112|       return lines
00113|     }
00114| 
00115|     if (window.showBefore) {
00116|       lines.push({ key: 'before', label: '… earlier …', isSelected: false })
00117|     }
00118| 
00119|     for (let offset = 0; offset < window.end - window.start; offset += 1) {
00120|       const name = names[window.start + offset]
00121|       if (!name) {
00122|         continue
00123|       }
00124|       const label = labelsByName.get(name) ?? name
00125|       const isActive = name === activeThemeName
00126|       const line = `${isActive ? '●' : ' '} ${label}`
00127|       const isSelected = window.start + offset === clampedSelection
00128|       lines.push({ key: name, label: line, isSelected })
00129|     }
00130| 
00131|     if (window.showAfter) {
00132|       lines.push({ key: 'after', label: '… later …', isSelected: false })
00133|     }
00134| 
00135|     while (lines.length < listRows) {
00136|       lines.push({ key: `pad-${lines.length}`, label: '', isSelected: false })
00137|     }
00138| 
00139|     return lines.map((line) => ({ ...line, label: padRight(line.label, contentWidth) }))
00140|   }, [activeThemeName, clampedSelection, contentWidth, labelsByName, listRows, names, window])
00141| 
00142|   const footer = '↑/↓ preview · Enter confirm · Esc cancel'
00143| 
00144|   return (
00145|     <Box
00146|       flexDirection="column"
00147|       borderStyle="round"
00148|       paddingX={0}
00149|       paddingY={0}
00150|       width={popupWidth}
00151|       {...inkBorderColorProps(theme.border)}
00152|     >
00153|       <Box flexDirection="row">
00154|         <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00155|           {headerLeft}
00156|         </Text>
00157|         <Text {...backgroundProps}>{renderFill(headerGap)}</Text>
00158|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00159|           {headerRight}
00160|         </Text>
00161|       </Box>
00162| 
00163|       <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00164|         {padRight(currentLabel, contentWidth)}
00165|       </Text>
00166| 
00167|       <Box flexDirection="column" marginTop={1}>
00168|         {listLines.map((line) => (
00169|           <Text
00170|             key={line.key}
00171|             {...(line.isSelected
00172|               ? selectedTextProps
00173|               : { ...backgroundProps, ...inkColorProps(theme.text) })}
00174|           >
00175|             {line.label}
00176|           </Text>
00177|         ))}
00178|       </Box>
00179| 
00180|       {error ? (
00181|         <Text {...backgroundProps} {...inkColorProps(theme.error)}>
00182|           {padRight(error.message, contentWidth)}
00183|         </Text>
00184|       ) : null}
00185| 
00186|       <Box marginTop={1}>
00187|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00188|           {padRight(footer, contentWidth)}
00189|         </Text>
00190|       </Box>
00191|     </Box>
00192|   )
00193| }
00194| 

(End of file - total 194 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ThemeModePopup.tsx"
}
```
**Output:**
```
<file>
00001| import { Box, Text, useStdout } from 'ink'
00002| 
00003| import type { ThemeMode } from '../../theme/theme-types'
00004| import { useTheme } from '../../theme/theme-provider'
00005| import {
00006|   inkBackgroundColorProps,
00007|   inkBorderColorProps,
00008|   inkColorProps,
00009| } from '../../theme/theme-types'
00010| 
00011| const clamp = (value: number, min: number, max: number): number =>
00012|   Math.max(min, Math.min(value, max))
00013| 
00014| const padRight = (value: string, width: number): string => {
00015|   if (width <= 0) {
00016|     return ''
00017|   }
00018| 
00019|   const trimmed = value.length > width ? value.slice(0, width) : value
00020|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00021| }
00022| 
00023| export type ThemeModePopupProps = {
00024|   selectionIndex: number
00025|   initialMode: ThemeMode
00026| }
00027| 
00028| const OPTIONS: readonly ThemeMode[] = ['system', 'dark', 'light']
00029| 
00030| const formatMode = (mode: ThemeMode): string => {
00031|   if (mode === 'system') {
00032|     return 'System'
00033|   }
00034|   return mode.charAt(0).toUpperCase() + mode.slice(1)
00035| }
00036| 
00037| export const ThemeModePopup = ({ selectionIndex, initialMode }: ThemeModePopupProps) => {
00038|   const { theme, mode, error } = useTheme()
00039|   const { stdout } = useStdout()
00040| 
00041|   const terminalColumns = stdout?.columns ?? 80
00042|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00043| 
00044|   const borderColumns = 2
00045|   const paddingColumns = 2
00046|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00047| 
00048|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00049| 
00050|   const selected = Math.min(selectionIndex, OPTIONS.length - 1)
00051| 
00052|   return (
00053|     <Box
00054|       flexDirection="column"
00055|       borderStyle="round"
00056|       paddingX={1}
00057|       paddingY={0}
00058|       width={popupWidth}
00059|       {...inkBorderColorProps(theme.border)}
00060|       {...backgroundProps}
00061|     >
00062|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00063|         {padRight('Theme Mode', contentWidth)}
00064|       </Text>
00065|       <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00066|         {padRight(
00067|           `Current: ${formatMode(initialMode)} · Active: ${formatMode(mode)}`,
00068|           contentWidth,
00069|         )}
00070|       </Text>
00071|       <Box flexDirection="column" marginTop={1}>
00072|         {OPTIONS.map((option, index) => {
00073|           const isSelected = index === selected
00074| 
00075|           const textProps = isSelected
00076|             ? {
00077|                 ...inkColorProps(theme.selectionText),
00078|                 ...inkBackgroundColorProps(theme.selectionBackground),
00079|               }
00080|             : { ...backgroundProps, ...inkColorProps(theme.text) }
00081| 
00082|           return (
00083|             <Text key={option} {...textProps}>
00084|               {padRight(formatMode(option), contentWidth)}
00085|             </Text>
00086|           )
00087|         })}
00088|       </Box>
00089|       {error ? (
00090|         <Text {...backgroundProps} {...inkColorProps(theme.error)}>
00091|           {padRight(error.message, contentWidth)}
00092|         </Text>
00093|       ) : null}
00094|       <Box marginTop={1}>
00095|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00096|           {padRight('↑/↓ select · Enter apply · Esc close', contentWidth)}
00097|         </Text>
00098|       </Box>
00099|     </Box>
00100|   )
00101| }
00102| 
00103| export const THEME_MODE_OPTIONS = OPTIONS
00104| 

(End of file - total 104 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/SettingsPopup.tsx"
}
```
**Output:**
```
<file>
00001| import { useMemo } from 'react'
00002| import { Box, Text, useStdout } from 'ink'
00003| 
00004| import { resolveIndicatorSegments, type IndicatorSegment } from '../core/status-indicators-layout'
00005| import { useTheme } from '../../theme/theme-provider'
00006| import {
00007|   inkBackgroundColorProps,
00008|   inkBorderColorProps,
00009|   inkColorProps,
00010| } from '../../theme/theme-types'
00011| import type { InkColorValue } from '../../theme/theme-types'
00012| 
00013| const clamp = (value: number, min: number, max: number): number =>
00014|   Math.max(min, Math.min(value, max))
00015| 
00016| const padRight = (value: string, width: number): string => {
00017|   if (width <= 0) {
00018|     return ''
00019|   }
00020| 
00021|   const trimmed = value.length > width ? value.slice(0, width) : value
00022|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00023| }
00024| 
00025| export type SettingsPopupProps = {
00026|   chips: readonly string[]
00027| }
00028| 
00029| const resolveSegmentLabel = (segment: IndicatorSegment): string => segment.label
00030| 
00031| export const SettingsPopup = ({ chips }: SettingsPopupProps) => {
00032|   const { theme } = useTheme()
00033|   const { stdout } = useStdout()
00034|   const segments = useMemo(() => resolveIndicatorSegments(chips), [chips])
00035| 
00036|   const terminalColumns = stdout?.columns ?? 80
00037|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00038| 
00039|   const borderColumns = 2
00040|   const paddingColumns = 2
00041|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00042| 
00043|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00044| 
00045|   const resolveSegmentColor = (segment: IndicatorSegment): InkColorValue => {
00046|     switch (segment.style) {
00047|       case 'success':
00048|         return theme.success
00049|       case 'warning':
00050|         return theme.warning
00051|       case 'danger':
00052|         return theme.error
00053|       case 'primary':
00054|         return theme.text
00055|       case 'muted':
00056|       default:
00057|         return theme.mutedText
00058|     }
00059|   }
00060| 
00061|   return (
00062|     <Box
00063|       flexDirection="column"
00064|       borderStyle="round"
00065|       paddingX={1}
00066|       paddingY={0}
00067|       width={popupWidth}
00068|       {...inkBorderColorProps(theme.border)}
00069|       {...backgroundProps}
00070|     >
00071|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00072|         {padRight('Current Settings', contentWidth)}
00073|       </Text>
00074|       <Box marginTop={1} flexDirection="column">
00075|         {segments.length === 0 ? (
00076|           <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00077|             {padRight('No settings available yet.', contentWidth)}
00078|           </Text>
00079|         ) : (
00080|           segments.map((segment) => {
00081|             const label = `${resolveSegmentLabel(segment)}: `
00082|             const value = segment.value
00083|             const remaining = Math.max(0, contentWidth - label.length - value.length)
00084| 
00085|             return (
00086|               <Box key={segment.id} flexDirection="row">
00087|                 <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00088|                   {label}
00089|                 </Text>
00090|                 <Text {...backgroundProps} {...inkColorProps(resolveSegmentColor(segment))}>
00091|                   {value}
00092|                 </Text>
00093|                 <Text {...backgroundProps}>{' '.repeat(remaining)}</Text>
00094|               </Box>
00095|             )
00096|           })
00097|         )}
00098|       </Box>
00099|       <Box marginTop={1}>
00100|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00101|           {padRight('Esc to close', contentWidth)}
00102|         </Text>
00103|       </Box>
00104|     </Box>
00105|   )
00106| }
00107| 

(End of file - total 107 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/TokenUsagePopup.tsx"
}
```
**Output:**
```
<file>
00001| import { Box, Text, useStdout } from 'ink'
00002| 
00003| import type { TokenUsageBreakdown, TokenUsageRun } from '../../token-usage-store'
00004| import { useTheme } from '../../theme/theme-provider'
00005| import {
00006|   inkBackgroundColorProps,
00007|   inkBorderColorProps,
00008|   inkColorProps,
00009| } from '../../theme/theme-types'
00010| 
00011| const formatNumber = (value: number): string => value.toLocaleString('en-US')
00012| 
00013| const clamp = (value: number, min: number, max: number): number =>
00014|   Math.max(min, Math.min(value, max))
00015| 
00016| const padRight = (value: string, width: number): string => {
00017|   if (width <= 0) {
00018|     return ''
00019|   }
00020| 
00021|   const trimmed = value.length > width ? value.slice(0, width) : value
00022|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00023| }
00024| 
00025| const formatUsd = (value: number | null): string => {
00026|   if (value === null) {
00027|     return 'n/a'
00028|   }
00029|   if (value === 0) {
00030|     return '$0.00'
00031|   }
00032|   if (value < 0.01) {
00033|     return `$${value.toFixed(4)}`
00034|   }
00035|   return `$${value.toFixed(2)}`
00036| }
00037| 
00038| const padCell = (value: string, width: number, align: 'left' | 'right'): string => {
00039|   if (value.length >= width) {
00040|     return value
00041|   }
00042|   const padding = ' '.repeat(width - value.length)
00043|   return align === 'right' ? `${padding}${value}` : `${value}${padding}`
00044| }
00045| 
00046| type Row = {
00047|   label: string
00048|   tokens: number
00049| }
00050| 
00051| const renderTable = (rows: readonly Row[]): string[] => {
00052|   const labelWidth = Math.max(12, ...rows.map((row) => row.label.length))
00053|   const tokenWidth = Math.max(8, ...rows.map((row) => formatNumber(row.tokens).length))
00054| 
00055|   return rows.map((row) => {
00056|     const label = padCell(row.label, labelWidth, 'left')
00057|     const tokens = padCell(formatNumber(row.tokens), tokenWidth, 'right')
00058|     return `${label}  ${tokens}`
00059|   })
00060| }
00061| 
00062| export type TokenUsagePopupProps = {
00063|   run: TokenUsageRun | null
00064|   breakdown: TokenUsageBreakdown | null
00065| }
00066| 
00067| export const TokenUsagePopup = ({ run, breakdown }: TokenUsagePopupProps) => {
00068|   const { theme } = useTheme()
00069|   const { stdout } = useStdout()
00070| 
00071|   const terminalColumns = stdout?.columns ?? 80
00072|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00073| 
00074|   const borderColumns = 2
00075|   const paddingColumns = 2
00076|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00077| 
00078|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00079| 
00080|   if (!run || !breakdown) {
00081|     return (
00082|       <Box
00083|         flexDirection="column"
00084|         borderStyle="round"
00085|         paddingX={1}
00086|         paddingY={0}
00087|         width={popupWidth}
00088|         {...inkBorderColorProps(theme.border)}
00089|         {...backgroundProps}
00090|       >
00091|         <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00092|           {padRight('Token Usage', contentWidth)}
00093|         </Text>
00094|         <Box marginTop={1}>
00095|           <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00096|             {padRight('No token usage recorded yet. Run generation first.', contentWidth)}
00097|           </Text>
00098|         </Box>
00099|         <Box marginTop={1}>
00100|           <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00101|             {padRight('Esc to close', contentWidth)}
00102|           </Text>
00103|         </Box>
00104|       </Box>
00105|     )
00106|   }
00107| 
00108|   const inputRows = renderTable([
00109|     { label: 'Intent', tokens: breakdown.input.intent },
00110|     { label: 'Files', tokens: breakdown.input.files },
00111|     { label: 'System', tokens: breakdown.input.system },
00112|     { label: 'Input total', tokens: breakdown.input.total },
00113|   ])
00114| 
00115|   const outputRows = renderTable([
00116|     { label: 'Reasoning', tokens: breakdown.output.reasoning },
00117|     { label: 'Final prompt', tokens: breakdown.output.prompt },
00118|     { label: 'Output total', tokens: breakdown.output.total },
00119|   ])
00120| 
00121|   return (
00122|     <Box
00123|       flexDirection="column"
00124|       borderStyle="round"
00125|       paddingX={1}
00126|       paddingY={0}
00127|       width={popupWidth}
00128|       {...inkBorderColorProps(theme.border)}
00129|       {...backgroundProps}
00130|     >
00131|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00132|         {padRight('Token Usage', contentWidth)}
00133|       </Text>
00134|       <Box marginTop={1} flexDirection="column">
00135|         <Text {...backgroundProps} {...inkColorProps(theme.text)}>
00136|           {padRight(`Model: ${run.model}`, contentWidth)}
00137|         </Text>
00138|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00139|           {padRight(`Started: ${run.startedAt}`, contentWidth)}
00140|         </Text>
00141|       </Box>
00142| 
00143|       <Box marginTop={1} flexDirection="column">
00144|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00145|           {padRight('Input', contentWidth)}
00146|         </Text>
00147|         {inputRows.map((line) => (
00148|           <Text key={`input-${line}`} {...backgroundProps} {...inkColorProps(theme.text)}>
00149|             {padRight(line, contentWidth)}
00150|           </Text>
00151|         ))}
00152|       </Box>
00153| 
00154|       <Box marginTop={1} flexDirection="column">
00155|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00156|           {padRight('Output', contentWidth)}
00157|         </Text>
00158|         {outputRows.map((line) => (
00159|           <Text key={`output-${line}`} {...backgroundProps} {...inkColorProps(theme.text)}>
00160|             {padRight(line, contentWidth)}
00161|           </Text>
00162|         ))}
00163|       </Box>
00164| 
00165|       <Box marginTop={1} flexDirection="column">
00166|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00167|           {padRight('Totals', contentWidth)}
00168|         </Text>
00169|         <Text {...backgroundProps} {...inkColorProps(theme.text)}>
00170|           {padRight(`Total tokens ${formatNumber(breakdown.totals.tokens)}`, contentWidth)}
00171|         </Text>
00172|         <Text {...backgroundProps} {...inkColorProps(theme.text)}>
00173|           {padRight(`Estimated cost ${formatUsd(breakdown.totals.estimatedCostUsd)}`, contentWidth)}
00174|         </Text>
00175|       </Box>
00176| 
00177|       <Box marginTop={1}>
00178|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00179|           {padRight('Esc to close', contentWidth)}
00180|         </Text>
00181|       </Box>
00182|     </Box>
00183|   )
00184| }
00185| 

(End of file - total 185 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/ReasoningPopup.tsx"
}
```
**Output:**
```
<file>
00001| import { Box, Text, useStdout } from 'ink'
00002| 
00003| import { ScrollableOutput } from '../core/ScrollableOutput'
00004| import { useTheme } from '../../theme/theme-provider'
00005| import {
00006|   inkBackgroundColorProps,
00007|   inkBorderColorProps,
00008|   inkColorProps,
00009| } from '../../theme/theme-types'
00010| import type { HistoryEntry } from '../../types'
00011| 
00012| const clamp = (value: number, min: number, max: number): number =>
00013|   Math.max(min, Math.min(value, max))
00014| 
00015| const padRight = (value: string, width: number): string => {
00016|   if (width <= 0) {
00017|     return ''
00018|   }
00019| 
00020|   const trimmed = value.length > width ? value.slice(0, width) : value
00021|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00022| }
00023| 
00024| export type ReasoningPopupProps = {
00025|   lines: readonly HistoryEntry[]
00026|   visibleRows: number
00027|   scrollOffset: number
00028| }
00029| 
00030| export const ReasoningPopup = ({ lines, visibleRows, scrollOffset }: ReasoningPopupProps) => {
00031|   const { theme } = useTheme()
00032|   const { stdout } = useStdout()
00033| 
00034|   const terminalColumns = stdout?.columns ?? 80
00035|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00036| 
00037|   const borderColumns = 2
00038|   const paddingColumns = 2
00039|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00040| 
00041|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00042| 
00043|   if (lines.length === 0) {
00044|     return (
00045|       <Box
00046|         flexDirection="column"
00047|         borderStyle="round"
00048|         paddingX={1}
00049|         paddingY={0}
00050|         width={popupWidth}
00051|         {...inkBorderColorProps(theme.border)}
00052|         {...backgroundProps}
00053|       >
00054|         <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00055|           {padRight('Model Reasoning', contentWidth)}
00056|         </Text>
00057|         <Box marginTop={1}>
00058|           <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00059|             {padRight('No reasoning recorded yet. Run generation first.', contentWidth)}
00060|           </Text>
00061|         </Box>
00062|         <Box marginTop={1}>
00063|           <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00064|             {padRight('Esc to close', contentWidth)}
00065|           </Text>
00066|         </Box>
00067|       </Box>
00068|     )
00069|   }
00070| 
00071|   return (
00072|     <Box
00073|       flexDirection="column"
00074|       borderStyle="round"
00075|       paddingX={1}
00076|       paddingY={0}
00077|       width={popupWidth}
00078|       {...inkBorderColorProps(theme.border)}
00079|       {...backgroundProps}
00080|     >
00081|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00082|         {padRight('Model Reasoning', contentWidth)}
00083|       </Text>
00084|       <Box marginTop={1} flexDirection="column" height={visibleRows} overflow="hidden">
00085|         <ScrollableOutput
00086|           lines={lines}
00087|           visibleRows={visibleRows}
00088|           scrollOffset={scrollOffset}
00089|           contentWidth={contentWidth}
00090|           backgroundColor={theme.popupBackground}
00091|         />
00092|       </Box>
00093|       <Box marginTop={1}>
00094|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00095|           {padRight('↑/↓ scroll · PgUp/PgDn · Esc to close', contentWidth)}
00096|         </Text>
00097|       </Box>
00098|     </Box>
00099|   )
00100| }
00101| 

(End of file - total 101 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/TogglePopup.tsx"
}
```
**Output:**
```
<file>
00001| import { Box, Text, useStdout } from 'ink'
00002| 
00003| import { TOGGLE_LABELS } from '../../config'
00004| import type { ToggleField } from '../../types'
00005| import { useTheme } from '../../theme/theme-provider'
00006| import {
00007|   inkBackgroundColorProps,
00008|   inkBorderColorProps,
00009|   inkColorProps,
00010| } from '../../theme/theme-types'
00011| 
00012| const clamp = (value: number, min: number, max: number): number =>
00013|   Math.max(min, Math.min(value, max))
00014| 
00015| const padRight = (value: string, width: number): string => {
00016|   if (width <= 0) {
00017|     return ''
00018|   }
00019| 
00020|   const trimmed = value.length > width ? value.slice(0, width) : value
00021|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00022| }
00023| 
00024| export type TogglePopupProps = {
00025|   field: ToggleField
00026|   selectionIndex: number
00027| }
00028| 
00029| export const TogglePopup = ({ field, selectionIndex }: TogglePopupProps) => {
00030|   const { theme } = useTheme()
00031|   const { stdout } = useStdout()
00032| 
00033|   const terminalColumns = stdout?.columns ?? 80
00034|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00035| 
00036|   const borderColumns = 2
00037|   const paddingColumns = 2
00038|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00039| 
00040|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00041| 
00042|   const options = ['On', 'Off']
00043| 
00044|   return (
00045|     <Box
00046|       flexDirection="column"
00047|       borderStyle="round"
00048|       paddingX={1}
00049|       paddingY={0}
00050|       width={popupWidth}
00051|       {...inkBorderColorProps(theme.border)}
00052|       {...backgroundProps}
00053|     >
00054|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00055|         {padRight(`${TOGGLE_LABELS[field]} Setting`, contentWidth)}
00056|       </Text>
00057|       <Box flexDirection="column" marginTop={1}>
00058|         {options.map((label, index) => {
00059|           const isSelected = index === selectionIndex
00060|           const textProps = isSelected
00061|             ? {
00062|                 ...inkColorProps(theme.selectionText),
00063|                 ...inkBackgroundColorProps(theme.selectionBackground),
00064|               }
00065|             : { ...backgroundProps, ...inkColorProps(theme.text) }
00066| 
00067|           return (
00068|             <Text key={label} {...textProps}>
00069|               {padRight(label, contentWidth)}
00070|             </Text>
00071|           )
00072|         })}
00073|       </Box>
00074|       <Box marginTop={1}>
00075|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00076|           {padRight('Use arrows to select · Enter to confirm · Esc to cancel', contentWidth)}
00077|         </Text>
00078|       </Box>
00079|     </Box>
00080|   )
00081| }
00082| 

(End of file - total 82 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/SmartPopup.tsx"
}
```
**Output:**
```
<file>
00001| import { useMemo, type ComponentProps } from 'react'
00002| import { Box, Text, useStdout } from 'ink'
00003| 
00004| import { SingleLineTextInput } from '../core/SingleLineTextInput'
00005| import { useTheme } from '../../theme/theme-provider'
00006| import {
00007|   inkBackgroundColorProps,
00008|   inkBorderColorProps,
00009|   inkColorProps,
00010| } from '../../theme/theme-types'
00011| import { resolveWindowedList } from './list-window'
00012| 
00013| const clamp = (value: number, min: number, max: number): number =>
00014|   Math.max(min, Math.min(value, max))
00015| 
00016| const padRight = (value: string, width: number): string => {
00017|   if (width <= 0) {
00018|     return ''
00019|   }
00020| 
00021|   const trimmed = value.length > width ? value.slice(0, width) : value
00022|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00023| }
00024| 
00025| export type SmartPopupProps = {
00026|   savedRoot: string | null
00027|   draft: string
00028|   suggestedItems: readonly string[]
00029|   suggestedSelectionIndex: number
00030|   suggestedFocused: boolean
00031|   maxHeight?: number
00032|   onDraftChange: (value: string) => void
00033|   onSubmitRoot: (value: string) => void
00034| }
00035| 
00036| type SuggestionWindow = {
00037|   start: number
00038|   values: readonly string[]
00039|   showBefore: boolean
00040|   showAfter: boolean
00041| }
00042| 
00043| const resolveSuggestionWindow = (
00044|   suggestions: readonly string[],
00045|   selectedIndex: number,
00046|   maxRows: number,
00047| ): SuggestionWindow => {
00048|   if (suggestions.length === 0 || maxRows <= 0) {
00049|     return { start: 0, values: [], showBefore: false, showAfter: false }
00050|   }
00051| 
00052|   const window = resolveWindowedList({
00053|     itemCount: suggestions.length,
00054|     selectedIndex,
00055|     maxVisibleRows: maxRows,
00056|     lead: 1,
00057|   })
00058| 
00059|   return {
00060|     start: window.start,
00061|     values: suggestions.slice(window.start, window.end),
00062|     showBefore: window.showBefore,
00063|     showAfter: window.showAfter,
00064|   }
00065| }
00066| 
00067| export const SmartPopup = ({
00068|   savedRoot,
00069|   draft,
00070|   suggestedItems,
00071|   suggestedSelectionIndex,
00072|   suggestedFocused,
00073|   maxHeight,
00074|   onDraftChange,
00075|   onSubmitRoot,
00076| }: SmartPopupProps) => {
00077|   const { theme } = useTheme()
00078|   const { stdout } = useStdout()
00079| 
00080|   const terminalColumns = stdout?.columns ?? 80
00081|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00082| 
00083|   const borderColumns = 2
00084|   const paddingColumns = 2
00085|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00086| 
00087|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00088| 
00089|   const hasSuggestions = suggestedItems.length > 0
00090|   const safeSuggestedSelection = Math.max(
00091|     0,
00092|     Math.min(suggestedSelectionIndex, Math.max(suggestedItems.length - 1, 0)),
00093|   )
00094|   const effectiveSuggestedFocused = hasSuggestions && suggestedFocused
00095| 
00096|   const suggestionRows = useMemo(() => {
00097|     const borderRows = 2
00098|     const resolvedHeight = maxHeight ?? 9
00099|     const contentRows = Math.max(1, resolvedHeight - borderRows)
00100| 
00101|     const fixedRows = 5
00102|     return Math.max(0, contentRows - fixedRows)
00103|   }, [maxHeight])
00104| 
00105|   const visibleSuggestions = useMemo(
00106|     () => resolveSuggestionWindow(suggestedItems, safeSuggestedSelection, suggestionRows),
00107|     [safeSuggestedSelection, suggestedItems, suggestionRows],
00108|   )
00109| 
00110|   const savedLabel = savedRoot ? savedRoot : '(none)'
00111| 
00112|   const focusedSelectionProps = {
00113|     ...inkColorProps(theme.selectionText),
00114|     ...inkBackgroundColorProps(theme.selectionBackground),
00115|   }
00116| 
00117|   const unfocusedSelectionProps = {
00118|     ...inkColorProps(theme.chipText),
00119|     ...inkBackgroundColorProps(theme.chipBackground),
00120|   }
00121| 
00122|   const suggestionLines = useMemo(() => {
00123|     const lines: Array<{ key: string; label: string; props: ComponentProps<typeof Text> }> = []
00124| 
00125|     if (!hasSuggestions) {
00126|       lines.push({
00127|         key: 'empty',
00128|         label: '(type to filter)',
00129|         props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
00130|       })
00131|     } else {
00132|       if (visibleSuggestions.showBefore) {
00133|         lines.push({
00134|           key: 'before',
00135|           label: '… earlier …',
00136|           props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
00137|         })
00138|       }
00139| 
00140|       visibleSuggestions.values.forEach((value, index) => {
00141|         const actualIndex = visibleSuggestions.start + index
00142|         const isSelected = actualIndex === safeSuggestedSelection
00143|         const textProps = isSelected
00144|           ? effectiveSuggestedFocused
00145|             ? focusedSelectionProps
00146|             : unfocusedSelectionProps
00147|           : { ...backgroundProps, ...inkColorProps(theme.text) }
00148| 
00149|         lines.push({ key: `${value}-${actualIndex}`, label: value, props: textProps })
00150|       })
00151| 
00152|       if (visibleSuggestions.showAfter) {
00153|         lines.push({
00154|           key: 'after',
00155|           label: '… later …',
00156|           props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
00157|         })
00158|       }
00159|     }
00160| 
00161|     while (lines.length < suggestionRows) {
00162|       lines.push({ key: `pad-${lines.length}`, label: '', props: backgroundProps })
00163|     }
00164| 
00165|     return lines
00166|   }, [
00167|     backgroundProps,
00168|     effectiveSuggestedFocused,
00169|     focusedSelectionProps,
00170|     hasSuggestions,
00171|     safeSuggestedSelection,
00172|     suggestionRows,
00173|     theme.mutedText,
00174|     theme.text,
00175|     unfocusedSelectionProps,
00176|     visibleSuggestions.showAfter,
00177|     visibleSuggestions.showBefore,
00178|     visibleSuggestions.start,
00179|     visibleSuggestions.values,
00180|   ])
00181| 
00182|   const rootLabel = 'Root: '
00183|   const inputWidth = Math.max(1, contentWidth - rootLabel.length)
00184| 
00185|   return (
00186|     <Box
00187|       flexDirection="column"
00188|       borderStyle="round"
00189|       paddingX={1}
00190|       paddingY={0}
00191|       width={popupWidth}
00192|       {...inkBorderColorProps(theme.border)}
00193|       {...backgroundProps}
00194|       {...(typeof maxHeight === 'number' ? { height: maxHeight } : {})}
00195|       overflow="hidden"
00196|     >
00197|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00198|         {padRight('Smart Context Root', contentWidth)}
00199|       </Text>
00200|       <Text {...backgroundProps} {...inkColorProps(theme.text)}>
00201|         {padRight('Enter to save · Tab suggestions · Esc close', contentWidth)}
00202|       </Text>
00203| 
00204|       <Box flexDirection="row">
00205|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00206|           {rootLabel}
00207|         </Text>
00208|         <SingleLineTextInput
00209|           value={draft}
00210|           onChange={onDraftChange}
00211|           onSubmit={onSubmitRoot}
00212|           placeholder="relative/dir"
00213|           focus={!effectiveSuggestedFocused}
00214|           width={inputWidth}
00215|           backgroundColor={theme.popupBackground}
00216|         />
00217|       </Box>
00218| 
00219|       <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00220|         {padRight(`Saved root: ${savedLabel}`, contentWidth)}
00221|       </Text>
00222| 
00223|       <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00224|         {padRight('Suggestions', contentWidth)}
00225|       </Text>
00226| 
00227|       {suggestionRows > 0 ? (
00228|         <Box flexDirection="column" height={suggestionRows} flexShrink={0} overflow="hidden">
00229|           {suggestionLines.map((line) => (
00230|             <Text key={line.key} {...line.props}>
00231|               {padRight(line.label, contentWidth)}
00232|             </Text>
00233|           ))}
00234|         </Box>
00235|       ) : null}
00236|     </Box>
00237|   )
00238| }
00239| 

(End of file - total 239 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/SeriesIntentPopup.tsx"
}
```
**Output:**
```
<file>
00001| import { Box, Text, useStdout } from 'ink'
00002| 
00003| import { SingleLineTextInput } from '../core/SingleLineTextInput'
00004| import { useTheme } from '../../theme/theme-provider'
00005| import {
00006|   inkBackgroundColorProps,
00007|   inkBorderColorProps,
00008|   inkColorProps,
00009| } from '../../theme/theme-types'
00010| 
00011| const clamp = (value: number, min: number, max: number): number =>
00012|   Math.max(min, Math.min(value, max))
00013| 
00014| const padRight = (value: string, width: number): string => {
00015|   if (width <= 0) {
00016|     return ''
00017|   }
00018| 
00019|   const trimmed = value.length > width ? value.slice(0, width) : value
00020|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00021| }
00022| 
00023| export type SeriesIntentPopupProps = {
00024|   draft: string
00025|   hint?: string | undefined
00026|   isRunning: boolean
00027|   onDraftChange: (value: string) => void
00028|   onSubmitDraft: (value: string) => void
00029| }
00030| 
00031| export const SeriesIntentPopup = ({
00032|   draft,
00033|   hint,
00034|   isRunning,
00035|   onDraftChange,
00036|   onSubmitDraft,
00037| }: SeriesIntentPopupProps) => {
00038|   const { theme } = useTheme()
00039|   const { stdout } = useStdout()
00040| 
00041|   const terminalColumns = stdout?.columns ?? 80
00042|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00043| 
00044|   const borderColumns = 2
00045|   const paddingColumns = 2
00046|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00047| 
00048|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00049| 
00050|   const hintLines = hint
00051|     ? [hint, 'Draft may come from typed text, last run, or the intent file.']
00052|     : ['Draft may come from typed text, last run, or the intent file.']
00053| 
00054|   return (
00055|     <Box
00056|       flexDirection="column"
00057|       borderStyle="round"
00058|       paddingX={1}
00059|       paddingY={0}
00060|       width={popupWidth}
00061|       {...inkBorderColorProps(theme.border)}
00062|       {...backgroundProps}
00063|     >
00064|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00065|         {padRight('Series Intent', contentWidth)}
00066|       </Text>
00067|       <Box flexDirection="column" marginTop={1}>
00068|         {hintLines.map((line) => (
00069|           <Text key={line} {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00070|             {padRight(line, contentWidth)}
00071|           </Text>
00072|         ))}
00073|         <SingleLineTextInput
00074|           value={draft}
00075|           onChange={onDraftChange}
00076|           onSubmit={() => onSubmitDraft(draft)}
00077|           placeholder="Describe the project to plan"
00078|           focus
00079|           width={contentWidth}
00080|           backgroundColor={theme.popupBackground}
00081|         />
00082|       </Box>
00083|       <Box marginTop={1}>
00084|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00085|           {padRight(
00086|             isRunning ? 'Series run in progress… please wait' : 'Enter runs series · Esc closes',
00087|             contentWidth,
00088|           )}
00089|         </Text>
00090|       </Box>
00091|     </Box>
00092|   )
00093| }
00094| 

(End of file - total 94 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/TestPopup.tsx"
}
```
**Output:**
```
<file>
00001| import { Box, Text, useStdout } from 'ink'
00002| 
00003| import { SingleLineTextInput } from '../core/SingleLineTextInput'
00004| import { useTheme } from '../../theme/theme-provider'
00005| import {
00006|   inkBackgroundColorProps,
00007|   inkBorderColorProps,
00008|   inkColorProps,
00009| } from '../../theme/theme-types'
00010| 
00011| const clamp = (value: number, min: number, max: number): number =>
00012|   Math.max(min, Math.min(value, max))
00013| 
00014| const padRight = (value: string, width: number): string => {
00015|   if (width <= 0) {
00016|     return ''
00017|   }
00018| 
00019|   const trimmed = value.length > width ? value.slice(0, width) : value
00020|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00021| }
00022| 
00023| export type TestPopupProps = {
00024|   draft: string
00025|   isRunning: boolean
00026|   onDraftChange: (value: string) => void
00027|   onSubmitDraft: (value: string) => void
00028| }
00029| 
00030| export const TestPopup = ({ draft, isRunning, onDraftChange, onSubmitDraft }: TestPopupProps) => {
00031|   const { theme } = useTheme()
00032|   const { stdout } = useStdout()
00033| 
00034|   const terminalColumns = stdout?.columns ?? 80
00035|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00036| 
00037|   const borderColumns = 2
00038|   const paddingColumns = 2
00039|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00040| 
00041|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00042| 
00043|   return (
00044|     <Box
00045|       flexDirection="column"
00046|       borderStyle="round"
00047|       paddingX={1}
00048|       paddingY={0}
00049|       width={popupWidth}
00050|       {...inkBorderColorProps(theme.border)}
00051|       {...backgroundProps}
00052|     >
00053|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00054|         {padRight('Prompt Tests', contentWidth)}
00055|       </Text>
00056|       <Box flexDirection="column" marginTop={1}>
00057|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00058|           {padRight('Suite path (Enter to run; blank uses prompt-tests.yaml)', contentWidth)}
00059|         </Text>
00060|         <SingleLineTextInput
00061|           value={draft}
00062|           onChange={onDraftChange}
00063|           onSubmit={() => onSubmitDraft(draft)}
00064|           placeholder="prompt-tests.yaml"
00065|           focus
00066|           width={contentWidth}
00067|           backgroundColor={theme.popupBackground}
00068|         />
00069|       </Box>
00070|       <Box marginTop={1}>
00071|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00072|           {padRight(
00073|             isRunning ? 'Tests running… please wait' : 'Enter to start tests · Esc to close',
00074|             contentWidth,
00075|           )}
00076|         </Text>
00077|       </Box>
00078|     </Box>
00079|   )
00080| }
00081| 

(End of file - total 81 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/components/popups/IntentFilePopup.tsx"
}
```
**Output:**
```
<file>
00001| import { useMemo, type ComponentProps } from 'react'
00002| import { Box, Text, useStdout } from 'ink'
00003| 
00004| import { SingleLineTextInput } from '../core/SingleLineTextInput'
00005| import { useTheme } from '../../theme/theme-provider'
00006| import {
00007|   inkBackgroundColorProps,
00008|   inkBorderColorProps,
00009|   inkColorProps,
00010| } from '../../theme/theme-types'
00011| import { resolveWindowedList } from './list-window'
00012| 
00013| const clamp = (value: number, min: number, max: number): number =>
00014|   Math.max(min, Math.min(value, max))
00015| 
00016| const padRight = (value: string, width: number): string => {
00017|   if (width <= 0) {
00018|     return ''
00019|   }
00020| 
00021|   const trimmed = value.length > width ? value.slice(0, width) : value
00022|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00023| }
00024| 
00025| export type IntentFilePopupProps = {
00026|   draft: string
00027|   suggestions: readonly string[]
00028|   suggestedSelectionIndex: number
00029|   suggestedFocused: boolean
00030|   maxHeight?: number
00031|   onDraftChange: (value: string) => void
00032|   onSubmitDraft: (value: string) => void
00033| }
00034| 
00035| type VisibleSuggestions = {
00036|   start: number
00037|   values: readonly string[]
00038|   showBefore: boolean
00039|   showAfter: boolean
00040| }
00041| 
00042| const resolveSuggestionWindow = (
00043|   suggestions: readonly string[],
00044|   selectedIndex: number,
00045|   maxRows: number,
00046| ): VisibleSuggestions => {
00047|   if (suggestions.length === 0 || maxRows <= 0) {
00048|     return { start: 0, values: [], showBefore: false, showAfter: false }
00049|   }
00050| 
00051|   const window = resolveWindowedList({
00052|     itemCount: suggestions.length,
00053|     selectedIndex,
00054|     maxVisibleRows: maxRows,
00055|     lead: 1,
00056|   })
00057| 
00058|   return {
00059|     start: window.start,
00060|     values: suggestions.slice(window.start, window.end),
00061|     showBefore: window.showBefore,
00062|     showAfter: window.showAfter,
00063|   }
00064| }
00065| 
00066| export const IntentFilePopup = ({
00067|   draft,
00068|   suggestions,
00069|   suggestedSelectionIndex,
00070|   suggestedFocused,
00071|   maxHeight,
00072|   onDraftChange,
00073|   onSubmitDraft,
00074| }: IntentFilePopupProps) => {
00075|   const { theme } = useTheme()
00076|   const { stdout } = useStdout()
00077| 
00078|   const terminalColumns = stdout?.columns ?? 80
00079|   const popupWidth = clamp(terminalColumns - 10, 40, 72)
00080| 
00081|   const borderColumns = 2
00082|   const paddingColumns = 2
00083|   const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
00084| 
00085|   const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
00086| 
00087|   const resolvedHeight = maxHeight ?? 9
00088| 
00089|   const suggestionRows = useMemo(() => {
00090|     const borderRows = 2
00091|     const contentRows = Math.max(1, resolvedHeight - borderRows)
00092|     const fixedRows = 3
00093|     return Math.max(0, contentRows - fixedRows)
00094|   }, [resolvedHeight])
00095| 
00096|   const hasSuggestions = suggestions.length > 0
00097| 
00098|   const safeSuggestedSelection = Math.max(
00099|     0,
00100|     Math.min(suggestedSelectionIndex, Math.max(suggestions.length - 1, 0)),
00101|   )
00102| 
00103|   const effectiveSuggestedFocused = hasSuggestions && suggestedFocused
00104| 
00105|   const visibleSuggestions = useMemo(
00106|     () => resolveSuggestionWindow(suggestions, safeSuggestedSelection, suggestionRows),
00107|     [safeSuggestedSelection, suggestions, suggestionRows],
00108|   )
00109| 
00110|   const focusedSelectionProps = {
00111|     ...inkColorProps(theme.selectionText),
00112|     ...inkBackgroundColorProps(theme.selectionBackground),
00113|   }
00114| 
00115|   const unfocusedSelectionProps = {
00116|     ...inkColorProps(theme.chipText),
00117|     ...inkBackgroundColorProps(theme.chipBackground),
00118|   }
00119| 
00120|   const suggestionLines = useMemo(() => {
00121|     const lines: Array<{ key: string; label: string; props: ComponentProps<typeof Text> }> = []
00122| 
00123|     if (!hasSuggestions) {
00124|       lines.push({
00125|         key: 'empty',
00126|         label: '(type to search)',
00127|         props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
00128|       })
00129|     } else {
00130|       if (visibleSuggestions.showBefore) {
00131|         lines.push({
00132|           key: 'before',
00133|           label: '… earlier …',
00134|           props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
00135|         })
00136|       }
00137| 
00138|       visibleSuggestions.values.forEach((value, index) => {
00139|         const actualIndex = visibleSuggestions.start + index
00140|         const isSelected = actualIndex === safeSuggestedSelection
00141|         const textProps = isSelected
00142|           ? effectiveSuggestedFocused
00143|             ? focusedSelectionProps
00144|             : unfocusedSelectionProps
00145|           : { ...backgroundProps, ...inkColorProps(theme.text) }
00146| 
00147|         lines.push({ key: `${value}-${actualIndex}`, label: value, props: textProps })
00148|       })
00149| 
00150|       if (visibleSuggestions.showAfter) {
00151|         lines.push({
00152|           key: 'after',
00153|           label: '… later …',
00154|           props: { ...backgroundProps, ...inkColorProps(theme.mutedText) },
00155|         })
00156|       }
00157|     }
00158| 
00159|     while (lines.length < suggestionRows) {
00160|       lines.push({ key: `pad-${lines.length}`, label: '', props: backgroundProps })
00161|     }
00162| 
00163|     return lines
00164|   }, [
00165|     backgroundProps,
00166|     effectiveSuggestedFocused,
00167|     focusedSelectionProps,
00168|     hasSuggestions,
00169|     safeSuggestedSelection,
00170|     suggestionRows,
00171|     theme.mutedText,
00172|     theme.text,
00173|     unfocusedSelectionProps,
00174|     visibleSuggestions.showAfter,
00175|     visibleSuggestions.showBefore,
00176|     visibleSuggestions.start,
00177|     visibleSuggestions.values,
00178|   ])
00179| 
00180|   const pathLabel = 'Path: '
00181|   const inputWidth = Math.max(1, contentWidth - pathLabel.length)
00182| 
00183|   return (
00184|     <Box
00185|       flexDirection="column"
00186|       borderStyle="round"
00187|       paddingX={1}
00188|       paddingY={0}
00189|       width={popupWidth}
00190|       {...inkBorderColorProps(theme.border)}
00191|       {...backgroundProps}
00192|       {...(typeof maxHeight === 'number' ? { height: maxHeight } : {})}
00193|       overflow="hidden"
00194|     >
00195|       <Text {...backgroundProps} {...inkColorProps(theme.accent)}>
00196|         {padRight('Intent File', contentWidth)}
00197|       </Text>
00198| 
00199|       <Box flexDirection="row">
00200|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00201|           {pathLabel}
00202|         </Text>
00203|         <SingleLineTextInput
00204|           value={draft}
00205|           onChange={onDraftChange}
00206|           onSubmit={() => onSubmitDraft(draft)}
00207|           placeholder="prompts/intent.md"
00208|           focus={!effectiveSuggestedFocused}
00209|           width={inputWidth}
00210|           backgroundColor={theme.popupBackground}
00211|         />
00212|       </Box>
00213| 
00214|       {suggestionRows > 0 ? (
00215|         <Box flexDirection="column" height={suggestionRows} flexShrink={0} overflow="hidden">
00216|           {suggestionLines.map((line) => (
00217|             <Text key={line.key} {...line.props}>
00218|               {padRight(line.label, contentWidth)}
00219|             </Text>
00220|           ))}
00221|         </Box>
00222|       ) : null}
00223| 
00224|       <Box flexShrink={0}>
00225|         <Text {...backgroundProps} {...inkColorProps(theme.mutedText)}>
00226|           {padRight('Tab suggestions · ↑/↓ select · Enter apply · Esc close', contentWidth)}
00227|         </Text>
00228|       </Box>
00229|     </Box>
00230|   )
00231| }
00232| 

(End of file - total 232 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerFileInput.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * TestRunnerFileInput
00003|  *
00004|  * Presentational component for the test file input section.
00005|  */
00006| 
00007| import { Box, Text, useStdout } from 'ink'
00008| 
00009| import { SingleLineTextInput } from '../../../components/core/SingleLineTextInput'
00010| import { useTheme } from '../../../theme/theme-provider'
00011| import {
00012|   inkBackgroundColorProps,
00013|   inkBorderColorProps,
00014|   inkColorProps,
00015| } from '../../../theme/theme-types'
00016| 
00017| const APP_CONTAINER_PADDING_X = 2
00018| 
00019| const padRight = (value: string, width: number): string => {
00020|   if (width <= 0) {
00021|     return ''
00022|   }
00023| 
00024|   const trimmed = value.length > width ? value.slice(0, width) : value
00025|   return trimmed.length === width ? trimmed : trimmed.padEnd(width, ' ')
00026| }
00027| 
00028| export type TestRunnerFileInputProps = {
00029|   filePath: string
00030|   isFocused: boolean
00031|   helpOpen: boolean
00032|   onChange: (next: string) => void
00033|   onSubmit: () => void
00034| }
00035| 
00036| export const TestRunnerFileInput = ({
00037|   filePath,
00038|   isFocused,
00039|   helpOpen,
00040|   onChange,
00041|   onSubmit,
00042| }: TestRunnerFileInputProps) => {
00043|   const { theme } = useTheme()
00044|   const { stdout } = useStdout()
00045| 
00046|   const terminalColumns = stdout?.columns ?? 80
00047|   const boxWidth = Math.max(0, terminalColumns - 2 * APP_CONTAINER_PADDING_X)
00048| 
00049|   const borderColumns = 2
00050|   const paddingColumns = 2
00051|   const contentWidth = Math.max(0, boxWidth - borderColumns - paddingColumns)
00052| 
00053|   const backgroundProps = inkBackgroundColorProps(theme.panelBackground)
00054| 
00055|   const borderColor = isFocused ? theme.accent : theme.border
00056| 
00057|   return (
00058|     <>
00059|       <Text {...backgroundProps} {...inkColorProps(isFocused ? theme.accent : theme.text)}>
00060|         {padRight('Test File', contentWidth)}
00061|       </Text>
00062|       <Box
00063|         borderStyle="round"
00064|         paddingX={1}
00065|         width={boxWidth}
00066|         {...inkBorderColorProps(borderColor)}
00067|         {...backgroundProps}
00068|       >
00069|         <SingleLineTextInput
00070|           value={filePath}
00071|           onChange={onChange}
00072|           placeholder="prompt-tests.yaml"
00073|           focus={isFocused && !helpOpen}
00074|           onSubmit={onSubmit}
00075|           width={contentWidth}
00076|           backgroundColor={theme.panelBackground}
00077|         />
00078|       </Box>
00079|     </>
00080|   )
00081| }
00082| 

(End of file - total 82 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerActions.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * TestRunnerActions
00003|  *
00004|  * Presentational component for the "actions" section.
00005|  */
00006| 
00007| import { Box, Text } from 'ink'
00008| 
00009| import { useTheme } from '../../../theme/theme-provider'
00010| import { inkColorProps } from '../../../theme/theme-types'
00011| 
00012| export type TestRunnerActionsProps = {
00013|   isFocused: boolean
00014|   status: 'idle' | 'running'
00015|   lastRunFile: string | null
00016| }
00017| 
00018| export const TestRunnerActions = ({ isFocused, status, lastRunFile }: TestRunnerActionsProps) => {
00019|   const { theme } = useTheme()
00020| 
00021|   return (
00022|     <Box marginTop={1} flexDirection="column">
00023|       {isFocused ? <Text {...inkColorProps(theme.accent)}>Actions</Text> : <Text>Actions</Text>}
00024|       <Text>Press Enter to run tests</Text>
00025|       <Text {...inkColorProps(theme.mutedText)}>
00026|         Status: {status === 'running' ? 'Running tests…' : 'Idle'}
00027|       </Text>
00028|       {lastRunFile ? (
00029|         <Text {...inkColorProps(theme.mutedText)}>Last suite: {lastRunFile}</Text>
00030|       ) : (
00031|         <Text {...inkColorProps(theme.mutedText)}>No runs yet</Text>
00032|       )}
00033|     </Box>
00034|   )
00035| }
00036| 

(End of file - total 36 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestList.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * TestList
00003|  *
00004|  * Presentational component for rendering the loaded test list.
00005|  *
00006|  * Note: we intentionally only show the first 15 tests, matching the existing UX.
00007|  */
00008| 
00009| import { Box, Text } from 'ink'
00010| 
00011| import { useTheme } from '../../../theme/theme-provider'
00012| import { inkColorProps } from '../../../theme/theme-types'
00013| import type { TestDisplayState, TestStatus } from '../test-runner-reducer'
00014| 
00015| const STATUS_LABEL: Record<TestStatus, string> = {
00016|   pending: 'PENDING',
00017|   running: 'RUNNING',
00018|   pass: 'PASS',
00019|   fail: 'FAIL',
00020| }
00021| 
00022| export type TestListProps = {
00023|   tests: readonly TestDisplayState[]
00024| }
00025| 
00026| export const TestList = ({ tests }: TestListProps) => {
00027|   const { theme } = useTheme()
00028| 
00029|   const resolveStatusColor = (status: TestStatus) => {
00030|     switch (status) {
00031|       case 'pending':
00032|         return theme.mutedText
00033|       case 'running':
00034|         return theme.accent
00035|       case 'pass':
00036|         return theme.success
00037|       case 'fail':
00038|         return theme.error
00039|       default: {
00040|         const exhaustive: never = status
00041|         return exhaustive
00042|       }
00043|     }
00044|   }
00045| 
00046|   if (tests.length === 0) {
00047|     return <Text {...inkColorProps(theme.mutedText)}>No test suite loaded yet.</Text>
00048|   }
00049| 
00050|   const displayed = tests.slice(0, 15).map((testState, index) => (
00051|     <Box key={`${testState.name}-${index}`} flexDirection="column">
00052|       <Text {...inkColorProps(resolveStatusColor(testState.status))}>
00053|         {STATUS_LABEL[testState.status].padEnd(7)} {testState.name}
00054|       </Text>
00055|       {testState.reason && testState.status === 'fail' ? (
00056|         <Text {...inkColorProps(theme.mutedText)}>↳ {testState.reason}</Text>
00057|       ) : null}
00058|     </Box>
00059|   ))
00060| 
00061|   return (
00062|     <>
00063|       {displayed}
00064|       {tests.length > 15 ? (
00065|         <Text {...inkColorProps(theme.mutedText)}>…and {tests.length - 15} more test(s)</Text>
00066|       ) : null}
00067|     </>
00068|   )
00069| }
00070| 

(End of file - total 70 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerLogs.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * TestRunnerLogs
00003|  *
00004|  * Presentational component for displaying recent test logs.
00005|  */
00006| 
00007| import { Box, Text } from 'ink'
00008| 
00009| import type { LogEntry } from '../../../useLogBuffer'
00010| import { useTheme } from '../../../theme/theme-provider'
00011| import { inkColorProps } from '../../../theme/theme-types'
00012| 
00013| export type TestRunnerLogsProps = {
00014|   logs: readonly LogEntry[]
00015| }
00016| 
00017| export const TestRunnerLogs = ({ logs }: TestRunnerLogsProps) => {
00018|   const { theme } = useTheme()
00019| 
00020|   if (logs.length === 0) {
00021|     return null
00022|   }
00023| 
00024|   return (
00025|     <Box marginTop={1} flexDirection="column">
00026|       <Text {...inkColorProps(theme.accent)}>Recent Logs</Text>
00027|       {logs.map((entry) => {
00028|         const color =
00029|           entry.level === 'error'
00030|             ? theme.error
00031|             : entry.level === 'warn'
00032|               ? theme.warning
00033|               : theme.mutedText
00034| 
00035|         return (
00036|           <Text key={entry.id} {...inkColorProps(color)}>
00037|             {entry.level.toUpperCase()}: {entry.message}
00038|           </Text>
00039|         )
00040|       })}
00041|     </Box>
00042|   )
00043| }
00044| 

(End of file - total 44 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerSummary.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * TestRunnerSummary
00003|  *
00004|  * Presentational component for displaying test run summary.
00005|  */
00006| 
00007| import { Box, Text } from 'ink'
00008| 
00009| import { useTheme } from '../../../theme/theme-provider'
00010| import { inkColorProps } from '../../../theme/theme-types'
00011| import type { TestRunSummary } from '../test-runner-reducer'
00012| 
00013| export type TestRunnerSummaryProps = {
00014|   summary: TestRunSummary | null
00015| }
00016| 
00017| export const TestRunnerSummary = ({ summary }: TestRunnerSummaryProps) => {
00018|   const { theme } = useTheme()
00019| 
00020|   if (!summary) {
00021|     return null
00022|   }
00023| 
00024|   return (
00025|     <Box marginTop={1} flexDirection="column">
00026|       <Text {...inkColorProps(theme.accent)}>Summary</Text>
00027|       <Text {...inkColorProps(theme.success)}>Passed: {summary.passed}</Text>
00028|       <Text {...inkColorProps(summary.failed > 0 ? theme.error : theme.success)}>
00029|         Failed: {summary.failed}
00030|       </Text>
00031|     </Box>
00032|   )
00033| }
00034| 

(End of file - total 34 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/screens/test-runner/components/TestRunnerError.tsx"
}
```
**Output:**
```
<file>
00001| /*
00002|  * TestRunnerError
00003|  *
00004|  * Presentational component for showing an error message.
00005|  */
00006| 
00007| import { Text } from 'ink'
00008| 
00009| import { useTheme } from '../../../theme/theme-provider'
00010| import { inkColorProps } from '../../../theme/theme-types'
00011| 
00012| export type TestRunnerErrorProps = {
00013|   message: string | null
00014| }
00015| 
00016| export const TestRunnerError = ({ message }: TestRunnerErrorProps) => {
00017|   const { theme } = useTheme()
00018| 
00019|   if (!message) {
00020|     return null
00021|   }
00022| 
00023|   return <Text {...inkColorProps(theme.error)}>{message}</Text>
00024| }
00025| 

(End of file - total 25 lines)
</file>
```
```

---

## Assistant

_Thinking:_

**Verifying theme details**

It looks like we might have missed a file: ThemePickerPopup has paddingX set to 0 but no background applied to the root. It’s using backgroundProps in the Text nodes, but the Box doesn't apply them in the root. That should be fine. The ListPopup is large and we’ll mention that. I’ve completed step 1 by reading the docs and step 2 by verifying paths, but it seems the apps path doesn’t exist. I'll update the to-do list accordingly. I also need to check the TUI entry and theming wrapper in `src/tui/index.tsx`.

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/index.tsx"
}
```
**Output:**
```
<file>
00001| import { render } from 'ink'
00002| 
00003| import { AppContainer } from './AppContainer'
00004| 
00005| type TuiOptions = {
00006|   interactiveTransport?: string
00007| }
00008| 
00009| const parseTuiArgs = (argv: string[]): TuiOptions => {
00010|   const options: TuiOptions = {}
00011|   for (let i = 0; i < argv.length; i += 1) {
00012|     const token = argv[i]
00013|     if (!token) {
00014|       continue
00015|     }
00016|     if (token === '--interactive-transport') {
00017|       const next = argv[i + 1]
00018|       if (next && !next.startsWith('-')) {
00019|         options.interactiveTransport = next
00020|         i += 1
00021|       }
00022|       continue
00023|     }
00024|     if (token.startsWith('--interactive-transport=')) {
00025|       options.interactiveTransport = token.split('=').slice(1).join('=')
00026|     }
00027|   }
00028|   return options
00029| }
00030| 
00031| export const runTuiCommand = async (argv: string[]): Promise<void> => {
00032|   const options = parseTuiArgs(argv)
00033|   const { waitUntilExit } = render(
00034|     <AppContainer interactiveTransport={options.interactiveTransport} />,
00035|   )
00036|   await waitUntilExit()
00037| }
00038| 

(End of file - total 38 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/theme/terminal-appearance.ts"
}
```
**Output:**
```
<file>
00001| import type { ThemeAppearanceMode } from './theme-types'
00002| 
00003| const parseAnsiIndex = (value: string): number | null => {
00004|   const trimmed = value.trim()
00005|   if (!trimmed) {
00006|     return null
00007|   }
00008| 
00009|   const parsed = Number.parseInt(trimmed, 10)
00010|   return Number.isFinite(parsed) ? parsed : null
00011| }
00012| 
00013| const detectFromColorFgBg = (envValue: string): ThemeAppearanceMode | null => {
00014|   // `COLORFGBG` commonly looks like "15;0" (foreground;background)
00015|   // but some terminals include extra segments. We only care about the last.
00016|   const parts = envValue
00017|     .split(';')
00018|     .map((part) => part.trim())
00019|     .filter((part) => part.length > 0)
00020| 
00021|   const last = parts[parts.length - 1]
00022|   if (!last) {
00023|     return null
00024|   }
00025| 
00026|   const background = parseAnsiIndex(last)
00027|   if (background === null) {
00028|     return null
00029|   }
00030| 
00031|   if (background >= 0 && background <= 6) {
00032|     return 'dark'
00033|   }
00034| 
00035|   if (background >= 7 && background <= 15) {
00036|     return 'light'
00037|   }
00038| 
00039|   return null
00040| }
00041| 
00042| export const detectTerminalAppearanceMode = (
00043|   env: NodeJS.ProcessEnv,
00044| ): ThemeAppearanceMode | null => {
00045|   const explicit = env.TERM_BACKGROUND?.trim().toLowerCase()
00046|   if (explicit === 'light' || explicit === 'dark') {
00047|     return explicit
00048|   }
00049| 
00050|   const colorFgBg = env.COLORFGBG?.trim()
00051|   if (colorFgBg) {
00052|     return detectFromColorFgBg(colorFgBg)
00053|   }
00054| 
00055|   return null
00056| }
00057| 

(End of file - total 57 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/theme/color-audit.ts"
}
```
**Output:**
```
<file>
00001| import type { ThemeSlot } from './theme-types'
00002| 
00003| export type ColorAuditEntry = {
00004|   file: string
00005|   tokenSuggestion: ThemeSlot
00006|   notes: string
00007| }
00008| 
00009| // This module exists to track any remaining hard-coded Ink colors.
00010| // After migrating the TUI to `useTheme()`, this list should stay empty.
00011| export const COLOR_AUDIT: readonly ColorAuditEntry[] = []
00012| 

(End of file - total 12 lines)
</file>
```
```

```
Tool: read

**Input:**
```json
{
  "filePath": "/Users/eroberts/Projects/prompt-maker/src/tui/context.tsx"
}
```
**Output:**
```
<file>
00001| import React, { useCallback, useState } from 'react'
00002| import { ContextDispatchContext, ContextStateContext } from './context-store'
00003| 
00004| export const ContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
00005|   const [files, setFiles] = useState<string[]>([])
00006|   const [urls, setUrls] = useState<string[]>([])
00007|   const [images, setImages] = useState<string[]>([])
00008|   const [videos, setVideos] = useState<string[]>([])
00009|   const [smartContextEnabled, setSmartContextEnabled] = useState(false)
00010|   const [smartContextRoot, setSmartContextRoot] = useState<string | null>(null)
00011|   const [metaInstructions, setMetaInstructions] = useState('')
00012|   const [lastReasoning, setLastReasoning] = useState<string | null>(null)
00013|   const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState<string | null>(null)
00014| 
00015|   const addEntry = useCallback(
00016|     (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
00017|       const trimmed = value.trim()
00018|       if (!trimmed) {
00019|         return
00020|       }
00021|       setter((prev) => [...prev, trimmed])
00022|     },
00023|     [],
00024|   )
00025| 
00026|   const removeEntry = useCallback(
00027|     (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
00028|       setter((prev) => prev.filter((_, idx) => idx !== index))
00029|     },
00030|     [],
00031|   )
00032| 
00033|   const addFile = useCallback((value: string) => addEntry(value, setFiles), [addEntry])
00034|   const removeFile = useCallback((index: number) => removeEntry(index, setFiles), [removeEntry])
00035| 
00036|   const addUrl = useCallback((value: string) => addEntry(value, setUrls), [addEntry])
00037|   const removeUrl = useCallback((index: number) => removeEntry(index, setUrls), [removeEntry])
00038| 
00039|   const addImage = useCallback((value: string) => addEntry(value, setImages), [addEntry])
00040|   const removeImage = useCallback((index: number) => removeEntry(index, setImages), [removeEntry])
00041| 
00042|   const addVideo = useCallback((value: string) => addEntry(value, setVideos), [addEntry])
00043|   const removeVideo = useCallback((index: number) => removeEntry(index, setVideos), [removeEntry])
00044| 
00045|   const toggleSmartContext = useCallback(() => {
00046|     setSmartContextEnabled((prev) => !prev)
00047|   }, [])
00048| 
00049|   const setSmartRoot = useCallback((value: string) => {
00050|     const trimmed = value.trim()
00051|     setSmartContextRoot(trimmed.length > 0 ? trimmed : null)
00052|   }, [])
00053| 
00054|   const resetContext = useCallback(() => {
00055|     setFiles([])
00056|     setUrls([])
00057|     setImages([])
00058|     setVideos([])
00059|     setSmartContextEnabled(false)
00060|     setSmartContextRoot(null)
00061|     setMetaInstructions('')
00062|     setLastReasoning(null)
00063|   }, [])
00064| 
00065|   return (
00066|     <ContextStateContext.Provider
00067|       value={{
00068|         files,
00069|         urls,
00070|         images,
00071|         videos,
00072|         smartContextEnabled,
00073|         smartContextRoot,
00074|         metaInstructions,
00075|         lastReasoning,
00076|         lastGeneratedPrompt,
00077|       }}
00078|     >
00079|       <ContextDispatchContext.Provider
00080|         value={{
00081|           addFile,
00082|           removeFile,
00083|           addUrl,
00084|           removeUrl,
00085|           addImage,
00086|           removeImage,
00087|           addVideo,
00088|           removeVideo,
00089|           toggleSmartContext,
00090|           setSmartRoot,
00091|           setMetaInstructions,
00092|           setLastReasoning,
00093|           setLastGeneratedPrompt,
00094|           resetContext,
00095|         }}
00096|       >
00097|         {children}
00098|       </ContextDispatchContext.Provider>
00099|     </ContextStateContext.Provider>
00100|   )
00101| }
00102| 

(End of file - total 102 lines)
</file>
```
```

---

## Assistant

_Thinking:_

**Updating to-do progress**

Alright, it’s time to update the to-do progress. Step 1 is complete, and I'm thinking Step 2 might be done too. Steps 3 and 4 are still in progress. We have the inventory lists on hand, so we'll update those accordingly. Step 3 involves the inventory of screens and components, which is only partially finished, while Step 4's theme system is complete. I’ll make sure to update the to-do list!

```
Tool: todowrite

**Input:**
```json
{
  "todos": [
    {
      "content": "Read required context docs/files",
      "status": "completed",
      "priority": "high",
      "id": "1"
    },
    {
      "content": "Verify TUI paths and modules",
      "status": "completed",
      "priority": "high",
      "id": "2"
    },
    {
      "content": "Inventory screens and components",
      "status": "completed",
      "priority": "high",
      "id": "3"
    },
    {
      "content": "Inventory theme system and persistence",
      "status": "completed",
      "priority": "high",
      "id": "4"
    },
    {
      "content": "Write tui-styling-guide.md tutorial",
      "status": "in_progress",
      "priority": "high",
      "id": "5"
    },
    {
      "content": "Cross-check paths and claims",
      "status": "pending",
      "priority": "high",
      "id": "6"
    }
  ]
}
```
**Output:**
```
[
  {
    "content": "Read required context docs/files",
    "status": "completed",
    "priority": "high",
    "id": "1"
  },
  {
    "content": "Verify TUI paths and modules",
    "status": "completed",
    "priority": "high",
    "id": "2"
  },
  {
    "content": "Inventory screens and components",
    "status": "completed",
    "priority": "high",
    "id": "3"
  },
  {
    "content": "Inventory theme system and persistence",
    "status": "completed",
    "priority": "high",
    "id": "4"
  },
  {
    "content": "Write tui-styling-guide.md tutorial",
    "status": "in_progress",
    "priority": "high",
    "id": "5"
  },
  {
    "content": "Cross-check paths and claims",
    "status": "pending",
    "priority": "high",
    "id": "6"
  }
]
```
```

---

## Assistant

---

## User

Please continue

---

## Assistant

---

