import type { Key } from 'ink'

export type CommandMenuKeyAction =
  | { type: 'none' }
  | { type: 'close' }
  | { type: 'change-selection'; nextIndex: number }

export type ResolveCommandMenuKeyActionOptions = {
  key: Key
  selectedIndex: number
  itemCount: number
}

export const resolveCommandMenuKeyAction = ({
  key,
  selectedIndex,
  itemCount,
}: ResolveCommandMenuKeyActionOptions): CommandMenuKeyAction => {
  if (itemCount <= 0) {
    return { type: 'none' }
  }

  if (key.escape) {
    return { type: 'close' }
  }

  const clampedIndex = Math.min(Math.max(selectedIndex, 0), itemCount - 1)

  if (key.upArrow) {
    const nextIndex = clampedIndex === 0 ? itemCount - 1 : clampedIndex - 1
    return { type: 'change-selection', nextIndex }
  }

  if (key.downArrow) {
    const nextIndex = clampedIndex === itemCount - 1 ? 0 : clampedIndex + 1
    return { type: 'change-selection', nextIndex }
  }

  return { type: 'none' }
}
