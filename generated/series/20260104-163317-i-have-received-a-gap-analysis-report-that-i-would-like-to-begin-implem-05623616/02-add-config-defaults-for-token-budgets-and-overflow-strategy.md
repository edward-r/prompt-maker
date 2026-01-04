# Title
Add config defaults for token budgets and overflow strategy

Role
You are a TypeScript maintainer extending config schema and resolution.

Context
Config resolution is implemented in src/config.ts. Current validated config keys include provider credentials, promptGenerator.defaultModel/defaultGeminiModel/models, templates, and TUI theme settings. The Recommendations propose config defaults:
- promptGenerator.maxInputTokens
- promptGenerator.contextOverflowStrategy
Optionally promptGenerator.maxContextTokens.

Goals & Tasks
- Extend the config schema/validation in src/config.ts to accept:
  - promptGenerator.maxInputTokens?: number
  - promptGenerator.maxContextTokens?: number
  - promptGenerator.contextOverflowStrategy?: 'fail'|'drop-smart'|'drop-url'|'drop-largest'|'drop-oldest'
- Ensure invalid values produce a descriptive config validation error.

Inputs
- Files:
  - src/config.ts
- Existing promptGenerator config shape (defaultModel, defaultGeminiModel, models[])

Constraints
- Backward compatibility: existing configs must still validate.
- Numeric values must be positive integers.
- Strategy must be restricted to the allowed set.

Execution Plan
1. Locate the config zod schema (or equivalent validation) in src/config.ts.
2. Add the three optional keys under promptGenerator.
3. Update any exported TypeScript types for config to include these keys.
4. Add or update unit tests around config validation if present; otherwise add a new focused test file under src/__tests__/ that imports the config validator and checks:
  - valid configs accept these keys
  - invalid numbers/strategy reject with clear messages

Output Format
- Provide a git diff (or explicit file edits) implementing schema and tests.

Validation
- Commands:
  - npm test
  - npm run build
- Expected outcomes:
  - A config containing promptGenerator.maxInputTokens=10000 loads successfully.
  - A config with promptGenerator.contextOverflowStrategy='drop-smart' loads successfully.
  - A config with negative maxInputTokens or unknown strategy fails with a descriptive error referencing the invalid key.