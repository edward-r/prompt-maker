import {
  INITIAL_GENERATION_PIPELINE_STATE,
  generationPipelineReducer,
  type ContextOverflowDetails,
  type ResumeLoadedDetails,
} from '../../tui/generation-pipeline-reducer'

describe('generationPipelineReducer', () => {
  it('stores latest resume.loaded details', () => {
    const details = {
      event: 'resume.loaded',
      source: 'history',
      reusedContextPaths: [{ path: 'src/a.ts', source: 'file' }],
      missingContextPaths: [{ path: 'https://example.com', source: 'url' }],
    } satisfies ResumeLoadedDetails

    const next = generationPipelineReducer(INITIAL_GENERATION_PIPELINE_STATE, {
      type: 'set-resume-loaded',
      details,
    })

    expect(next.latestResumeLoaded).toEqual(details)
    expect(next.latestContextOverflow).toBeNull()
  })

  it('stores latest context.overflow details', () => {
    const before = {
      files: [{ path: 'src/a.ts', tokens: 120 }],
      intentTokens: 10,
      fileTokens: 120,
      systemTokens: 5,
      totalTokens: 135,
    }

    const after = {
      files: [],
      intentTokens: 10,
      fileTokens: 0,
      systemTokens: 5,
      totalTokens: 15,
    }

    const details = {
      event: 'context.overflow',
      strategy: 'drop-largest',
      before,
      after,
      droppedPaths: [{ path: 'src/a.ts', source: 'file' }],
    } satisfies ContextOverflowDetails

    const next = generationPipelineReducer(INITIAL_GENERATION_PIPELINE_STATE, {
      type: 'set-context-overflow',
      details,
    })

    expect(next.latestContextOverflow).toEqual(details)
    expect(next.latestResumeLoaded).toBeNull()
  })

  it('clears overflow/resume details on generation-start', () => {
    const resumeDetails = {
      event: 'resume.loaded',
      source: 'file',
      reusedContextPaths: [{ path: 'src/a.ts', source: 'file' }],
      missingContextPaths: [],
    } satisfies ResumeLoadedDetails

    const overflowDetails = {
      event: 'context.overflow',
      strategy: 'drop-oldest',
      before: {
        files: [{ path: 'src/a.ts', tokens: 120 }],
        intentTokens: 10,
        fileTokens: 120,
        systemTokens: 5,
        totalTokens: 135,
      },
      after: {
        files: [],
        intentTokens: 10,
        fileTokens: 0,
        systemTokens: 5,
        totalTokens: 15,
      },
      droppedPaths: [{ path: 'src/a.ts', source: 'file' }],
    } satisfies ContextOverflowDetails

    const withResume = generationPipelineReducer(INITIAL_GENERATION_PIPELINE_STATE, {
      type: 'set-resume-loaded',
      details: resumeDetails,
    })

    const withOverflow = generationPipelineReducer(withResume, {
      type: 'set-context-overflow',
      details: overflowDetails,
    })

    const next = generationPipelineReducer(withOverflow, {
      type: 'generation-start',
      statusMessage: 'Preparing generation…',
    })

    expect(next.isGenerating).toBe(true)
    expect(next.latestTelemetry).toBeNull()
    expect(next.latestResumeLoaded).toBeNull()
    expect(next.latestContextOverflow).toBeNull()
  })
})
