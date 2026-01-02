import type { Key } from 'ink'

export const handleEscapeOnlyPopupShortcuts = (key: Key, closePopup: () => void): void => {
  if (key.escape) {
    closePopup()
  }
}
