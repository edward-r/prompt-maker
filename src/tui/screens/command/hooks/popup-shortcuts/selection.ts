export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(value, max))
}

export const clampIndex = (index: number, length: number): number => {
  if (length <= 0) {
    return 0
  }

  return clamp(index, 0, length - 1)
}

export const wrapIndex = (index: number, length: number): number => {
  if (length <= 0) {
    return 0
  }

  return ((index % length) + length) % length
}
