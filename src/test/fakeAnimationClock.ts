import { act } from '@testing-library/react'
import { vi } from 'vitest'

export interface FakeAnimationClock {
  /** Current simulated `performance.now()` value. */
  now(): number
  /** Moves time forward in frame-sized steps, running every queued frame callback. */
  advance(ms: number): void
  uninstall(): void
}

const FRAME_MS = 16

/**
 * Deterministic stand-in for `performance.now()` + `requestAnimationFrame`, so
 * timing tests never depend on wall-clock speed. Frames are flushed inside
 * `act()` because the loops under test dispatch React state updates.
 */
export function installFakeAnimationClock(startMs = 1_000): FakeAnimationClock {
  let currentMs = startMs
  let nextFrameId = 1
  const queuedFrames = new Map<number, FrameRequestCallback>()

  const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => currentMs)
  const rafSpy = vi
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation((callback: FrameRequestCallback) => {
      const frameId = nextFrameId
      nextFrameId += 1
      queuedFrames.set(frameId, callback)

      return frameId
    })
  const cancelSpy = vi
    .spyOn(globalThis, 'cancelAnimationFrame')
    .mockImplementation((frameId: number) => {
      queuedFrames.delete(frameId)
    })

  const runQueuedFrames = () => {
    const callbacks = [...queuedFrames.values()]
    queuedFrames.clear()

    // The loops under test dispatch React updates, so a frame flush is an act boundary.
    act(() => {
      for (const callback of callbacks) {
        callback(currentMs)
      }
    })
  }

  return {
    now: () => currentMs,
    advance(ms: number) {
      const target = currentMs + ms

      while (currentMs < target) {
        currentMs = Math.min(target, currentMs + FRAME_MS)
        runQueuedFrames()
      }
    },
    uninstall() {
      nowSpy.mockRestore()
      rafSpy.mockRestore()
      cancelSpy.mockRestore()
      queuedFrames.clear()
    },
  }
}
