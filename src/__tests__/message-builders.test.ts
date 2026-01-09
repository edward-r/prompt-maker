import type { MessageContent } from '@prompt-maker/core'

import { buildInitialUserMessage } from '../prompt-generator/message-builders'

jest.mock('../image-loader', () => ({
  resolveImageParts: jest.fn(),
}))

jest.mock('../prompt-generator/video-parts', () => ({
  resolveVideoParts: jest.fn(),
}))

jest.mock('../prompt-generator/pdf-parts', () => ({
  resolvePdfParts: jest.fn(),
}))

const { resolveImageParts } = jest.requireMock('../image-loader') as {
  resolveImageParts: jest.Mock
}

const { resolveVideoParts } = jest.requireMock('../prompt-generator/video-parts') as {
  resolveVideoParts: jest.Mock
}

const { resolvePdfParts } = jest.requireMock('../prompt-generator/pdf-parts') as {
  resolvePdfParts: jest.Mock
}

describe('message-builders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('merges parts in deterministic order: images → videos → PDFs → text', async () => {
    resolveImageParts.mockResolvedValue([{ type: 'image', mimeType: 'image/png', data: 'img' }])
    resolveVideoParts.mockResolvedValue([
      { type: 'video_uri', mimeType: 'video/mp4', fileUri: 'gs://v' },
    ])
    resolvePdfParts.mockResolvedValue([
      { type: 'pdf', mimeType: 'application/pdf', filePath: 'doc.pdf', fileUri: 'gs://p' },
    ])

    const content = await buildInitialUserMessage(
      'Do a thing',
      [],
      ['img.png'],
      ['clip.mp4'],
      ['doc.pdf'],
    )

    expect(Array.isArray(content)).toBe(true)

    const parts = content as Exclude<MessageContent, string>
    expect(parts.map((part) => part.type)).toEqual(['image', 'video_uri', 'pdf', 'text'])
  })

  it('returns plain text when no media parts exist', async () => {
    resolveImageParts.mockResolvedValue([])
    resolveVideoParts.mockResolvedValue([])
    resolvePdfParts.mockResolvedValue([])

    const content = await buildInitialUserMessage('Do a thing', [], [], [], [])
    expect(typeof content).toBe('string')
  })
})
