import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installFakeAnimationClock, type FakeAnimationClock } from '@/test/fakeAnimationClock'
import { useAnimationClock } from './useAnimationClock'

const installed: FakeAnimationClock[] = []

function startClock(startMs?: number): FakeAnimationClock {
  const clock = installFakeAnimationClock(startMs)
  installed.push(clock)

  return clock
}

afterEach(() => {
  installed.splice(0).forEach((clock) => clock.uninstall())
})

describe('useAnimationClock', () => {
  it('ticks once per frame while it is running', () => {
    const clock = startClock(5_000)
    const onTick = vi.fn()

    renderHook(() => useAnimationClock(true, onTick))
    clock.advance(48)

    expect(onTick).toHaveBeenCalledTimes(3)
    expect(onTick.mock.calls[0][0]).toBe(5_016)
    expect(onTick.mock.calls[2][0]).toBe(5_048)
  })

  it('stays idle when off and stops as soon as it is switched off', () => {
    const clock = startClock()
    const onTick = vi.fn()
    const { rerender } = renderHook(({ isRunning }) => useAnimationClock(isRunning, onTick), {
      initialProps: { isRunning: false },
    })

    clock.advance(160)
    expect(onTick).not.toHaveBeenCalled()

    rerender({ isRunning: true })
    clock.advance(32)

    expect(onTick).toHaveBeenCalledTimes(2)

    rerender({ isRunning: false })
    clock.advance(160)

    expect(onTick).toHaveBeenCalledTimes(2)
  })
})

