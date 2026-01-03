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

  it('clears terminal after Ink exits', async () => {
    const stdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const originalIsTTY = process.stdout.isTTY
    process.stdout.isTTY = true

    const waitUntilExit = jest.fn(async () => {})
    getInkMock().render.mockReturnValue({ waitUntilExit })

    await runTuiCommand([])

    expect(waitUntilExit).toHaveBeenCalledTimes(1)
    expect(stdoutWrite).toHaveBeenCalledWith('\u001b[0m\u001b[2J\u001b[H')

    stdoutWrite.mockRestore()
    process.stdout.isTTY = originalIsTTY
  })

  it('skips clear when not a TTY', async () => {
    const stdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const originalIsTTY = process.stdout.isTTY
    process.stdout.isTTY = false

    const waitUntilExit = jest.fn(async () => {})
    getInkMock().render.mockReturnValue({ waitUntilExit })

    await runTuiCommand([])

    expect(waitUntilExit).toHaveBeenCalledTimes(1)
    expect(stdoutWrite).not.toHaveBeenCalled()

    stdoutWrite.mockRestore()
    process.stdout.isTTY = originalIsTTY
  })
})
