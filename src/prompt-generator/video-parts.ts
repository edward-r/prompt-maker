import type { VideoPart } from '@prompt-maker/core'

import { inferVideoMimeType, uploadFileForGemini } from '../media-loader'

import type { UploadStateChange } from './types'

export const resolveVideoParts = async (
  videoPaths: string[],
  onUploadStateChange?: UploadStateChange,
): Promise<VideoPart[]> => {
  const parts: VideoPart[] = []

  for (const videoPath of videoPaths) {
    onUploadStateChange?.('start', { kind: 'video', filePath: videoPath })
    try {
      const fileUri = await uploadFileForGemini(videoPath)
      const mimeType = inferVideoMimeType(videoPath)
      parts.push({ type: 'video_uri', fileUri, mimeType })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown video upload error.'
      console.warn(`Failed to upload video ${videoPath}: ${message}`)
    } finally {
      onUploadStateChange?.('finish', { kind: 'video', filePath: videoPath })
    }
  }

  return parts
}
