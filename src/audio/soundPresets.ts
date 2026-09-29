import type { SoundId } from '../config/userSettings'
import type { MorseSymbol } from '../domain/morse/morseAlphabet'

/**
 * The four keying sounds this app ships with are synthesised, not sampled, so the
 * bundle stays small and the timing is exact. Each one is transcribed from a
 * reference implementation: `sounder` is the plain relay beep, `clack` is the
 * mechanical sounder with no tone at all, `sidetone` is the electronic keyer tone
 * behind a contact click, and `bright` is the metal strike with audible partials.
 */
export interface SoundPreset {
  readonly id: Exclude<SoundId, 'off'>
  readonly label: string
  readonly blurb: string
  /** Key make: contact transient, and the tone start for presets that carry one. */
  readonly strike: (ctx: AudioContext, out: AudioNode) => ToneHandle | null
  /** Key break: release transient, plus stopping any live tone. */
  readonly release: (ctx: AudioContext, out: AudioNode, tone: ToneHandle | null) => void
  /** Short blip that marks a character printing on the tape. */
  readonly tick: (ctx: AudioContext, out: AudioNode) => void
}

export interface ToneHandle {
  readonly stop: (atTime: number) => void
}

/** Seconds of key travel per symbol when previewing a character. */
export const PREVIEW_DIT_S = 0.07
export const PREVIEW_DAH_S = 0.21
export const PREVIEW_GAP_S = 0.11

export function previewDuration(symbol: MorseSymbol): number {
  return symbol === '.' ? PREVIEW_DIT_S : PREVIEW_DAH_S
}

function noiseBuffer(ctx: AudioContext, seconds: number, decay: boolean): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1

    data[index] = decay ? white * Math.pow(1 - index / length, 2) : white
  }

  return buffer
}

function burst(
  ctx: AudioContext,
  out: AudioNode,
  at: number,
  frequency: number,
  level: number,
  seconds: number,
): void {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(level, at)
  gain.gain.exponentialRampToValueAtTime(0.0008, at + seconds)
  oscillator.connect(gain)
  gain.connect(out)
  oscillator.start(at)
  oscillator.stop(at + seconds + 0.02)
}

function noiseStrike(
  ctx: AudioContext,
  out: AudioNode,
  buffer: AudioBuffer,
  at: number,
  frequency: number,
  level: number,
  seconds: number,
): void {
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()

  source.buffer = buffer
  filter.type = 'bandpass'
  filter.frequency.value = frequency
  filter.Q.value = 1
  gain.gain.setValueAtTime(level, at)
  gain.gain.exponentialRampToValueAtTime(0.001, at + seconds)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(out)
  source.start(at)
  source.stop(at + seconds + 0.04)
}

/** Envelope a held tone so it never clicks on make or break. */
function heldTone(
  ctx: AudioContext,
  out: AudioNode,
  type: OscillatorType,
  frequency: number,
  level: number,
  filterHz?: number,
): ToneHandle {
  const at = ctx.currentTime
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, at + 0.004)
  gain.gain.linearRampToValueAtTime(level, at + 0.016)
  oscillator.connect(gain)

  if (filterHz) {
    const filter = ctx.createBiquadFilter()

    filter.type = 'lowpass'
    filter.frequency.value = filterHz
    gain.connect(filter)
    filter.connect(out)
  } else {
    gain.connect(out)
  }

  oscillator.start(at + 0.004)

  return {
    stop: (atTime: number) => {
      const end = Math.max(atTime, ctx.currentTime + 0.005)

      gain.gain.cancelScheduledValues(end)
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), end)
      gain.gain.exponentialRampToValueAtTime(0.0001, end + 0.02)

      try {
        oscillator.stop(end + 0.03)
      } catch {
        // Already stopped by an earlier break — nothing left to silence.
      }
    },
  }
}

/* ------------------------------------------------------------------------- */
/* Presets                                                                   */
/* ------------------------------------------------------------------------- */

/** Zai: a clean 620 Hz relay tone with soft make/break transients. */
const sounderPreset: SoundPreset = {
  id: 'sounder',
  label: 'Relay sounder',
  blurb: 'Plain 620 Hz keying tone, the classic receiver pitch.',
  strike: (ctx, out) => heldTone(ctx, out, 'sine', 620, 0.3),
  release: (_ctx, _out, tone) => tone?.stop(_ctx.currentTime),
  tick: (ctx, out) => burst(ctx, out, ctx.currentTime, 880, 0.08, 0.03),
}

/** Gemini: wood-and-brass keying — filtered noise bursts, deliberately no tone. */
const clackPreset: SoundPreset = {
  id: 'clack',
  label: 'Sounder clack',
  blurb: 'Mechanical make-and-break clatter with no keying tone.',
  strike: (ctx, out) => {
    noiseStrike(ctx, out, noiseBuffer(ctx, 0.03, true), ctx.currentTime, 1500, 0.5, 0.03)

    return null
  },
  release: (ctx, out) => {
    noiseStrike(ctx, out, noiseBuffer(ctx, 0.02, true), ctx.currentTime, 900, 0.32, 0.02)
  },
  tick: (ctx, out) => {
    noiseStrike(ctx, out, noiseBuffer(ctx, 0.02, true), ctx.currentTime, 2400, 0.22, 0.02)
  },
}

/** ChatGPT: electronic keyer sidetone — square wave with a contact click on make. */
const sidetonePreset: SoundPreset = {
  id: 'sidetone',
  label: 'Electronic sidetone',
  blurb: 'Square-wave keyer tone with a click as the contacts close.',
  strike: (ctx, out) => {
    const at = ctx.currentTime

    noiseStrike(ctx, out, noiseBuffer(ctx, 0.025, true), at, 2200, 0.26, 0.025)

    return heldTone(ctx, out, 'square', 760, 0.18)
  },
  release: (ctx, out, tone) => {
    noiseStrike(ctx, out, noiseBuffer(ctx, 0.015, true), ctx.currentTime, 1800, 0.16, 0.015)
    tone?.stop(ctx.currentTime)
  },
  tick: (ctx, out) => burst(ctx, out, ctx.currentTime, 760, 0.1, 0.035),
}

/** Claude: struck metal — low strike, bright ring, three detuned partials. */
const brightPreset: SoundPreset = {
  id: 'bright',
  label: 'Bright strike',
  blurb: 'Metallic strike: low knock, bright ring, detuned partials.',
  strike: (ctx, out) => {
    const at = ctx.currentTime

    burst(ctx, out, at, 180, 0.5, 0.06)
    burst(ctx, out, at, 2600, 0.3, 0.015)
    burst(ctx, out, at + 0.004, 1320, 0.12, 0.1)
    burst(ctx, out, at + 0.004, 1990, 0.09, 0.08)
    burst(ctx, out, at + 0.006, 2650, 0.07, 0.06)

    return heldTone(ctx, out, 'triangle', 1240, 0.1)
  },
  release: (ctx, out, tone) => {
    burst(ctx, out, ctx.currentTime, 900, 0.24, 0.05)
    tone?.stop(ctx.currentTime)
  },
  tick: (ctx, out) => burst(ctx, out, ctx.currentTime, 2600, 0.16, 0.02),
}

export const SOUND_PRESETS: readonly SoundPreset[] = [
  sounderPreset,
  clackPreset,
  sidetonePreset,
  brightPreset,
]

export function soundPresetFor(id: SoundId): SoundPreset | undefined {
  return SOUND_PRESETS.find((preset) => preset.id === id)
}

