# Context Templates in Prompt Maker CLI

Context templates let you **wrap the final generated prompt text** with a named, reusable string template. They’re designed for workflows where the prompt should land inside a consistent “envelope” (editor scratch buffer, team conventions, structured wrappers for downstream tooling, etc.).

This document is the source-of-truth behavior as implemented in `src/generate/context-templates.ts` and exposed via the `--context-template <name>` CLI flag.

## Table of contents

- [What is a context template?](#what-is-a-context-template)
- [How template resolution works](#how-template-resolution-works)
- [How template rendering works](#how-template-rendering-works)
- [Defining templates in your config](#defining-templates-in-your-config)
- [Using templates from the CLI](#using-templates-from-the-cli)
- [Built-in templates](#built-in-templates)
- [Practical examples](#practical-examples)
- [Troubleshooting](#troubleshooting)

## What is a context template?

A **context template** is a named string that is applied to the generated prompt at the very end of a run.

Use a context template when:

- You want a **consistent wrapper** around every prompt you generate (team conventions, coding guidelines, output formatting rules).
- You want the prompt to be **editor-friendly**, e.g. a scratch buffer header.
- You want to wrap the prompt in a **structured envelope** (XML-ish/JSON-ish) for downstream parsing.

A context template is _not_ a full templating engine:

- There is exactly one placeholder token: `{{prompt}}`.
- No other variables are supported.
- The rendering behavior is intentionally simple and deterministic.

## How template resolution works

When you run with `--context-template <name>`, Prompt Maker resolves `<name>` to a template string using this order (implemented in `resolveContextTemplate` in `src/generate/context-templates.ts`):

1. **Built-in templates first**.
2. If there’s no built-in match, the CLI loads your config and looks up `contextTemplates[name]`.
3. If still not found, the CLI throws an error that includes an “Available templates” list.

Important implications:

- **Built-ins win.** If you define a config template with the same name as a built-in (e.g. `nvim`), the built-in will still be used.
- The “Available templates” list is computed from:
  - built-in template names
  - plus any `contextTemplates` keys in your loaded config
  - and if there are none, it prints `none`

The error message format is:

- `Unknown context template "<name>". Available templates: <comma-separated-list-or-none>.`

## How template rendering works

Rendering is implemented in `renderContextTemplate(template, prompt)` in `src/generate/context-templates.ts`.

There are two modes:

### 1) Placeholder mode (`{{prompt}}` is present)

If the template contains the exact substring `{{prompt}}`:

- Prompt Maker replaces **all occurrences** of `{{prompt}}` with the generated prompt.
- Replacement is literal string replacement (implemented with `template.split('{{prompt}}').join(prompt)`), so it’s global.

This means you can intentionally include the prompt multiple times.

### 2) Append mode (`{{prompt}}` is not present)

If the template does _not_ contain `{{prompt}}`, Prompt Maker uses “append prompt” behavior:

1. It applies `trimEnd()` to the template (only removes trailing whitespace/newlines).
2. If the result is empty (e.g. `""`, or whitespace-only), the output is **just the prompt**.
3. Otherwise the output is:

- `trimmedTemplate + "\n\n" + prompt`

### Pseudocode summary

```ts
const PLACEHOLDER = '{{prompt}}'

function render(template: string, prompt: string): string {
  if (template.includes(PLACEHOLDER)) {
    // Replace all occurrences.
    return template.split(PLACEHOLDER).join(prompt)
  }

  const trimmed = template.trimEnd()
  if (!trimmed) return prompt

  return `${trimmed}\n\n${prompt}`
}
```

## Defining templates in your config

User-defined templates live under the `contextTemplates` key in your CLI config file, as shown in `README.md`.

### Config file locations

Config path resolution (highest precedence first):

- `PROMPT_MAKER_CLI_CONFIG=/path/to/config.json`
- `~/.config/prompt-maker-cli/config.json`
- `~/.prompt-maker-cli.json`

### Minimal config snippet

```json
{
  "contextTemplates": {
    "scratch": "# Scratch\n\n{{prompt}}"
  }
}
```

Notes:

- Config is JSON.
- Newlines must be encoded as `\n` inside JSON strings.
- Template values are plain strings; there are no other supported tokens besides `{{prompt}}`.

### Team/project sharing tip

If you want your whole team to share a standard template set, put a config file in your repo (for example `./prompt-maker.config.json`) and have developers point to it:

```bash
export PROMPT_MAKER_CLI_CONFIG="$PWD/prompt-maker.config.json"
```

Because built-in templates are resolved first, avoid naming collisions with built-ins (currently `nvim`).

## Using templates from the CLI

The CLI flag is documented in `README.md` under “Key flags”:

- `--context-template <name>` wraps the final prompt using a named template.

Examples:

```bash
# Use the built-in NeoVim-friendly wrapper
prompt-maker-cli "Draft a refactor plan for this module" \
  --context "src/**/*.ts" \
  --context-template nvim

# Use a custom template defined in your config
prompt-maker-cli "Write a PR description" \
  --context README.md \
  --context-template scratch
```

## Built-in templates

Built-ins are defined in `src/generate/context-templates.ts`.

### `nvim`

Name: `nvim`

Template body (exactly as implemented):

```text
## NeoVim Prompt Buffer

Paste this block into a scratch buffer (e.g., :enew) so you can keep prompts beside your work.

{{prompt}}
```

Rendered output shape:

- It always starts with the heading and instruction text.
- The generated prompt is inserted where `{{prompt}}` appears.

## Practical examples

All examples below are designed to be copy/pasteable into your config under `contextTemplates`, then invoked via `--context-template <name>`.

Each example includes:

- A config entry (JSON)
- When to use it
- The resulting output shape

### Example 1 — Wrapper template (uses `{{prompt}}`)

**Name:** `scratch`

**Config:**

```json
{
  "contextTemplates": {
    "scratch": "# Scratch\n\n{{prompt}}"
  }
}
```

**When to use:** You want a lightweight heading above the prompt.

**CLI:**

```bash
prompt-maker-cli "Summarize this file" --context src/index.ts --context-template scratch
```

**Output shape:**

```text
# Scratch

<the generated prompt>
```

### Example 2 — Append mode (omits `{{prompt}}`)

**Name:** `preamble`

Because there is no `{{prompt}}`, Prompt Maker will `trimEnd()` the template and then append the prompt with a blank line separator.

**Config:**

```json
{
  "contextTemplates": {
    "preamble": "You are a careful assistant. Ask clarifying questions when needed."
  }
}
```

**When to use:** You want a standard preface, but you don’t want to embed a placeholder.

**CLI:**

```bash
prompt-maker-cli "Propose 3 test cases" --context src/generate/pipeline.ts --context-template preamble
```

**Output shape:**

```text
You are a careful assistant. Ask clarifying questions when needed.

<the generated prompt>
```

### Example 3 — Minimal / whitespace-only template

**Name:** `empty`

If the template is empty or becomes empty after `trimEnd()`, the rendered output is **just the prompt**.

**Config:**

```json
{
  "contextTemplates": {
    "empty": "   \n\n"
  }
}
```

**When to use:** You want a stable flag in scripts, but effectively disable wrapping.

**CLI:**

```bash
prompt-maker-cli "Draft a changelog entry" --context README.md --context-template empty
```

**Output shape:**

```text
<the generated prompt>
```

### Example 4 — Headings + workflow instructions (editor checklist)

**Name:** `review-workflow`

**Config:**

```json
{
  "contextTemplates": {
    "review-workflow": "## Review Workflow\n\n1. Read the prompt carefully.\n2. Apply changes locally.\n3. Run tests.\n4. Summarize risks and tradeoffs.\n\n{{prompt}}\n\n## Notes\n- Keep changes small.\n- Prefer deterministic behavior."
  }
}
```

**When to use:** You paste prompts into an editor/issue and want a consistent checklist around them.

**CLI:**

```bash
prompt-maker-cli "Review this reducer for edge cases" \
  --context "src/tui/**/*reducer*.ts" \
  --context-template review-workflow
```

**Output shape (excerpt):**

```text
## Review Workflow

1. Read the prompt carefully.
...

<the generated prompt>

## Notes
- Keep changes small.
...
```

### Example 5 — Structured wrapper for downstream tooling (XML-ish)

**Name:** `xml-envelope`

**Config:**

```json
{
  "contextTemplates": {
    "xml-envelope": "<request>\n  <intent>Generated by prompt-maker-cli</intent>\n  <prompt>\n{{prompt}}\n  </prompt>\n</request>"
  }
}
```

**When to use:** You want your prompt inside stable tags so another tool can extract it reliably.

**CLI:**

```bash
prompt-maker-cli "Generate release notes" --context docs/cookbook.md --context-template xml-envelope
```

**Output shape:**

```text
<request>
  <intent>Generated by prompt-maker-cli</intent>
  <prompt>
<the generated prompt>
  </prompt>
</request>
```

### Example 6 — Structured wrapper for downstream tooling (JSON-ish)

**Name:** `json-envelope`

**Config:**

```json
{
  "contextTemplates": {
    "json-envelope": "{\n  \"type\": \"pmc_prompt\",\n  \"prompt\": \"{{prompt}}\"\n}"
  }
}
```

**When to use:** You want a single blob that looks like JSON (useful for copy/paste into systems expecting JSON-like payloads).

Caveat: The generated prompt can contain quotes/newlines that are not JSON-escaped. This template is best when the consuming system is tolerant of “JSON-ish” text, not strict JSON parsing.

**CLI:**

```bash
prompt-maker-cli "Explain this API" --context src/index.ts --context-template json-envelope
```

### Example 7 — Team / project standard template (shared config)

**Name:** `team-default`

This example is meant to live in a shared config file, referenced via `PROMPT_MAKER_CLI_CONFIG`, so everyone gets the same wrapper.

**Config (`prompt-maker.config.json` in your repo, for example):**

```json
{
  "contextTemplates": {
    "team-default": "## Team Prompt Contract\n\n- Be explicit about constraints and acceptance criteria.\n- Prefer small diffs and minimal refactors.\n- If requirements are ambiguous, ask questions first.\n\n{{prompt}}\n"
  }
}
```

**CLI:**

```bash
PROMPT_MAKER_CLI_CONFIG="$PWD/prompt-maker.config.json" \
  prompt-maker-cli "Add tests for this behavior" \
  --context src/generate/context-templates.ts \
  --context-template team-default
```

### Bonus — Multiple `{{prompt}}` occurrences (global replacement)

**Name:** `double`

All occurrences of `{{prompt}}` are replaced.

**Config:**

```json
{
  "contextTemplates": {
    "double": "## Prompt (verbatim)\n\n{{prompt}}\n\n## Prompt (for quoting)\n\n> {{prompt}}"
  }
}
```

## Troubleshooting

### “Unknown context template … Available templates: …”

If you see an error like:

```text
Unknown context template "my-template". Available templates: nvim, scratch.
```

It means the name you passed via `--context-template` was not found.

Fix options:

- Use one of the listed names (built-ins + any `contextTemplates` from your loaded config).
- Add the missing template under `contextTemplates` in your config file.
- Double-check you’re editing the config file that Prompt Maker is actually loading (see config path precedence in [Defining templates in your config](#defining-templates-in-your-config)).

### My template doesn’t seem to apply

Common causes:

- You defined a template with the same name as a built-in (e.g. `nvim`). Built-ins resolve first, so your config entry won’t be used.
- Your template doesn’t contain `{{prompt}}` and you expected replacement behavior. Without the placeholder, Prompt Maker uses append mode.

### Why are there extra blank lines?

In append mode, Prompt Maker always inserts `"\n\n"` between the (trimmed) template and the prompt.

If you need exact spacing control, use explicit placeholder mode (`{{prompt}}`) and place newlines exactly where you want them.
