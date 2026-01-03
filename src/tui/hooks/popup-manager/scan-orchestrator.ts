import type { PopupAction, PopupScanKind } from '../../popup-reducer'
import type { HistoryEntry } from '../../types'

type ScanIdRef = {
  current: number
}

type PopupDispatch = (action: PopupAction) => void

type PushHistory = (content: string, kind?: HistoryEntry['kind']) => void

export type RunSuggestionScanOptions = {
  kind: PopupScanKind
  open: (scanId: number) => PopupAction
  scan: () => Promise<string[]>
}

export type PopupScanOrchestrator = {
  runSuggestionScan: (options: RunSuggestionScanOptions) => void
}

export const createPopupScanOrchestrator = ({
  scanIdRef,
  dispatch,
  pushHistory,
}: {
  scanIdRef: ScanIdRef
  dispatch: PopupDispatch
  pushHistory: PushHistory
}): PopupScanOrchestrator => {
  const nextScanId = (): number => {
    scanIdRef.current += 1
    return scanIdRef.current
  }

  const runSuggestionScan = ({ kind, open, scan }: RunSuggestionScanOptions): void => {
    const scanId = nextScanId()
    dispatch(open(scanId))

    const run = async (): Promise<void> => {
      try {
        const suggestions = await scan()
        dispatch({
          type: 'scan-suggestions-success',
          kind,
          scanId,
          suggestions,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown workspace scan error.'
        pushHistory(`[${kind}] Failed to scan workspace: ${message}`, 'system')
      }
    }

    void run()
  }

  return { runSuggestionScan }
}
