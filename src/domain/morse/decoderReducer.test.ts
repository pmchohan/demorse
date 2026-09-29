import { describe, expect, it } from 'vitest'
import {
  activePathOf,
  createDecoderReducer,
  createInitialDecoderState,
  lastCommittedLetter,
  type DecoderState,
} from './decoderReducer'
import type { MorseTimingThresholds } from './timingClassifier'

const thresholds: MorseTimingThresholds = {
  tapMinMs: 40,
  tapMaxMs: 200,
  holdMinMs: 250,
  holdMaxMs: 700,
  letterGapMs: 250,
  wordGapMs: 900,
  lineGapMs: 1_800,
}

const reducer = createDecoderReducer(thresholds)
const withExtras = createDecoderReducer(thresholds, { digits: true, specials: true })

function pressAt(
  state: DecoderState,
  atMs: number,
  durationMs: number,
  key = reducer,
): DecoderState {
  const holding = key(state, { type: 'press-start', atMs })

  return key(holding, { type: 'press-end', atMs: atMs + durationMs })
}

function tickAt(state: DecoderState, atMs: number): DecoderState {
  return reducer(state, { type: 'tick', atMs })
}

describe('decoderReducer', () => {
  it('turns a short press into a dot and commits it after the letter window', () => {
    let state = pressAt(createInitialDecoderState(), 1_000, 100)

    expect(state.symbols).toEqual(['.'])
    expect(state.phase).toBe('waiting')

    state = tickAt(state, 1_400)

    expect(state.text).toBe('E')
    expect(state.letters).toEqual([{ character: 'E', morse: '.', path: '.' }])
    expect(lastCommittedLetter(state)?.character).toBe('E')
    expect(state.symbols).toEqual([])
  })

  it('accumulates symbols while the silence stays inside the character window', () => {
    let state = pressAt(createInitialDecoderState(), 1_000, 80)
    state = tickAt(state, 1_120)

    expect(state.symbols).toEqual(['.'])

    state = pressAt(state, 1_200, 80)
    state = pressAt(state, 1_400, 80)

    expect(activePathOf(state)).toBe('...')

    state = tickAt(state, 1_800)

    expect(state.text).toBe('S')
  })

  it('adds a word space once the silence passes the word threshold', () => {
    let state = pressAt(createInitialDecoderState(), 1_000, 100)
    state = tickAt(state, 1_400)

    expect(state.text).toBe('E')

    state = tickAt(state, 2_200)

    expect(state.text).toBe('E ')
    // The clock keeps running: more silence can still escalate this same pause.
    expect(state.phase).toBe('waiting')
  })

  it('escalates the same long silence into a new line', () => {
    let state = pressAt(createInitialDecoderState(), 1_000, 100)
    state = tickAt(state, 1_400)
    state = tickAt(state, 2_200)

    expect(state.text).toBe('E ')

    state = tickAt(state, 3_100)

    // The trailing space becomes a line break rather than stacking whitespace.
    expect(state.text).toBe('E\n')
    expect(state.phase).toBe('idle')

    state = tickAt(state, 5_000)

    expect(state.text).toBe('E\n')
  })

  it('ignores key bounce without losing the character in progress', () => {
    let state = pressAt(createInitialDecoderState(), 1_000, 100)

    state = pressAt(state, 1_200, 20)

    expect(state.symbols).toEqual(['.'])
    expect(state.notice?.kind).toBe('short-press')
    expect(state.phase).toBe('waiting')
  })

  it('flags presses held past the hold maximum but still reads them as dashes', () => {
    let state = pressAt(createInitialDecoderState(), 1_000, 900)

    expect(state.notice?.kind).toBe('over-max-press')
    expect(state.symbols).toEqual(['-'])

    state = tickAt(state, 2_300)

    expect(state.text).toBe('T')
  })

  it('reports sequences that are not on the chart instead of guessing', () => {
    let state = pressAt(createInitialDecoderState(), 1_000, 80)
    state = pressAt(state, 1_150, 80)
    state = pressAt(state, 1_300, 300)
    state = pressAt(state, 1_700, 300)
    state = tickAt(state, 2_400)

    expect(state.symbols).toEqual([])
    expect(state.text).toBe('')
    expect(state.notice?.kind).toBe('unresolved-sequence')
    expect(state.notice?.message).toMatch(/\.\.--/)
    expect(state.commitCount).toBe(1)
  })

  it('reads a digit once digits are switched on, and reports it as unresolved without them', () => {
    const fiveDots = (key: typeof reducer): DecoderState => {
      let state = createInitialDecoderState()

      for (let index = 0; index < 5; index += 1) {
        state = pressAt(state, 1_000 + index * 200, 80, key)
      }

      return key(state, { type: 'tick', atMs: 2_400 })
    }

    const lettersOnly = fiveDots(reducer)

    expect(lettersOnly.text).toBe('')
    expect(lettersOnly.notice?.kind).toBe('unresolved-sequence')

    expect(fiveDots(withExtras).text).toBe('5')
  })

  it('does not let a held two-key dash count as silence', () => {
    let state = reducer(createInitialDecoderState(), { type: 'symbol', symbol: '.', atMs: 1_000 })

    state = reducer(state, { type: 'symbol', symbol: '-', atMs: 1_200 })
    // The dash key stayed down for 700ms: the gap only starts when it came up.
    state = reducer(state, { type: 'key-pause', atMs: 1_900, startedAtMs: 1_200 })
    state = tickAt(state, 2_000)

    expect(state.text).toBe('')
    expect(state.symbols).toEqual(['.', '-'])

    state = tickAt(state, 2_300)

    expect(state.text).toBe('A')
  })

  it('keeps the dwell timer running across auto-repeat presses', () => {
    const holding = reducer(createInitialDecoderState(), { type: 'press-start', atMs: 1_000 })
    const repeated = reducer(holding, { type: 'press-start', atMs: 1_400 })

    expect(repeated).toBe(holding)

    const released = reducer(repeated, { type: 'press-end', atMs: 1_500 })

    expect(released.notice).toBeNull()
    expect(released.symbols).toEqual(['-'])
  })

  it('resets the transcript on clear', () => {
    let state = pressAt(createInitialDecoderState(), 1_000, 100)
    state = tickAt(state, 1_400)

    expect(state.text).toBe('E')

    state = reducer(state, { type: 'clear' })

    expect(state).toEqual(createInitialDecoderState())
  })
})
