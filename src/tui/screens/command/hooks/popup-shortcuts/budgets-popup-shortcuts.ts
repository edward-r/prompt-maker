import type { Key } from 'ink'

import type { ContextOverflowStrategy } from '../../../../../config'
import type { PopupState } from '../../../../types'

import { wrapIndex } from './selection'
import { guardPopupUpdater } from './types'

const FIELD_COUNT = 3

const STRATEGY_OPTIONS = [
  '',
  'fail',
  'drop-smart',
  'drop-url',
  'drop-largest',
  'drop-oldest',
] as const satisfies ReadonlyArray<ContextOverflowStrategy | ''>

export type HandleBudgetsPopupShortcutsOptions = {
  popupState: Extract<Exclude<PopupState, null>, { type: 'budgets' }>
  key: Key
  setPopupState: (next: PopupState | ((prev: PopupState) => PopupState)) => void
  closePopup: () => void
  onBudgetsSubmit: () => void
}

const cycleStrategy = (
  current: ContextOverflowStrategy | '',
  delta: number,
): ContextOverflowStrategy | '' => {
  const index = STRATEGY_OPTIONS.indexOf(current)
  const safeIndex = index >= 0 ? index : 0
  return STRATEGY_OPTIONS[wrapIndex(safeIndex + delta, STRATEGY_OPTIONS.length)] ?? ''
}

export const handleBudgetsPopupShortcuts = ({
  popupState,
  key,
  setPopupState,
  closePopup,
  onBudgetsSubmit,
}: HandleBudgetsPopupShortcutsOptions): void => {
  if (key.escape) {
    closePopup()
    return
  }

  if (key.upArrow) {
    setPopupState(
      guardPopupUpdater('budgets', (prev) => ({
        ...prev,
        selectionIndex: wrapIndex(prev.selectionIndex - 1, FIELD_COUNT),
      })),
    )
    return
  }

  if (key.downArrow) {
    setPopupState(
      guardPopupUpdater('budgets', (prev) => ({
        ...prev,
        selectionIndex: wrapIndex(prev.selectionIndex + 1, FIELD_COUNT),
      })),
    )
    return
  }

  if (popupState.selectionIndex === 2 && (key.leftArrow || key.rightArrow)) {
    const delta = key.rightArrow ? 1 : -1

    setPopupState(
      guardPopupUpdater('budgets', (prev) => ({
        ...prev,
        contextOverflowStrategyDraft: cycleStrategy(prev.contextOverflowStrategyDraft, delta),
        errorMessage: null,
      })),
    )
    return
  }

  if (popupState.selectionIndex === 2 && key.return) {
    onBudgetsSubmit()
  }
}
