import { describe, expect, it } from 'vitest'
import {
  classifyGap,
  classifyPress,
  findThresholdConflicts,
  type MorseTimingThresholds,
} from './timingClassifier'

const thresholds: MorseTimingThresholds = {
  tapMinMs: 40,
  tapMaxMs: 200,
  holdMinMs: 250,
  holdMaxMs: 700,
  gapMinMs: 250,
  gapMaxMs: 900,
}

describe('classifyPress', () => {
  it('drops presses below the tap minimum as key bounce', () => {
    const result = classifyPress(39, thresholds)

    expect(result.verdict).toBe('too-short')
    expect(result.symbol).toBeNull()
  })

  it('accepts both window bounds inclusively', () => {
    expect(classifyPress(40, thresholds)).toMatchObject({ verdict: 'dot', symbol: '.' })
    expect(classifyPress(200, thresholds)).toMatchObject({ verdict: 'dot', symbol: '.' })
    expect(classifyPress(250, thresholds)).toMatchObject({ verdict: 'dash', symbol: '-' })
    expect(classifyPress(700, thresholds)).toMatchObject({ verdict: 'dash', symbol: '-' })
  })

  it('resolves the dead zone to the nearer bound', () => {
    expect(classifyPress(220, thresholds)).toMatchObject({ verdict: 'dot', confidence: 'ambiguous' })
    expect(classifyPress(240, thresholds)).toMatchObject({ verdict: 'dash', confidence: 'ambiguous' })
  })

  it('keeps over-long presses as dashes instead of losing input', () => {
    expect(classifyPress(950, thresholds)).toMatchObject({
      verdict: 'dash',
      symbol: '-',
      confidence: 'over-max',
    })
  })
})

describe('classifyGap', () => {
  it('separates same-character, letter and word windows', () => {
    expect(classifyGap(120, thresholds).verdict).toBe('intra')
    expect(classifyGap(250, thresholds).verdict).toBe('letter')
    expect(classifyGap(900, thresholds).verdict).toBe('letter')
    expect(classifyGap(901, thresholds)).toMatchObject({ verdict: 'word', confidence: 'over-max' })
  })
})

describe('findThresholdConflicts', () => {
  it('reports nothing for a coherent configuration', () => {
    expect(findThresholdConflicts(thresholds)).toEqual([])
  })

  it('reports overlapping dot and dash windows', () => {
    const conflicts = findThresholdConflicts({ ...thresholds, tapMaxMs: 300 })

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatch(/overlaps the hold window/)
  })
})
