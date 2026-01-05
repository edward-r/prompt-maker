import type { StreamEventInput } from '../../generate/types'

test('resume.loaded is a valid StreamEventInput', () => {
  const event = {
    event: 'resume.loaded',
    source: 'history',
    reusedContextPaths: [{ path: 'docs/context-templates.md', source: 'file' }],
    missingContextPaths: [{ path: 'https://example.com', source: 'url' }],
  } satisfies StreamEventInput

  expect(event.event).toBe('resume.loaded')
})
