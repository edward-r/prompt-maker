/**
 * TODO: the dedupe logic in showToast could be made more sophisticated.
 * It should not be deduping at all. Need to figure out a better way to handle
 * repeated messages that need to be updated (e.g. progress toasts).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { DEFAULT_MAX_TOASTS, TOAST_ANIMATION_TICK_MS, TOAST_HEIGHT } from './toast-constants'
import {
  addOrReuseToast,
  beginExitToast,
  createToastTrimmedMessage,
  getLatestActiveToast,
  getOldestActiveToastId,
  removeToast as removeToastFromList,
} from './toast-state'
import type { ToastId, ToastItem, ToastKind } from './toast-state'

export type { ToastId, ToastItem, ToastKind } from './toast-state'

export type NotifyOptions = {
  kind?: ToastKind
  autoDismissMs?: number
}

export type UseNotifierOptions = {
  autoDismissMs?: number
}

type ToastContextValue = {
  toasts: ToastItem[]
  showToast: (message: string, options?: NotifyOptions) => ToastId | null
  dismissToast: (id: ToastId) => void
  removeToast: (id: ToastId) => void
  dismissLatest: () => void
  maxToasts: number
  defaultAutoDismissMs: number
  exitAnimationMs: number
}

const DEFAULT_AUTO_DISMISS_MS = 2200

const ToastContext = createContext<ToastContextValue | null>(null)

export type ToastProviderProps = {
  children: React.ReactNode
  maxToasts?: number
  defaultAutoDismissMs?: number
  exitAnimationMs?: number
}

export const ToastProvider = ({
  children,
  maxToasts = DEFAULT_MAX_TOASTS,
  defaultAutoDismissMs = DEFAULT_AUTO_DISMISS_MS,
  exitAnimationMs = TOAST_HEIGHT * TOAST_ANIMATION_TICK_MS,
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const nextToastIdRef = useRef(1)
  const dismissTimersRef = useRef(new Map<ToastId, ReturnType<typeof setTimeout>>())
  const removalTimersRef = useRef(new Map<ToastId, ReturnType<typeof setTimeout>>())
  const toastsRef = useRef<ToastItem[]>([])

  useEffect(() => {
    toastsRef.current = toasts
  }, [toasts])

  const clearDismissTimer = useCallback((id: ToastId): void => {
    const timer = dismissTimersRef.current.get(id)
    if (!timer) {
      return
    }
    clearTimeout(timer)
    dismissTimersRef.current.delete(id)
  }, [])

  const clearRemovalTimer = useCallback((id: ToastId): void => {
    const timer = removalTimersRef.current.get(id)
    if (!timer) {
      return
    }
    clearTimeout(timer)
    removalTimersRef.current.delete(id)
  }, [])

  const removeToast = useCallback(
    (id: ToastId): void => {
      clearDismissTimer(id)
      clearRemovalTimer(id)

      setToasts((prev) => removeToastFromList(prev, id))
    },
    [clearDismissTimer, clearRemovalTimer],
  )

  const beginExit = useCallback(
    (id: ToastId): void => {
      clearDismissTimer(id)

      setToasts((prev) => beginExitToast(prev, id))

      if (removalTimersRef.current.has(id)) {
        return
      }

      const timer = setTimeout(() => {
        removeToast(id)
      }, exitAnimationMs)

      removalTimersRef.current.set(id, timer)
    },
    [clearDismissTimer, exitAnimationMs, removeToast],
  )

  const dismissToast = useCallback(
    (id: ToastId): void => {
      beginExit(id)
    },
    [beginExit],
  )

  const dismissLatest = useCallback((): void => {
    const latestActive = getLatestActiveToast(toastsRef.current)
    if (!latestActive) {
      return
    }

    beginExit(latestActive.id)
  }, [beginExit])

  const showToast = useCallback(
    (message: string, options: NotifyOptions = {}): ToastId | null => {
      const trimmed = createToastTrimmedMessage(message)
      if (!trimmed) {
        return null
      }

      const kind = options.kind ?? 'info'
      const autoDismissMs = options.autoDismissMs ?? defaultAutoDismissMs

      const result = addOrReuseToast({
        toasts: toastsRef.current,
        message: trimmed,
        kind,
        autoDismissMs,
        now: Date.now(),
        nextToastId: nextToastIdRef.current,
      })

      nextToastIdRef.current = result.nextToastId
      const toastId = result.toastId

      if (result.action === 'added') {
        toastsRef.current = result.toasts
        setToasts(result.toasts)
      }

      clearDismissTimer(toastId)

      if (autoDismissMs !== null) {
        const timer = setTimeout(() => {
          dismissToast(toastId)
        }, autoDismissMs)

        dismissTimersRef.current.set(toastId, timer)
      }

      return toastId
    },
    [clearDismissTimer, defaultAutoDismissMs, dismissToast],
  )

  useEffect(() => {
    const activeToasts = toasts.filter((toast) => !toast.isExiting)
    if (activeToasts.length <= maxToasts) {
      return
    }

    const oldestActiveId = getOldestActiveToastId(toasts)
    if (oldestActiveId === null) {
      return
    }

    beginExit(oldestActiveId)
  }, [beginExit, maxToasts, toasts])

  useEffect(() => {
    const dismissTimers = dismissTimersRef.current
    const removalTimers = removalTimersRef.current

    return () => {
      for (const timer of dismissTimers.values()) {
        clearTimeout(timer)
      }
      dismissTimers.clear()

      for (const timer of removalTimers.values()) {
        clearTimeout(timer)
      }
      removalTimers.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      dismissToast,
      removeToast,
      dismissLatest,
      maxToasts,
      defaultAutoDismissMs,
      exitAnimationMs,
    }),
    [
      defaultAutoDismissMs,
      dismissLatest,
      dismissToast,
      exitAnimationMs,
      maxToasts,
      removeToast,
      showToast,
      toasts,
    ],
  )

  return React.createElement(ToastContext.Provider, { value }, children)
}

export const useToastContext = (): ToastContextValue => {
  const value = useContext(ToastContext)
  if (!value) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return value
}

export const useNotifier = (options: UseNotifierOptions = {}) => {
  const { toasts, showToast, dismissToast, dismissLatest, defaultAutoDismissMs } = useToastContext()

  const defaultDismissMs = options.autoDismissMs ?? defaultAutoDismissMs

  const notify = useCallback(
    (message: string, notifyOptions: NotifyOptions = {}): void => {
      void showToast(message, {
        ...notifyOptions,
        autoDismissMs: notifyOptions.autoDismissMs ?? defaultDismissMs,
      })
    },
    [defaultDismissMs, showToast],
  )

  return {
    toasts,
    notify,
    showToast,
    dismiss: dismissLatest,
    dismissToast,
  }
}
