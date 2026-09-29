export type MorseSymbol = '.' | '-'

/**
 * Which character sets the decoder resolves. Letters are always on because the
 * decoding chart is drawn for them; digits and punctuation are opt-in, and both
 * the reducer and the extension chart follow this selection.
 */
export interface AlphabetSelection {
  readonly digits: boolean
  readonly specials: boolean
}

export const LETTERS_ONLY: AlphabetSelection = { digits: false, specials: false }
export const FULL_ALPHABET: AlphabetSelection = { digits: true, specials: true }

/** ITU letters — exactly the labels drawn on the reference decoding chart. */
export const LETTER_CODE_BY_CHARACTER: Readonly<Record<string, string>> = {
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

/** ITU digits — no letter shares any of these sequences. */
export const DIGIT_CODE_BY_CHARACTER: Readonly<Record<string, string>> = {
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
}

/** ITU punctuation and prosign-adjacent marks, as printed on international charts. */
export const SPECIAL_CODE_BY_CHARACTER: Readonly<Record<string, string>> = {
  '.': '.-.-.-',
  ',': '--..--',
  ':': '---...',
  '?': '..--..',
  "'": '.----.',
  '-': '-....-',
  '/': '-..-.',
  '!': '-.-.--',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  '=': '-...-',
  '+': '.-.-.',
  '_': '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
  ';': '-.-.-.',
}

function invert(record: Readonly<Record<string, string>>): Map<string, string> {
  return new Map(Object.entries(record).map(([character, code]) => [code, character]))
}

const LETTER_BY_CODE = invert(LETTER_CODE_BY_CHARACTER)
const DIGIT_BY_CODE = invert(DIGIT_CODE_BY_CHARACTER)
const SPECIAL_BY_CODE = invert(SPECIAL_CODE_BY_CHARACTER)

/** Letters plus whichever extra sets are switched on. */
function enabledMaps(selection: AlphabetSelection): ReadonlyMap<string, string>[] {
  const maps: ReadonlyMap<string, string>[] = [LETTER_BY_CODE]

  if (selection.digits) {
    maps.push(DIGIT_BY_CODE)
  }

  if (selection.specials) {
    maps.push(SPECIAL_BY_CODE)
  }

  return maps
}

function enabledRecords(selection: AlphabetSelection): Readonly<Record<string, string>>[] {
  const records: Readonly<Record<string, string>>[] = [LETTER_CODE_BY_CHARACTER]

  if (selection.digits) {
    records.push(DIGIT_CODE_BY_CHARACTER)
  }

  if (selection.specials) {
    records.push(SPECIAL_CODE_BY_CHARACTER)
  }

  return records
}

/** Every symbol sequence the selection can resolve, longest first. */
export function enabledCodes(selection: AlphabetSelection): string[] {
  return enabledRecords(selection).flatMap((record) => Object.values(record))
}

/**
 * Resolves a symbol sequence to a character. `selection` defaults to letters only,
 * so a caller that has not asked for extras keeps the reference chart's behaviour
 * and reports `..--` as unresolved rather than guessing.
 */
export function characterForCode(code: string, selection: AlphabetSelection = LETTERS_ONLY): string | undefined {
  for (const lookup of enabledMaps(selection)) {
    const character = lookup.get(code)

    if (character !== undefined) {
      return character
    }
  }

  return undefined
}

/** Reverse lookup, case-insensitive for letters. */
export function codeForCharacter(
  character: string,
  selection: AlphabetSelection = LETTERS_ONLY,
): string | undefined {
  const upper = character.toUpperCase()

  for (const record of enabledRecords(selection)) {
    const code = record[upper] ?? record[character]

    if (code !== undefined) {
      return code
    }
  }

  return undefined
}

/** True when `code` is a prefix of — or itself — a character the selection can resolve.
 *
 * Morse codes are deliberately not prefix-free — `.` is E while `...` is S — so this is
 * what tells the decoder to keep waiting for more symbols rather than guessing.
 */
export function isResolvablePrefix(code: string, selection: AlphabetSelection = LETTERS_ONLY): boolean {
  return enabledCodes(selection).some((enabled) => enabled.startsWith(code))
}

export function symbolsToMorse(symbols: readonly MorseSymbol[]): string {
  return symbols.join('')
}

export function morseToSymbols(morse: string): MorseSymbol[] {
  return [...morse].filter((symbol): symbol is MorseSymbol => symbol === '.' || symbol === '-')
}
