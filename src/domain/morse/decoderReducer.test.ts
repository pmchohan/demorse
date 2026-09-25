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
  gapMinMs: 250,
  gapMaxMs: 900,
}

const reducer = createDecoderReducer(thresholds)

function pressAt(state: DecoderState, atMs: number, durationMs: number): DecoderState {
  const holding = reducer(state, { type: 'press-start', atMs })

  return reducer(holding, { type: 'press-end', atMs: atMs + durationMs })
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

  it('adds a word space once the silence passes the gap maximum, and only once', () => {
    let state = pressAt(createInitialDecoderState(), 1_000, 100)
    state = tickAt(state, 1_400)

    expect(state.text).toBe('E')

    state = tickAt(state, 2_200)

    expect(state.text).toBe('E ')
    expect(state.phase).toBe('idle')

    state = tickAt(state, 3_000)

    expect(state.text).toBe('E ')
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
