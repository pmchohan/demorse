import { findThresholdConflicts, type MorseTimingThresholds } from '../domain/morse/timingClassifier'

export type MorseTimingKey = keyof MorseTimingThresholds
export type MorseTimingSource = 'env' | 'default'

/** Used when a variable is missing or unusable — tuned for hand-tapping a space bar. */
export const DEFAULT_MORSE_TIMING: MorseTimingThresholds = {
  tapMinMs: 40,
  tapMaxMs: 200,
  holdMinMs: 250,
  holdMaxMs: 700,
  gapMinMs: 250,
  gapMaxMs: 900,
}

export const ENV_VARIABLE_BY_KEY: Readonly<Record<MorseTimingKey, string>> = {
  tapMinMs: 'VITE_MORSE_TAP_MIN_MS',
  tapMaxMs: 'VITE_MORSE_TAP_MAX_MS',
  holdMinMs: 'VITE_MORSE_HOLD_MIN_MS',
  holdMaxMs: 'VITE_MORSE_HOLD_MAX_MS',
  gapMinMs: 'VITE_MORSE_GAP_MIN_MS',
  gapMaxMs: 'VITE_MORSE_GAP_MAX_MS',
}

export const TIMING_KEYS: readonly MorseTimingKey[] = [
  'tapMinMs',
  'tapMaxMs',
  'holdMinMs',
  'holdMaxMs',
  'gapMinMs',
  'gapMaxMs',
]

export interface ResolvedMorseTiming {
  readonly thresholds: MorseTimingThresholds
  readonly sourceByKey: Readonly<Record<MorseTimingKey, MorseTimingSource>>
  readonly warnings: readonly string[]
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

  return {
    thresholds: resolved,
    sourceByKey,
    warnings: [...warnings, ...findThresholdConflicts(resolved)],
  }
}

export const morseTiming: ResolvedMorseTiming = resolveMorseTiming(import.meta.env)
