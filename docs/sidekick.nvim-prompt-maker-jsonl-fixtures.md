# Prompt Maker JSONL + Transport Fixture Samples (for Neovim/Sidekick tests)

This file contains **copy/pasteable JSONL** streams for testing a Neovim-side client that parses Prompt Maker stream events and the interactive transport tap.

Sources of truth for schema:

- Stream event union: `src/generate/types.ts`
- Serialization: `src/generate/stream.ts`
- Transport server + `transport.error`: `src/generate/interactive-transport.ts`

Notes:

- Stream events emitted by `createStreamDispatcher(...).emit(...)` always include `timestamp`.
- The transport server’s `transport.error` is written as:
  - `{"event":"transport.error","message":"..."}\n`
  - It currently **does not include** `timestamp`.
  - Clients should tolerate this and treat it as a valid event line.

---

## Fixture A: “Happy Path” interactive transport run

This simulates:

- transport lifecycle (listening → connected)
- progress updates
- telemetry
- 2 iterations (initial + 1 refine)
- interactive loop completion
- final payload with `renderedPrompt`

```jsonl
{"event":"transport.listening","timestamp":"2026-01-03T12:00:00.000Z","path":"/tmp/pmc-nvim-12345-acde1234.sock"}
{"event":"transport.client.connected","timestamp":"2026-01-03T12:00:00.050Z","status":"connected"}

{"event":"progress.update","timestamp":"2026-01-03T12:00:00.100Z","label":"Resolving URL context","state":"start","scope":"url"}
{"event":"progress.update","timestamp":"2026-01-03T12:00:00.800Z","label":"Resolved 2 URLs","state":"stop","scope":"url"}

{"event":"progress.update","timestamp":"2026-01-03T12:00:00.900Z","label":"Scanning smart context","state":"start","scope":"smart"}
{"event":"progress.update","timestamp":"2026-01-03T12:00:01.400Z","label":"Smart context ready","state":"stop","scope":"smart"}

{"event":"context.telemetry","timestamp":"2026-01-03T12:00:01.500Z","telemetry":{"files":[{"path":"src/main.ts","tokens":820},{"path":"docs/spec.md","tokens":1410}],"intentTokens":140,"fileTokens":2230,"systemTokens":650,"totalTokens":3020}}

{"event":"generation.iteration.start","timestamp":"2026-01-03T12:00:01.600Z","iteration":1,"intent":"Draft a prompt for a code review agent","model":"gpt-4o-mini","interactive":true,"inputTokens":3020,"refinements":[]}
{"event":"generation.iteration.complete","timestamp":"2026-01-03T12:00:02.200Z","iteration":1,"prompt":"# Prompt\n\nYou are a code review agent...","tokens":620}

{"event":"interactive.state","timestamp":"2026-01-03T12:00:02.210Z","phase":"start","iteration":1}
{"event":"interactive.state","timestamp":"2026-01-03T12:00:02.220Z","phase":"prompt","iteration":1}
{"event":"interactive.awaiting","timestamp":"2026-01-03T12:00:02.230Z","mode":"transport"}

{"event":"interactive.state","timestamp":"2026-01-03T12:00:05.000Z","phase":"refine","iteration":1}

{"event":"generation.iteration.start","timestamp":"2026-01-03T12:00:05.010Z","iteration":2,"intent":"Draft a prompt for a code review agent","model":"gpt-4o-mini","interactive":true,"inputTokens":3020,"refinements":["Make it shorter and add a checklist"],"latestRefinement":"Make it shorter and add a checklist"}
{"event":"generation.iteration.complete","timestamp":"2026-01-03T12:00:05.600Z","iteration":2,"prompt":"# Prompt\n\nYou are a code review agent. Follow this checklist...","tokens":540,"reasoningTokens":120}

{"event":"interactive.state","timestamp":"2026-01-03T12:00:05.610Z","phase":"prompt","iteration":2}
{"event":"interactive.awaiting","timestamp":"2026-01-03T12:00:05.620Z","mode":"transport"}
{"event":"interactive.state","timestamp":"2026-01-03T12:00:06.200Z","phase":"complete","iteration":2}

{"event":"generation.final","timestamp":"2026-01-03T12:00:06.250Z","result":{"schemaVersion":"1","intent":"Draft a prompt for a code review agent","model":"gpt-4o-mini","targetModel":"gpt-4o-mini","prompt":"# Prompt\n\nYou are a code review agent...","refinements":["Make it shorter and add a checklist"],"iterations":2,"interactive":true,"timestamp":"2026-01-03T12:00:06.250Z","contextPaths":[{"path":"src/main.ts","source":"file"},{"path":"docs/spec.md","source":"file"}],"contextTemplate":"nvim","renderedPrompt":"## NeoVim Prompt Buffer\n\n# Prompt\n\nYou are a code review agent. Follow this checklist..."}}

{"event":"transport.client.disconnected","timestamp":"2026-01-03T12:00:06.300Z","status":"disconnected"}
```

---

## Fixture B: Transport error + recover

This simulates the server sending `transport.error` due to a bad refine instruction.

```jsonl
{"event":"transport.listening","timestamp":"2026-01-03T12:10:00.000Z","path":"/tmp/pmc-nvim-12345-acde9999.sock"}
{"event":"transport.client.connected","timestamp":"2026-01-03T12:10:00.050Z","status":"connected"}

{"event":"interactive.awaiting","timestamp":"2026-01-03T12:10:00.100Z","mode":"transport"}

{"event":"transport.error","message":"Refinement instruction must be non-empty."}

{"event":"interactive.awaiting","timestamp":"2026-01-03T12:10:02.000Z","mode":"transport"}

{"event":"generation.iteration.start","timestamp":"2026-01-03T12:10:03.000Z","iteration":2,"intent":"Draft a prompt","model":"gpt-4o-mini","interactive":true,"inputTokens":1200,"refinements":["Add explicit output format"],"latestRefinement":"Add explicit output format"}
{"event":"generation.iteration.complete","timestamp":"2026-01-03T12:10:03.500Z","iteration":2,"prompt":"# Prompt\n\nOutput format: ...","tokens":400}

{"event":"generation.final","timestamp":"2026-01-03T12:10:04.000Z","result":{"schemaVersion":"1","intent":"Draft a prompt","model":"gpt-4o-mini","targetModel":"gpt-4o-mini","prompt":"# Prompt\n\nOutput format: ...","refinements":["Add explicit output format"],"iterations":2,"interactive":true,"timestamp":"2026-01-03T12:10:04.000Z","contextPaths":[],"polishedPrompt":"# Prompt (Polished)\n\nOutput format: ..."}}
```

---

## Fixture C: Token telemetry warning/overflow scenario

This is for testing your Neovim-side guardrails when total tokens exceed thresholds.

```jsonl
{"event":"context.telemetry","timestamp":"2026-01-03T12:20:00.000Z","telemetry":{"files":[{"path":"src/bigfile.ts","tokens":41000},{"path":"docs/huge.md","tokens":22000}],"intentTokens":600,"fileTokens":63000,"systemTokens":1800,"totalTokens":65400}}
{"event":"progress.update","timestamp":"2026-01-03T12:20:00.100Z","label":"Generating...","state":"start","scope":"generate"}
```

---

## Fixture D: Upload progress (image + video)

Use this to test counters and UI gating while uploads are active.

```jsonl
{"event":"upload.state","timestamp":"2026-01-03T12:30:00.000Z","state":"start","detail":{"kind":"image","filePath":"assets/mock.png"}}
{"event":"upload.state","timestamp":"2026-01-03T12:30:00.800Z","state":"finish","detail":{"kind":"image","filePath":"assets/mock.png"}}

{"event":"upload.state","timestamp":"2026-01-03T12:30:01.000Z","state":"start","detail":{"kind":"video","filePath":"media/demo.mp4"}}
{"event":"progress.update","timestamp":"2026-01-03T12:30:01.100Z","label":"Uploading video...","state":"update","scope":"generic"}
{"event":"upload.state","timestamp":"2026-01-03T12:30:03.500Z","state":"finish","detail":{"kind":"video","filePath":"media/demo.mp4"}}
```

---

## Fixture E: Context budget trimming (`context.overflow`)

This simulates budgets being enabled (via CLI flags `--max-input-tokens`/`--max-context-tokens` or config defaults) and the CLI dropping one or more **text** context entries to satisfy the budget.

Important ordering note:

- When trimming occurs, the CLI emits `context.overflow` and then emits `context.telemetry` for the post-trim telemetry.
- `context.overflow` happens **before** any `generation.iteration.*` events.

```jsonl
{"event":"progress.update","timestamp":"2026-01-03T12:40:00.000Z","label":"Resolving context","state":"start","scope":"generic"}
{"event":"progress.update","timestamp":"2026-01-03T12:40:00.450Z","label":"Resolving context","state":"stop","scope":"generic"}

{"event":"context.overflow","timestamp":"2026-01-03T12:40:00.500Z","strategy":"drop-largest","before":{"files":[{"path":"src/core.ts","tokens":1200},{"path":"docs/huge.md","tokens":4800},{"path":"url:https://example.com","tokens":2600}],"intentTokens":220,"fileTokens":8600,"systemTokens":800,"totalTokens":9620},"after":{"files":[{"path":"src/core.ts","tokens":1200},{"path":"docs/brief.md","tokens":900}],"intentTokens":220,"fileTokens":2100,"systemTokens":800,"totalTokens":3120},"droppedPaths":[{"path":"docs/huge.md","source":"file"},{"path":"url:https://example.com","source":"url"}]}
{"event":"context.telemetry","timestamp":"2026-01-03T12:40:00.510Z","telemetry":{"files":[{"path":"src/core.ts","tokens":1200},{"path":"docs/brief.md","tokens":900}],"intentTokens":220,"fileTokens":2100,"systemTokens":800,"totalTokens":3120}}

{"event":"progress.update","timestamp":"2026-01-03T12:40:00.600Z","label":"Generating prompt","state":"start","scope":"generate"}
{"event":"generation.iteration.start","timestamp":"2026-01-03T12:40:00.610Z","iteration":1,"intent":"Draft a prompt with strict context budget","model":"gpt-4o-mini","interactive":false,"inputTokens":3120,"refinements":[]}
{"event":"generation.iteration.complete","timestamp":"2026-01-03T12:40:01.100Z","iteration":1,"prompt":"# Prompt\n\nUse only the provided context.","tokens":220}
{"event":"progress.update","timestamp":"2026-01-03T12:40:01.120Z","label":"Generating prompt","state":"stop","scope":"generate"}

{"event":"generation.final","timestamp":"2026-01-03T12:40:01.150Z","result":{"schemaVersion":"1","intent":"Draft a prompt with strict context budget","model":"gpt-4o-mini","targetModel":"gpt-4o-mini","prompt":"# Prompt\n\nUse only the provided context.","refinements":[],"iterations":1,"interactive":false,"timestamp":"2026-01-03T12:40:01.150Z","contextPaths":[{"path":"inline-intent","source":"intent"},{"path":"src/core.ts","source":"file"},{"path":"docs/brief.md","source":"file"}]}}
```

---

## Fixture F: Resume early in run (`resume.loaded`)

This simulates a run that loads a previous payload from history, reuses one context path successfully, and reports a missing context file. The `resume.loaded` event is emitted before context resolution telemetry and generation.

```jsonl
{"event":"resume.loaded","timestamp":"2026-01-03T12:50:00.000Z","source":"history","reusedContextPaths":[{"path":"notes/existing.md","source":"file"}],"missingContextPaths":[{"path":"notes/missing.md","source":"file"}]}

{"event":"progress.update","timestamp":"2026-01-03T12:50:00.050Z","label":"Resolving context","state":"start","scope":"generic"}
{"event":"progress.update","timestamp":"2026-01-03T12:50:00.250Z","label":"Resolving context","state":"stop","scope":"generic"}

{"event":"context.telemetry","timestamp":"2026-01-03T12:50:00.300Z","telemetry":{"files":[{"path":"notes/existing.md","tokens":640}],"intentTokens":160,"fileTokens":640,"systemTokens":780,"totalTokens":1580}}

{"event":"generation.iteration.start","timestamp":"2026-01-03T12:50:00.350Z","iteration":3,"intent":"Resumed intent","model":"gpt-4o-mini","interactive":false,"inputTokens":1580,"refinements":["prior refinement"]}
{"event":"generation.iteration.complete","timestamp":"2026-01-03T12:50:00.900Z","iteration":3,"prompt":"# Prompt\n\nContinue from the previous run.","tokens":260}

{"event":"generation.final","timestamp":"2026-01-03T12:50:00.950Z","result":{"schemaVersion":"1","intent":"Resumed intent","model":"gpt-4o-mini","targetModel":"gpt-4o-mini","prompt":"# Prompt\n\nContinue from the previous run.","refinements":["prior refinement"],"iterations":3,"interactive":false,"timestamp":"2026-01-03T12:50:00.950Z","contextPaths":[{"path":"inline-intent","source":"intent"},{"path":"notes/existing.md","source":"file"}]}}
```
