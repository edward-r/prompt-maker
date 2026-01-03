export type ToastKind = 'info' | 'progress' | 'warning' | 'error'

export type ToastId = number

export type ToastItem = {
  id: ToastId
  message: string
  kind: ToastKind
  createdAt: number
  autoDismissMs: number | null
  isExiting: boolean
}

export const createToastTrimmedMessage = (message: string): string | null => {
  const trimmed = message.trim()
  return trimmed ? trimmed : null
}

export const getLatestActiveToast = (toasts: ToastItem[]): ToastItem | null => {
  const latestActive = [...toasts].reverse().find((toast) => !toast.isExiting)
  return latestActive ?? null
}

export const getOldestActiveToastId = (toasts: ToastItem[]): ToastId | null => {
  const oldest = toasts.find((toast) => !toast.isExiting)
  return oldest ? oldest.id : null
}

export type AddOrReuseToastResult =
  | {
      action: 'added'
      toastId: ToastId
      toasts: ToastItem[]
      nextToastId: ToastId
    }
  | {
      action: 'reused'
      toastId: ToastId
      toasts: ToastItem[]
      nextToastId: ToastId
    }

export const addOrReuseToast = (input: {
  toasts: ToastItem[]
  message: string
  kind: ToastKind
  autoDismissMs: number | null
  now: number
  nextToastId: ToastId
}): AddOrReuseToastResult => {
  const latestActive = getLatestActiveToast(input.toasts)
  const shouldReuse =
    latestActive !== null &&
    latestActive.message === input.message &&
    latestActive.kind === input.kind

  if (shouldReuse) {
    return {
      action: 'reused',
      toastId: latestActive.id,
      toasts: input.toasts,
      nextToastId: input.nextToastId,
    }
  }

  const toast: ToastItem = {
    id: input.nextToastId,
    message: input.message,
    kind: input.kind,
    createdAt: input.now,
    autoDismissMs: input.autoDismissMs,
    isExiting: false,
  }

  return {
    action: 'added',
    toastId: toast.id,
    toasts: [...input.toasts, toast],
    nextToastId: toast.id + 1,
  }
}

export const beginExitToast = (toasts: ToastItem[], id: ToastId): ToastItem[] => {
  const toast = toasts.find((candidate) => candidate.id === id)
  if (!toast || toast.isExiting) {
    return toasts
  }

  return toasts.map((candidate) =>
    candidate.id === id ? { ...candidate, isExiting: true } : candidate,
  )
}

export const removeToast = (toasts: ToastItem[], id: ToastId): ToastItem[] =>
  toasts.filter((toast) => toast.id !== id)
