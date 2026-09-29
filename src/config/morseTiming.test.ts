import { describe, expect, it } from 'vitest'
import { findThresholdConflicts } from '../domain/morse/timingClassifier'
import {
  CUSTOM_TIMING_ID,
  DEFAULT_MORSE_TIMING,
  TIMING_KEYS,
  TIMING_PRESETS,
  resolveMorseTiming,
  timingPresetIdOf,
} from './morseTiming'

describe('resolveMorseTiming', () => {
  it('falls back to the built-in defaults when nothing is configured', () => {
    const resolved = resolveMorseTiming({})

    expect(resolved.thresholds).toEqual(DEFAULT_MORSE_TIMING)
    expect(resolved.sourceByKey.tapMinMs).toBe('default')
    expect(resolved.warnings).toEqual([])
  })

  it('reads configured values and rounds them to whole milliseconds', () => {
    const resolved = resolveMorseTiming({
      VITE_MORSE_TAP_MIN_MS: '35.6',
      VITE_MORSE_LINE_GAP_MS: '2200',
    })

    expect(resolved.thresholds.tapMinMs).toBe(36)
    expect(resolved.thresholds.lineGapMs).toBe(2200)
    expect(resolved.sourceByKey.tapMinMs).toBe('env')
    expect(resolved.sourceByKey.tapMaxMs).toBe('default')
    expect(resolved.warnings).toEqual([])
  })

  it('warns and falls back for unusable values', () => {
    const resolved = resolveMorseTiming({
      VITE_MORSE_HOLD_MIN_MS: 'soon',
      VITE_MORSE_HOLD_MAX_MS: '-5',
    })

    expect(resolved.thresholds.holdMinMs).toBe(DEFAULT_MORSE_TIMING.holdMinMs)
    expect(resolved.thresholds.holdMaxMs).toBe(DEFAULT_MORSE_TIMING.holdMaxMs)
    expect(resolved.parseWarnings).toHaveLength(2)
    expect(resolved.parseWarnings[0]).toMatch(/VITE_MORSE_HOLD_MIN_MS/)
  })

  it('surfaces window conflicts coming from the environment', () => {
    const resolved = resolveMorseTiming({ VITE_MORSE_TAP_MAX_MS: '400' })

    expect(resolved.warnings.some((warning) => /overlaps the hold window/.test(warning))).toBe(true)
    // A conflict is about the resolved numbers, not about what the file said, so the
    // footer (which only reports file problems) stays quiet while the panel can flag it.
    expect(resolved.parseWarnings).toEqual([])
  })
})

describe('timingPresetIdOf', () => {
  it('names the preset whose thresholds all match', () => {
    for (const preset of TIMING_PRESETS) {
      expect(timingPresetIdOf(preset.thresholds)).toBe(preset.id)
    }
  })

  it('calls anything else custom', () => {
    expect(timingPresetIdOf({ ...DEFAULT_MORSE_TIMING, wordGapMs: 1_000 })).toBe(CUSTOM_TIMING_ID)
  })

  it('offers distinct, internally coherent presets', () => {
    const ids = TIMING_PRESETS.map((preset) => preset.id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(TIMING_KEYS).toHaveLength(Object.keys(DEFAULT_MORSE_TIMING).length)

    for (const preset of TIMING_PRESETS) {
      expect(findThresholdConflicts(preset.thresholds), preset.id).toEqual([])
    }
  })
})
