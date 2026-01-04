# Title
Implement import utility: load GenerateJsonPayload from JSON or YAML file

Role
You are a TypeScript engineer implementing reusable serialization utilities.

Context
A resume feature will need to load an exported payload file. Export can produce JSON or YAML. The codebase has GenerateJsonPayload type in src/generate/types.ts. There is no import facility yet.

Goals & Tasks
- Add a new module (e.g., src/generate/payload-io.ts or src/payload-io.ts) that exports:
  - loadGeneratePayloadFromFile(filePath: string): Promise<GenerateJsonPayload>
  - serializeGeneratePayload(payload: GenerateJsonPayload, format: 'json'|'yaml'): string
- Implement auto-detection by file extension (.json, .yaml, .yml) for load, or require explicit format; choose one and keep it deterministic.
- Validate shape minimally (ensure required fields like intent, model, prompt exist; schemaVersion optional/required per implementation).

Inputs
- Files:
  - src/generate/types.ts
- YAML dependency decision should match what is used for export.

Constraints
- Errors must be descriptive (file not found, parse error, validation error).
- ESM module style.

Execution Plan
1. Create the new module with the two functions.
2. Implement JSON parse with JSON.parse.
3. Implement YAML parse with the chosen library.
4. Add a lightweight runtime validator:
  - check typeof intent/model/prompt are strings
  - check refinements is array if present
  - check contextPaths shape if present
5. Add unit tests:
  - JSON round-trip
  - YAML round-trip
  - invalid file content throws

Output Format
- Provide a git diff (or explicit file edits) including tests.

Validation
- Commands:
  - npm test
  - npm run build
- Expected outcomes:
  - Tests confirm JSON and YAML payloads load into objects matching expected keys.
  - Invalid formats produce thrown errors with actionable messages.