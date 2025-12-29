# AGENTS.md — prompt-maker

Instructions for agentic coding tools (opencode/Codex, Cursor, Copilot Chat, etc.).
Goal: small, focused changes that match existing patterns and keep tests green.

## Quick Facts

- Package manager: `npm` (`package-lock.json`)
- Node: `>=18` (see `.nvmrc` — `22.15` works)
- Modules: ESM (`"type": "module"`); build output is ESM in `dist/`
- TypeScript: `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- UI: Ink + React under `src/tui/`
- Tests: Jest + ts-jest (`jest.config.cjs`, `tsconfig.jest.json`)

## Commands

### Install

- Install deps: `npm ci` (preferred)
- Update deps/lockfile: `npm install`

### Build / Run

- Build: `npm run build` (esbuild via `scripts/build.mjs`)
  - Output: `dist/index.js` + `dist/meta.json`
  - Note: build aliases `@prompt-maker/core/*` to `packages/core/src/*`
- Watch build only: `node scripts/build.mjs --watch`
- Build (minify): `node scripts/build.mjs --minify`
- Run (compiled): `npm start`
- Run (dev, watch + restart): `npm run dev -- <cli args>`
  - Example: `npm run dev -- --help`

### Typecheck / Format

- Typecheck: `npm run typecheck`
- Format (write): `npm run format`
- Format (check, optional): `npx prettier -c .`

### Lint

- No `lint` script is configured.
- `.eslintrc.json` extends `next/core-web-vitals` but `eslint/next` deps are not present; treat as inactive.

### Tests (Jest)

- All tests: `npm test`
- Watch: `npm test -- --watch`

Run a single test file:

- `npm test -- src/__tests__/config.test.ts`
- If the file is outside Jest `testMatch`, use:
  - `npm test -- --runTestsByPath packages/core/src/__tests__/llm.test.ts`

Run a single test by name:

- `npm test -- -t "ThemeResolver"`
- `npm test -- -t "loads config"`

Debugging:

- Serial: `npm test -- --runInBand`
- Open handles: `npm test -- --detectOpenHandles`
- List discovered tests: `npm test -- --listTests`

## Repo Structure

- CLI entry: `src/index.ts` (routes to `generate`, `test`, or TUI)
- Core package: `packages/core/src/` (imported via `@prompt-maker/core`)
- TUI: `src/tui/` (Ink + React)
  - Reducers: `*-reducer.ts` (pure, no React/Ink imports)
  - Hooks: `src/tui/hooks/` (effects, timers, async, IO)
  - Components: `src/tui/components/` (mostly presentational)
- Architecture note: `src/tui/DEVELOPER_NOTE.md` (some paths are historical)

### TUI input invariants

Input routing is easy to regress; keep this priority order:

1. Help overlay (when open, suppress screen input)
2. Popup input (popups “own” the keyboard)
3. Screen input
4. AppContainer global keys (exit, etc.)

Avoid “fallthrough” where a single key is handled by both popup and screen.

## Coding Conventions

### TypeScript / Types

- Do not use `any`.
- Prefer `unknown` + type guards (or Zod) for external data.
- Prefer functional composition over OO; keep functions small and pure.
- Prefer `type` aliases; use `interface` only when you need declaration merging/extensibility.
- With `noUncheckedIndexedAccess`, assume array/map indexing can be `undefined`.
- With `exactOptionalPropertyTypes`, distinguish “missing” vs “present but undefined”.
- For recoverable failures, prefer typed results:
  - `{ ok: true, value } | { ok: false, error }`

### Imports

- Group imports:
  1. Node built-ins first (`node:` specifiers)
  2. blank line
  3. third-party
  4. blank line
  5. local
- Use `import type { ... }` for type-only imports.
- Prefer named exports/imports; avoid introducing new default exports.

### Naming

- Files: `kebab-case.ts` / `kebab-case.tsx`
- Values/functions: `camelCase`
- Types/components: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Booleans: `isX` / `hasX` / `shouldX`

### Formatting

- Prettier is the source of truth (`npm run format`).
- Keep changes consistent with surrounding code.
- Prefer early returns; avoid deep nesting.

### Error Handling

- Programmer/invariant errors: `throw new Error('...')`.
- User/config/IO errors: return a typed error OR throw with actionable context.
- When wrapping errors, preserve the original `error.message` and include paths/flags.
- In `catch (error)`, narrow with `error instanceof Error`.

### Validation

- Use runtime validation for JSON/YAML/API responses.
- Zod is already used (see `src/testing/test-schema.ts`); small type guards are also common.

### React/Ink Patterns

- Keep reducers pure and unit-testable; put effects in hooks.
- Prefer stable callbacks; avoid re-render churn from new objects/arrays.
- For stale closure issues, prefer refs + stable callbacks.

## Testing Conventions

- Jest `testMatch`: `src/**/__tests__/**/*.test.ts?(x)`.
- Prefer deterministic tests (fake timers/mocks) where possible.
- When mocking modules, follow `jest.config.cjs` `moduleNameMapper` patterns (see `tests/mocks/`).

## Environment Variables

Some commands/features require provider keys:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

## Build Artifacts

- Do not edit `dist/` by hand; source of truth is `src/` and `packages/`.

## Cursor / Copilot Rules

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found in this repo.

## Hygiene (Agents)

- Keep PRs focused; avoid drive-by refactors.
- Add/adjust tests only when behavior changes.
- Before finalizing: run `npm run typecheck` and `npm test`.
