import { fireEvent, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installFakeAnimationClock, type FakeAnimationClock } from '@/test/fakeAnimationClock'
import { DEFAULT_KEY_BINDINGS } from '@/config/userSettings'
import { usePressInput, type PressInputOptions } from './usePressInput'

const installed: FakeAnimationClock[] = []

function startClock(startMs?: number): FakeAnimationClock {
  const clock = installFakeAnimationClock(startMs)
  installed.push(clock)

  return clock
}

afterEach(() => {
  installed.splice(0).forEach((clock) => clock.uninstall())
})

/** Every callback is a spy, so a test reads the one it cares about off `options`. */
function pressOptions(overrides: Partial<PressInputOptions> = {}): PressInputOptions {
  return {
    mode: 'single',
    bindings: DEFAULT_KEY_BINDINGS,
    capture: null,
    onCapture: vi.fn(),
    onPressStart: vi.fn(),
    onPressEnd: vi.fn(),
    onSymbolDown: vi.fn(),
    onSymbolUp: vi.fn(),
    ...overrides,
  }
}

function pressSpace(): void {
  fireEvent.keyDown(window, { code: 'Space', key: ' ' })
}

function releaseSpace(): void {
  fireEvent.keyUp(window, { code: 'Space', key: ' ' })
}

describe('usePressInput', () => {
  it('reports the dwell time between keydown and keyup', () => {
    const clock = startClock(2_000)
    const options = pressOptions()

    renderHook(() => usePressInput(options))

    pressSpace()
    expect(options.onPressStart).toHaveBeenCalledWith(2_000)

    clock.advance(150)
    releaseSpace()

    expect(options.onPressEnd).toHaveBeenCalledWith(2_150)
  })

  it('ignores auto-repeat keydown events', () => {
    const options = pressOptions()

    renderHook(() => usePressInput(options))
    fireEvent.keyDown(window, { code: 'Space', key: ' ', repeat: true })

    expect(options.onPressStart).not.toHaveBeenCalled()
  })

  it('does not report a second start while the key is still down', () => {
    const options = pressOptions()

    renderHook(() => usePressInput(options))
    pressSpace()
    pressSpace()
    releaseSpace()

    expect(options.onPressStart).toHaveBeenCalledTimes(1)
    expect(options.onPressEnd).toHaveBeenCalledTimes(1)
  })

  it('ends the press when the window loses focus', () => {
    const options = pressOptions()

    renderHook(() => usePressInput(options))
    pressSpace()
    fireEvent.blur(window)

    expect(options.onPressEnd).toHaveBeenCalledTimes(1)
  })

  it('takes the two symbols from their own keys in dual mode', () => {
    const clock = startClock(3_000)
    const options = pressOptions({ mode: 'dual' })

    renderHook(() => usePressInput(options))
    fireEvent.keyDown(window, { code: DEFAULT_KEY_BINDINGS.ditCode })
    fireEvent.keyUp(window, { code: DEFAULT_KEY_BINDINGS.ditCode })
    clock.advance(120)
    fireEvent.keyDown(window, { code: DEFAULT_KEY_BINDINGS.dahCode })
    fireEvent.keyUp(window, { code: DEFAULT_KEY_BINDINGS.dahCode })

    expect(options.onSymbolDown).toHaveBeenCalledWith('.', 3_000)
    expect(options.onSymbolUp).toHaveBeenCalledWith('.', 3_000)
    expect(options.onSymbolDown).toHaveBeenCalledWith('-', 3_120)
    expect(options.onPressStart).not.toHaveBeenCalled()
  })

  it('ignores unbound keys in dual mode', () => {
    const options = pressOptions({ mode: 'dual' })

    renderHook(() => usePressInput(options))
    fireEvent.keyDown(window, { code: 'Space' })

    expect(options.onSymbolDown).not.toHaveBeenCalled()
    expect(options.onPressStart).not.toHaveBeenCalled()
  })

  it('captures a key for rebinding instead of keying it', () => {
    const options = pressOptions({ mode: 'dual', capture: 'dah' })

    renderHook(() => usePressInput(options))
    fireEvent.keyDown(window, { code: 'KeyK' })

    expect(options.onCapture).toHaveBeenCalledWith('dah', 'KeyK')
    expect(options.onSymbolDown).not.toHaveBeenCalled()
  })

  it('leaves typing in form fields alone', () => {
    const options = pressOptions()
    const input = document.createElement('input')
    document.body.append(input)

    renderHook(() => usePressInput(options))
    fireEvent.keyDown(input, { code: 'Space', key: ' ' })

    expect(options.onPressStart).not.toHaveBeenCalled()

    input.remove()
  })
})
