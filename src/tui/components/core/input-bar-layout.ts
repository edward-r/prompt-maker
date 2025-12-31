import { getLineCount } from './multiline-text-buffer'

export type InputBarRowEstimateOptions = {
  value: string
  hint?: string | undefined
  debugLine?: string | undefined
}

export const estimateInputBarRows = ({
  value,
  hint,
  debugLine,
}: InputBarRowEstimateOptions): number => {
  const lineCount = getLineCount(value)
  const contentRows = 2 + (hint ? 1 : 0) + (debugLine ? 1 : 0) + lineCount
  // Keep the input bar as compact as possible; callers can pad if desired.
  return contentRows
}
