import { useRef } from 'react'

import type { BudgetSettings } from '../../../budget-settings'
import { useGenerationPipeline } from '../../../hooks/useGenerationPipeline'
import type { NotifyOptions } from '../../../notifier'
import { createTokenUsageStore } from '../../../token-usage-store'
import type { HistoryEntry, ProviderStatus } from '../../../types'
import type { TokenUsageBreakdown, TokenUsageRun } from '../../../token-usage-store'

export type UseCommandGenerationPipelineOptions = {
  pushHistory: (
    content: string,
    kind?: HistoryEntry['kind'],
    format?: HistoryEntry['format'],
  ) => void
  notify?: (message: string, options?: NotifyOptions) => void

  files: string[]
  urls: string[]
  images: string[]
  videos: string[]
  pdfs: string[]

  smartContextEnabled: boolean
  smartContextRoot: string | null

  metaInstructions: string
  budgets: BudgetSettings
  currentModel: string
  targetModel: string
  interactiveTransportPath?: string | undefined
  terminalColumns: number

  polishModelId: string | null
  jsonOutputEnabled: boolean
  copyEnabled: boolean
  chatGptEnabled: boolean

  isTestCommandRunning: boolean

  onProviderStatusUpdate: (status: ProviderStatus) => void
  onReasoningUpdate: (reasoning: string | null) => void
  onLastGeneratedPromptUpdate: (prompt: string) => void
}

export type UseCommandGenerationPipelineResult = {
  isGenerating: boolean
  runGeneration: ReturnType<typeof useGenerationPipeline>['runGeneration']
  runSeriesGeneration: ReturnType<typeof useGenerationPipeline>['runSeriesGeneration']
  statusChips: string[]
  latestContextOverflow: ReturnType<typeof useGenerationPipeline>['latestContextOverflow']
  isAwaitingRefinement: boolean
  submitRefinement: ReturnType<typeof useGenerationPipeline>['submitRefinement']
  awaitingInteractiveMode: ReturnType<typeof useGenerationPipeline>['awaitingInteractiveMode']

  tokenUsageRun: TokenUsageRun | null
  tokenUsageBreakdown: TokenUsageBreakdown | null
}

export const useCommandGenerationPipeline = ({
  pushHistory,
  notify,
  files,
  urls,
  images,
  videos,
  pdfs,
  smartContextEnabled,

  smartContextRoot,
  metaInstructions,
  budgets,
  currentModel,
  targetModel,
  interactiveTransportPath,
  terminalColumns,
  polishModelId,
  jsonOutputEnabled,
  copyEnabled,
  chatGptEnabled,
  isTestCommandRunning,
  onProviderStatusUpdate,
  onReasoningUpdate,
  onLastGeneratedPromptUpdate,
}: UseCommandGenerationPipelineOptions): UseCommandGenerationPipelineResult => {
  const tokenUsageStoreRef = useRef<ReturnType<typeof createTokenUsageStore> | null>(null)
  if (!tokenUsageStoreRef.current) {
    tokenUsageStoreRef.current = createTokenUsageStore()
  }

  const trimmedMetaInstructions = metaInstructions.trim()

  const pipeline = useGenerationPipeline({
    pushHistory,
    ...(notify ? { notify } : {}),
    files,
    urls,
    images,
    videos,
    pdfs,
    smartContextEnabled,
    smartContextRoot,
    currentModel,
    targetModel,
    ...(interactiveTransportPath ? { interactiveTransportPath } : {}),
    terminalColumns,
    metaInstructions: trimmedMetaInstructions,
    budgets,
    polishModelId,
    jsonOutputEnabled,

    copyEnabled,
    chatGptEnabled,
    isTestCommandRunning,
    tokenUsageStore: tokenUsageStoreRef.current,
    onProviderStatusUpdate,
    onReasoningUpdate,
    onLastGeneratedPromptUpdate,
  })

  const tokenUsageRun = tokenUsageStoreRef.current?.getLatestRun() ?? null
  const tokenUsageBreakdown = tokenUsageStoreRef.current?.getLatestBreakdown() ?? null

  return {
    isGenerating: pipeline.isGenerating,
    runGeneration: pipeline.runGeneration,
    runSeriesGeneration: pipeline.runSeriesGeneration,
    statusChips: pipeline.statusChips,
    latestContextOverflow: pipeline.latestContextOverflow,
    isAwaitingRefinement: pipeline.isAwaitingRefinement,
    submitRefinement: pipeline.submitRefinement,
    awaitingInteractiveMode: pipeline.awaitingInteractiveMode,
    tokenUsageRun,
    tokenUsageBreakdown,
  }
}
