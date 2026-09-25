import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { installFakeAnimationClock, type FakeAnimationClock } from '@/test/fakeAnimationClock'
import { useMorseSession } from './useMorseSession'

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

describe('useMorseSession', () => {
  it('decodes a single tap into the letter E', () => {
    const clock = startClock(10_000)
    const { result } = renderHook(() => useMorseSession())

    pressSpace()
    clock.advance(96)

    expect(result.current.state.phase).toBe('holding')
    expect(result.current.state.liveElapsedMs).toBe(96)

    releaseSpace()
    expect(result.current.activePath).toBe('.')
    expect(result.current.pendingCharacter).toBe('E')

    clock.advance(304)

    expect(result.current.state.text).toBe('E')
    expect(result.current.lastLetter?.character).toBe('E')
    expect(result.current.state.phase).toBe('waiting')
  })

  it('walks three fast taps down the chart to S', () => {
    const clock = startClock(20_000)
    const { result } = renderHook(() => useMorseSession())

    for (let tap = 0; tap < 3; tap += 1) {
      pressSpace()
      clock.advance(80)
      releaseSpace()
      // Short silence keeps the symbols inside one character.
      clock.advance(80)
    }

    expect(result.current.activePath).toBe('...')

    clock.advance(400)
    expect(result.current.state.text).toBe('S')
  })

  it('separates words once the pause passes the gap maximum', () => {
    const clock = startClock(30_000)
    const { result } = renderHook(() => useMorseSession())

    pressSpace()
    clock.advance(80)
    releaseSpace()
    clock.advance(1_200)

    expect(result.current.state.text).toBe('E ')
    expect(result.current.state.phase).toBe('idle')
  })

  it('drops key bounce and clears on request', () => {
    const clock = startClock(40_000)
    const { result } = renderHook(() => useMorseSession())

    pressSpace()
    clock.advance(16)
    releaseSpace()

    expect(result.current.state.symbols).toEqual([])
    expect(result.current.state.notice?.kind).toBe('short-press')

    pressSpace()
    clock.advance(96)
    releaseSpace()
    clock.advance(300)

    expect(result.current.state.text).toBe('E')

    act(() => {
      result.current.clear()
    })

    expect(result.current.state.text).toBe('')
    expect(result.current.state.letters).toEqual([])
  })
})
