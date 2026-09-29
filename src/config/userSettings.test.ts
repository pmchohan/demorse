import { describe, expect, it } from 'vitest'
import {
  DEFAULT_USER_SETTINGS,
  loadUserSettings,
  mergeUserSettings,
  saveUserSettings,
  type UserSettings,
} from './userSettings'
import { DEFAULT_MORSE_TIMING } from './morseTiming'

/** A fallback that is clearly distinguishable from the built-in defaults. */
const ENV_SEED: UserSettings = {
  ...DEFAULT_USER_SETTINGS,
  thresholds: { ...DEFAULT_MORSE_TIMING, wordGapMs: 1_500 },
}

function storageFrom(values: Record<string, string>): Pick<Storage, 'getItem' | 'setItem'> {
  const store = new Map(Object.entries(values))

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

describe('mergeUserSettings', () => {
  it('keeps the seeded thresholds when nothing was stored', () => {
    const merged = mergeUserSettings({}, ENV_SEED)

    expect(merged.thresholds.wordGapMs).toBe(1_500)
    expect(merged.mode).toBe('single')
  })

  it('takes the stored values over the seed', () => {
    const merged = mergeUserSettings(
      { mode: 'dual', thresholds: { wordGapMs: 700 }, sound: { id: 'clack', volume: 0.2 } },
      ENV_SEED,
    )

    expect(merged.mode).toBe('dual')
    expect(merged.thresholds.wordGapMs).toBe(700)
    // Untouched windows stay at the seed rather than the built-in defaults.
    expect(merged.thresholds.lineGapMs).toBe(ENV_SEED.thresholds.lineGapMs)
    expect(merged.sound).toEqual({ id: 'clack', volume: 0.2 })
  })

  it('drops unusable values instead of trusting storage', () => {
    const merged = mergeUserSettings(
      {
        mode: 'paddle',
        sound: { id: 'shofar', volume: 11 },
        thresholds: { tapMinMs: -30, holdMaxMs: 'wide' },
        alphabet: { digits: 'yes' },
      },
      ENV_SEED,
    )

    expect(merged.mode).toBe(ENV_SEED.mode)
    expect(merged.sound).toEqual(ENV_SEED.sound)
    expect(merged.thresholds.tapMinMs).toBe(ENV_SEED.thresholds.tapMinMs)
    expect(merged.thresholds.holdMaxMs).toBe(ENV_SEED.thresholds.holdMaxMs)
    expect(merged.alphabet).toEqual(ENV_SEED.alphabet)
  })

  it('never lets both keys be the same key', () => {
    const merged = mergeUserSettings({ bindings: { ditCode: 'KeyF', dahCode: 'KeyF' } })

    expect(merged.bindings.ditCode).toBe('KeyF')
    expect(merged.bindings.dahCode).not.toBe('KeyF')
  })

  it('falls back wholesale when the payload is not an object', () => {
    for (const raw of [null, undefined, 'settings', 7, []]) {
      expect(mergeUserSettings(raw, ENV_SEED)).toBe(ENV_SEED)
    }
  })
})

describe('loadUserSettings', () => {
  it('returns the seed when there is no storage, no entry, or broken JSON', () => {
    expect(loadUserSettings(null, ENV_SEED)).toBe(ENV_SEED)
    expect(loadUserSettings(storageFrom({}), ENV_SEED)).toBe(ENV_SEED)
    expect(loadUserSettings(storageFrom({ 'demorse.settings.v1': '{' }), ENV_SEED)).toBe(ENV_SEED)
  })

  it('reads back what was saved', () => {
    const storage = storageFrom({})
    const next: UserSettings = {
      ...DEFAULT_USER_SETTINGS,
      mode: 'dual',
      bindings: { ditCode: 'KeyS', dahCode: 'KeyL' },
    }

    saveUserSettings(storage, next)

    expect(loadUserSettings(storage, ENV_SEED)).toEqual(next)
  })

  it('keeps working when storage refuses to be written', () => {
    const refusing: Pick<Storage, 'getItem' | 'setItem'> = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceeded')
      },
    }

    expect(() => saveUserSettings(refusing, DEFAULT_USER_SETTINGS)).not.toThrow()
  })
})
