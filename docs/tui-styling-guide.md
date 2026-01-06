# TUI Styling Guide (Ink) — prompt-maker

This guide teaches **Ink styling fundamentals** and then explains **exactly how styling and theming work in this repo**, with **screen-by-screen** and **component-by-component** pointers to the files you should change.

It is grounded in these repo docs and code:

- UX goals + input routing invariants: `docs/tui-design.md`
- Architecture + performance notes: `src/tui/DEVELOPER_NOTE.md`
- Boot sequence + module map: `docs/prompt-maker-cli-tui-encyclopedia.md`
- Worked example popup: `src/tui/components/popups/InstructionsPopup.tsx`

> Note on paths: some older docs may reference `apps/prompt-maker-cli/...`, but this repo’s authoritative TUI implementation is under `src/tui/**`.

---

## 1) Overview

You’ll learn:

1. **Ink basics**: how `<Box>` and `<Text>` render in a terminal, and which props matter.
2. **This repo’s theme system**: where theme tokens live, how a theme JSON becomes Ink props, and how theme selection is persisted.
3. **A styling map** of:
   - Screens (`Generate` and `Test Runner`)
   - Shared layout components (`core/*`)
   - Popup components (`popups/*`)
4. Practical recipes:
   - Change popup background/border
   - Change accent vs muted text
   - Make a layout responsive to terminal width
   - Add a new theme token (slot)
   - Add a new theme JSON

Constraints / philosophy (mirrors repo intent):

- Prefer **theme tokens** over hard-coded colors.
- Keep **input routing invariants** intact (help overlay and popups must “own” keyboard input).
- Avoid costly work in render paths.

---

## 2) Ink Basics (Beginner Tutorial)

### 2.1 What Ink is

Ink is **React for command-line interfaces**:

- You write React components (`function Component() { return <Box>...</Box> }`).
- Ink renders them to the terminal using a layout engine.
- Keyboard input is handled via Ink hooks (not browser events).

In this repo, the TUI mounts from `src/tui/index.tsx` via Ink’s `render()`.

### 2.2 The two primitives you’ll style 90% of the time

#### `<Text>`

`<Text>` prints text to the terminal.

Common styling props:

- `color`: foreground color (e.g. `"#ff0000"` or `"cyan"` depending on terminal)
- `backgroundColor`: background fill behind the text
- `bold`, `italic`, `underline`
- `wrap`: how to handle long lines (`"wrap"`, `"truncate"`, etc.)
- `inverse`: swaps foreground/background for that cell (used for cursors and selections)

Example:

```tsx
import { Text } from 'ink'

export const Example = () => (
  <Text color="#58a6ff" bold>
    Accent headline
  </Text>
)
```

#### `<Box>`

`<Box>` is Ink’s layout container.

Key layout props:

- `flexDirection`: `"row"` or `"column"` (most screens use column)
- `width`, `height`: numbers or strings like `"100%"`
- `flexGrow`, `flexShrink`
- `justifyContent`, `alignItems`
- `paddingX`, `paddingY`, `marginTop`, etc.
- `borderStyle`: `"round"`, `"single"`, etc.
- `borderColor`: border color
- `backgroundColor`: background fill
- `position="absolute"`: overlay layers (popups and toasts use this)

Example:

```tsx
import { Box, Text } from 'ink'

export const Card = () => (
  <Box borderStyle="round" paddingX={1} flexDirection="column">
    <Text>Title</Text>
    <Text>Body</Text>
  </Box>
)
```

### 2.3 Terminals impose constraints you must design around

#### Monospace + “columns”

Terminals measure width in **columns**. When you want a boxed UI that looks solid, you usually must:

- Compute the available width (via `useStdout().stdout.columns`).
- Clamp it to reasonable bounds.
- Pad each rendered line with spaces so background colors fill the entire box.

This “pad to full width” pattern is used throughout popups (see `src/tui/components/popups/InstructionsPopup.tsx` and many others).

#### Wrapping vs truncation

If your content may exceed the available width, you must decide:

- `wrap="wrap"`: can reflow but may make the UI jumpy.
- `wrap="truncate"`: stable layout but hides overflow.

The repo often prefers stable layouts in constrained panes (e.g. popups) by computing `contentWidth` and padding/truncating manually.

#### Unicode width and borders

Box borders (like `borderStyle="round"`) use Unicode line-drawing characters. Some terminals/fonts render these differently. When changing border styles, sanity-check in multiple terminals.

---

## 3) How Styling Works in This Repo

### 3.1 The ThemeProvider and `useTheme()`

The TUI is wrapped by `ThemeProvider` in `src/tui/AppContainer.tsx`.

- Provider: `src/tui/theme/theme-provider.tsx`
- Consumer hook: `useTheme()` exported from the same file

`useTheme()` gives you:

- `theme`: a **ResolvedTheme** (a map of named slots → Ink-compatible colors)
- `mode`: current mode (`'light' | 'dark' | 'system'`)
- `themes`: loaded theme descriptors (built-in + custom)
- `activeThemeName`: the current selected theme name
- `setTheme(name)`, `previewTheme(name)`
- `setMode(mode)`
- `error` and `warnings`

### 3.2 Theme tokens (slots)

Theme slot definitions live in `src/tui/theme/theme-types.ts`.

Required slots (current list):

- `background`
- `text`
- `mutedText`
- `border`
- `accent`
- `accentText`
- `warning`
- `error`
- `success`
- `panelBackground`
- `popupBackground`
- `selectionBackground`
- `selectionText`
- `chipBackground`
- `chipText`
- `chipMutedText`

These are enforced by:

- `REQUIRED_THEME_SLOTS` in `src/tui/theme/theme-types.ts`
- Theme JSON validation in `src/tui/theme/theme-loader.ts`

### 3.3 Turning theme tokens into Ink props

The repo uses tiny helpers in `src/tui/theme/theme-types.ts`:

- `inkColorProps(theme.text)` → `{ color?: string }`
- `inkBackgroundColorProps(theme.panelBackground)` → `{ backgroundColor?: string }`
- `inkBorderColorProps(theme.border)` → `{ borderColor?: string }`

They deliberately return `{}` when the value is `undefined`, which keeps JSX clean:

```tsx
<Text {...inkColorProps(theme.mutedText)}>Muted text</Text>
```

This pattern is everywhere (screens, core components, popups).

### 3.4 Theme JSON → ResolvedTheme

Theme JSON is **not** “Ink props”. It’s a higher-level schema that supports:

- Hex colors (`"#RRGGBB"`)
- 8-digit hex (`"#RRGGBBAA"`), where `AA == "00"` resolves to “transparent” (treated as `undefined`)
- ANSI color numbers (`0..255`) (converted to a hex value)
- References (strings that point to `defs.<name>` or `theme.<slot>` keys)
- Variants: `{ "dark": ..., "light": ... }`

Resolution is implemented in `src/tui/theme/theme-resolver.ts`.

### 3.5 Built-in themes

Built-in themes live in:

- `src/tui/theme/builtins/pm-dark.ts` (default)
- `src/tui/theme/builtins/pm-light.ts`

They are registered in `src/tui/theme/theme-registry.ts`.

### 3.6 Theme loading locations (custom themes)

Theme discovery and validation are implemented in `src/tui/theme/theme-loader.ts`.

It loads theme JSON files from:

1. **Built-in themes** (from `theme-registry.ts`)
2. **Global user themes**:
   - `~/.config/prompt-maker-cli/themes/*.json`
3. **Project themes** (walks upward from `cwd`):
   - `<project or parent>/.prompt-maker-cli/themes/*.json`

Project themes are discovered by walking up directories until an optional `stopAt` boundary.

The file name (minus `.json`) becomes the theme name.

### 3.7 Persistence: where theme selection is stored

Theme selection persists into the CLI config JSON via `src/config.ts`:

- Config fields: `theme?: string`, `themeMode?: ThemeMode`
- Update function: `updateCliThemeSettings(...)`

The bridge between the TUI and CLI config is in `src/tui/theme/theme-settings-service.ts`:

- `loadThemeSelection()` loads config + themes and resolves fallbacks.
- `saveThemeSelection()` writes `theme` and/or `themeMode`.

### 3.8 “System” mode and terminal appearance detection

`ThemeMode = 'light' | 'dark' | 'system'` in `src/tui/theme/theme-types.ts`.

When mode is `system`, `ThemeProvider` resolves it using `detectTerminalAppearanceMode()` from `src/tui/theme/terminal-appearance.ts`:

- Uses `TERM_BACKGROUND` if set (`light`/`dark`)
- Else uses `COLORFGBG` heuristics
- Else falls back to `dark`

---

## 4) Where Styles Live (Path Map)

### 4.1 Entry points and wrappers

| Concern                                                   | File(s)                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| CLI → TUI mount                                           | `src/tui/index.tsx`                                         |
| Root shell (layout + help + global keys + theme provider) | `src/tui/AppContainer.tsx`                                  |
| Screen re-export stubs                                    | `src/tui/CommandScreen.tsx`, `src/tui/TestRunnerScreen.tsx` |

### 4.2 Theme system

| Concern                               | File(s)                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------- |
| Theme provider + `useTheme()`         | `src/tui/theme/theme-provider.tsx`                                        |
| Theme token types + Ink prop helpers  | `src/tui/theme/theme-types.ts`                                            |
| Theme JSON resolution                 | `src/tui/theme/theme-resolver.ts`                                         |
| Theme discovery + validation          | `src/tui/theme/theme-loader.ts`                                           |
| Theme persistence bridge (CLI config) | `src/tui/theme/theme-settings-service.ts`                                 |
| Built-in theme registry               | `src/tui/theme/theme-registry.ts`                                         |
| Built-in themes                       | `src/tui/theme/builtins/pm-dark.ts`, `src/tui/theme/builtins/pm-light.ts` |
| Example theme JSON                    | `src/tui/theme/examples/ocean-example.json`                               |

### 4.3 Screens

| Screen               | Entry                          | Implementation directory        |
| -------------------- | ------------------------------ | ------------------------------- |
| Generate (“Command”) | `src/tui/CommandScreen.tsx`    | `src/tui/screens/command/*`     |
| Test Runner          | `src/tui/TestRunnerScreen.tsx` | `src/tui/screens/test-runner/*` |

### 4.4 Shared components

| Category                              | Directory                                |
| ------------------------------------- | ---------------------------------------- |
| Core presentational components        | `src/tui/components/core/*`              |
| Popup components                      | `src/tui/components/popups/*`            |
| Spinner (currently hard-coded colors) | `src/tui/components/OpencodeSpinner.tsx` |

---

## 5) Screen-by-Screen Styling Guide

This section is intentionally practical: _“I want to change X — where do I go?”_

### 5.1 App shell: `AppContainer`

**Primary file:** `src/tui/AppContainer.tsx`

What it styles:

- Global background via `inkBackgroundColorProps(theme.background)`.
- Header text colors (`theme.accent`, `theme.mutedText`).
- Help overlay and toast overlay positioning.

Safe styling changes:

- Change overall app background using theme token `background`.
- Change the header look by adjusting `accent`/`mutedText` tokens.
- Be careful changing `paddingX`/`paddingY`: multiple components assume `AppContainer` has `paddingX={2}` when computing widths.

Related invariants:

- Input routing order from `docs/tui-design.md` and `docs/prompt-maker-cli-tui-encyclopedia.md`:
  1. Help overlay
  2. Popup input
  3. Screen input
  4. Global keys

### 5.2 Generate screen (“CommandScreen”)

**Entry:** `src/tui/CommandScreen.tsx`

**Main implementation:** `src/tui/screens/command/CommandScreenImpl.tsx`

(There is also a local re-export at `src/tui/screens/command/CommandScreen.tsx`; the TUI shell imports the screen via `src/tui/CommandScreen.tsx`.)

Styled regions:

1. **Main background**: `theme.background`.
2. **History area**: `HistoryPane` paints `theme.background` and passes `backgroundColor={theme.background}` into `ScrollableOutput`.
3. **Command palette**: `CommandMenuPane` → `CommandMenu` uses `theme.panelBackground` + `theme.border`, with selection via `selectionBackground`/`selectionText`.
4. **Input bar**: `CommandInput` → `InputBar` uses `theme.panelBackground`; the left gutter uses `theme.border` or `theme.warning` depending on mode.
5. **Popup overlay**:
   - A full-screen background paint using `BackgroundFill` with `theme.background` (prevents “holes”/bleed-through in absolute overlays).
   - A centered popup (one of `src/tui/components/popups/*`), typically built on `PopupSheet` with `theme.popupBackground`.

Key files (styling focus):

- History area wrapper: `src/tui/screens/command/components/HistoryPane.tsx`
- Command palette wrapper: `src/tui/screens/command/components/CommandMenuPane.tsx`
- Input wrapper: `src/tui/screens/command/components/CommandInput.tsx`
- Popup selection switch: `src/tui/screens/command/components/PopupArea.tsx`

Safe modifications:

- To change the history “panel” look: there isn’t a dedicated token; it currently uses `background` (adjust tokens or edit `src/tui/components/core/ScrollableOutput.tsx`).
- To change selection styling in command palette/popups: use `selectionBackground`/`selectionText`.
- To change the popup overlay backdrop: today it uses `background`; for a dim overlay, add a dedicated theme slot and use it in `src/tui/screens/command/CommandScreenImpl.tsx`.

Terminal-width pitfalls (from `CommandScreenImpl.tsx`):

- `AppContainer` uses `paddingX={2}`; the command screen compensates when filling backgrounds to avoid Ink truncating with `...`.

### 5.3 Test Runner screen

**Entry:** `src/tui/TestRunnerScreen.tsx`

**Implementation:** `src/tui/screens/test-runner/TestRunnerScreen.tsx`

Styled regions:

- Headings (`Tests`, `Summary`, `Recent Logs`) use `theme.accent`.
- Summary uses `theme.success` and `theme.error`.
- Logs use `theme.mutedText`/`warning`/`error`.
- File input uses a bordered card with `theme.panelBackground` and a focus border using `theme.accent`.

Key styled files:

- Screen orchestration: `src/tui/screens/test-runner/TestRunnerScreen.tsx` (re-exported by `src/tui/TestRunnerScreen.tsx`)
- File input: `src/tui/screens/test-runner/components/TestRunnerFileInput.tsx`
- Summary: `src/tui/screens/test-runner/components/TestRunnerSummary.tsx`
- Logs: `src/tui/screens/test-runner/components/TestRunnerLogs.tsx`
- Test list: `src/tui/screens/test-runner/components/TestList.tsx`
- Errors: `src/tui/screens/test-runner/components/TestRunnerError.tsx`

Safe modifications:

- Change card background via `panelBackground`.
- Change focus border via `accent`.
- Change fail/pass colors via `error`/`success`.

---

## 6) Shared Components Styling Guide

### 6.1 Core components (`src/tui/components/core/*`)

These are used across screens and popups.

#### `BackgroundFill`

- File: `src/tui/components/core/BackgroundFill.tsx`
- Purpose: paint a solid background for absolute overlays (popups).
- Styling inputs: `background` prop (passed from theme in callers).

Tip: this component uses NBSP padding to force Ink to paint background cells.

#### `ScrollableOutput`

- File: `src/tui/components/core/ScrollableOutput.tsx`
- Purpose: windowed rendering of history/log lines.
- Styling:
  - Colors are chosen by entry kind (`user` → `accent`, `progress` → `warning`, default → `text`).
  - Uses `backgroundColor` prop (often `background`, `panelBackground`, or `popupBackground`).

Safe changes:

- Adjust kind → token mapping here if you want different “speaker” coloring.

#### `InputBar`

- File: `src/tui/components/core/InputBar.tsx`
- Purpose: the main multi-line input with status summary.
- Styling:
  - Card background: `panelBackground`
  - Border: `border` or `warning` depending on mode
  - Label and hint text: `mutedText` or `warning`
  - Spinner and accent text: `accent`

Note: the input bar tries to keep render work predictable via memoization.

#### `MultilineTextInput`

- File: `src/tui/components/core/MultilineTextInput.tsx`
- Purpose: editable multiline input with a custom cursor.
- Styling:
  - Prompt prefix uses `theme.accent`.
  - Placeholder uses `theme.mutedText`.
  - Cursor is rendered using `<Text inverse>`.

Pitfall: because the cursor is cell-based, extra styling (padding, emoji, wide unicode) can easily shift perceived cursor position.

#### `SingleLineTextInput`

- File: `src/tui/components/core/SingleLineTextInput.tsx`
- Purpose: single-line input used in popups and panels.
- Styling:
  - Placeholder uses `theme.mutedText`.
  - Cursor uses `<Text inverse>`.
  - Supports `width` and `backgroundColor` props so popups can paint full-width.

#### `CommandMenu`

- File: `src/tui/components/core/CommandMenu.tsx`
- Purpose: command palette list.
- Styling:
  - Background: `panelBackground`
  - Border: `border`
  - Header: `accent`
  - Selection: `selectionText` + `selectionBackground`

#### `HelpOverlay`

- File: `src/tui/components/core/HelpOverlay.tsx`
- Purpose: the highest-priority overlay that suppresses other input.
- Styling:
  - Background: `popupBackground`
  - Border: `border`
  - Titles: `accent`
  - Content: `mutedText`

Because it’s a key input layer, be careful making it too transparent or visually subtle.

#### `Toast` + `ToastOverlay`

- Files: `src/tui/components/core/Toast.tsx`, `src/tui/components/core/ToastOverlay.tsx`
- Purpose: transient messages.
- Styling:
  - Background: `popupBackground` (opaque)
  - Border: `border` / `warning` / `error` depending on toast kind
  - Title: `mutedText` / `warning` / `error`

Important pattern: `Toast` pads each line to `contentWidth` so Ink paints background cells in absolute overlays.

#### Status indicator segments

- File: `src/tui/components/core/status-indicators-layout.ts`
- Purpose: parse `statusChips` into display segments (used by `InputBar` and `SettingsPopup`).
- Styling:
  - Segments are mapped to theme tokens (`success`, `warning`, `danger` → `error`, etc.).

Note: the old `StatusIndicators.tsx` and `PastedSnippetCard.tsx` components were removed during cleanup; status/paste UI now lives in the screen + popup components that need it.

### 6.2 Top-level entrypoints (`src/tui/*.tsx`)

After the screen/component cleanup, `src/tui/*.tsx` is mostly entrypoints and glue (`AppContainer`, `CommandScreen`, `TestRunnerScreen`, `index`, `context`). Most styling work now lives under:

- `src/tui/screens/*` (screen layouts)
- `src/tui/components/*` (reusable building blocks)

### 6.3 Popups (`src/tui/components/popups/*`)

Popups share a consistent “sheet” style:

- Most popups render inside `PopupSheet` (`src/tui/components/popups/PopupSheet.tsx`).
- `PopupSheet` uses `BackgroundFill` to paint a solid `popupBackground` rectangle (no bleed-through).
- `width` is derived from terminal columns using `clamp(terminalColumns - 10, 40, 72)`.
- `contentWidth` is computed by subtracting **padding only** (there is no popup border anymore).
- `backgroundProps = inkBackgroundColorProps(theme.popupBackground)` is applied to each `<Text>` line.
- Header uses `theme.accent`, footer uses `theme.mutedText`.
- Selection uses `selectionText` + `selectionBackground`.
- Suggestion/unfocused selection styling uses `chipBackground` + `chipText`.

Note: popups are intentionally borderless after the cleanup; the `border` token is still used by bordered UI like `HelpOverlay`, `CommandMenu`, and `Toast`.

Popups are selected/rendered in `src/tui/screens/command/components/PopupArea.tsx`.

Below is a quick inventory with styling notes.

| Popup                      | File                                              | Main tokens                                                                                        |
| -------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Model selection            | `src/tui/components/popups/ModelPopup.tsx`        | `popupBackground`, `accent`, `mutedText`, `selection*`, plus `warning`/`error` for provider status |
| Generic list + suggestions | `src/tui/components/popups/ListPopup.tsx`         | `popupBackground`, `mutedText`, `text`, `selection*`, `chip*` for “unfocused selection”            |
| Intent file chooser        | `src/tui/components/popups/IntentFilePopup.tsx`   | `popupBackground`, `mutedText`, `selection*`, `chip*`                                              |
| Instructions               | `src/tui/components/popups/InstructionsPopup.tsx` | `popupBackground`, `accent`, `mutedText`                                                           |
| Toggle on/off              | `src/tui/components/popups/TogglePopup.tsx`       | `popupBackground`, `accent`, `mutedText`, `selection*`                                             |
| Series intent              | `src/tui/components/popups/SeriesIntentPopup.tsx` | `popupBackground`, `accent`, `mutedText`                                                           |
| Prompt test run            | `src/tui/components/popups/TestPopup.tsx`         | `popupBackground`, `accent`, `mutedText`                                                           |
| Token usage                | `src/tui/components/popups/TokenUsagePopup.tsx`   | `popupBackground`, `accent`, `text`, `mutedText`                                                   |
| Settings display           | `src/tui/components/popups/SettingsPopup.tsx`     | `popupBackground`, `accent`, `mutedText`, `success`/`warning`/`error`                              |
| Theme picker               | `src/tui/components/popups/ThemePickerPopup.tsx`  | `popupBackground`, `accent`, `mutedText`, `selection*`, `error`                                    |
| Theme mode picker          | `src/tui/components/popups/ThemeModePopup.tsx`    | `popupBackground`, `accent`, `mutedText`, `selection*`, `error`                                    |
| Reasoning view             | `src/tui/components/popups/ReasoningPopup.tsx`    | `popupBackground`, `accent`, `mutedText`, and `ScrollableOutput`                                   |
| Smart root chooser         | `src/tui/components/popups/SmartPopup.tsx`        | `popupBackground`, `accent`, `mutedText`, `selection*`, `chip*`                                    |

---

## 7) Worked Example: `InstructionsPopup.tsx`

**File:** `src/tui/components/popups/InstructionsPopup.tsx`

This popup is a great “microcosm” of how the repo styles popups.

### 7.1 Responsive sizing with `useStdout()` + clamp

```ts
const { stdout } = useStdout()
const terminalColumns = stdout?.columns ?? 80
const popupWidth = clamp(terminalColumns - 10, 40, 72)
```

Why:

- `stdout.columns` is the runtime terminal width.
- `-10` leaves a margin so the popup is not edge-to-edge.
- `clamp(..., 40, 72)` keeps the popup readable and stable.

### 7.2 Correct content width accounting

```ts
const paddingColumns = 2 * POPUP_PADDING_X
const contentWidth = Math.max(0, popupWidth - paddingColumns)
```

Why:

- These popups are borderless; padding is the main width cost.
- Without subtracting padding, your padded lines will overflow and Ink may truncate.

### 7.3 “Opaque background” pattern

Most popups render inside `PopupSheet` (`src/tui/components/popups/PopupSheet.tsx`), which uses `BackgroundFill` to paint an opaque rectangle behind the content.

Inside the popup, we still compute:

```ts
const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
```

…and apply `backgroundProps` to each `<Text>` line, padding to `contentWidth`:

```ts
{
  padRight('Meta Instructions', contentWidth)
}
```

This keeps the popup fully opaque even when rendered in an absolute overlay.

### 7.4 Theme helpers vs direct props

The popup uses:

- `inkBackgroundColorProps(theme.popupBackground)`
- `inkColorProps(theme.accent)`
- `inkColorProps(theme.mutedText)`

This is the preferred approach.

### 7.5 Example changes (documentation-only)

#### Change popup background

You usually do this by changing theme tokens, not the component.

Example: create a custom theme JSON that changes popup background (and the shared `border` token used by bordered UI):

```json
{
  "defs": {
    "bg": "#0b0f14",
    "popup": "#1a2029",
    "border": "#6cb6ff",
    "text": "#e6edf3",
    "muted": "#9aa4b2",
    "accent": "#6cb6ff",
    "warning": "#f2cc60",
    "error": "#ff6b6b",
    "success": "#3fb950",
    "panel": "#111820",
    "selectionBg": 60
  },
  "theme": {
    "background": "bg",
    "text": "text",
    "mutedText": "muted",
    "border": "border",
    "accent": "accent",
    "accentText": "bg",
    "warning": "warning",
    "error": "error",
    "success": "success",
    "panelBackground": "panel",
    "popupBackground": "popup",
    "selectionBackground": "selectionBg",
    "selectionText": "text",
    "chipBackground": "panelBackground",
    "chipText": "text",
    "chipMutedText": "mutedText"
  }
}
```

Put it in either:

- `~/.config/prompt-maker-cli/themes/<name>.json`
- `<repo>/.prompt-maker-cli/themes/<name>.json`

Then select it via the theme popup (see `ThemePickerPopup`).

---

## 8) Common Customizations (Recipes)

### 8.1 Change popup background

Goal: all popups use a new background.

Best practice: change tokens, not components.

- Background: `popupBackground`

Where to do it:

- Built-ins: `src/tui/theme/builtins/pm-dark.ts` / `src/tui/theme/builtins/pm-light.ts`
- Or create a custom theme JSON in the user/project theme directories.

Note: popups are borderless after the cleanup. The `border` token still controls bordered UI like `src/tui/components/core/HelpOverlay.tsx`, `src/tui/components/core/Toast.tsx`, and `src/tui/components/core/CommandMenu.tsx`.

### 8.2 Change “accent” and “muted” text styling

Tokens:

- “Accent”: `accent`
- “Muted” text: `mutedText`
- Default text: `text`

Common places:

- Headings across screens/panels: `theme.accent`
  - `src/tui/AppContainer.tsx`
  - `src/tui/screens/test-runner/TestRunnerScreen.tsx` (re-exported by `src/tui/TestRunnerScreen.tsx`)
- Instructional/help text: `theme.mutedText`
  - `src/tui/components/core/HelpOverlay.tsx`
  - most popup footers

### 8.3 Adjust widths responsively based on terminal columns

This repo now has two common width-math patterns.

**Borderless sheets (most popups via `PopupSheet`)**

```ts
const { stdout } = useStdout()
const terminalColumns = stdout?.columns ?? 80

const popupWidth = clamp(terminalColumns - 10, 40, 72)

const paddingColumns = 2 * POPUP_PADDING_X
const contentWidth = Math.max(0, popupWidth - paddingColumns)
```

**Bordered boxes (help overlay, command menu, toasts)**

```ts
const borderColumns = 2
const paddingColumns = 2
const contentWidth = Math.max(0, boxWidth - borderColumns - paddingColumns)
```

Guidelines:

- Subtract padding for `PopupSheet` popups; subtract **border + padding** for bordered boxes.
- Clamp widths to keep UX stable.
- Prefer manual padding/truncation (stable layout) over uncontrolled wrapping in overlays.

### 8.4 Add a new theme token (slot)

You only need this when you want a new semantic role that cannot be expressed with existing tokens.

Example goal: introduce a dedicated `dimOverlayBackground` token (instead of reusing `background`).

Steps (repo-accurate locations):

1. Add the slot to the union in `src/tui/theme/theme-types.ts`:

```ts
export type ThemeSlot =
  | 'background'
  // ...
  | 'chipMutedText'
  | 'dimOverlayBackground'
```

2. Add it to `REQUIRED_THEME_SLOTS` in `src/tui/theme/theme-types.ts`.

3. Update built-in themes to include it:

- `src/tui/theme/builtins/pm-dark.ts`
- `src/tui/theme/builtins/pm-light.ts`

4. Update any theme examples you ship (optional but recommended):

- `src/tui/theme/examples/ocean-example.json`

5. Use it in UI code (example, popup overlay in `src/tui/screens/command/CommandScreenImpl.tsx`).

Why this matters:

- Theme JSON validation in `src/tui/theme/theme-loader.ts` enforces required slots based on `REQUIRED_THEME_SLOTS`.
- Theme resolution in `src/tui/theme/theme-resolver.ts` resolves required slots.

### 8.5 Create a new theme JSON

Fast path:

1. Copy `src/tui/theme/examples/ocean-example.json`.
2. Save as:
   - `~/.config/prompt-maker-cli/themes/my-theme.json`
   - or `<repo>/.prompt-maker-cli/themes/my-theme.json`
3. Restart the TUI and select it in the theme picker popup.

Tips:

- Use `defs` for reusable named colors.
- Use references (`"popupBackground": "panelBackground"`) to keep things consistent.
- Use variants to support `system` mode:

```json
"bg": { "dark": "#10141a", "light": "#fafcff" }
```

---

## 9) Troubleshooting & Pitfalls

### 9.1 Input routing: styling can hide focus cues

From `docs/tui-design.md` and `docs/prompt-maker-cli-tui-encyclopedia.md`:

- Help overlay should visually read as “top layer”.
- Popups should clearly indicate they own input.

If you make backgrounds too similar (e.g., `popupBackground` == `background` and borders muted), users may not understand where focus is.

### 9.2 Overlays need explicit background painting

Ink won’t always repaint “empty cells” in absolute overlays.

Symptoms:

- Toasts or popups appear with “holes” or underlying text bleeding through.

Fix pattern:

- Apply `backgroundColor` to each `<Text>`.
- Pad each line to full width.

Examples:

- `src/tui/components/core/Toast.tsx`
- `src/tui/components/popups/InstructionsPopup.tsx`

### 9.3 Performance: avoid heavy work in render

From `src/tui/DEVELOPER_NOTE.md`:

- Avoid recreating arrays/objects as props.
- Memoize derived arrays when it prevents meaningful work.
- Use reducers for state transitions.

Styling-specific advice:

- Don’t build large padded string arrays in render unless memoized.
- Prefer `useMemo` for expensive formatting of lines (see `ScrollableOutput`, `CommandMenu`, `ListPopup`).

### 9.4 Cross-terminal differences

- Not all terminals support true color the same way.
- Unicode border glyphs may vary.
- Width calculations can break with wide characters.

When changing themes:

- Test on a light and dark terminal.
- Test with different font/renderers if possible.

### 9.5 Hard-coded colors exist in `OpencodeSpinner`

Most of the TUI uses `useTheme()` and theme tokens. One exception:

- `src/tui/components/OpencodeSpinner.tsx` uses hard-coded hex colors.

If you want fully themeable visuals, consider migrating this to theme tokens.

---

## 10) Safe Styling Change Checklist

Before you submit a styling change:

- Confirm you’re changing **tokens** (theme JSON / built-ins) rather than sprinkling hard-coded colors.
- If you touched popups or overlays:
  - Verify full opacity: backgrounds paint correctly (no “holes”).
  - Verify width math: `contentWidth` subtracts padding (and border columns when the component draws a border).
- If you touched layout/padding:
  - Re-check any components that assume `AppContainer` padding when computing widths.
- Verify input routing cues still make sense:
  - Help overlay obviously looks like a modal.
  - Popups look like the active layer.
- Keep render paths light:
  - Use `useMemo` for expensive padded line arrays.

---

### Appendix: Quick “where do I change…” index

- Global app background: `background` token (themes) → used in `src/tui/AppContainer.tsx` and `src/tui/screens/command/CommandScreenImpl.tsx`
- Panel background (command menu + input bar): `panelBackground` token (history uses `background`)
- Popup background: `popupBackground` token
- Border colors: `border` token (or `warning`/`error` for state)
- Selected row styling: `selectionBackground` + `selectionText`
- Unfocused selection / chip styling: `chipBackground` + `chipText` (+ `chipMutedText`)
