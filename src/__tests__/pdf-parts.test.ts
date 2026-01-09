import { resolvePdfParts } from '../prompt-generator/pdf-parts'

jest.mock('node:fs/promises', () => ({
  access: jest.fn(),
}))

jest.mock('../media-loader', () => ({
  inferPdfMimeType: jest.fn(),
  uploadFileForGeminiWithMimeType: jest.fn(),
}))

const fs = jest.requireMock('node:fs/promises') as { access: jest.Mock }
const mediaLoader = jest.requireMock('../media-loader') as {
  inferPdfMimeType: jest.Mock
  uploadFileForGeminiWithMimeType: jest.Mock
}

describe('pdf-parts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fs.access.mockResolvedValue(undefined)
    mediaLoader.inferPdfMimeType.mockReturnValue('application/pdf')
    mediaLoader.uploadFileForGeminiWithMimeType.mockResolvedValue('gs://pdf/123')
  })

  it('creates local PDF parts when no apiKey provided', async () => {
    const onUpload = jest.fn()
    const parts = await resolvePdfParts(['doc.pdf'], onUpload)

    expect(mediaLoader.uploadFileForGeminiWithMimeType).not.toHaveBeenCalled()
    expect(parts).toEqual([{ type: 'pdf', mimeType: 'application/pdf', filePath: 'doc.pdf' }])
    expect(onUpload).toHaveBeenNthCalledWith(1, 'start', { kind: 'pdf', filePath: 'doc.pdf' })
    expect(onUpload).toHaveBeenNthCalledWith(2, 'finish', { kind: 'pdf', filePath: 'doc.pdf' })
  })

  it('uploads PDFs for Gemini when apiKey is provided', async () => {
    const parts = await resolvePdfParts(['doc.pdf'], undefined, 'gem-key')

    expect(mediaLoader.uploadFileForGeminiWithMimeType).toHaveBeenCalledWith(
      'doc.pdf',
      'application/pdf',
      'gem-key',
    )
    expect(parts).toEqual([
      { type: 'pdf', mimeType: 'application/pdf', filePath: 'doc.pdf', fileUri: 'gs://pdf/123' },
    ])
  })

  it('throws actionable errors for unreadable PDFs', async () => {
    fs.access.mockRejectedValue(new Error('denied'))

    const onUpload = jest.fn()
    await expect(resolvePdfParts(['doc.pdf'], onUpload)).rejects.toThrow('doc.pdf')
    await expect(resolvePdfParts(['doc.pdf'], onUpload)).rejects.toThrow('not readable')

    expect(onUpload).toHaveBeenNthCalledWith(1, 'start', { kind: 'pdf', filePath: 'doc.pdf' })
    expect(onUpload).toHaveBeenNthCalledWith(2, 'finish', { kind: 'pdf', filePath: 'doc.pdf' })
  })

  it('throws actionable errors for unsupported paths', async () => {
    mediaLoader.inferPdfMimeType.mockImplementation(() => {
      throw new Error('Unsupported PDF type')
    })

    await expect(resolvePdfParts(['doc.txt'])).rejects.toThrow('doc.txt')
    await expect(resolvePdfParts(['doc.txt'])).rejects.toThrow('Unsupported PDF type')
  })
})
