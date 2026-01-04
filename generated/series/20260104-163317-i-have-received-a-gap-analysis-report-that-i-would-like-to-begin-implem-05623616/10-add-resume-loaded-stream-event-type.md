# Title
Add resume.loaded stream event type

Role
You are a TypeScript engineer maintaining stream event schemas.

Context
Stream events are typed in src/generate/types.ts. Recommendation proposes a new event:
- resume.loaded with { source: 'history'|'file', reusedContextPaths, missingContextPaths }
This event should be emitted when resume successfully loads a prior payload.

Goals & Tasks
- Add a new StreamEventInput variant for event: 'resume.loaded'.
- Define payload fields:
  - source: 'history'|'file'
  - reusedContextPaths: array of context path descriptors
  - missingContextPaths: array of context path descriptors

Inputs
- Files:
  - src/generate/types.ts
- Existing contextPaths type within GenerateJsonPayload.

Constraints
- Additive only.

Execution Plan
1. Add ResumeLoadedStreamEvent type.
2. Add to StreamEventInput union.
3. Add a compile-time or unit test ensuring event can be emitted.

Output Format
- Provide a git diff.

Validation
- Commands:
  - npm run build
  - npm test
- Expected outcomes:
  - TypeScript compiles.
  - No existing event consumers/tests break.