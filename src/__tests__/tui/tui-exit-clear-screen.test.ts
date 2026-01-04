import { runTuiCommand } from '../../tui'

type InkModule = {
  render: jest.Mock
}

jest.mock('ink', () => ({
  render: jest.fn(),
}))

jest.mock('../../tui/AppContainer', () => ({
  __esModule: true,
  AppContainer: () => null,
}))

describe('runTuiCommand exit clear', () => {
  const getInkMock = (): InkModule => jest.requireMock('ink') as InkModule

  const mockStdoutIsTTY = (value: boolean): (() => void) => {
    const proto = Object.getPrototypeOf(process.stdout) as object | null
    const descriptor =
      Object.getOwnPropertyDescriptor(process.stdout, 'isTTY') ??
      (proto ? Object.getOwnPropertyDescriptor(proto, 'isTTY') : undefined)

    if (descriptor?.get) {
      const spy = jest
        .spyOn(process.stdout as unknown as { isTTY: boolean }, 'isTTY', 'get')
        .mockReturnValue(value)

      return () => spy.mockRestore()
    }

    const original = process.stdout.isTTY
    Object.defineProperty(process.stdout, 'isTTY', { value, configurable: true })

    return () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: original, configurable: true })
    }
  }

  it('clears terminal after Ink exits', async () => {
    const stdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const restoreIsTTY = mockStdoutIsTTY(true)

    try {
      const waitUntilExit = jest.fn(async () => {})
      getInkMock().render.mockReturnValue({ waitUntilExit })

      await runTuiCommand([])

      expect(waitUntilExit).toHaveBeenCalledTimes(1)
      expect(stdoutWrite).toHaveBeenCalledWith('\u001b[0m\u001b[2J\u001b[H')
    } finally {
      stdoutWrite.mockRestore()
      restoreIsTTY()
    }
  })

  it('skips clear when not a TTY', async () => {
    const stdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const restoreIsTTY = mockStdoutIsTTY(false)

    try {
      const waitUntilExit = jest.fn(async () => {})
      getInkMock().render.mockReturnValue({ waitUntilExit })

      await runTuiCommand([])

      expect(waitUntilExit).toHaveBeenCalledTimes(1)
      expect(stdoutWrite).not.toHaveBeenCalled()
    } finally {
      stdoutWrite.mockRestore()
      restoreIsTTY()
    }
  })
})
