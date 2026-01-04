# Title
Add new stream event type: context.overflow

Role
You are a TypeScript engineer maintaining streaming event schemas.

Context
Streaming events are defined in src/generate/types.ts (StreamEventInput union) and serialized in src/generate/stream.ts. The Recommendations propose a new additive event:
- context.overflow with { strategy, before:{...telemetry}, after:{...telemetry}, droppedPaths:[...] }
Telemetry shape exists in existing context.telemetry events.

Goals & Tasks
- Add a new StreamEventInput variant for event: 'context.overflow'.
- Define a clear payload type that reuses existing telemetry types where possible.
- Ensure serialization via createStreamDispatcher emits this event correctly (no changes required if dispatcher is generic, but types must compile).

Inputs
- Files:
  - src/generate/types.ts
  - src/generate/stream.ts
- Existing types:
  - context.telemetry event payload
  - any TokenTelemetry type used by GeneratePipelineResult

Constraints
- Additive only: do not break existing event parsing.
- Ensure timestamp injection behavior remains consistent (dispatcher adds timestamp).

Execution Plan
1. Open src/generate/types.ts and identify StreamEventInput union.
2. Add a new interface/type for ContextOverflowStreamEvent, containing:
  - event: 'context.overflow'
  - strategy: allowed strategies
  - before: TokenTelemetry (or the telemetry object used in context.telemetry)
  - after: TokenTelemetry
  - droppedPaths: array of { path: string, source?: 'file'|'url'|'smart'|'image'|'video' } or strings (choose one; keep consistent with existing contextPaths typing)
3. Update the union to include the new event.
4. Add a unit test that ensures JSON serialization round-trips for a sample event line if there’s an existing stream test pattern; otherwise add a type-level test by compiling.

Output Format
- Provide a git diff (or explicit file edits) adding the new event type.

Validation
- Commands:
  - npm run build
  - npm test
- Expected outcomes:
  - TypeScript compilation succeeds.
  - A minimal code snippet (test or sample) can call stream.emit({ event: 'context.overflow', ... }) without type errors.
  - No existing tests or fixtures that parse stream events break.