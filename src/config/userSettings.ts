import { DEFAULT_MORSE_TIMING } from './morseTiming'
import type { MorseTimingThresholds } from '../domain/morse/timingClassifier'
import type { AlphabetSelection } from '../domain/morse/morseAlphabet'

/** How the operator supplies symbols: one key timed, or one key per symbol. */
export type InputMode = 'single' | 'dual'

export interface KeyBindings {
  /** `event.code`, so the layout position survives, not the glyph. */
  readonly ditCode: string
  readonly dahCode: string
}

/** Sound identities, in dropdown order. `off` is always first. */
export type SoundId = 'off' | 'sidetone' | 'sounder' | 'clack' | 'bright'

export interface SoundSettings {
  readonly id: SoundId
  /** 0–1 multiplier applied to every preset's own level. */
  readonly volume: number
}

export interface UserSettings {
  readonly mode: InputMode
  readonly bindings: KeyBindings
  readonly sound: SoundSettings
  readonly thresholds: MorseTimingThresholds
  readonly alphabet: AlphabetSelection
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = { ditCode: 'KeyF', dahCode: 'KeyJ' }

export const DEFAULT_USER_SETTINGS: UserSettings = {
  mode: 'single',
  bindings: DEFAULT_KEY_BINDINGS,
  sound: { id: 'off', volume: 0.6 },
  thresholds: DEFAULT_MORSE_TIMING,
  alphabet: { digits: false, specials: false },
}

const STORAGE_KEY = 'demorse.settings.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown, fallback: string, allowed?: readonly string[]): string {
  if (typeof value !== 'string' || value === '') {
    return fallback
  }

  if (allowed && !allowed.includes(value)) {
    return fallback
  }

  return value
}

function readNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return fallback
  }

  return parsed
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/** Keys may not be the same key, and never a modifier-only chord. */
function readBindings(raw: unknown): KeyBindings {
  const source = isRecord(raw) ? raw : {}
  const ditCode = readString(source.ditCode, DEFAULT_KEY_BINDINGS.ditCode)
  let dahCode = readString(source.dahCode, DEFAULT_KEY_BINDINGS.dahCode)

  if (dahCode === ditCode) {
    dahCode = DEFAULT_KEY_BINDINGS.dahCode

    if (dahCode === ditCode) {
      dahCode = 'KeyK'
    }
  }

  return { ditCode, dahCode }
}

function readThresholds(raw: unknown, defaults: MorseTimingThresholds): MorseTimingThresholds {
  const source = isRecord(raw) ? raw : {}

  return {
    tapMinMs: readNumber(source.tapMinMs, defaults.tapMinMs, 5, 500),
    tapMaxMs: readNumber(source.tapMaxMs, defaults.tapMaxMs, 20, 900),
    holdMinMs: readNumber(source.holdMinMs, defaults.holdMinMs, 40, 1500),
    holdMaxMs: readNumber(source.holdMaxMs, defaults.holdMaxMs, 80, 3000),
    letterGapMs: readNumber(source.letterGapMs, defaults.letterGapMs, 80, 3000),
    wordGapMs: readNumber(source.wordGapMs, defaults.wordGapMs, 160, 6000),
    lineGapMs: readNumber(source.lineGapMs, defaults.lineGapMs, 320, 12000),
  }
}

/**
 * Merges whatever was persisted with the defaults, dropping anything unusable.
 *
 * `fallback` is the floor the stored values are merged onto: the page passes the
 * environment-derived settings, so a fresh visitor gets the `.env` thresholds while a
 * returning visitor keeps their own tuning. Exported so the merge is testable without a browser.
 */
export function mergeUserSettings(raw: unknown, fallback: UserSettings = DEFAULT_USER_SETTINGS): UserSettings {
  if (!isRecord(raw)) {
    return fallback
  }

  const sound = isRecord(raw.sound) ? raw.sound : {}
  const alphabet = isRecord(raw.alphabet) ? raw.alphabet : {}

  return {
    mode: readString(raw.mode, fallback.mode, ['single', 'dual']) as InputMode,
    bindings: readBindings(raw.bindings),
    sound: {
      id: readString(
        sound.id,
        fallback.sound.id,
        ['off', 'sidetone', 'sounder', 'clack', 'bright'],
      ) as SoundId,
      volume: readNumber(sound.volume, fallback.sound.volume, 0, 1),
    },
    thresholds: readThresholds(raw.thresholds, fallback.thresholds),
    alphabet: {
      digits: readBoolean(alphabet.digits, fallback.alphabet.digits),
      specials: readBoolean(alphabet.specials, fallback.alphabet.specials),
    },
  }
}

export function loadUserSettings(
  storage: Pick<Storage, 'getItem'> | null,
  fallback: UserSettings = DEFAULT_USER_SETTINGS,
): UserSettings {
  if (!storage) {
    return fallback
  }

  try {
    const raw = storage.getItem(STORAGE_KEY)

    if (!raw) {
      return fallback
    }

    return mergeUserSettings(JSON.parse(raw), fallback)
  } catch {
    return fallback
  }
}

export function saveUserSettings(storage: Pick<Storage, 'setItem'> | null, settings: UserSettings): void {
  if (!storage) {
    return
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Private-mode or full storage: the session simply stops persisting.
  }
}
