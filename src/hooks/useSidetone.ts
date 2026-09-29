import { useEffect, useMemo, useRef } from 'react'
import { soundPresetFor, type ToneHandle } from '../audio/soundPresets'
import type { SoundSettings } from '../config/userSettings'

interface AudioRig {
  readonly ctx: AudioContext
  readonly master: GainNode
}

export interface Sidetone {
  /** Key make. Returns the live tone, if the preset carries one. */
  readonly strike: () => void
  /** Key break. Stops the tone strike() started. */
  readonly release: () => void
  /** A character printed on the tape. */
  readonly tick: () => void
  /** Whether sound is currently enabled (UI can hide the volume control). */
  readonly enabled: boolean
}

/**
 * Wires the selected sound preset to an AudioContext that is created lazily on
 * the first strike, because browsers refuse to start audio before a gesture.
 * `off` is a no-op preset; volume scales a master gain every preset shares.
 */
export function useSidetone(sound: SoundSettings): Sidetone {
  const rigRef = useRef<AudioRig | null>(null)
  const toneRef = useRef<ToneHandle | null>(null)
  const preset = useMemo(() => soundPresetFor(sound.id), [sound.id])

  // Switching presets mid-hold must not strand a tone from the old one.
  useEffect(() => {
    const rig = rigRef.current

    if (rig && toneRef.current) {
      toneRef.current.stop(rig.ctx.currentTime)
      toneRef.current = null
    }
  }, [preset])

  useEffect(() => {
    const rig = rigRef.current

    if (rig) {
      rig.master.gain.value = sound.volume
    }
  }, [sound.volume])

  const ensureRig = (): AudioRig | null => {
    if (rigRef.current) {
      return rigRef.current
    }

    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!Ctor) {
      return null
    }

    const ctx = new Ctor()
    const master = ctx.createGain()

    master.gain.value = sound.volume
    master.connect(ctx.destination)
    rigRef.current = { ctx, master }

    return rigRef.current
  }

  return {
    enabled: preset !== undefined,
    strike: () => {
      if (!preset) {
        return
      }

      const rig = ensureRig()

      if (!rig) {
        return
      }

      if (rig.ctx.state === 'suspended') {
        void rig.ctx.resume()
      }

      toneRef.current = preset.strike(rig.ctx, rig.master)
    },
    release: () => {
      const rig = rigRef.current

      if (!preset || !rig) {
        return
      }

      preset.release(rig.ctx, rig.master, toneRef.current)
      toneRef.current = null
    },
    tick: () => {
      const rig = rigRef.current

      if (!preset || !rig) {
        return
      }

      preset.tick(rig.ctx, rig.master)
    },
  }
}
