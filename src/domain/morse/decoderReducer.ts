import {
  characterForCode,
  symbolsToMorse,
  LETTERS_ONLY,
  type AlphabetSelection,
  type MorseSymbol,
} from './morseAlphabet'
import {
  classifyGap,
  classifyPress,
  type MorseTimingThresholds,
  type PressClassification,
} from './timingClassifier'

export type DecoderPhase = 'idle' | 'holding' | 'waiting'

export interface DecodedLetter {
  readonly character: string
  readonly morse: string
  readonly path: string
}

export type DecoderNoticeKind =
  | 'unresolved-sequence'
  | 'short-press'
  | 'over-max-press'
  | 'ambiguous-timing'

export interface DecoderNotice {
  readonly kind: DecoderNoticeKind
  readonly message: string
}

export interface DecoderState {
  readonly phase: DecoderPhase
  readonly pressStartedAtMs: number | null
  readonly releasedAtMs: number | null
  /** Milliseconds the current press or the current silence has been running. */
  readonly liveElapsedMs: number
  readonly symbols: readonly MorseSymbol[]
  readonly letters: readonly DecodedLetter[]
  readonly text: string
  readonly notice: DecoderNotice | null
  /** Increments on every attempted character commit — drives the chart pulse. */
  readonly commitCount: number
}

export type DecoderAction =
  | { readonly type: 'press-start'; readonly atMs: number }
  | { readonly type: 'press-end'; readonly atMs: number }
  | { readonly type: 'tick'; readonly atMs: number }
  | { readonly type: 'clear' }

export function createInitialDecoderState(): DecoderState {
  return {
    phase: 'idle',
    pressStartedAtMs: null,
    releasedAtMs: null,
    liveElapsedMs: 0,
    symbols: [],
    letters: [],
    text: '',
    notice: null,
    commitCount: 0,
  }
}

function noticeForPress(classification: PressClassification): DecoderNotice | null {
  if (classification.confidence === 'exact') {
    return null
  }

  return {
    kind: classification.confidence === 'over-max' ? 'over-max-press' : 'ambiguous-timing',
    message: classification.note,
  }
}

/**
 * Commits the character currently held in `symbols`. Returns the same state
 * object when there is nothing pending, so callers can compare identity.
 */
function commitPendingLetter(state: DecoderState, selection: AlphabetSelection): DecoderState {
  if (state.symbols.length === 0) {
    return state
  }

  const morse = symbolsToMorse(state.symbols)
  const character = characterForCode(morse, selection)

  if (!character) {
    return {
      ...state,
      symbols: [],
      commitCount: state.commitCount + 1,
      notice: {
        kind: 'unresolved-sequence',
        message: `${morse} is not a character the chart can resolve — nothing was appended.`,
      },
    }
  }

  return {
    ...state,
    symbols: [],
    letters: [...state.letters, { character, morse, path: morse }],
    text: state.text + character,
    commitCount: state.commitCount + 1,
    notice: null,
  }
}

/** Appends a separator, collapsing any pending letter and never doubling up whitespace. */
function appendSeparator(
  state: DecoderState,
  selection: AlphabetSelection,
  separator: ' ' | '\n',
): DecoderState {
  const committed = commitPendingLetter(state, selection)
  const trimmed = separator === '\n' ? committed.text.replace(/ +$/, '') : committed.text
  const isBlank = trimmed === ''
  const alreadySeparated = separator === ' ' ? committed.text.endsWith(' ') : trimmed.endsWith('\n')

  return {
    ...committed,
    phase: 'idle',
    pressStartedAtMs: null,
    symbols: [],
    text: isBlank || alreadySeparated ? trimmed : `${trimmed}${separator}`,
  }
}

/**
 * Pure, clock-injected decoder. Every transition is driven by timestamps the
 * caller supplies, which keeps the timing rules unit-testable without real timers.
 */
export function createDecoderReducer(
  thresholds: MorseTimingThresholds,
  selection: AlphabetSelection = LETTERS_ONLY,
): (state: DecoderState, action: DecoderAction) => DecoderState {
  return function decoderReducer(state, action) {
    switch (action.type) {
      case 'press-start': {
        // Key auto-repeat must not restart the dwell timer.
        if (state.phase === 'holding') {
          return state
        }

        return {
          ...state,
          phase: 'holding',
          pressStartedAtMs: action.atMs,
          liveElapsedMs: 0,
          notice: null,
        }
      }

      case 'press-end': {
        if (state.phase !== 'holding' || state.pressStartedAtMs === null) {
          return state
        }

        const durationMs = Math.max(0, action.atMs - state.pressStartedAtMs)
        const classification = classifyPress(durationMs, thresholds)

        if (classification.verdict === 'too-short') {
          // Key bounce: keep the character in progress and the running gap intact.
          const releasedAtMs = state.releasedAtMs
          const backToWaiting = releasedAtMs !== null

          return {
            ...state,
            phase: backToWaiting ? 'waiting' : 'idle',
            pressStartedAtMs: null,
            liveElapsedMs: backToWaiting ? Math.max(0, action.atMs - releasedAtMs) : 0,
            notice: { kind: 'short-press', message: classification.note },
          }
        }

        return {
          ...state,
          phase: 'waiting',
          pressStartedAtMs: null,
          releasedAtMs: action.atMs,
          liveElapsedMs: 0,
          symbols: [...state.symbols, classification.symbol as MorseSymbol],
          notice: noticeForPress(classification),
        }
      }

      case 'symbol': {
        // Two-key mode: the key that was pressed already names the symbol, so
        // dwell time is irrelevant — but the press still ends the running pause.
        return {
          ...state,
          phase: 'waiting',
          pressStartedAtMs: null,
          releasedAtMs: action.atMs,
          liveElapsedMs: 0,
          symbols: [...state.symbols, action.symbol],
          notice: null,
        }
      }

      case 'tick': {
        if (state.phase === 'holding') {
          if (state.pressStartedAtMs === null) {
            return state
          }

          const elapsedMs = Math.max(0, action.atMs - state.pressStartedAtMs)

          return elapsedMs === state.liveElapsedMs ? state : { ...state, liveElapsedMs: elapsedMs }
        }

        if (state.phase !== 'waiting' || state.releasedAtMs === null) {
          return state
        }

        const gapMs = Math.max(0, action.atMs - state.releasedAtMs)
        const classification = classifyGap(gapMs, thresholds)

        if (classification.verdict === 'word') {
          // Freeze the metre at full scale and drop back to idle so the clock stops.
          return { ...closeWord(state), liveElapsedMs: thresholds.gapMaxMs }
        }

        const committed = classification.verdict === 'letter' ? commitPendingLetter(state) : state

        return { ...committed, liveElapsedMs: gapMs }
      }

      case 'clear':
        return createInitialDecoderState()

      default:
        return state
    }
  }
}

/** Dot/dash path of the character currently being typed. */
export function activePathOf(state: DecoderState): string {
  return symbolsToMorse(state.symbols)
}

export function lastCommittedLetter(state: DecoderState): DecodedLetter | null {
  return state.letters.length > 0 ? state.letters[state.letters.length - 1] : null
}
