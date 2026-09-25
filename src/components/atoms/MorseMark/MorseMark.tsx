import type { MorseSymbol } from '@/domain/morse/morseAlphabet'
import styles from './MorseMark.module.css'

export type MorseMarkSize = 'sm' | 'md' | 'lg'

export interface MorseMarkProps {
  readonly symbol: MorseSymbol
  readonly size?: MorseMarkSize
  readonly tone?: 'signal' | 'muted'
}

/** The dot/pill mark used on the chart edges and in the transcript. */
export function MorseMark({ symbol, size = 'md', tone = 'signal' }: MorseMarkProps) {
  return (
    <span
      className={`${styles.mark} ${styles[size]} ${styles[tone]}`}
      data-symbol={symbol}
      aria-hidden="true"
    />
  )
}
