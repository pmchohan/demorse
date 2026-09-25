import { useCallback, useMemo, useReducer } from 'react'
import { morseTiming, type ResolvedMorseTiming } from '../config/morseTiming'
import {
  activePathOf,
  createDecoderReducer,
  createInitialDecoderState,
  lastCommittedLetter,
  type DecodedLetter,
  type DecoderState,
} from '../domain/morse/decoderReducer'
import { letterForPath } from '../domain/morse/morseTree'
import { useAnimationClock } from './useAnimationClock'
import { usePressInput } from './usePressInput'

export interface MorseSession {
  readonly state: DecoderState
  readonly timing: ResolvedMorseTiming
  /** Dot/dash path of the character being typed right now. */
  readonly activePath: string
  /** Letter the active path would decode to, or null while it is incomplete. */
  readonly pendingCharacter: string | null
  readonly lastLetter: DecodedLetter | null
  readonly clear: () => void
}

/**
 * Wires the press input, the animation clock and the pure decoder together.
 * Thresholds come from the build-time environment, so they never change at runtime.
 */
export function useMorseSession(): MorseSession {
  const timing = morseTiming
  const reducer = useMemo(() => createDecoderReducer(timing.thresholds), [timing])
  const [state, dispatch] = useReducer(reducer, undefined, createInitialDecoderState)

  const handlePressStart = useCallback((atMs: number) => dispatch({ type: 'press-start', atMs }), [])
  const handlePressEnd = useCallback((atMs: number) => dispatch({ type: 'press-end', atMs }), [])
  const handleTick = useCallback((atMs: number) => dispatch({ type: 'tick', atMs }), [])
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])

  usePressInput({ onPressStart: handlePressStart, onPressEnd: handlePressEnd })

  // Only runs while a press is held or a gap is being measured.
  useAnimationClock(state.phase !== 'idle', handleTick)

  const activePath = activePathOf(state)

  return {
    state,
    timing,
    activePath,
    pendingCharacter: letterForPath(activePath) ?? null,
    lastLetter: lastCommittedLetter(state),
    clear,
  }
}
