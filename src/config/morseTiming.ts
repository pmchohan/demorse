import { findThresholdConflicts, type MorseTimingThresholds } from '../domain/morse/timingClassifier'

export type MorseTimingKey = keyof MorseTimingThresholds
export type MorseTimingSource = 'env' | 'default'

/** Used when a variable is missing or unusable — tuned for hand-tapping a space bar. */
export const DEFAULT_MORSE_TIMING: MorseTimingThresholds = {
  tapMinMs: 40,
  tapMaxMs: 200,
  holdMinMs: 250,
  holdMaxMs: 700,
  letterGapMs: 250,
  wordGapMs: 900,
  lineGapMs: 1800,
}

export const ENV_VARIABLE_BY_KEY: Readonly<Record<MorseTimingKey, string>> = {
  tapMinMs: 'VITE_MORSE_TAP_MIN_MS',
  tapMaxMs: 'VITE_MORSE_TAP_MAX_MS',
  holdMinMs: 'VITE_MORSE_HOLD_MIN_MS',
  holdMaxMs: 'VITE_MORSE_HOLD_MAX_MS',
  letterGapMs: 'VITE_MORSE_LETTER_GAP_MS',
  wordGapMs: 'VITE_MORSE_WORD_GAP_MS',
  lineGapMs: 'VITE_MORSE_LINE_GAP_MS',
}

export const TIMING_KEYS: readonly MorseTimingKey[] = [
  'tapMinMs',
  'tapMaxMs',
  'holdMinMs',
  'holdMaxMs',
  'letterGapMs',
  'wordGapMs',
  'lineGapMs',
]

/**
 * Named timings offered by the tuning dropdown. The dropdown is a shortcut, not a
 * limit: dragging any slider moves that threshold and the timing becomes `custom`.
 */
export interface TimingPreset {
  readonly id: string
  readonly label: string
  readonly blurb: string
  readonly thresholds: MorseTimingThresholds
}

export const TIMING_PRESETS: readonly TimingPreset[] = [
  {
    id: 'relaxed',
    label: 'Relaxed',
    blurb: 'Generous windows for deliberate, slow keying.',
    thresholds: {
      tapMinMs: 60,
      tapMaxMs: 260,
      holdMinMs: 320,
      holdMaxMs: 950,
      letterGapMs: 420,
      wordGapMs: 1250,
      lineGapMs: 2400,
    },
  },
  {
    id: 'standard',
    label: 'Standard',
    blurb: 'The built-in defaults — the same numbers as .env.',
    thresholds: DEFAULT_MORSE_TIMING,
  },
  {
    id: 'snappy',
    label: 'Snappy',
    blurb: 'Tight windows and short pauses for fast fists.',
    thresholds: {
      tapMinMs: 25,
      tapMaxMs: 140,
      holdMinMs: 170,
      holdMaxMs: 520,
      letterGapMs: 190,
      wordGapMs: 620,
      lineGapMs: 1300,
    },
  },
]

export const CUSTOM_TIMING_ID = 'custom'

/** Which preset, if any, a live set of thresholds matches. */
export function timingPresetIdOf(thresholds: MorseTimingThresholds): string {
  const match = TIMING_PRESETS.find((preset) =>
    TIMING_KEYS.every((key) => preset.thresholds[key] === thresholds[key]),
  )

  return match ? match.id : CUSTOM_TIMING_ID
}

export interface ResolvedMorseTiming {
  readonly thresholds: MorseTimingThresholds
  readonly sourceByKey: Readonly<Record<MorseTimingKey, MorseTimingSource>>
  /** Unusable or contradictory environment values, spelled out for the page footer. */
  readonly warnings: readonly string[]
  /**
   * Only the warnings about what `.env` said. `warnings` also carries the conflicts the
   * resolved numbers create, but the page cannot show those next to the live sliders —
   * the thresholds are editable now, so contradictions are recomputed from the settings.
   */
  readonly parseWarnings: readonly string[]
}


function readMilliseconds(
  key: MorseTimingKey,
  env: Record<string, unknown>,
  warnings: string[],
): { value: number; source: MorseTimingSource } {
  const variable = ENV_VARIABLE_BY_KEY[key]
  const raw = env[variable]
  const fallback = DEFAULT_MORSE_TIMING[key]

  if (raw === undefined || raw === null || `${raw}`.trim() === '') {
    return { value: fallback, source: 'default' }
  }

  const parsed = Number(raw)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    warnings.push(`${variable}="${raw}" is not a positive number of milliseconds — using ${fallback}ms.`)
    return { value: fallback, source: 'default' }
  }

  return { value: Math.round(parsed), source: 'env' }
}

export function resolveMorseTiming(env: Record<string, unknown>): ResolvedMorseTiming {
  const warnings: string[] = []
  const thresholds = {} as Record<MorseTimingKey, number>
  const sourceByKey = {} as Record<MorseTimingKey, MorseTimingSource>

  for (const key of TIMING_KEYS) {
    const { value, source } = readMilliseconds(key, env, warnings)
    thresholds[key] = value
    sourceByKey[key] = source
  }

  const resolved = thresholds as MorseTimingThresholds
  const conflicts = findThresholdConflicts(resolved)

  return {
    thresholds: resolved,
    sourceByKey,
    warnings: [...warnings, ...conflicts],
    parseWarnings: warnings,
  }
}

export const morseTiming: ResolvedMorseTiming = resolveMorseTiming(import.meta.env)
