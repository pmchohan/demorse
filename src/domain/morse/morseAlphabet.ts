export type MorseSymbol = '.' | '-'

/** ITU letter set — exactly the labels drawn on the reference decoding chart. */
export const MORSE_BY_CHARACTER: Readonly<Record<string, string>> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
}

const CHARACTER_BY_MORSE: ReadonlyMap<string, string> = new Map(
  Object.entries(MORSE_BY_CHARACTER).map(([character, morse]) => [morse, character]),
)

export function morseForCharacter(character: string): string | undefined {
  return MORSE_BY_CHARACTER[character.toUpperCase()]
}

export function characterForMorse(morse: string): string | undefined {
  return CHARACTER_BY_MORSE.get(morse)
}

export function symbolsToMorse(symbols: readonly MorseSymbol[]): string {
  return symbols.join('')
}

export function morseToSymbols(morse: string): MorseSymbol[] {
  return [...morse].filter((symbol): symbol is MorseSymbol => symbol === '.' || symbol === '-')
}
