import { useDroppedFileDetection } from './useDroppedFileDetection'

export type UseDroppedFilePathResult = string | null

export const useDroppedFilePath = (inputValue: string): UseDroppedFilePathResult => {
  const { droppedFilePath } = useDroppedFileDetection(inputValue)
  return droppedFilePath
}
