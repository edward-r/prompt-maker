import type { FileContext } from '../file-context'
import type { UploadDetail, UploadState } from '../prompt-generator-service'

export type StreamMode = 'none' | 'jsonl'

export type ContextOverflowStrategy =
  | 'fail'
  | 'drop-smart'
  | 'drop-url'
  | 'drop-largest'
  | 'drop-oldest'

export type GenerateArgs = {
  intent?: string
  intentFile?: string
  model?: string
  target?: string
  interactive: boolean
  copy: boolean
  openChatGpt: boolean
  polish: boolean
  polishModel?: string
  json: boolean
  quiet: boolean
  progress: boolean
  stream: StreamMode
  maxInputTokens?: number
  maxContextTokens?: number
  contextOverflow?: ContextOverflowStrategy
  showContext: boolean
  contextTemplate?: string
  contextFile?: string
  interactiveTransport?: string
  contextFormat: 'text' | 'json'
  help: boolean
  context: string[]
  urls: string[]
  images: string[]
  video: string[]
  metaInstructions?: string
  smartContext: boolean
  smartContextRoot?: string
  inlineIntentAfterInteractive?: boolean
}

export type ContextPathMetadata = {
  path: string
  source: ContextPathSource
}

type ContextPathSource = 'intent' | 'file' | 'url' | 'smart'

export const GENERATE_JSON_PAYLOAD_SCHEMA_VERSION = '1' as const

export type GenerateJsonPayload = {
  schemaVersion: typeof GENERATE_JSON_PAYLOAD_SCHEMA_VERSION
  intent: string
  model: string
  targetModel: string
  prompt: string
  reasoning?: string
  refinements: string[]
  iterations: number
  interactive: boolean
  timestamp: string
  contextPaths: ContextPathMetadata[]
  outputPath?: string
  polishedPrompt?: string
  polishModel?: string
  contextTemplate?: string
  renderedPrompt?: string
}

export type GeneratePipelineResult = {
  payload: GenerateJsonPayload
  telemetry: TokenTelemetry
  generatedPrompt: string
  reasoning?: string
  polishedPrompt?: string
  finalPrompt: string
  iterations: number
  model: string
  contextPaths: ContextPathMetadata[]
}

export type GeneratePipelineOptions = {
  onStreamEvent?: (event: StreamEventInput) => void
  interactiveDelegate?: InteractiveDelegate
}

export type InteractiveDelegate = {
  getNextAction: (context: {
    iteration: number
    currentPrompt: string
  }) => Promise<{ type: 'refine'; instruction: string } | { type: 'finish' }>
}

export type TokenTelemetry = {
  files: FileTokenSummary[]
  intentTokens: number
  fileTokens: number
  systemTokens: number
  totalTokens: number
}

type FileTokenSummary = {
  path: string
  tokens: number
}

export type LoopContext = {
  intent: string
  refinements: string[]
  model: string
  targetModel: string
  fileContext: FileContext[]
  images: string[]
  videos: string[]
  metaInstructions: string
}

export type InteractiveMode = 'transport' | 'tty' | 'none'

export type ProgressScope = 'url' | 'smart' | 'generate' | 'polish' | 'generic'

type StreamEventBase<EventName extends string, Payload extends object> = {
  event: EventName
  timestamp: string
} & Payload

type ContextTelemetryStreamEvent = StreamEventBase<
  'context.telemetry',
  { telemetry: TokenTelemetry }
>

type ContextOverflowStreamEvent = StreamEventBase<
  'context.overflow',
  {
    strategy: ContextOverflowStrategy
    before: TokenTelemetry
    after: TokenTelemetry
    droppedPaths: ContextPathMetadata[]
  }
>

type ProgressStreamEvent = StreamEventBase<
  'progress.update',
  {
    label: string
    state: 'start' | 'update' | 'stop'
    scope?: ProgressScope
  }
>

type UploadStreamEvent = StreamEventBase<
  'upload.state',
  { state: UploadState; detail: UploadDetail }
>

type GenerationIterationStartEvent = StreamEventBase<
  'generation.iteration.start',
  {
    iteration: number
    intent: string
    model: string
    interactive: boolean
    inputTokens: number
    refinements: string[]
    latestRefinement?: string
  }
>

type GenerationIterationCompleteEvent = StreamEventBase<
  'generation.iteration.complete',
  {
    iteration: number
    prompt: string
    tokens: number
    reasoningTokens?: number
  }
>

type InteractiveMilestoneStreamEvent = StreamEventBase<
  'interactive.state',
  {
    phase: 'start' | 'prompt' | 'refine' | 'complete'
    iteration: number
  }
>

type InteractiveAwaitingStreamEvent = StreamEventBase<
  'interactive.awaiting',
  { mode: InteractiveMode }
>
export type TransportListeningEvent = StreamEventBase<'transport.listening', { path: string }>
export type TransportClientConnectedEvent = StreamEventBase<
  'transport.client.connected',
  { status: 'connected' }
>
export type TransportClientDisconnectedEvent = StreamEventBase<
  'transport.client.disconnected',
  { status: 'disconnected' }
>
export type TransportEvent =
  | TransportListeningEvent
  | TransportClientConnectedEvent
  | TransportClientDisconnectedEvent

type GenerationFinalStreamEvent = StreamEventBase<
  'generation.final',
  { result: GenerateJsonPayload }
>

type StreamEvent =
  | ContextTelemetryStreamEvent
  | ContextOverflowStreamEvent
  | ProgressStreamEvent
  | UploadStreamEvent
  | GenerationIterationStartEvent
  | GenerationIterationCompleteEvent
  | InteractiveMilestoneStreamEvent
  | InteractiveAwaitingStreamEvent
  | TransportEvent
  | GenerationFinalStreamEvent

export type StreamEventInput = {
  [EventName in StreamEvent['event']]: Omit<Extract<StreamEvent, { event: EventName }>, 'timestamp'>
}[StreamEvent['event']]

export type TransportLifecycleEventInput = Extract<
  StreamEventInput,
  {
    event: 'transport.listening' | 'transport.client.connected' | 'transport.client.disconnected'
  }
>
