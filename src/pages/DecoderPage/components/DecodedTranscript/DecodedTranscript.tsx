import { MorseMark } from '@/components/atoms/MorseMark/MorseMark'
import { morseToSymbols } from '@/domain/morse/morseAlphabet'
import type { DecodedLetter, DecoderNotice } from '@/domain/morse/decoderReducer'
import styles from './DecodedTranscript.module.css'

export interface DecodedTranscriptProps {
  readonly text: string
  readonly letters: readonly DecodedLetter[]
  readonly notice: DecoderNotice | null
  readonly onClear: () => void
}

/**
 * Live output: the decoded string, plus one chip per committed letter holding that
 * letter's marks — the character itself is already in the text above.
 */
export function DecodedTranscript({ text, letters, notice, onClear }: DecodedTranscriptProps) {
  const isEmpty = letters.length === 0

  return (
    <section className={styles.root} aria-labelledby="transcript-title">
      <div className={styles.head}>
        <div>
          <h2 className={styles.title} id="transcript-title">
            Decoded text
          </h2>
          <p className={styles.meta}>
            {isEmpty
              ? 'Nothing decoded yet'
              : `${letters.length} letter${letters.length === 1 ? '' : 's'} committed`}
          </p>
        </div>

        <button type="button" className={styles.clear} onClick={onClear} disabled={isEmpty}>
          Clear
        </button>
      </div>

      <p className={styles.text} aria-live="polite" data-empty={isEmpty}>
        {isEmpty ? 'Waiting for the first tap — press and hold the space bar.' : text}
      </p>

      {notice ? (
        <p className={styles.notice} role="status">
          {notice.message}
        </p>
      ) : null}

      {isEmpty ? null : (
        <ul className={styles.letters} aria-label="Committed letters">
          {/* The letter itself is already in the text above, so each chip keeps only the
              timing that produced it; the character stays as the chip's accessible name. */}
          {letters.map((letter, index) => (
            <li
              key={`${letter.path}-${index}`}
              className={styles.letter}
              data-latest={index === letters.length - 1}
              aria-label={`${letter.character} ${letter.morse}`}
            >
              <span className={styles.letterMorse}>
                {morseToSymbols(letter.morse).map((symbol, markIndex) => (
                  <MorseMark key={`${symbol}-${markIndex}`} symbol={symbol} size="xs" />
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
