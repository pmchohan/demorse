import { keyLabel } from '@/config/keyLabels'
import type { InputMode, KeyBindings } from '@/config/userSettings'
import type { MorseSymbol } from '@/domain/morse/morseAlphabet'
import type { MorseTimingThresholds } from '@/domain/morse/timingClassifier'
import type { CaptureTarget } from '@/hooks/usePressInput'
import { ElementStrip, GapMeter } from './GapMeter'
import styles from './TransmitConsole.module.css'

export interface TransmitConsoleProps {
  readonly mode: InputMode
  readonly bindings: KeyBindings
  readonly thresholds: MorseTimingThresholds
  readonly symbols: readonly MorseSymbol[]
  /** Character the symbols in flight would print, null while incomplete. */
  readonly pendingCharacter: string | null
  /** True while an unresolved sequence is being held — shown as a dead end. */
  readonly isUnresolvable: boolean
  readonly isPressing: boolean
  /**
   * The symbol a held press would leave behind if it ended now, so the element strip
   * can show the dash arriving while the key is still down. Null between presses.
   */
  readonly pendingSymbol: MorseSymbol | null
  readonly phase: 'idle' | 'holding' | 'waiting'
  readonly liveElapsedMs: number
  readonly capture: CaptureTarget
  readonly onModeChange: (mode: InputMode) => void
  readonly onBeginCapture: (target: Exclude<CaptureTarget, null>) => void
  readonly onCancelCapture: () => void
  /** Pointer/touch keying, mirroring what the keyboard does. */
  readonly onPadDown: () => void
  readonly onPadUp: () => void
  readonly onSymbolDown: (symbol: MorseSymbol) => void
  readonly onSymbolUp: (symbol: MorseSymbol) => void
}

interface PadHandlers {
  onPointerDown: (event: React.PointerEvent) => void
  onPointerUp: () => void
  onPointerCancel: () => void
  onContextMenu: (event: React.MouseEvent) => void
}

/** Pointer keying: capture keeps the release outside the pad from stranding a symbol. */
function padHandlers(down: () => void, up: () => void): PadHandlers {
  return {
    onPointerDown: (event) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture?.(event.pointerId)
      down()
    },
    onPointerUp: up,
    onPointerCancel: up,
    onContextMenu: (event) => event.preventDefault(),
  }
}

const MODES = [
  { id: 'single', label: 'Single key' },
  { id: 'dual', label: 'Two keys' },
] as const

export function TransmitConsole(props: TransmitConsoleProps) {
  const {
    mode,
    bindings,
    thresholds,
    symbols,
    pendingCharacter,
    isUnresolvable,
    isPressing,
    pendingSymbol,
    phase,
    liveElapsedMs,
    capture,
    onModeChange,
    onBeginCapture,
    onCancelCapture,
    onPadDown,
    onPadUp,
    onSymbolDown,
    onSymbolUp,
  } = props

  const ditLabel = keyLabel(bindings.ditCode)
  const dahLabel = keyLabel(bindings.dahCode)
  const isDual = mode === 'dual'

  const status = capture
    ? `Press a key to bind ${capture === 'dit' ? 'dit' : 'dah'} — Esc cancels`
    : isPressing
      ? 'Key down'
      : phase === 'waiting'
        ? 'Listening for the next pause'
        : symbols.length > 0
          ? 'Building a character'
          : 'Ready'

  const hint = isDual
    ? `Press ${ditLabel} for dit and ${dahLabel} for dah. Each press sends one symbol; the pause between presses decides nothing.`
    : 'Hold the space bar. A quick tap is a dit, holding longer is a dah. Watch the chart to see where the path is going.'

  return (
    <section className={styles.console} aria-label="Transmit console">
      <header className={styles.consoleHead}>
        <div className={styles.segmented} role="tablist" aria-label="Input mode">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              className={item.id === mode ? styles.segmentOn : styles.segment}
              aria-selected={item.id === mode}
              onClick={() => onModeChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className={styles.status} data-live={isPressing || phase !== 'idle' ? 'yes' : 'no'}>
          {status}
        </p>
      </header>

      <div className={styles.signal}>
        <div className={styles.elements}>
          <ElementStrip symbols={symbols} pendingSymbol={isPressing ? pendingSymbol : null} />
        </div>
        <output
          className={styles.candidate}
          data-state={
            isUnresolvable ? 'dead' : pendingCharacter ? 'resolved' : symbols.length > 0 ? 'partial' : 'empty'
          }
          aria-label={
            pendingCharacter
              ? `In flight: ${pendingCharacter}`
              : isUnresolvable
                ? 'In flight: no character on that branch'
                : 'No character in flight'
          }
        >
          {pendingCharacter ?? (isUnresolvable ? '□' : '·')}
        </output>
      </div>

      {isDual ? (
        <div className={styles.pads}>
          <div className={styles.padBox}>
            <button
              type="button"
              className={styles.pad}
              aria-label={`Dit key, ${ditLabel}`}
              {...padHandlers(
                () => onSymbolDown('.'),
                () => onSymbolUp('.'),
              )}
            >
              <span className={styles.padTitle}>Dit</span>
              <span className={styles.padMark} aria-hidden="true">
                ·
              </span>
              <kbd className={styles.kbd}>{capture === 'dit' ? 'press a key' : ditLabel}</kbd>
            </button>
            <button
              type="button"
              className={capture === 'dit' ? styles.miniOn : styles.mini}
              onClick={() => (capture === 'dit' ? onCancelCapture() : onBeginCapture('dit'))}
            >
              {capture === 'dit' ? 'Cancelling' : 'Change key'}
            </button>
          </div>
          <div className={styles.padBox}>
            <button
              type="button"
              className={`${styles.pad} ${styles.padDah}`}
              aria-label={`Dah key, ${dahLabel}`}
              {...padHandlers(
                () => onSymbolDown('-'),
                () => onSymbolUp('-'),
              )}
            >
              <span className={styles.padTitle}>Dah</span>
              <span className={styles.padMark} aria-hidden="true">
                –
              </span>
              <kbd className={styles.kbd}>{capture === 'dah' ? 'press a key' : dahLabel}</kbd>
            </button>
            <button
              type="button"
              className={capture === 'dah' ? styles.miniOn : styles.mini}
              onClick={() => (capture === 'dah' ? onCancelCapture() : onBeginCapture('dah'))}
            >
              {capture === 'dah' ? 'Cancelling' : 'Change key'}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.pads}>
          <div className={styles.padBox}>
            <button
              type="button"
              className={styles.pad}
              aria-label="Telegraph key"
              {...padHandlers(onPadDown, onPadUp)}
            >
              <span className={styles.padTitle}>Press any key</span>
              <span className={styles.padSub}>Tap for dit, hold for dah</span>
            </button>
            <p className={styles.padNote}>
              Dit up to <output className={styles.padValue}>{thresholds.tapMaxMs}&nbsp;ms</output> ·
              dah from <output className={styles.padValue}>{thresholds.holdMinMs}&nbsp;ms</output>
            </p>
          </div>
        </div>
      )}

      <GapMeter
        elapsedMs={liveElapsedMs}
        thresholds={thresholds}
        isMeasuring={phase === 'waiting'}
      />

      <p className={styles.hint}>{hint}</p>
    </section>
  )
}
