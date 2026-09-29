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
  letterGapMs: 250,
  wordGapMs: 900,
  lineGapMs: 1800,
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
  it('separates the three tiers of silence', () => {
    expect(classifyGap(120, thresholds).verdict).toBe('intra')
    expect(classifyGap(250, thresholds).verdict).toBe('letter')
    expect(classifyGap(899, thresholds).verdict).toBe('letter')
    expect(classifyGap(900, thresholds).verdict).toBe('word')
    expect(classifyGap(1799, thresholds).verdict).toBe('word')
    expect(classifyGap(1800, thresholds).verdict).toBe('line')
  })

  it('never treats a long pause as uncertain — silence has no upper bound', () => {
    expect(classifyGap(60_000, thresholds)).toMatchObject({ verdict: 'line', confidence: 'exact' })
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

  it('reports gaps that can never be reached', () => {
    expect(findThresholdConflicts({ ...thresholds, wordGapMs: 250 })).toEqual([
      expect.stringMatching(/word spaces can never be reached/),
    ])
    expect(findThresholdConflicts({ ...thresholds, lineGapMs: 900 })).toEqual([
      expect.stringMatching(/line breaks can never be reached/),
    ])
  })
})
