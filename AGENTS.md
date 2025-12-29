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

- Install deps: `npm ci` (preferred)
- Update deps/lockfile: `npm install`
- Build: `npm run build` (esbuild via `scripts/build.mjs`)
  - Output: `dist/index.js` + `dist/meta.json`
  - Note: build aliases `@prompt-maker/core/*` to `packages/core/src/*`
- Build (watch): `node scripts/build.mjs --watch`
- Build (minify): `node scripts/build.mjs --minify`
- Run (compiled): `npm start`
- Run (dev, watch + restart): `npm run dev -- <cli args>` (ex: `npm run dev -- --help`)
- Typecheck: `npm run typecheck`
- Format (write): `npm run format`
- Format (check, optional): `npx prettier -c .`

### Lint

- No `lint` script is configured.
- `.eslintrc.json` extends `next/core-web-vitals` but `eslint/next` deps are not present; treat as inactive.

### Tests (Jest)

- All tests: `npm test`
- Watch: `npm test -- --watch`
- Single file: `npm test -- src/__tests__/config.test.ts`
- File outside `testMatch`: `npm test -- --runTestsByPath packages/core/src/__tests__/llm.test.ts`
- Single test by name: `npm test -- -t "ThemeResolver"`
- Debug: `npm test -- --runInBand`, `npm test -- --detectOpenHandles`, `npm test -- --listTests`

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

### TUI change checklist

- Keep reducers pure (`*-reducer.ts`) and add/adjust reducer tests in `src/__tests__/tui/`.
- If adding a popup: update popup types/state machine and ensure popups “own” input.
- If adding async suggestion scans: guard against stale updates (scan id + popup type checks).

### Strict TS gotchas

- Don’t assume `array[index]` or `map.get(key)` is defined; handle `undefined`.
- With `exactOptionalPropertyTypes`, prefer omitting optional fields (vs setting them to `undefined`).
- Prefer `satisfies`/`as const` when you need literal unions.
- When narrowing in `catch`, always handle non-`Error` values.

## Coding Conventions

### TypeScript / Types

- Do not use `any`.
- Prefer `unknown` + type guards (or Zod) for external data.
- Prefer functional composition over OO; keep functions small and pure.
- Prefer `type` aliases; use `interface` only for declaration merging/extensibility.
- With `noUncheckedIndexedAccess`, assume indexing can yield `undefined`.
- With `exactOptionalPropertyTypes`, distinguish “missing” vs “present but undefined”.
- For recoverable failures, prefer typed results: `{ ok: true, value } | { ok: false, error }`.

### Imports

- Order: Node built-ins (`node:`) → blank line → third-party → blank line → local.
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
- Keep changes consistent with surrounding code; prefer early returns.

### Error Handling

- Programmer/invariant errors: `throw new Error('...')`.
- User/config/IO errors: return a typed error OR throw with actionable context.
- When wrapping errors, preserve `error.message` and include paths/flags.
- In `catch (error)`, narrow with `error instanceof Error`.

### Validation

- Use runtime validation for JSON/YAML/API responses.
- Zod is already used (see `src/testing/test-schema.ts`); small type guards are also common.

### React/Ink Patterns

- Keep reducers pure and unit-testable; put effects in hooks.
- Prefer stable callbacks; avoid re-render churn from new objects/arrays.
- For stale closures, prefer refs + stable callbacks.

## Testing Conventions

- Jest `testMatch`: `src/**/__tests__/**/*.test.ts?(x)`.
- Prefer deterministic tests (fake timers/mocks) where possible.
- When mocking modules, follow `jest.config.cjs` `moduleNameMapper` patterns (see `tests/mocks/`).

## Environment Variables

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
