import { useMemo } from 'react'
import { morseTiming } from '@/config/morseTiming'
import { isResolvablePrefix } from '@/domain/morse/morseAlphabet'
import { findThresholdConflicts } from '@/domain/morse/timingClassifier'
import { useColorTheme } from '@/hooks/useColorTheme'
import { useMorseSession } from '@/hooks/useMorseSession'
import { useUserSettings } from '@/hooks/useUserSettings'
import { DecodedTranscript } from './components/DecodedTranscript/DecodedTranscript'
import { MorseChart } from './components/MorseChart/MorseChart'
import { PageHeader } from './components/PageHeader/PageHeader'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import { TransmitConsole } from './components/TransmitConsole/TransmitConsole'
import styles from './DecoderPage.module.css'

/**
 * Single page of the app: the transmit console, the decoding chart it walks, the text
 * it decodes, and the settings that retune all three. The environment supplies the
 * starting thresholds; everything below them belongs to the operator.
 */
export function DecoderPage() {
  const { theme, toggleTheme } = useColorTheme()
  const actions = useUserSettings({ thresholds: morseTiming.thresholds })
  const session = useMorseSession(actions)
  const { settings } = actions
  const { state } = session

  const conflicts = useMemo(() => findThresholdConflicts(settings.thresholds), [settings.thresholds])

  /**
   * The symbol a held press would leave behind if it ended now. It flips to a dash at
   * the hold threshold, which is the same rule the reducer applies on release.
   */
  const pendingSymbol =
    settings.mode === 'single' && state.phase === 'holding'
      ? state.liveElapsedMs >= settings.thresholds.holdMinMs
        ? '-'
        : '.'
      : null
  const isUnresolvable =
    session.activePath !== '' && !isResolvablePrefix(session.activePath, settings.alphabet)

  return (
    <div className={styles.page}>
      <div className={styles.aurora} aria-hidden="true" />

      <PageHeader theme={theme} onToggleTheme={toggleTheme} />

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.headline}>
            Tap the space bar and watch the chart walk each letter out of your timing.
          </h1>
          <p className={styles.lead}>
            A short press is a dot, a longer hold is a dash, and the silence after it decides what
            the next thing is: a new letter, a space, or a new line. The chart lights the whole path
            your timing takes — from the start hub out to the character you are spelling — while the
            decoded text builds alongside it. Starting a new character hands the highlight over: the
            chain behind you goes out.
          </p>
        </section>

        <TransmitConsole
          mode={settings.mode}
          bindings={settings.bindings}
          thresholds={settings.thresholds}
          symbols={state.symbols}
          pendingCharacter={session.pendingCharacter}
          isUnresolvable={isUnresolvable}
          isPressing={state.phase === 'holding'}
          pendingSymbol={pendingSymbol}
          phase={state.phase}
          liveElapsedMs={state.liveElapsedMs}
          capture={session.capture}
          onModeChange={actions.setMode}
          onBeginCapture={session.beginCapture}
          onCancelCapture={session.cancelCapture}
          onPadDown={session.pressStart}
          onPadUp={session.pressEnd}
          onSymbolDown={session.symbolDown}
          onSymbolUp={session.symbolUp}
        />

        <div className={styles.workbench}>
          <section className={styles.chartPanel} aria-labelledby="chart-title">
            <h2 className={styles.panelTitle} id="chart-title">
              Decoding chart
            </h2>
            <MorseChart
              activePath={session.activePath}
              pendingCharacter={session.pendingCharacter}
              lastLetter={session.lastLetter}
              commitCount={state.commitCount}
              isPressing={state.phase === 'holding'}
              isTransmitting={state.phase !== 'idle'}
              selection={settings.alphabet}
            />
          </section>

          <DecodedTranscript
            text={state.text}
            letters={state.letters}
            notice={state.notice}
            onClear={session.clear}
          />
        </div>

        <SettingsPanel
          settings={settings}
          conflicts={conflicts}
          onThresholdsChange={actions.setThresholds}
          onResetTiming={actions.resetThresholds}
          onSoundChange={actions.setSound}
          onAlphabetChange={actions.setAlphabet}
        />
      </main>

      <footer className={styles.footer}>
        <p>
          The letter chart is drawn from the reference illustration and always available. Numbers and
          punctuation are opt-in: switch them on and their own charts appear underneath, and the
          decoder starts resolving those sequences instead of reporting them unresolved. A path with
          no character on any enabled branch is reported as a dead end rather than guessed at.
        </p>
        {morseTiming.parseWarnings.length > 0 ? (
          <ul className={styles.warnings} role="status">
            {morseTiming.parseWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </footer>
    </div>
  )
}
