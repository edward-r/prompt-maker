# Running Prompt Maker CLI TUI inside Neovim via `sidekick.nvim` (Streaming + Transport)

## 1. Title + Purpose

This document is a **design + implementation hand-off guide** for building a Neovim integration that runs **Prompt Maker CLI’s Ink TUI** (`prompt-maker-cli ui`) inside a **sidekick.nvim-managed terminal**, while also using Prompt Maker’s **interactive transport** and **JSONL streaming events** for a richer UX outside the terminal.

The target result is a plugin/module in your Neovim repo that:

- Opens the Prompt Maker Ink TUI in a Sidekick terminal window.
- Creates (and owns) a per-session `--interactive-transport` socket/pipe.
- Connects a Neovim-side transport client to:
  - parse streaming JSONL events for progress/telemetry/results
  - send newline-delimited JSON commands (`refine` / `finish`) to drive refinement loops
- Surfaces structured status and the final prompt into buffers/windows (without scraping terminal output).

**Authoritative Prompt Maker references in this repo**:

- `docs/neovim-plugin-integration.md` (integration flags and workflow guidance)
- `docs/prompt-maker-cli-tui-encyclopedia.md` (TUI behavior + transport notes)
- `docs/tui-design.md` (TUI input routing invariants)
- `src/generate/types.ts` (exact JSONL event schema)
- `src/generate/interactive-transport.ts` (exact transport command schema + lifecycle)

**Relevant Sidekick references (upstream)**:

- `folke/sidekick.nvim/lua/sidekick/cli/terminal.lua` (terminal job lifecycle + keymaps)
- `folke/sidekick.nvim/lua/sidekick/cli/session/init.lua` (session backend model)
- `folke/sidekick.nvim/lua/sidekick/cli/watch.lua` (file watching for external changes)
- `folke/sidekick.nvim/lua/sidekick/cli/actions.lua` (how terminal keymaps dispatch actions)

---

## 2. Glossary

- **Prompt Maker / PMC**: `prompt-maker-cli`, the Node-based CLI.
- **Ink TUI**: Prompt Maker’s terminal UI (`prompt-maker-cli ui`).
- **Sidekick Terminal**: Neovim terminal window created/managed by sidekick.nvim.
- **JSONL stream**: newline-delimited JSON “events” emitted by Prompt Maker (`--stream jsonl`) or mirrored over the transport tap.
- **Interactive transport**: local IPC channel created by PMC server (`--interactive-transport <path>`) that accepts newline-delimited JSON commands and mirrors events.
- **Session**: one running instance of Prompt Maker + its transport connection.
- **Rendered prompt**: the final prompt string after applying a context template.

---

## 3. Requirements & Non-Goals

### Requirements

- Run **Ink TUI** inside Neovim using Sidekick’s terminal/session abstractions.
- Use **interactive transport** to avoid scraping the terminal buffer for state/results.
- Use **JSONL events** to drive Neovim UI updates.
- Must respect Prompt Maker constraints from `docs/neovim-plugin-integration.md`:
  - Prefer `--quiet --stream jsonl` for editor integrations.
  - Set token budgets (`--max-input-tokens`/`--max-context-tokens`) and handle `context.overflow` for predictable behavior with large contexts.
  - `--json` **cannot** be used with interactive (`--interactive` or `--interactive-transport`).
  - `--interactive-transport` accepts newline-delimited JSON commands `{ "type": "refine", "instruction": "..." }` and `{ "type": "finish" }`.
  - When extracting the final prompt, use fallback: `renderedPrompt` → `polishedPrompt` → `prompt`.
- Cross-platform support:
  - Unix socket path on macOS/Linux
  - Windows named pipes (`\\.\pipe\...`)
  - Cleanup of stale socket files before launch (non-Windows only).

### Non-Goals

- Reimplement Prompt Maker’s internal TUI UX in Lua.
- Scrape the Ink terminal UI for prompts/state.
- Make network calls from tests (use fixtures/stubs).
- Store provider API keys in plugin state; rely on environment variables or Prompt Maker’s config file (`~/.config/prompt-maker-cli/config.json`).

---

## 4. UX Overview (user stories + keymaps)

### Core user stories

1. **Open the TUI**
   - As a user, I run `:Sidekick` / keymap and Prompt Maker’s TUI opens in a Sidekick terminal split.

2. **See progress and telemetry outside the terminal**
   - As a user, I see current phase (URL fetch / smart context / generate / polish), token totals, and upload progress in Neovim notifications / statusline.

3. **Refine from Neovim**
   - As a user, I can send a refine instruction from a Neovim prompt (floating input), without focusing the terminal.

4. **Finish and insert**
   - As a user, I can press a key to send `finish`, then the plugin opens a scratch buffer containing the final prompt and optionally inserts it into my current buffer.

5. **Close cleanly**
   - As a user, closing the terminal detaches the transport client, stops timers, and deletes any transport socket file.

### Suggested keymaps (defaults)

These are **suggestions**; integrate with your repo’s conventions.

- `:Sidekick cli toggle name=pmc` (or a custom command) → open/focus the TUI terminal
- `<leader>pr` → “Refine…” (`vim.ui.input`), send transport `refine`
- `<leader>pf` → “Finish” (`finish`), focus the “Prompt Result” buffer
- `<leader>po` → open a “Prompt Maker Status” floating window
- `<leader>pc` → copy final prompt to clipboard (Neovim-side; do not rely on `--copy`)

---

## 5. Architecture (diagram + components)

### High-level diagram

```text
+-------------------+         +------------------------------+
|     Neovim        |         |   sidekick.nvim terminal      |
|                   |         |   (term=true job)             |
|  - Commands       |  open   |                              |
|  - Status UI      +-------->+  prompt-maker-cli ui ...      |
|  - Transport      |         |  (Ink raw-mode TUI)           |
|    client         |         +------------------------------+
|        ^          |
|        | JSONL    |
|        | events   |
|        |          |
|  connect/send     |
|   over socket/pipe|
+--------+----------+
         |
         v
+------------------------------+
| prompt-maker-cli transport   |
| server (--interactive-transport)
|  - accepts NDJSON commands   |
|  - writes JSONL events back  |
+------------------------------+
```

### Components you will implement

1. **Session manager**
   - Owns per-session identifiers, transport path selection, and cleanup.

2. **Sidekick launcher**
   - Starts/attaches a Sidekick terminal session running `prompt-maker-cli ui --interactive-transport <path>`.

3. **Transport client**
   - Connects to the transport server (socket/pipe), reads JSONL events, and sends NDJSON commands.

4. **Event router**
   - Parses JSON lines into Lua tables and dispatches handlers.

5. **Neovim UI surfaces**
   - Statusline integration hooks, notifications, optional floating window, and a scratch buffer for final output.

---

## 6. CLI Invocation & Modes (exact commands)

### Mode A (Primary): Ink TUI in Sidekick terminal + transport tap for events

Run **Ink TUI** in a terminal, but drive out-of-band UX using the transport:

```bash
prompt-maker-cli ui --interactive-transport <transport_path>
```

Notes:

- `ui` only parses `--interactive-transport` (see `docs/prompt-maker-cli-tui-encyclopedia.md`). Do not depend on `ui --help`.
- Token budgets (`--max-input-tokens`, `--max-context-tokens`, `--context-overflow`) are **generate-mode flags** and are not parsed by `ui`.
  - To use budgets with the TUI, set defaults via config under `promptGenerator`:

    ```json
    {
      "promptGenerator": {
        "maxInputTokens": 12000,
        "maxContextTokens": 8000,
        "contextOverflowStrategy": "drop-smart"
      }
    }
    ```

- The TUI requires a real TTY; sidekick.nvim’s terminal uses `term=true` (`folke/sidekick.nvim/lua/sidekick/cli/terminal.lua`).

### Mode B (Optional): Headless generate loop (no Ink), still inside Sidekick terminal

If you want a non-TUI fallback that still streams progress deterministically:

```bash
prompt-maker-cli "<intent>" \
  --quiet \
  --stream jsonl \
  --interactive-transport <transport_path> \
  --context-template nvim \
  --max-context-tokens 8000 \
  --context-overflow drop-smart
```

Important constraints from Prompt Maker:

- `--json` cannot be combined with interactive mode (`--interactive` or `--interactive-transport`) (see `docs/neovim-plugin-integration.md` and `docs/prompt-maker-cli-tui-encyclopedia.md`).
- Therefore, your plugin must treat `generation.final` (JSONL) as the “final payload” source.

### Environment and binary resolution

- Binary is `prompt-maker-cli` (see `README.md`).
- Credentials are loaded from env vars or config file; your plugin should not try to pass keys directly.

---

## 7. Streaming (JSONL) Event Handling

### Wire format (exact)

Prompt Maker stream events are JSON objects **one per line**:

- Always include:
  - `event` (string)
  - `timestamp` (ISO string)
- Plus event-specific payload fields.

Schema source: `src/generate/types.ts` and serialization in `src/generate/stream.ts`.

Example line:

```json
{
  "event": "progress.update",
  "timestamp": "2026-01-03T12:00:00.000Z",
  "label": "Generating...",
  "state": "start",
  "scope": "generate"
}
```

### Relevant event types and expected plugin behavior

Below is the minimal mapping you should implement; expand as needed.

#### `transport.listening`

Payload: `{ path: string }`

- Mark session transport server as ready.
- If the client isn’t connected yet, attempt `connect()` with retry/backoff.

#### `transport.client.connected` / `transport.client.disconnected`

Payload: `{ status: 'connected'|'disconnected' }`

- Update statusline state.
- On disconnect: disable refine/finish UI and stop reading loop.

#### `transport.error`

Not part of the typed stream union, but written by the transport server as:

```json
{ "event": "transport.error", "message": "..." }
```

- Surface with `vim.notify(..., vim.log.levels.ERROR)`.
- Consider showing a “last transport error” in your status window.

#### `progress.update`

Payload:

- `label: string`
- `state: 'start'|'update'|'stop'`
- `scope?: 'url'|'smart'|'generate'|'polish'|'generic'`

Plugin actions:

- Maintain a simple “current phase” state machine:
  - `start`: show spinner/indicator
  - `update`: update label
  - `stop`: clear spinner
- UI options:
  - Notifications on `start`/`stop` only
  - Statusline/virtual text updates on every `update`

#### `context.telemetry`

Payload: `{ telemetry: { totalTokens, intentTokens, fileTokens, systemTokens, files:[{path,tokens}...] } }`

Plugin actions:

- Persist latest telemetry in session state.
- If token counts exceed a threshold, show warning (see “Security & Safety”).
- Optional: render top-N file token contributors in a floating window.

#### `context.overflow`

Emitted when token budgets are enabled and the CLI drops one or more **text** context entries to satisfy the budget.

Payload includes:

- `strategy`: `fail | drop-smart | drop-url | drop-largest | drop-oldest`
- `before`: token telemetry before trimming
- `after`: token telemetry after trimming
- `droppedPaths`: `[{ path, source }]` describing removed context entries

Plugin actions:

- Notify the user that some context was dropped (this can materially change results).
- Reconcile any “attached context” UI with `droppedPaths`.
- Consider offering a one-click re-run with a larger budget or a different overflow strategy.

#### `upload.state`

Payload: `{ state: 'start'|'finish', detail: { kind: 'image'|'video', filePath: string } }`

Plugin actions:

- Indicate uploads in statusline; discourage closing session while uploads active.

#### `generation.iteration.start`

Payload includes: `{ iteration, intent, model, interactive, inputTokens, refinements, latestRefinement? }`

Plugin actions:

- Update “iteration N” status.
- If `latestRefinement` exists, append it to a “refinement log” buffer.

#### `generation.iteration.complete`

Payload includes: `{ iteration, prompt, tokens, reasoningTokens? }`

Plugin actions:

- Optionally show “prompt preview” (not the whole prompt by default; it can be huge).

#### `interactive.state`

Payload: `{ phase:'start'|'prompt'|'refine'|'complete', iteration:number }`

Plugin actions:

- Use `phase` to enable/disable refine/finish controls:
  - `start`/`prompt`: allow refine + finish
  - `refine`: disable input until next `prompt`
  - `complete`: finalization UI (open prompt buffer)

#### `interactive.awaiting`

Payload: `{ mode:'transport'|'tty'|'none' }`

Plugin actions:

- If mode is `transport`, show “awaiting refine/finish” indicator.

#### `generation.final`

Payload: `{ result: GenerateJsonPayload }`

Plugin actions:

- Extract the final prompt text using:
  1. `result.renderedPrompt` (preferred)
  2. else `result.polishedPrompt`
  3. else `result.prompt`
- Open a scratch buffer and populate it with the extracted text.
- Optionally:
  - set filetype `markdown`
  - set buffer name like `Prompt Maker: <timestamp>`
  - provide actions: copy, insert into current buffer, save to file

---

## 8. Interactive Transport Protocol (client/server lifecycle)

### Server behavior (Prompt Maker)

Prompt Maker creates a local `net.Server` on the given `--interactive-transport` path (see `src/generate/interactive-transport.ts`).

- On Unix: PMC deletes any existing socket file at that path before binding.
- On Windows: the path must start with `\\.\pipe\`.

Once a client connects:

- PMC reads newline-delimited JSON commands.
- PMC writes JSONL events back to the same socket.

### Client responsibilities (your plugin)

- Connect to the transport server and keep reading lines until disconnect.
- Provide a `send_command(cmd)` API that serializes JSON + appends `\n`.
- Reconnect strategy:
  - If you connect before the server is listening, retry for up to `N` seconds.
  - If you disconnect mid-session, stop retries unless the terminal process is still running.

### Command schema (exact)

Send **one JSON object per line**:

- Refine:

```json
{ "type": "refine", "instruction": "Make it shorter" }
```

- Finish:

```json
{ "type": "finish" }
```

Rules from server implementation:

- `refine.instruction` must be a non-empty string after trimming.
- Unknown payloads yield `transport.error` event.

### Lifecycle sequencing (recommended)

1. Compute transport path.
2. Launch Sidekick terminal running `prompt-maker-cli ui --interactive-transport <path>`.
3. Wait for `transport.listening` OR retry-connect until it succeeds.
4. When connected, start JSONL reader loop.
5. On Neovim exit, terminal close, or user “stop session”:
   - Close client socket.
   - Delete stale Unix socket file (best-effort).

---

## 9. Integration with sidekick.nvim (what to reuse, what to extend)

### What to reuse

- **Terminal lifecycle + window management**
  - Sidekick’s terminal wrapper (`folke/sidekick.nvim/lua/sidekick/cli/terminal.lua`) already:
    - creates a scratch terminal buffer/window
    - starts jobs with `term=true` (needed for Ink)
    - manages focus/hide/toggle
    - has a send queue (`Terminal:send`) and keymap wiring

- **Session model**
  - Sidekick’s session layer (`folke/sidekick.nvim/lua/sidekick/cli/session/init.lua`) gives you:
    - stable session IDs per tool+cwd
    - attach/detach semantics
    - mux backends (tmux/zellij) if users enable them

- **File watching (optional)**
  - If the TUI writes files (e.g., `/series` output folders), you can enable sidekick watcher (`folke/sidekick.nvim/lua/sidekick/cli/watch.lua`) to refresh buffers automatically.

### What to extend (recommended)

Sidekick’s terminal is not designed to parse job stdout when `term=true`. For this integration:

- Treat the terminal as **display + interactive input only**.
- Treat the transport socket as your **machine-readable event stream**.

Recommended extension points:

1. **Add a dedicated tool entry**
   - In the user config: `cli.tools.pmc = { cmd = { "prompt-maker-cli", "ui" } }`.

2. **Add a “PMC adapter” module** (in your repo)
   - Wrap `sidekick.cli` to start/attach a session with a **modified cmd** that injects `--interactive-transport <path>`.
   - Keep the rest of Sidekick untouched.

3. **Emit User events**
   - Sidekick uses `Util.emit(...)` internally (see session attach/detach); your integration can emit `User` autocmd events like:
     - `User SidekickPmcEvent` (with payload in `vim.g`/in module state)
     - or direct `vim.api.nvim_exec_autocmds("User", { pattern = "SidekickPmcEvent", data = ... })`

---

## 10. Neovim UI Plan (buffers, windows, statusline, notifications)

### Recommended UI surfaces

1. **Statusline component**
   - Expose `require("pmc").status()` returning a short string like:
     - `PMC: idle`
     - `PMC: generating (2)`
     - `PMC: awaiting refine`
     - `PMC: uploads 1`

2. **Notifications**
   - Use `vim.notify` sparingly:
     - on `transport.error`
     - on `generation.final`
     - on fatal disconnects

3. **Prompt result buffer**
   - Create a scratch buffer (unlisted or listed depending on your preference) containing the final prompt.
   - Provide buffer-local mappings:
     - `y` copy to clipboard
     - `p` paste/insert into original buffer
     - `q` close

4. **Telemetry window (optional)**
   - A floating window rendering token totals and top-N files.

### Interaction design rules

- Never block Neovim UI while waiting for transport events.
  - Use `vim.uv` + `vim.schedule` to apply UI updates.
- Avoid flooding with progress updates.
  - Debounce `progress.update` rendering.

---

## 11. Configuration Spec (Lua table schema + defaults)

Define a dedicated config table (separate from sidekick’s own config) so the integration can be used without forking sidekick.nvim.

```lua
---@class PmcSidekickConfig
---@field enabled boolean
---@field tool_name string           -- sidekick cli tool name (default: "pmc")
---@field bin string|string[]?       -- override cmd[1] (binary) or full cmd
---@field cwd fun():string?          -- resolve cwd for session
---@field env table<string,string|false>? -- extra env vars; false clears
---@field transport
---@field transport.dir fun():string -- unix socket dir selection
---@field transport.name fun(ctx:{pid:number,cwd:string}):string -- filename/pipe name
---@field transport.connect_timeout_ms number
---@field transport.retry_interval_ms number
---@field ui
---@field ui.open_result_on_final boolean
---@field ui.result_filetype string
---@field ui.notify_level integer
---@field ui.token_warn_threshold number
---@field ui.token_error_threshold number
---@field ui.progress_debounce_ms number
local defaults = {
  enabled = true,
  tool_name = "pmc",
  bin = nil,
  cwd = function() return vim.fn.getcwd(0) end,
  env = {},
  transport = {
    dir = function()
      -- Prefer a per-user runtime dir if available.
      -- stdpath('run') exists on newer Neovim; otherwise fall back to tempname().
      return (vim.fn.has("win32") == 1) and "" or (vim.fn.stdpath("run") or vim.loop.os_tmpdir())
    end,
    name = function(ctx)
      return ("pmc-nvim-%d-%s.sock"):format(ctx.pid, vim.fn.sha256(ctx.cwd):sub(1, 8))
    end,
    connect_timeout_ms = 8000,
    retry_interval_ms = 100,
  },
  ui = {
    open_result_on_final = true,
    result_filetype = "markdown",
    notify_level = vim.log.levels.INFO,
    token_warn_threshold = 30000,
    token_error_threshold = 60000,
    progress_debounce_ms = 50,
  },
}
```

Notes:

- For Windows, use a named pipe path:
  - `\\.\pipe\pmc-nvim-<pid>-<hash>`
- For Unix, compute a socket path under `stdpath('run')` or `os_tmpdir()`.
- Always avoid collisions by including `vim.fn.getpid()` and a cwd hash.

---

## 12. Implementation Plan (files/modules + pseudocode)

This plan assumes you implement this in your Neovim repo as a small plugin/module that depends on sidekick.nvim.

### Suggested module layout

- `lua/pmc_sidekick/init.lua`
  - `setup(opts)`
  - user commands + keymaps

- `lua/pmc_sidekick/session.lua`
  - create/start/stop a session
  - store state: terminal session id, transport path, telemetry, etc.

- `lua/pmc_sidekick/transport.lua`
  - connect/read/write
  - jsonl decoder

- `lua/pmc_sidekick/events.lua`
  - event dispatch table: `handlers[event](session, payload)`

- `lua/pmc_sidekick/ui.lua`
  - open result buffer
  - status window
  - notifications

- `lua/pmc_sidekick/util.lua`
  - path helpers
  - debounce
  - safe json decode

### Session state machine

Keep a single Lua table per running session:

```lua
---@class PmcSession
---@field id string
---@field cwd string
---@field transport_path string
---@field terminal any?              -- sidekick terminal/session handle
---@field client any?                -- uv pipe/tcp handle
---@field status {phase?:string, label?:string, iteration?:number, connected?:boolean}
---@field telemetry table?           -- from context.telemetry
---@field final_payload table?       -- from generation.final
---@field closed boolean
```

### Starting the TUI session

Key behavior: start Sidekick terminal with a cmd including `--interactive-transport`.

Pseudocode:

```lua
local Sidekick = require("sidekick.cli")
local Session = require("sidekick.cli.session")

function M.start()
  local cwd = config.cwd()
  local transport_path = Transport.make_path(cwd)

  -- Ensure the tool exists in sidekick config: cli.tools[tool_name]
  -- Then clone/override cmd to append args.
  local base_tool = require("sidekick.config").get_tool(config.tool_name)
  local tool = base_tool:clone({
    cmd = { "prompt-maker-cli", "ui", "--interactive-transport", transport_path },
    env = config.env,
  })

  local session = Session.new({ tool = tool, cwd = cwd, backend = "terminal" })
  require("sidekick.cli.session").attach(session)

  -- Now connect transport client.
  Transport.connect(session, transport_path)
end
```

Implementation detail:

- Sidekick’s `Session.new` normalizes cwd and manages IDs (`folke/sidekick.nvim/lua/sidekick/cli/session/init.lua`).
- Sidekick’s terminal backend uses `jobstart(..., { term = true })` to provide a real TTY (`folke/sidekick.nvim/lua/sidekick/cli/terminal.lua`).

### Transport client: reading JSONL

Use `vim.uv`:

- On Unix: `uv.new_pipe(false)` and `pipe:connect(path, cb)`
- On Windows named pipe: `uv.new_pipe(true)` is typically required; validate with Neovim’s libuv.

Pseudocode:

```lua
local function decode_lines(chunk, state)
  state.buf = state.buf .. chunk
  while true do
    local i = state.buf:find("\n", 1, true)
    if not i then break end
    local line = vim.trim(state.buf:sub(1, i - 1))
    state.buf = state.buf:sub(i + 1)
    if line ~= "" then
      local ok, obj = pcall(vim.json.decode, line)
      if ok and type(obj) == "table" then
        Events.dispatch(session, obj)
      else
        -- optionally log parse failure
      end
    end
  end
end

function Transport.connect(session, path)
  -- retry connect until timeout
  -- once connected:
  client:read_start(function(err, chunk)
    if err then return Transport.on_error(session, err) end
    if not chunk then return Transport.on_eof(session) end
    decode_lines(chunk, session._decoder)
  end)
end

function Transport.send(session, obj)
  session.client:write(vim.json.encode(obj) .. "\n")
end
```

### Sending refine/finish from Neovim UI

- `refine`: prompt user via `vim.ui.input`, send `{ type="refine", instruction=input }`
- `finish`: send `{ type="finish" }`

Guardrails:

- Only allow if `session.status.connected == true`.
- Debounce refine: if `interactive.state.phase == "refine"`, block additional refine sends until next `prompt`.

### Extracting the final prompt

From `generation.final` event payload (`src/generate/types.ts`):

```lua
local result = event.result
local final = result.renderedPrompt or result.polishedPrompt or result.prompt
```

Create a buffer and store the full `result` as session.final_payload.

---

## 13. Testing Plan

Align with sidekick.nvim conventions (mini.test, fixtures, no network):

### Unit tests

1. **JSONL decoder**
   - Given arbitrary chunk boundaries, ensure the line splitter:
     - emits full decoded objects
     - tolerates empty lines
     - tolerates trailing partial lines

2. **Event mapping**
   - Feed sample events for each type and assert:
     - status transitions
     - telemetry storage
     - final prompt extraction

3. **Transport command serialization**
   - Ensure `refine`/`finish` commands are encoded as NDJSON lines.

### Integration tests (headless Neovim)

- Use `nvim --headless` and mini.test style similar to sidekick.nvim.
- Avoid running `prompt-maker-cli` in CI.
  - Instead, spawn a tiny Lua “fake server” using `vim.uv` that:
    - accepts a connection
    - sends JSONL events
    - asserts it received expected `refine`/`finish`

Fixtures

- Provide JSONL fixture files for:
  - a full successful run including `generation.final`
  - transport error line
  - token telemetry overflow case

---

## 14. Edge Cases & Failure Modes

- **Transport path collision (Unix)**
  - If the socket file exists from a previous crash, the server may fail to bind.
  - Best practice: delete stale socket file before launching.

- **Client connects too early**
  - Implement retry loop up to `connect_timeout_ms`.

- **Terminal closed while transport connected**
  - Detect terminal `TermClose` via sidekick terminal lifecycle and stop transport client.

- **Huge `generation.iteration.complete.prompt`**
  - Do not render full prompt in notifications.
  - Keep it in memory only; render on demand.

- **Uploads in progress**
  - Use `upload.state` counters; warn before stopping session if uploads are active.

- **Interactive mode mismatch**
  - If the TUI is used normally, it may not be “awaiting transport” at all times.
  - Only enable refine/finish UI when you observe `interactive.awaiting.mode == "transport"`.

---

## 15. Security/Privacy Considerations

- Never persist API keys; do not ask users to put secrets in config committed to git.
- Do not auto-read unbounded files.
  - If your plugin provides “attach buffer/file” helpers, enforce size caps (Prompt Maker’s own caps are described in `docs/neovim-plugin-integration.md`).
- Treat prompt output as potentially sensitive:
  - default to scratch buffers, not file writes
  - provide explicit “save to file” command
- Token telemetry thresholds:
  - If `telemetry.totalTokens` exceeds `token_warn_threshold`, show a warning.
  - If it exceeds `token_error_threshold`, consider prompting user to trim context.
  - If you observe `context.overflow`, show which files were dropped (`droppedPaths`) and consider offering a re-run with a higher budget.

---

## 16. Roadmap (MVP vs Phase 2)

### MVP

- Launch `prompt-maker-cli ui --interactive-transport ...` in Sidekick terminal.
- Connect transport client and parse JSONL events.
- Implement refine/finish commands from Neovim.
- Extract `generation.final.result` and open a result buffer.
- Basic statusline string + notifications.

### Phase 2

- Telemetry window with top-N token files and quickfix population.
- Rich progress UI (floating progress, virtual text in current buffer).
- History picker (tail `~/.config/prompt-maker-cli/history.jsonl`) using Sidekick pickers.
- Multi-session support + session picker.
- “Insert prompt at cursor” with preview + confirm.

---

## 17. Open Questions

1. In Prompt Maker’s **Ink TUI** flow, is `interactive.awaiting.mode` reliably `transport` when `--interactive-transport` is passed, or only during refinement loops?
2. Does the TUI always emit `generation.final` over the transport tap, or only in generate-mode interactive sessions?
3. Should the integration prefer launching **generate mode** (non-Ink) for deterministic transport-driven refinement, with Ink TUI offered as an optional “monitor UI”?
4. How should the plugin resolve a “default context template” when using the TUI (since `ui` doesn’t accept `--context-template`)? Rely on Prompt Maker config, or post-wrap in Neovim?
5. For Windows: what is the most reliable libuv pipe connect mode in Neovim (named pipe quirks vary)?
6. Should we expose “attach context from selection/buffer” via Sidekick’s context system, or keep the first version transport-only?
