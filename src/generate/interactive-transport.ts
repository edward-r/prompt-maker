import fs from 'node:fs/promises'
import net from 'node:net'

import { isFsNotFoundError } from './fs-utils'
import type { TransportLifecycleEventInput } from './types'
import type { StreamWriter } from './stream'

type InteractiveCommand = { type: 'refine'; instruction: string } | { type: 'finish' }

const isWindowsNamedPipePath = (target: string): boolean => target.startsWith('\\\\.\\pipe\\')

export class InteractiveTransport {
  private server: net.Server | null = null
  private client: net.Socket | null = null
  private buffer = ''
  private commandQueue: InteractiveCommand[] = []
  private pendingResolvers: Array<(command: InteractiveCommand | null) => void> = []
  private stopped = false
  private lifecycleEmitter?: (event: TransportLifecycleEventInput) => void

  constructor(private readonly socketPath: string) {}

  setEventEmitter(callback: (event: TransportLifecycleEventInput) => void): void {
    this.lifecycleEmitter = callback
  }

  async start(): Promise<void> {
    if (!isWindowsNamedPipePath(this.socketPath)) {
      try {
        await fs.unlink(this.socketPath)
      } catch (error) {
        if (!isFsNotFoundError(error)) {
          throw error
        }
      }
    }

    await new Promise<void>((resolve, reject) => {
      const server = net.createServer((socket) => this.handleConnection(socket))
      const onError = (error: Error): void => {
        server.close()
        reject(error)
      }
      server.once('error', onError)
      server.listen(this.socketPath, () => {
        server.off('error', onError)
        this.server = server
        this.emitLifecycle({ event: 'transport.listening', path: this.socketPath })
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    if (this.stopped) {
      return
    }
    this.stopped = true

    if (this.client) {
      this.client.removeAllListeners()
      this.client.destroy()
      this.client = null
    }

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server?.close(() => resolve())
      })
      this.server = null
    }

    if (!isWindowsNamedPipePath(this.socketPath)) {
      try {
        await fs.unlink(this.socketPath)
      } catch (error) {
        if (!isFsNotFoundError(error)) {
          throw error
        }
      }
    }

    this.flushPending()
  }

  getEventWriter(): StreamWriter {
    return (chunk) => {
      if (this.client && !this.client.destroyed) {
        this.client.write(chunk)
      }
    }
  }

  async nextCommand(): Promise<InteractiveCommand | null> {
    if (this.commandQueue.length > 0) {
      return this.commandQueue.shift() ?? null
    }

    if (this.stopped) {
      return null
    }

    return await new Promise<InteractiveCommand | null>((resolve) => {
      this.pendingResolvers.push(resolve)
    })
  }

  private handleConnection(socket: net.Socket): void {
    if (this.client && !this.client.destroyed) {
      this.client.destroy()
    }
    this.client = socket
    this.buffer = ''
    this.emitLifecycle({ event: 'transport.client.connected', status: 'connected' })
    socket.setEncoding('utf8')
    socket.on('data', (data: string) => {
      this.handleData(data)
    })
    socket.on('close', () => {
      if (this.client === socket) {
        this.client = null
      }
      this.emitLifecycle({ event: 'transport.client.disconnected', status: 'disconnected' })
      this.flushPending()
    })
    socket.on('error', () => {
      if (this.client === socket) {
        this.client = null
        this.emitLifecycle({ event: 'transport.client.disconnected', status: 'disconnected' })
      }
    })
  }

  private handleData(data: string): void {
    this.buffer += data
    let newlineIndex = this.buffer.indexOf('\n')
    while (newlineIndex >= 0) {
      const raw = this.buffer.slice(0, newlineIndex).trim()
      this.buffer = this.buffer.slice(newlineIndex + 1)
      if (raw) {
        this.processRawCommand(raw)
      }
      newlineIndex = this.buffer.indexOf('\n')
    }
  }

  private processRawCommand(raw: string): void {
    try {
      const parsed = JSON.parse(raw) as { type?: string; instruction?: unknown }
      if (parsed.type === 'refine' && typeof parsed.instruction === 'string') {
        const instruction = parsed.instruction.trim()
        if (!instruction) {
          this.sendTransportError('Refinement instruction must be non-empty.')
          return
        }
        this.enqueueCommand({ type: 'refine', instruction })
        return
      }

      if (parsed.type === 'finish') {
        this.enqueueCommand({ type: 'finish' })
        return
      }

      this.sendTransportError('Unknown interactive command.')
    } catch {
      this.sendTransportError('Invalid command payload; expected JSON.')
    }
  }

  private enqueueCommand(command: InteractiveCommand): void {
    if (this.pendingResolvers.length > 0) {
      const resolve = this.pendingResolvers.shift()
      resolve?.(command)
      return
    }
    this.commandQueue.push(command)
  }

  private flushPending(): void {
    while (this.pendingResolvers.length > 0) {
      const resolve = this.pendingResolvers.shift()
      resolve?.(null)
    }
    this.commandQueue = []
  }

  private sendTransportError(message: string): void {
    if (this.client && !this.client.destroyed) {
      this.client.write(`${JSON.stringify({ event: 'transport.error', message })}\n`)
    }
  }

  private emitLifecycle(event: TransportLifecycleEventInput): void {
    this.lifecycleEmitter?.(event)
  }
}
