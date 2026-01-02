import type { PopupState } from '../../../../types'

export type NonNullPopupState = Exclude<PopupState, null>
export type PopupType = NonNullPopupState['type']
export type PopupStateFor<T extends PopupType> = Extract<NonNullPopupState, { type: T }>

export type PopupKey = {
  upArrow?: boolean
  downArrow?: boolean
  leftArrow?: boolean
  rightArrow?: boolean
  tab?: boolean
  shift?: boolean
  return?: boolean
  escape?: boolean
  delete?: boolean
  pageUp?: boolean
  pageDown?: boolean
  ctrl?: boolean
}

export type PopupShortcutEffect =
  | { type: 'none' }
  | { type: 'close' }
  | { type: 'set'; updater: (prev: PopupState) => PopupState }
  | { type: 'remove'; index: number }
  | { type: 'selectSuggestion'; value: string }

export const NO_EFFECT: PopupShortcutEffect = { type: 'none' }

export const guardPopupUpdater = <T extends PopupType>(
  popupType: T,
  updater: (prev: PopupStateFor<T>) => PopupStateFor<T>,
): ((prev: PopupState) => PopupState) => {
  return (prev) => {
    if (!prev || prev.type !== popupType) {
      return prev
    }

    return updater(prev as PopupStateFor<T>)
  }
}
