import fs from 'node:fs/promises'

import type { PdfPart } from '@prompt-maker/core'

import { inferPdfMimeType, uploadFileForGeminiWithMimeType } from '../media-loader'

import type { UploadStateChange } from './types'

const assertReadablePdf = async (filePath: string): Promise<void> => {
  try {
    await fs.access(filePath)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`PDF file ${filePath} is not readable: ${message}`)
  }
}

export const resolvePdfParts = async (
  pdfPaths: string[],
  onUploadStateChange?: UploadStateChange,
  apiKey?: string,
): Promise<PdfPart[]> => {
  const parts: PdfPart[] = []

  for (const pdfPath of pdfPaths) {
    onUploadStateChange?.('start', { kind: 'pdf', filePath: pdfPath })

    try {
      const mimeType = inferPdfMimeType(pdfPath)

      if (apiKey) {
        const fileUri = await uploadFileForGeminiWithMimeType(pdfPath, mimeType, apiKey)
        parts.push({ type: 'pdf', mimeType, filePath: pdfPath, fileUri })
      } else {
        await assertReadablePdf(pdfPath)
        parts.push({ type: 'pdf', mimeType, filePath: pdfPath })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to attach PDF ${pdfPath}: ${message}`)
    } finally {
      onUploadStateChange?.('finish', { kind: 'pdf', filePath: pdfPath })
    }
  }

  return parts
}
