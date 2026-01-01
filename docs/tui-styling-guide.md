# TUI Styling Guide (Ink) — prompt-maker

This guide teaches **Ink styling fundamentals** and then explains **exactly how styling and theming work in this repo**, with **screen-by-screen** and **component-by-component** pointers to the files you should change.

It is grounded in these repo docs and code:

- UX goals + input routing invariants: `docs/tui-design.md`
- Architecture + performance notes: `src/tui/DEVELOPER_NOTE.md`
- Boot sequence + module map: `docs/prompt-maker-cli-tui-encyclopedia.md`
- Worked example popup: `src/tui/components/popups/InstructionsPopup.tsx`

> Note on paths: `src/tui/DEVELOPER_NOTE.md` refers to `apps/prompt-maker-cli/src/tui/**`, but that directory does **not** exist in this checkout. The authoritative TUI implementation is under `src/tui/**`.

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

| Screen               | Entry                                                   | Implementation directory        |
| -------------------- | ------------------------------------------------------- | ------------------------------- |
| Generate (“Command”) | `src/tui/screens/command/CommandScreen.tsx` (re-export) | `src/tui/screens/command/*`     |
| Test Runner          | `src/tui/screens/test-runner/TestRunnerScreen.tsx`      | `src/tui/screens/test-runner/*` |

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

**Entry:** `src/tui/screens/command/CommandScreen.tsx`

**Main implementation:** `src/tui/screens/command/CommandScreenImpl.tsx`

Styled regions:

1. **Main background**: `theme.background`.
2. **History panel**: `HistoryPane` uses `theme.panelBackground`.
3. **Command palette panel**: `CommandMenuPane` → `CommandMenu` uses `theme.panelBackground`, selection tokens.
4. **Input bar**: `CommandInput` → `InputBar` uses `theme.panelBackground`, border uses either `theme.border` or `theme.warning`.
5. **Popup overlay**:
   - A full-screen translucent-ish panel fill using `BackgroundFill` with `theme.panelBackground`.
   - A centered popup (one of `components/popups/*`).

Key files (styling focus):

- History area wrapper: `src/tui/screens/command/components/HistoryPane.tsx`
- Command palette wrapper: `src/tui/screens/command/components/CommandMenuPane.tsx`
- Input wrapper: `src/tui/screens/command/components/CommandInput.tsx`
- Popup selection switch: `src/tui/screens/command/components/PopupArea.tsx`

Safe modifications:

- To change the _history panel background_: use `panelBackground` token.
- To change selection styling in command palette: use `selectionBackground`/`selectionText`.
- To change the popup “dim” overlay, adjust `panelBackground` (used by `BackgroundFill` overlay).

Terminal-width pitfalls (from `CommandScreenImpl.tsx`):

- `AppContainer` uses `paddingX={2}`; the command screen compensates when filling backgrounds to avoid Ink truncating with `...`.

### 5.3 Test Runner screen

**Entry:** `src/tui/screens/test-runner/TestRunnerScreen.tsx`

Styled regions:

- Headings (`Tests`, `Summary`, `Recent Logs`) use `theme.accent`.
- Summary uses `theme.success` and `theme.error`.
- Logs use `theme.mutedText`/`warning`/`error`.
- File input uses a bordered card with `theme.panelBackground` and a focus border using `theme.accent`.

Key styled files:

- Screen orchestration: `src/tui/screens/test-runner/TestRunnerScreen.tsx`
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
  - Uses `backgroundColor` prop (often `panelBackground` or `popupBackground`).

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

#### `StatusIndicators`

- File: `src/tui/components/core/StatusIndicators.tsx`
- Purpose: status chip formatting.
- Styling:
  - Label uses `mutedText`.
  - Segment value uses a style mapping to tokens (`success`, `warning`, `danger` → `error`, etc.).

#### `PastedSnippetCard`

- File: `src/tui/components/core/PastedSnippetCard.tsx`
- Purpose: display a captured paste snippet in a popup-like card.
- Styling:
  - Background: `popupBackground`
  - Border: `border`
  - Label: `warning` (acts like a “title”)

### 6.2 Panels (`src/tui/*.tsx`)

These are “sidebar/panel” style components (not currently categorized under `components/core/*`). They follow the same token conventions.

#### `MediaPanel`

- File: `src/tui/MediaPanel.tsx`
- Styling:
  - Card background: `panelBackground`
  - Border: `border`
  - Focused section header: `accent`
  - Highlighted list entries: `warning`
  - Empty/instructions text: `mutedText`

### 6.3 Popups (`src/tui/components/popups/*`)

Popups share a consistent “card” style:

- `borderStyle="round"`
- `width` derived from terminal columns using `clamp(terminalColumns - 10, 40, 72)`
- A `contentWidth` computed by subtracting border + padding
- `backgroundProps = inkBackgroundColorProps(theme.popupBackground)`
- Header in `theme.accent`, footer in `theme.mutedText`
- Selection uses `selectionText` + `selectionBackground`

Popups are selected/rendered in `src/tui/screens/command/components/PopupArea.tsx`.

Below is a quick inventory with styling notes.

| Popup                      | File                                              | Main tokens                                                                                                  |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Model selection            | `src/tui/components/popups/ModelPopup.tsx`        | `popupBackground`, `border`, `accent`, `mutedText`, `selection*`, plus `warning`/`error` for provider status |
| Generic list + suggestions | `src/tui/components/popups/ListPopup.tsx`         | `popupBackground`, `border`, `mutedText`, `text`, `selection*`, `chip*` for “unfocused selection”            |
| Intent file chooser        | `src/tui/components/popups/IntentFilePopup.tsx`   | `popupBackground`, `border`, `mutedText`, `selection*`, `chip*`                                              |
| Instructions               | `src/tui/components/popups/InstructionsPopup.tsx` | `popupBackground`, `border`, `accent`, `mutedText`                                                           |
| Toggle on/off              | `src/tui/components/popups/TogglePopup.tsx`       | `popupBackground`, `border`, `accent`, `mutedText`, `selection*`                                             |
| Series intent              | `src/tui/components/popups/SeriesIntentPopup.tsx` | `popupBackground`, `border`, `accent`, `mutedText`                                                           |
| Prompt test run            | `src/tui/components/popups/TestPopup.tsx`         | `popupBackground`, `border`, `accent`, `mutedText`                                                           |
| Token usage                | `src/tui/components/popups/TokenUsagePopup.tsx`   | `popupBackground`, `border`, `accent`, `text`, `mutedText`                                                   |
| Settings display           | `src/tui/components/popups/SettingsPopup.tsx`     | `popupBackground`, `border`, `accent`, `mutedText`, `success`/`warning`/`error`                              |
| Theme picker               | `src/tui/components/popups/ThemePickerPopup.tsx`  | `popupBackground`, `border`, `accent`, `mutedText`, `selection*`, `error`                                    |
| Theme mode picker          | `src/tui/components/popups/ThemeModePopup.tsx`    | `popupBackground`, `border`, `accent`, `mutedText`, `selection*`, `error`                                    |
| Reasoning view             | `src/tui/components/popups/ReasoningPopup.tsx`    | `popupBackground`, `border`, `accent`, `mutedText`, and `ScrollableOutput`                                   |
| Smart root chooser         | `src/tui/components/popups/SmartPopup.tsx`        | `popupBackground`, `border`, `accent`, `mutedText`, `selection*`, `chip*`                                    |

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
const borderColumns = 2
const paddingColumns = 2
const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
```

Why:

- Terminal borders consume columns.
- Padding consumes columns.
- Without subtracting, your padded lines will overflow and Ink may truncate.

### 7.3 “Opaque background” pattern

The popup computes:

```ts
const backgroundProps = inkBackgroundColorProps(theme.popupBackground)
```

Then spreads `backgroundProps` onto both `<Box>` and _each_ `<Text>` line.

This matters because:

- In overlay situations (`position="absolute"`), Ink won’t necessarily repaint underlying cells unless you print background-colored spaces.
- This repo ensures the popup looks like a solid rectangle by **padding** each line:

```ts
{
  padRight('Meta Instructions', contentWidth)
}
```

### 7.4 Theme helpers vs direct props

The popup uses:

- `inkBorderColorProps(theme.border)`
- `inkColorProps(theme.accent)`
- `inkColorProps(theme.mutedText)`

This is the preferred approach.

### 7.5 Example changes (documentation-only)

#### Change popup background and border

You usually do this by changing theme tokens, not the component.

Example: create a custom theme JSON that changes popup background and border:

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

### 8.1 Change popup background/border colors

Goal: all popups use a new background/border.

Best practice: change tokens, not components.

- Background: `popupBackground`
- Border: `border`

Where to do it:

- Built-ins: `src/tui/theme/builtins/pm-dark.ts` / `src/tui/theme/builtins/pm-light.ts`
- Or create a custom theme JSON in the user/project theme directories.

### 8.2 Change “accent” and “muted” text styling

Tokens:

- “Accent”: `accent`
- “Muted” text: `mutedText`
- Default text: `text`

Common places:

- Headings across screens/panels: `theme.accent`
  - `src/tui/AppContainer.tsx`
  - `src/tui/screens/test-runner/TestRunnerScreen.tsx`
- Instructional/help text: `theme.mutedText`
  - `src/tui/components/core/HelpOverlay.tsx`
  - most popup footers

### 8.3 Adjust widths responsively based on terminal columns

Pattern (used in many components):

```ts
const { stdout } = useStdout()
const terminalColumns = stdout?.columns ?? 80

const popupWidth = clamp(terminalColumns - 10, 40, 72)

const borderColumns = 2
const paddingColumns = 2
const contentWidth = Math.max(0, popupWidth - borderColumns - paddingColumns)
```

Guidelines:

- Always subtract **both** border and padding.
- Clamp widths to keep UX stable.
- Prefer padding/truncation to uncontrolled wrapping for popups.

### 8.4 Add a new theme token (slot)

You only need this when you want a new semantic role that cannot be expressed with existing tokens.

Example goal: introduce a dedicated `dimOverlayBackground` token (instead of reusing `panelBackground`).

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

If you want fully themeable visuals, consider migrating this to theme tokens (and optionally track it via `src/tui/theme/color-audit.ts`).

---

## 10) Safe Styling Change Checklist

Before you submit a styling change:

- Confirm you’re changing **tokens** (theme JSON / built-ins) rather than sprinkling hard-coded colors.
- If you touched popups or overlays:
  - Verify full opacity: backgrounds paint correctly (no “holes”).
  - Verify width math: `contentWidth` subtracts border + padding.
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
- Panel background (history, command menu, side panels): `panelBackground` token
- Popup background: `popupBackground` token
- Border colors: `border` token (or `warning`/`error` for state)
- Selected row styling: `selectionBackground` + `selectionText`
- Unfocused selection / chip styling: `chipBackground` + `chipText` (+ `chipMutedText`)
