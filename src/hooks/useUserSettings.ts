import { useCallback, useMemo, useState } from 'react'
import {
  DEFAULT_USER_SETTINGS,
  loadUserSettings,
  saveUserSettings,
  type KeyBindings,
  type SoundSettings,
  type UserSettings,
} from '../config/userSettings'
import type { AlphabetSelection } from '../domain/morse/morseAlphabet'
import type { MorseTimingThresholds } from '../domain/morse/timingClassifier'

function browserStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export interface UserSettingsSeed {
  /** Usually the environment-derived thresholds: the values a fresh visitor starts on. */
  readonly thresholds: MorseTimingThresholds
  readonly alphabet?: AlphabetSelection
}

export interface UserSettingsActions {
  readonly settings: UserSettings
  readonly setMode: (mode: UserSettings['mode']) => void
  readonly setBindings: (bindings: KeyBindings) => void
  readonly setSound: (sound: SoundSettings) => void
  readonly setThresholds: (thresholds: MorseTimingThresholds) => void
  readonly setAlphabet: (alphabet: AlphabetSelection) => void
  /** Drops the saved tuning and returns to the seeded (`.env`) thresholds. */
  readonly resetThresholds: () => void
}

/**
 * User-adjustable settings, seeded from the environment-derived defaults and
 * persisted to localStorage. Everything the user can tune lives here; the env
 * file remains the source of the starting values, and `resetThresholds` is the
 * way back to them.
 */
export function useUserSettings(seed: UserSettingsSeed): UserSettingsActions {
  const fallback = useMemo<UserSettings>(
    () => ({
      ...DEFAULT_USER_SETTINGS,
      thresholds: seed.thresholds,
      alphabet: seed.alphabet ?? DEFAULT_USER_SETTINGS.alphabet,
    }),
    [seed.thresholds, seed.alphabet],
  )
  const [settings, setSettings] = useState<UserSettings>(() =>
    loadUserSettings(typeof window === 'undefined' ? null : window.localStorage, fallback),
  )

  const update = useCallback((next: UserSettings) => {
    setSettings(next)
    saveUserSettings(browserStorage(), next)
  }, [])

  return {
    settings,
    setMode: useCallback(
      (mode) => update({ ...settings, mode }),
      [settings, update],
    ),
    setBindings: useCallback(
      (bindings) => update({ ...settings, bindings }),
      [settings, update],
    ),
    setSound: useCallback(
      (sound) => update({ ...settings, sound }),
      [settings, update],
    ),
    setThresholds: useCallback(
      (thresholds) => update({ ...settings, thresholds }),
      [settings, update],
    ),
    setAlphabet: useCallback(
      (alphabet) => update({ ...settings, alphabet }),
      [settings, update],
    ),
    resetThresholds: useCallback(
      () => update({ ...settings, thresholds: fallback.thresholds }),
      [settings, update, fallback.thresholds],
    ),
  }
}
