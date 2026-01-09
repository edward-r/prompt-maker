import { runGenerationWorkflow } from '../../generate/interactive'

import type { StreamDispatcher } from '../../generate/stream'
import type { TokenTelemetry } from '../../generate/types'

describe('runGenerationWorkflow (interactive)', () => {
  it('passes pdfs through to PromptGenerationRequest', async () => {
    const generator = {
      generatePromptDetailed: jest.fn().mockResolvedValue({ prompt: 'ok', reasoning: 'r' }),
    }

    const stream: StreamDispatcher = {
      mode: 'none',
      emit: jest.fn(),
    }

    const telemetry: TokenTelemetry = {
      files: [],
      intentTokens: 0,
      fileTokens: 0,
      systemTokens: 0,
      totalTokens: 0,
    }

    await runGenerationWorkflow({
      service: generator as never,
      context: {
        intent: 'intent',
        refinements: [],
        model: 'gpt-4o-mini',
        targetModel: 'gpt-5.2',
        fileContext: [],
        images: [],
        videos: [],
        pdfs: ['/tmp/doc.pdf'],
        metaInstructions: '',
      },
      telemetry,
      interactiveMode: 'none',
      display: false,
      stream,
    })

    expect(generator.generatePromptDetailed).toHaveBeenCalledWith(
      expect.objectContaining({ pdfs: ['/tmp/doc.pdf'] }),
    )
  })
})
