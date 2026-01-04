# Title
Implement resume refinement in generate pipeline using exported payload file

Role
You are a TypeScript engineer implementing generate pipeline enhancements.

Context
A payload IO utility exists that can load GenerateJsonPayload from JSON/YAML files. Generate-mode flags exist:
- --resume-from <path>
- --resume-mode strict|best-effort
A resume.loaded stream event type exists.

Goals & Tasks
- Implement resume-from-file behavior:
  - Load GenerateJsonPayload from the provided file.
  - Seed run state similarly to history resume:
    - intent/model/target/refinements/previousPrompt
    - rehydrate file context paths with strict/best-effort handling
  - Emit resume.loaded with source:'file'.

Inputs
- Files:
  - src/generate/pipeline.ts
  - src/generate/payload-io.ts (or whichever module provides loadGeneratePayloadFromFile)
  - src/generate/types.ts

Constraints
- Must not require history.jsonl.
- Errors must be descriptive for parse/validation failures.

Execution Plan
1. In pipeline, detect args.resumeFrom.
2. Call loadGeneratePayloadFromFile.
3. Apply same precedence rules for explicit user inputs vs resumed payload (document in code comments).
4. Rehydrate file contexts and emit resume.loaded.
5. Add tests using temp files:
  - write a JSON payload file
  - write a YAML payload file
  - ensure both load and seed as expected

Output Format
- Provide a git diff including tests.

Validation
- Commands:
  - npm test
  - npm run build
- Expected outcomes:
  - Resuming from a JSON file works.
  - Resuming from a YAML file works.
  - Invalid payload file fails fast with a clear error message.
  - resume.loaded event is emitted with source:'file'.