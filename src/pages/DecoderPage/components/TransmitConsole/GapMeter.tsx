import { MorseMark } from '@/components/atoms/MorseMark/MorseMark'
import type { MorseSymbol } from '@/domain/morse/morseAlphabet'
import { classifyGap, type MorseTimingThresholds } from '@/domain/morse/timingClassifier'
import styles from './GapMeter.module.css'

export interface GapMeterProps {
  /** Silence measured since the last release, in ms. */
  readonly elapsedMs: number
  readonly thresholds: MorseTimingThresholds
  /** The meter only means something while a pause is actually being measured. */
  readonly isMeasuring: boolean
}

interface Tick {
  readonly key: string
  readonly label: string
  readonly atMs: number
}

/**
 * The pause the decoder is listening for, drawn as a bar with a tick at each of the
 * three tiers: a character boundary, a word space, then a line break. The bar runs to
 * the line-break threshold, so the distance left to read is the distance left to the
 * next thing the pause will do.
 */
export function GapMeter({ elapsedMs, thresholds, isMeasuring }: GapMeterProps) {
  const { letterGapMs, wordGapMs, lineGapMs } = thresholds
  const ticks: Tick[] = [
    { key: 'letter', label: 'Letter', atMs: letterGapMs },
    { key: 'word', label: 'Word', atMs: wordGapMs },
    { key: 'line', label: 'Line', atMs: lineGapMs },
  ]
  const verdict = classifyGap(elapsedMs, thresholds)
  const fillPct = Math.min(100, (elapsedMs / lineGapMs) * 100)
  const passed = (atMs: number): boolean => isMeasuring && elapsedMs >= atMs

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span className={styles.overline}>Silence</span>
        <span className={styles.readout} data-measuring={isMeasuring}>
          {isMeasuring ? `${Math.round(elapsedMs)} ms` : '—'}
        </span>
      </div>

      <div className={styles.trackWrap}>
        <div className={styles.track}>
          <div
            className={styles.fill}
            data-tier={isMeasuring ? verdict.verdict : 'idle'}
            style={{ transform: `scaleX(${isMeasuring ? fillPct / 100 : 0})` }}
          />
          {ticks.map((tick) => (
            <span
              key={tick.key}
              className={styles.tick}
              data-passed={passed(tick.atMs)}
              style={{ left: `${(tick.atMs / lineGapMs) * 100}%` }}
            />
          ))}
        </div>

        <div className={styles.labels}>
          {ticks.map((tick) => (
            <span
              key={tick.key}
              className={styles.tickLabel}
              data-passed={passed(tick.atMs)}
              style={{ left: `${(tick.atMs / lineGapMs) * 100}%` }}
            >
              {tick.label}
              <span className={styles.tickMs}>{tick.atMs}ms</span>
            </span>
          ))}
        </div>
      </div>

      <p className={styles.note} aria-live="polite">
        {isMeasuring
          ? verdict.note
          : 'The pause after a symbol decides what comes next: a new letter, a space, or a new line.'}
      </p>
    </div>
  )
}

/** The symbols of the character in flight, with the pending one flagged. */
export function ElementStrip({
  symbols,
  pendingSymbol,
}: {
  readonly symbols: readonly MorseSymbol[]
  readonly pendingSymbol: MorseSymbol | null
}) {
  const isEmpty = symbols.length === 0 && pendingSymbol === null

  return (
    <div className={styles.element}>
      {isEmpty ? (
        <span className={styles.elementEmpty}>waiting for a signal</span>
      ) : (
        symbols.map((symbol, index) => (
          <MorseMark key={`${symbol}-${index}`} symbol={symbol} size="sm" />
        ))
      )}
      {pendingSymbol ? <MorseMark symbol={pendingSymbol} size="sm" tone="muted" /> : null}
    </div>
  )
}
