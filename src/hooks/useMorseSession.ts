import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { UserSettingsActions } from './useUserSettings'
import {
  activePathOf,
  createDecoderReducer,
  createInitialDecoderState,
  lastCommittedLetter,
  type DecodedLetter,
  type DecoderState,
} from '../domain/morse/decoderReducer'
import { characterForCode, type MorseSymbol } from '../domain/morse/morseAlphabet'
import { useAnimationClock } from './useAnimationClock'
import { usePressInput, type CaptureTarget } from './usePressInput'
import { useSidetone } from './useSidetone'

export interface MorseSession {
  readonly state: DecoderState
  /** Dot/dash path of the character being typed right now. */
  readonly activePath: string
  /** Character the active path would decode to, or null while it is incomplete. */
  readonly pendingCharacter: string | null
  readonly lastLetter: DecodedLetter | null
  readonly isPressing: boolean
  readonly clear: () => void
  /** On-screen pads use the same stamped path the keyboard takes. */
  readonly pressStart: () => void
  readonly pressEnd: () => void
  readonly symbolDown: (symbol: MorseSymbol) => void
  readonly symbolUp: (symbol: MorseSymbol) => void
  /** Two-key rebinding: which key (if any) is waiting to be chosen. */
  readonly capture: CaptureTarget
  readonly beginCapture: (target: Exclude<CaptureTarget, null>) => void
  readonly cancelCapture: () => void
}

/**
 * Wires the user settings, key input, animation clock, sidetone and the pure
 * decoder together. Thresholds and the alphabet selection arrive from user
 * settings (seeded by the environment), so a slider move takes effect on the
 * very next dispatch — the reducer is rebuilt, but the state shape is identical.
 */
export function useMorseSession(actions: UserSettingsActions): MorseSession {
  const { settings } = actions
  const reducer = useMemo(
    () => createDecoderReducer(settings.thresholds, settings.alphabet),
    [settings.thresholds, settings.alphabet],
  )
  const [state, dispatch] = useReducer(reducer, undefined, createInitialDecoderState)
  const sidetone = useSidetone(settings.sound)

  // Sidetone closures churn with every render; the callbacks below stay stable
  // by reaching through a ref.
  const sidetoneRef = useRef(sidetone)

  useEffect(() => {
    sidetoneRef.current = sidetone
  }, [sidetone])

  // When the current symbol key went down, so its hold can be subtracted from the
  // following silence. Only one symbol key is tracked: two at once is a chord.
  const symbolDownAtMsRef = useRef<number | null>(null)
  // While a two-key symbol key is down the gap clock is pointless — nothing has been
  // released yet — so the animation clock is parked and the meter holds its breath.
  const [isKeyed, setIsKeyed] = useState(false)

  const handlePressStart = useCallback((atMs: number) => {
    sidetoneRef.current.strike()
    dispatch({ type: 'press-start', atMs })
  }, [])
  const handlePressEnd = useCallback((atMs: number) => {
    sidetoneRef.current.release()
    dispatch({ type: 'press-end', atMs })
  }, [])
  const handleSymbolDown = useCallback((symbol: MorseSymbol, atMs: number) => {
    symbolDownAtMsRef.current = atMs
    setIsKeyed(true)
    sidetoneRef.current.strike()
    dispatch({ type: 'symbol', symbol, atMs })
  }, [])
  const handleSymbolUp = useCallback((_symbol: MorseSymbol, atMs: number) => {
    sidetoneRef.current.release()

    const startedAtMs = symbolDownAtMsRef.current
    symbolDownAtMsRef.current = null
    setIsKeyed(false)

    // A dash held under the finger is the element, not the silence after it.
    if (startedAtMs !== null) {
      dispatch({ type: 'key-pause', atMs, startedAtMs })
    }
  }, [])
  const handleTick = useCallback((atMs: number) => dispatch({ type: 'tick', atMs }), [])
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])

  const [capture, setCapture] = useState<CaptureTarget>(null)
  const handleCapture = useCallback(
    (target: Exclude<CaptureTarget, null>, code: string) => {
      const bindings = settings.bindings

      if (target === 'dit') {
        // One physical key cannot name both symbols: swap on collision.
        actions.setBindings(
          bindings.dahCode === code
            ? { ditCode: code, dahCode: bindings.ditCode }
            : { ditCode: code, dahCode: bindings.dahCode },
        )
      } else {
        actions.setBindings(
          bindings.ditCode === code
            ? { ditCode: bindings.dahCode, dahCode: code }
            : { ditCode: bindings.ditCode, dahCode: code },
        )
      }

      setCapture(null)
    },
    [actions, settings.bindings],
  )

  usePressInput({
    mode: settings.mode,
    bindings: settings.bindings,
    capture,
    onCapture: handleCapture,
    onPressStart: handlePressStart,
    onPressEnd: handlePressEnd,
    onSymbolDown: handleSymbolDown,
    onSymbolUp: handleSymbolUp,
  })

  // Only runs while a press is held or a gap is being measured — and never while a
  // two-key symbol key is under the finger, which is element time, not silence.
  useAnimationClock(state.phase !== 'idle' && !isKeyed, handleTick)

  // A character printing on the tape earns an audible tick of its own.
  const letterCountRef = useRef(state.letters.length)

  useEffect(() => {
    if (state.letters.length > letterCountRef.current) {
      sidetoneRef.current.tick()
    }

    letterCountRef.current = state.letters.length
  }, [state.letters.length])

  const activePath = activePathOf(state)

  return {
    state,
    activePath,
    pendingCharacter: activePath === '' ? null : characterForCode(activePath, settings.alphabet) ?? null,
    lastLetter: lastCommittedLetter(state),
    isPressing: state.phase === 'holding',
    clear,
    pressStart: () => handlePressStart(performance.now()),
    pressEnd: () => handlePressEnd(performance.now()),
    symbolDown: (symbol) => handleSymbolDown(symbol, performance.now()),
    symbolUp: (symbol) => handleSymbolUp(symbol, performance.now()),
    capture,
    beginCapture: (target) => setCapture((current) => (current === target ? null : target)),
    cancelCapture: () => setCapture(null),
  }
}

