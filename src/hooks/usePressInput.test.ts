import { fireEvent, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installFakeAnimationClock, type FakeAnimationClock } from '@/test/fakeAnimationClock'
import { usePressInput } from './usePressInput'

const installed: FakeAnimationClock[] = []

function startClock(startMs?: number): FakeAnimationClock {
  const clock = installFakeAnimationClock(startMs)
  installed.push(clock)

  return clock
}

afterEach(() => {
  installed.splice(0).forEach((clock) => clock.uninstall())
})

function pressSpace(): void {
  fireEvent.keyDown(window, { code: 'Space', key: ' ' })
}

function releaseSpace(): void {
  fireEvent.keyUp(window, { code: 'Space', key: ' ' })
}

describe('usePressInput', () => {
  it('reports the dwell time between keydown and keyup', () => {
    const clock = startClock(2_000)
    const onPressStart = vi.fn()
    const onPressEnd = vi.fn()

    renderHook(() => usePressInput({ onPressStart, onPressEnd }))

    pressSpace()
    expect(onPressStart).toHaveBeenCalledWith(2_000)

    clock.advance(150)
    releaseSpace()

    expect(onPressEnd).toHaveBeenCalledWith(2_150)
  })

  it('ignores auto-repeat keydown events', () => {
    const onPressStart = vi.fn()
    const onPressEnd = vi.fn()

    renderHook(() => usePressInput({ onPressStart, onPressEnd }))
    fireEvent.keyDown(window, { code: 'Space', key: ' ', repeat: true })

    expect(onPressStart).not.toHaveBeenCalled()
  })

  it('does not report a second start while the key is still down', () => {
    const onPressStart = vi.fn()
    const onPressEnd = vi.fn()

    renderHook(() => usePressInput({ onPressStart, onPressEnd }))
    pressSpace()
    pressSpace()
    releaseSpace()

    expect(onPressStart).toHaveBeenCalledTimes(1)
    expect(onPressEnd).toHaveBeenCalledTimes(1)
  })

  it('ends the press when the window loses focus', () => {
    const onPressStart = vi.fn()
    const onPressEnd = vi.fn()

    renderHook(() => usePressInput({ onPressStart, onPressEnd }))
    pressSpace()
    fireEvent.blur(window)

    expect(onPressEnd).toHaveBeenCalledTimes(1)
  })

  it('leaves typing in form fields alone', () => {
    const onPressStart = vi.fn()
    const onPressEnd = vi.fn()
    const input = document.createElement('input')
    document.body.append(input)

    renderHook(() => usePressInput({ onPressStart, onPressEnd }))
    fireEvent.keyDown(input, { code: 'Space', key: ' ' })

    expect(onPressStart).not.toHaveBeenCalled()

    input.remove()
  })
})
