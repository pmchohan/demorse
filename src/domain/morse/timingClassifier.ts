import type { MorseSymbol } from './morseAlphabet'

/**
 * Timing windows, in milliseconds, that turn raw key dwell and silence into
 * Morse symbols. Sourced from VITE_MORSE_* environment variables.
 */
export interface MorseTimingThresholds {
  readonly tapMinMs: number
  readonly tapMaxMs: number
  readonly holdMinMs: number
  readonly holdMaxMs: number
  /** Silence that finishes the current character. */
  readonly letterGapMs: number
  /** Silence that finishes the character and adds a space. */
  readonly wordGapMs: number
  /** Silence that finishes the character and starts a new line. */
  readonly lineGapMs: number
}

export type PressVerdict = 'dot' | 'dash' | 'too-short'
export type GapVerdict = 'intra' | 'letter' | 'word' | 'line'

/** `exact` = inside a defined window, `ambiguous` = between windows, `over-max` = past the upper bound. */
export type TimingConfidence = 'exact' | 'ambiguous' | 'over-max'

export interface PressClassification {
  readonly verdict: PressVerdict
  readonly confidence: TimingConfidence
  readonly symbol: MorseSymbol | null
  readonly note: string
}

export interface GapClassification {
  readonly verdict: GapVerdict
  readonly confidence: TimingConfidence
  readonly note: string
}

function roundMs(value: number): number {
  return Math.round(value)
}

export function classifyPress(
  durationMs: number,
  thresholds: MorseTimingThresholds,
): PressClassification {
  const { tapMinMs, tapMaxMs, holdMinMs, holdMaxMs } = thresholds
  const duration = Math.max(0, durationMs)

  if (duration < tapMinMs) {
    return {
      verdict: 'too-short',
      confidence: 'exact',
      symbol: null,
      note: `${roundMs(duration)}ms is below the tap minimum of ${tapMinMs}ms — treated as key bounce and dropped.`,
    }
  }

  if (duration <= tapMaxMs) {
    return {
      verdict: 'dot',
      confidence: 'exact',
      symbol: '.',
      note: `${roundMs(duration)}ms sits in the tap window (${tapMinMs}–${tapMaxMs}ms).`,
    }
  }

  if (duration >= holdMinMs) {
    if (duration <= holdMaxMs) {
      return {
        verdict: 'dash',
        confidence: 'exact',
        symbol: '-',
        note: `${roundMs(duration)}ms sits in the hold window (${holdMinMs}–${holdMaxMs}ms).`,
      }
    }

    return {
      verdict: 'dash',
      confidence: 'over-max',
      symbol: '-',
      note: `${roundMs(duration)}ms is past the hold maximum of ${holdMaxMs}ms — held as a dash so no input is lost.`,
    }
  }

  // Between the windows: hand the press to whichever bound is nearer.
  const distanceToTap = duration - tapMaxMs
  const distanceToHold = holdMinMs - duration
  const isDot = distanceToTap <= distanceToHold

  return {
    verdict: isDot ? 'dot' : 'dash',
    confidence: 'ambiguous',
    symbol: isDot ? '.' : '-',
    note: `${roundMs(duration)}ms falls between the windows — resolved to ${isDot ? 'dot' : 'dash'} as the nearer bound.`,
  }
}

/**
 * Silence is the only separator the decoder has, so it is read in three tiers:
 * a character boundary, a word space, then a line break. `letterGapMs` is the
 * first tier's threshold, `wordGapMs` the second's, `lineGapMs` the third's.
 */
export function classifyGap(gapMs: number, thresholds: MorseTimingThresholds): GapClassification {
  const { letterGapMs, wordGapMs, lineGapMs } = thresholds
  const gap = Math.max(0, gapMs)

  if (gap < letterGapMs) {
    return {
      verdict: 'intra',
      confidence: 'exact',
      note: `${roundMs(gap)}ms of silence — still inside the same character (under ${letterGapMs}ms).`,
    }
  }

  if (gap < wordGapMs) {
    return {
      verdict: 'letter',
      confidence: 'exact',
      note: `${roundMs(gap)}ms of silence — character boundary (${letterGapMs}–${wordGapMs}ms).`,
    }
  }

  if (gap < lineGapMs) {
    return {
      verdict: 'word',
      confidence: 'exact',
      note: `${roundMs(gap)}ms of silence — word space (${wordGapMs}–${lineGapMs}ms).`,
    }
  }

  return {
    verdict: 'line',
    confidence: 'exact',
    note: `${roundMs(gap)}ms of silence — line break (past ${lineGapMs}ms).`,
  }
}

/** Windows that overlap make dot/dash ambiguous by construction — surfaced in the UI. */
export function findThresholdConflicts(thresholds: MorseTimingThresholds): string[] {
  const { tapMinMs, tapMaxMs, holdMinMs, holdMaxMs, letterGapMs, wordGapMs, lineGapMs } = thresholds
  const conflicts: string[] = []

  if (tapMinMs > tapMaxMs) {
    conflicts.push('The tap minimum is larger than the tap maximum.')
  }

  if (tapMaxMs > holdMinMs) {
    conflicts.push('The tap window overlaps the hold window — presses land on whichever check runs first.')
  }

  if (holdMinMs > holdMaxMs) {
    conflicts.push('The hold minimum is larger than the hold maximum.')
  }

  if (letterGapMs >= wordGapMs) {
    conflicts.push('The character gap is not shorter than the word gap — word spaces can never be reached.')
  }

  if (wordGapMs >= lineGapMs) {
    conflicts.push('The word gap is not shorter than the line gap — line breaks can never be reached.')
  }

  return conflicts
}
