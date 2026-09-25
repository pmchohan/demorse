import { describe, expect, it } from 'vitest'
import { DEFAULT_MORSE_TIMING, resolveMorseTiming } from './morseTiming'

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
      VITE_MORSE_GAP_MAX_MS: '1100',
    })

    expect(resolved.thresholds.tapMinMs).toBe(36)
    expect(resolved.thresholds.gapMaxMs).toBe(1100)
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
    expect(resolved.warnings).toHaveLength(2)
    expect(resolved.warnings[0]).toMatch(/VITE_MORSE_HOLD_MIN_MS/)
  })

  it('surfaces window conflicts coming from the environment', () => {
    const resolved = resolveMorseTiming({ VITE_MORSE_TAP_MAX_MS: '400' })

    expect(resolved.warnings.some((warning) => /overlaps the hold window/.test(warning))).toBe(true)
  })
})
