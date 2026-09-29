import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installFakeAnimationClock, type FakeAnimationClock } from '@/test/fakeAnimationClock'
import { DEFAULT_USER_SETTINGS, type UserSettings } from '@/config/userSettings'
import { useMorseSession } from './useMorseSession'
import type { UserSettingsActions } from './useUserSettings'

const installed: FakeAnimationClock[] = []

function startClock(startMs?: number): FakeAnimationClock {
  const clock = installFakeAnimationClock(startMs)
  installed.push(clock)

  return clock
}

afterEach(() => {
  installed.splice(0).forEach((clock) => clock.uninstall())
})

/**
 * The hook only reads settings and calls the setters, so a plain object is enough —
 * no storage, no provider. `thresholds` stay at the built-in defaults unless a test
 * says otherwise.
 */
function settingsActions(overrides: Partial<UserSettings> = {}): UserSettingsActions {
  return {
    settings: { ...DEFAULT_USER_SETTINGS, ...overrides },
    setMode: vi.fn(),
    setBindings: vi.fn(),
    setSound: vi.fn(),
    setThresholds: vi.fn(),
    setAlphabet: vi.fn(),
    resetThresholds: vi.fn(),
  }
}

function pressSpace(): void {
  fireEvent.keyDown(window, { code: 'Space', key: ' ' })
}

function releaseSpace(): void {
  fireEvent.keyUp(window, { code: 'Space', key: ' ' })
}

describe('useMorseSession', () => {
  it('decodes a single tap into the letter E', () => {
    const clock = startClock(10_000)
    const { result } = renderHook(() => useMorseSession(settingsActions()))

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
    const { result } = renderHook(() => useMorseSession(settingsActions()))

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

  it('takes dots and dashes from two separate keys in dual mode', () => {
    const clock = startClock(25_000)
    const { result } = renderHook(() =>
      useMorseSession(
        settingsActions({ mode: 'dual', bindings: { ditCode: 'KeyF', dahCode: 'KeyJ' } }),
      ),
    )

    fireEvent.keyDown(window, { code: 'KeyF' })
    fireEvent.keyUp(window, { code: 'KeyF' })
    fireEvent.keyDown(window, { code: 'KeyJ' })
    // A dash key held past the letter threshold must not cut the character in half.
    clock.advance(600)
    fireEvent.keyUp(window, { code: 'KeyJ' })
    clock.advance(304)

    expect(result.current.state.text).toBe('A')
  })

  it('separates words once the pause passes the word threshold, and only once', () => {
    const clock = startClock(30_000)
    const { result } = renderHook(() => useMorseSession(settingsActions()))

    pressSpace()
    clock.advance(80)
    releaseSpace()
    clock.advance(1_200)

    expect(result.current.state.text).toBe('E ')
    expect(result.current.state.phase).toBe('waiting')

    clock.advance(400)

    expect(result.current.state.text).toBe('E ')
  })

  it('breaks the line when the silence keeps going', () => {
    const clock = startClock(34_000)
    const { result } = renderHook(() => useMorseSession(settingsActions()))

    pressSpace()
    clock.advance(80)
    releaseSpace()
    clock.advance(1_200)

    expect(result.current.state.text).toBe('E ')

    clock.advance(900)

    expect(result.current.state.text).toBe('E\n')
    expect(result.current.state.phase).toBe('idle')
  })

  it('decodes a digit only after digits are switched on', () => {
    const clock = startClock(36_000)
    const { result } = renderHook(() => useMorseSession(settingsActions({ alphabet: { digits: true, specials: false } })))

    for (let tap = 0; tap < 5; tap += 1) {
      pressSpace()
      clock.advance(80)
      releaseSpace()
      clock.advance(80)
    }

    clock.advance(400)

    expect(result.current.state.text).toBe('5')
  })

  it('drops key bounce and clears on request', () => {
    const clock = startClock(40_000)
    const { result } = renderHook(() => useMorseSession(settingsActions()))

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
