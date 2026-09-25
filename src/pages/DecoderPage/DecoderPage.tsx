import { useColorTheme } from '@/hooks/useColorTheme'
import { useMorseSession } from '@/hooks/useMorseSession'
import { DecodedTranscript } from './components/DecodedTranscript/DecodedTranscript'
import { MorseChart } from './components/MorseChart/MorseChart'
import { PageHeader } from './components/PageHeader/PageHeader'
import styles from './DecoderPage.module.css'

/** Single page of the app: the decoding chart, and the text it decodes. */
export function DecoderPage() {
  const { theme, toggleTheme } = useColorTheme()
  const session = useMorseSession()
  const { state, timing } = session

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
            A short press is a dot, a longer hold is a dash, and the pause after it closes the
            letter. The chart lights the whole path your timing takes — from the start hub out to
            the letter you are spelling — and the decoded text builds underneath.
          </p>
        </section>

        <section className={styles.chartPanel} aria-labelledby="chart-title">
          <h2 className={styles.panelTitle} id="chart-title">
            Decoding chart
          </h2>
          <MorseChart
            activePath={session.activePath}
            pendingCharacter={session.pendingCharacter}
            lastLetter={session.lastLetter}
            commitCount={state.commitCount}
            isTransmitting={state.phase !== 'idle'}
          />
        </section>

        <DecodedTranscript
          text={state.text}
          letters={state.letters}
          notice={state.notice}
          onClear={session.clear}
        />
      </main>

      <footer className={styles.footer}>
        <p>
          The chart carries the 26 letters of the ITU alphabet, matching the reference chart.
          Digits, punctuation and prosigns are not on it, so those sequences are reported as
          unresolved instead of guessed at.
        </p>
        {timing.warnings.length > 0 ? (
          <ul className={styles.warnings} role="status">
            {timing.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </footer>
    </div>
  )
}
