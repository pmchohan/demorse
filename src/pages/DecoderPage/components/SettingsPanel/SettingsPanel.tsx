import { useMemo, useRef } from 'react'
import { ToggleSwitch } from '@/components/atoms/ToggleSwitch/ToggleSwitch'
import {
  CUSTOM_TIMING_ID,
  TIMING_KEYS,
  TIMING_PRESETS,
  timingPresetIdOf,
  type MorseTimingKey,
} from '@/config/morseTiming'
import type { SoundSettings, UserSettings } from '@/config/userSettings'
import { SOUND_PRESETS } from '@/audio/soundPresets'
import type { AlphabetSelection } from '@/domain/morse/morseAlphabet'
import type { MorseTimingThresholds } from '@/domain/morse/timingClassifier'
import { useSidetone } from '@/hooks/useSidetone'
import styles from './SettingsPanel.module.css'

export interface SettingsPanelProps {
  readonly settings: UserSettings
  /** Window overlaps coming from findThresholdConflicts, shown under the sliders. */
  readonly conflicts: readonly string[]
  readonly onThresholdsChange: (thresholds: MorseTimingThresholds) => void
  readonly onResetTiming: () => void
  readonly onSoundChange: (sound: SoundSettings) => void
  readonly onAlphabetChange: (alphabet: AlphabetSelection) => void
}

interface SliderMeta {
  readonly label: string
  readonly min: number
  readonly max: number
  readonly step: number
}

const SLIDER_META: Readonly<Record<MorseTimingKey, SliderMeta>> = {
  tapMinMs: { label: 'Ignore presses shorter than', min: 5, max: 120, step: 5 },
  tapMaxMs: { label: 'Dot up to', min: 60, max: 500, step: 10 },
  holdMinMs: { label: 'Dash from', min: 80, max: 800, step: 10 },
  holdMaxMs: { label: 'Dash up to', min: 200, max: 1500, step: 10 },
  letterGapMs: { label: 'Close the character after', min: 80, max: 1500, step: 10 },
  wordGapMs: { label: 'Print a space after', min: 300, max: 3000, step: 25 },
  lineGapMs: { label: 'Start a new line after', min: 600, max: 6000, step: 50 },
}

const SOUND_OPTIONS = [{ id: 'off', label: 'Off', blurb: 'Silent keying.' }, ...SOUND_PRESETS] as const

/**
 * Everything the operator tunes: the timing preset dropdown with its seven
 * sliders, the keying sound and volume, and the alphabet switches for digits and
 * punctuation (which also grow the decoding chart).
 */
export function SettingsPanel({
  settings,
  conflicts,
  onThresholdsChange,
  onResetTiming,
  onSoundChange,
  onAlphabetChange,
}: SettingsPanelProps) {
  const presetId = timingPresetIdOf(settings.thresholds)
  const sidetone = useSidetone(settings.sound)
  const testTimer = useRef<number | null>(null)

  const soundBlurb = useMemo(
    () => SOUND_OPTIONS.find((option) => option.id === settings.sound.id)?.blurb ?? '',
    [settings.sound.id],
  )

  const playTest = () => {
    sidetone.strike()

    if (testTimer.current !== null) {
      window.clearTimeout(testTimer.current)
    }

    testTimer.current = window.setTimeout(() => sidetone.release(), 140)
  }

  return (
    <section className={styles.root} aria-label="Decoder settings">
      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Timing</h3>

        <label className={styles.selectRow}>
          <span className={styles.fieldLabel}>Keying speed</span>
          <select
            className={styles.select}
            value={presetId}
            onChange={(event) => {
              const preset = TIMING_PRESETS.find((candidate) => candidate.id === event.target.value)

              if (preset) {
                onThresholdsChange(preset.thresholds)
              }
            }}
          >
            {TIMING_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label} — {preset.blurb}
              </option>
            ))}
            <option value={CUSTOM_TIMING_ID} disabled>
              Custom — sliders set the thresholds
            </option>
          </select>
        </label>

        <div className={styles.sliders}>
          {TIMING_KEYS.map((key) => {
            const meta = SLIDER_META[key]

            return (
              <label key={key} className={styles.slider}>
                <span className={styles.sliderHead}>
                  <span className={styles.fieldLabel}>{meta.label}</span>
                  <output className={styles.sliderValue}>{settings.thresholds[key]} ms</output>
                </span>
                <input
                  type="range"
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  value={Math.min(Math.max(settings.thresholds[key], meta.min), meta.max)}
                  onChange={(event) =>
                    onThresholdsChange({ ...settings.thresholds, [key]: Number(event.target.value) })
                  }
                />
              </label>
            )
          })}
        </div>

        {conflicts.length > 0 ? (
          <ul className={styles.conflicts} role="status">
            {conflicts.map((conflict) => (
              <li key={conflict}>{conflict}</li>
            ))}
          </ul>
        ) : null}

        <button type="button" className={styles.textButton} onClick={onResetTiming}>
          Reset timing to .env defaults
        </button>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Sound</h3>

        <label className={styles.selectRow}>
          <span className={styles.fieldLabel}>Keying sound</span>
          <select
            className={styles.select}
            value={settings.sound.id}
            onChange={(event) =>
              onSoundChange({ ...settings.sound, id: event.target.value as SoundSettings['id'] })
            }
          >
            {SOUND_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <p className={styles.blurb}>{soundBlurb}</p>

        <label className={styles.slider}>
          <span className={styles.sliderHead}>
            <span className={styles.fieldLabel}>Volume</span>
            <output className={styles.sliderValue}>{Math.round(settings.sound.volume * 100)}%</output>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(settings.sound.volume * 100)}
            disabled={settings.sound.id === 'off'}
            onChange={(event) =>
              onSoundChange({ ...settings.sound, volume: Number(event.target.value) / 100 })
            }
          />
        </label>

        <button
          type="button"
          className={styles.textButton}
          onClick={playTest}
          disabled={settings.sound.id === 'off'}
        >
          Test sound
        </button>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Alphabet</h3>

        <ToggleSwitch
          checked={settings.alphabet.digits}
          onChange={(digits) => onAlphabetChange({ ...settings.alphabet, digits })}
          label="Numbers 0–9"
          hint="Adds the digit chart under the letters."
        />
        <ToggleSwitch
          checked={settings.alphabet.specials}
          onChange={(specials) => onAlphabetChange({ ...settings.alphabet, specials })}
          label="Punctuation"
          hint="Adds the marks chart: . , : ? / ( ) = and more."
        />
      </div>
    </section>
  )
}