import type { NotifyOptions } from '../../notifier'
import type { CommandDescriptor, HistoryEntry, ToggleField } from '../../types'

import { parseUrlArgs, validateHttpUrlCandidate } from '../../screens/command/utils/url-args'

export const JSON_INTERACTIVE_ERROR =
  'JSON output is unavailable while interactive transport is enabled.'

type NotificationKind = Exclude<NotifyOptions['kind'], undefined>

type PushHistoryStep = {
  type: 'push-history'
  message: string
  kind?: HistoryEntry['kind']
}

type NotifyStep = {
  type: 'notify'
  message: string
  kind: NotificationKind
}

type SetInputStep = {
  type: 'set-input'
  value: string
}

type ClosePopupStep = {
  type: 'close-popup'
}

type OpenPopupStep = {
  type: 'open-popup'
  popup:
    | 'model'
    | 'target'
    | 'polish'
    | 'toggle'
    | 'file'
    | 'url'
    | 'image'
    | 'video'
    | 'history'
    | 'smart-root'
    | 'tokens'
    | 'settings'
    | 'theme'
    | 'theme-mode'
    | 'reasoning'
    | 'test'
    | 'intent'
    | 'instructions'
  field?: ToggleField
}

type ApplyToggleStep = {
  type: 'apply-toggle'
  field: ToggleField
  value: boolean
}

type ClearPolishStep = {
  type: 'clear-polish'
}

type AddUrlStep = {
  type: 'add-url'
  value: string
}

type AddImageStep = {
  type: 'add-image'
  value: string
}

type AddVideoStep = {
  type: 'add-video'
  value: string
}

type SmartContextToggleStep = {
  type: 'toggle-smart-context'
}

type SetSmartRootStep = {
  type: 'set-smart-root'
  value: string
}

type SetIntentFileStep = {
  type: 'set-intent-file'
  value: string
}

type SetMetaInstructionsStep = {
  type: 'set-meta-instructions'
  value: string
}

type ClearScreenStep = {
  type: 'clear-screen'
}

type ExitAppStep = {
  type: 'exit-app'
}

type RunTestsStep = {
  type: 'run-tests'
  value: string
}

export type PopupManagerCommandStep =
  | PushHistoryStep
  | NotifyStep
  | SetInputStep
  | ClosePopupStep
  | OpenPopupStep
  | ApplyToggleStep
  | ClearPolishStep
  | AddUrlStep
  | AddImageStep
  | AddVideoStep
  | SmartContextToggleStep
  | SetSmartRootStep
  | SetIntentFileStep
  | SetMetaInstructionsStep
  | ClearScreenStep
  | ExitAppStep
  | RunTestsStep

export type CommandMappingResult =
  | { kind: 'steps'; steps: readonly PopupManagerCommandStep[] }
  | { kind: 'series'; trimmedArgs: string }

export type CommandMappingContext = {
  copyEnabled: boolean
  chatGptEnabled: boolean
  jsonOutputEnabled: boolean
  interactiveTransportPath?: string | undefined
  urls: readonly string[]
  images: readonly string[]
  videos: readonly string[]
  smartContextEnabled: boolean
  smartContextRoot: string | null
}

const OPEN_TOGGLE_ARGS = new Set(['on', 'off'])
const CLEAR_ARGS = new Set(['off', 'clear', '--clear'])

export const mapPopupCommandSelection = ({
  commandId,
  argsRaw,
  context,
}: {
  commandId: CommandDescriptor['id']
  argsRaw?: string | undefined
  context: CommandMappingContext
}): CommandMappingResult => {
  const trimmedArgs = argsRaw?.trim() ?? ''
  const normalizedToggleArgs = trimmedArgs.toLowerCase()

  switch (commandId) {
    case 'model':
      return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'model' }] }

    case 'target':
      return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'target' }] }

    case 'polish': {
      if (trimmedArgs && CLEAR_ARGS.has(normalizedToggleArgs)) {
        return { kind: 'steps', steps: [{ type: 'clear-polish' }] }
      }

      return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'polish' }] }
    }

    case 'copy': {
      if (!trimmedArgs) {
        return {
          kind: 'steps',
          steps: [{ type: 'apply-toggle', field: 'copy', value: !context.copyEnabled }],
        }
      }

      if (OPEN_TOGGLE_ARGS.has(normalizedToggleArgs)) {
        return {
          kind: 'steps',
          steps: [{ type: 'apply-toggle', field: 'copy', value: normalizedToggleArgs === 'on' }],
        }
      }

      return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'toggle', field: 'copy' }] }
    }

    case 'chatgpt': {
      if (!trimmedArgs) {
        return {
          kind: 'steps',
          steps: [{ type: 'apply-toggle', field: 'chatgpt', value: !context.chatGptEnabled }],
        }
      }

      if (OPEN_TOGGLE_ARGS.has(normalizedToggleArgs)) {
        return {
          kind: 'steps',
          steps: [{ type: 'apply-toggle', field: 'chatgpt', value: normalizedToggleArgs === 'on' }],
        }
      }

      return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'toggle', field: 'chatgpt' }] }
    }

    case 'json': {
      if (context.interactiveTransportPath) {
        return {
          kind: 'steps',
          steps: [
            { type: 'push-history', message: JSON_INTERACTIVE_ERROR, kind: 'system' },
            { type: 'set-input', value: '' },
          ],
        }
      }

      if (!trimmedArgs) {
        return {
          kind: 'steps',
          steps: [{ type: 'apply-toggle', field: 'json', value: !context.jsonOutputEnabled }],
        }
      }

      if (OPEN_TOGGLE_ARGS.has(normalizedToggleArgs)) {
        return {
          kind: 'steps',
          steps: [{ type: 'apply-toggle', field: 'json', value: normalizedToggleArgs === 'on' }],
        }
      }

      return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'toggle', field: 'json' }] }
    }

    case 'file':
      return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'file' }] }

    case 'url': {
      if (!trimmedArgs) {
        return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'url' }] }
      }

      const candidates = parseUrlArgs(trimmedArgs)
      if (candidates.length === 0) {
        return {
          kind: 'steps',
          steps: [{ type: 'set-input', value: '' }, { type: 'close-popup' }],
        }
      }

      const steps: PopupManagerCommandStep[] = []
      const seen = new Set<string>()

      for (const candidate of candidates) {
        if (seen.has(candidate)) {
          continue
        }
        seen.add(candidate)

        const validation = validateHttpUrlCandidate(candidate)
        if (!validation.ok) {
          steps.push({
            type: 'push-history',
            message: `Warning: ${validation.message}`,
            kind: 'system',
          })
          continue
        }

        if (context.urls.includes(candidate)) {
          steps.push({
            type: 'push-history',
            message: `Context URL already added: ${candidate}`,
            kind: 'system',
          })
          continue
        }

        steps.push({ type: 'add-url', value: candidate })
        steps.push({
          type: 'push-history',
          message: `Context URL added: ${candidate}`,
          kind: 'system',
        })
      }

      steps.push({ type: 'set-input', value: '' })
      steps.push({ type: 'close-popup' })

      return { kind: 'steps', steps }
    }

    case 'image': {
      if (!trimmedArgs) {
        return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'image' }] }
      }

      if (context.images.includes(trimmedArgs)) {
        return {
          kind: 'steps',
          steps: [
            {
              type: 'push-history',
              message: `[image] Already attached: ${trimmedArgs}`,
              kind: 'system',
            },
            { type: 'set-input', value: '' },
            { type: 'close-popup' },
          ],
        }
      }

      return {
        kind: 'steps',
        steps: [
          { type: 'add-image', value: trimmedArgs },
          { type: 'push-history', message: `[image] Attached: ${trimmedArgs}`, kind: 'system' },
          { type: 'set-input', value: '' },
          { type: 'close-popup' },
        ],
      }
    }

    case 'video': {
      if (!trimmedArgs) {
        return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'video' }] }
      }

      if (context.videos.includes(trimmedArgs)) {
        return {
          kind: 'steps',
          steps: [
            {
              type: 'push-history',
              message: `[video] Already attached: ${trimmedArgs}`,
              kind: 'system',
            },
            { type: 'set-input', value: '' },
            { type: 'close-popup' },
          ],
        }
      }

      return {
        kind: 'steps',
        steps: [
          { type: 'add-video', value: trimmedArgs },
          { type: 'push-history', message: `[video] Attached: ${trimmedArgs}`, kind: 'system' },
          { type: 'set-input', value: '' },
          { type: 'close-popup' },
        ],
      }
    }

    case 'smart': {
      const nextEnabled = !trimmedArgs
        ? !context.smartContextEnabled
        : normalizedToggleArgs === 'on'
          ? true
          : normalizedToggleArgs === 'off'
            ? false
            : null

      if (nextEnabled === null) {
        return {
          kind: 'steps',
          steps: [
            { type: 'notify', message: 'Smart context expects /smart on|off', kind: 'warning' },
            { type: 'set-input', value: '' },
            { type: 'close-popup' },
          ],
        }
      }

      const steps: PopupManagerCommandStep[] = []

      const isDisabling = nextEnabled === false
      const shouldClearRoot = isDisabling && Boolean(context.smartContextRoot)

      if (shouldClearRoot) {
        steps.push({ type: 'set-smart-root', value: '' })
      }

      if (context.smartContextEnabled !== nextEnabled) {
        steps.push({ type: 'toggle-smart-context' })
      }

      steps.push({
        type: 'notify',
        message: nextEnabled
          ? 'Smart context enabled'
          : shouldClearRoot
            ? 'Smart context disabled; root cleared'
            : 'Smart context disabled',
        kind: nextEnabled ? 'info' : 'warning',
      })

      steps.push({ type: 'set-input', value: '' })
      steps.push({ type: 'close-popup' })

      return { kind: 'steps', steps }
    }

    case 'smart-root': {
      if (!trimmedArgs) {
        return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'smart-root' }] }
      }

      const normalizedRootArgs = trimmedArgs.toLowerCase()
      const rootValue = CLEAR_ARGS.has(normalizedRootArgs) ? '' : trimmedArgs
      const shouldEnable = Boolean(rootValue) && !context.smartContextEnabled

      const steps: PopupManagerCommandStep[] = [{ type: 'set-smart-root', value: rootValue }]
      if (shouldEnable) {
        steps.push({ type: 'toggle-smart-context' })
      }

      steps.push({
        type: 'notify',
        message: rootValue
          ? shouldEnable
            ? `Smart context enabled; root set to ${rootValue}`
            : `Smart context root set to ${rootValue}`
          : 'Smart context root cleared',
        kind: rootValue ? 'info' : 'warning',
      })

      steps.push({ type: 'set-input', value: '' })
      steps.push({ type: 'close-popup' })

      return { kind: 'steps', steps }
    }

    case 'tokens':
      return {
        kind: 'steps',
        steps: [
          { type: 'open-popup', popup: 'tokens' },
          { type: 'set-input', value: '' },
        ],
      }

    case 'settings':
      return {
        kind: 'steps',
        steps: [
          { type: 'open-popup', popup: 'settings' },
          { type: 'set-input', value: '' },
        ],
      }

    case 'theme':
      return {
        kind: 'steps',
        steps: [
          { type: 'open-popup', popup: 'theme' },
          { type: 'set-input', value: '' },
        ],
      }

    case 'theme-mode':
      return {
        kind: 'steps',
        steps: [
          { type: 'open-popup', popup: 'theme-mode' },
          { type: 'set-input', value: '' },
        ],
      }

    case 'reasoning':
      return {
        kind: 'steps',
        steps: [
          { type: 'open-popup', popup: 'reasoning' },
          { type: 'set-input', value: '' },
        ],
      }

    case 'history':
      return {
        kind: 'steps',
        steps: [
          { type: 'open-popup', popup: 'history' },
          { type: 'set-input', value: '' },
        ],
      }

    case 'intent': {
      if (!trimmedArgs) {
        return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'intent' }] }
      }

      const normalizedValue = trimmedArgs.trim()

      return {
        kind: 'steps',
        steps: [
          { type: 'set-intent-file', value: normalizedValue },
          {
            type: 'push-history',
            message: normalizedValue
              ? `Intent file set to ${normalizedValue}`
              : 'Intent file cleared; using typed intent.',
          },
          { type: 'set-input', value: '' },
          { type: 'close-popup' },
        ],
      }
    }

    case 'instructions': {
      if (!trimmedArgs) {
        return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'instructions' }] }
      }

      const normalizedValue = trimmedArgs.trim()

      return {
        kind: 'steps',
        steps: [
          { type: 'set-meta-instructions', value: normalizedValue },
          {
            type: 'push-history',
            message: normalizedValue ? `[instr] ${normalizedValue}` : '[instr] cleared',
          },
          { type: 'set-input', value: '' },
          { type: 'close-popup' },
        ],
      }
    }

    case 'exit':
      return {
        kind: 'steps',
        steps: [
          { type: 'push-history', message: 'Exiting…', kind: 'system' },
          { type: 'set-input', value: '' },
          { type: 'clear-screen' },
          { type: 'exit-app' },
        ],
      }

    case 'series':
      return { kind: 'series', trimmedArgs }

    case 'test': {
      if (trimmedArgs) {
        return {
          kind: 'steps',
          steps: [
            {
              type: 'push-history',
              message: `[tests] Running /test ${trimmedArgs}`,
              kind: 'system',
            },
            { type: 'run-tests', value: trimmedArgs },
          ],
        }
      }

      return { kind: 'steps', steps: [{ type: 'open-popup', popup: 'test' }] }
    }

    default:
      return { kind: 'steps', steps: [{ type: 'push-history', message: `Selected ${commandId}` }] }
  }
}
