import { describe, expect, it } from 'vitest'
import {
  DIGIT_CODE_BY_CHARACTER,
  FULL_ALPHABET,
  LETTER_CODE_BY_CHARACTER,
  LETTERS_ONLY,
  SPECIAL_CODE_BY_CHARACTER,
  characterForCode,
  codeForCharacter,
  enabledCodes,
  isResolvablePrefix,
  morseToSymbols,
  symbolsToMorse,
} from './morseAlphabet'

describe('morseAlphabet', () => {
  it('carries exactly the 26 ITU letters', () => {
    const letters = Object.keys(LETTER_CODE_BY_CHARACTER)

    expect(letters).toHaveLength(26)
    expect(new Set(letters).size).toBe(26)
  })

  it('looks characters up case-insensitively and back from morse', () => {
    expect(codeForCharacter('a')).toBe('.-')
    expect(codeForCharacter('Q')).toBe('--.-')
    expect(characterForCode('.-')).toBe('A')
    expect(characterForCode('..--')).toBeUndefined()
  })

  it('keeps digits and punctuation out of the letters-only selection', () => {
    expect(characterForCode('-----', LETTERS_ONLY)).toBeUndefined()
    expect(characterForCode('.-.-.-', LETTERS_ONLY)).toBeUndefined()
    expect(codeForCharacter('5', LETTERS_ONLY)).toBeUndefined()
  })

  it('resolves digits and punctuation once they are switched on', () => {
    expect(characterForCode('.....', FULL_ALPHABET)).toBe('5')
    expect(characterForCode('.-.-.-', FULL_ALPHABET)).toBe('.')
    expect(codeForCharacter('0', FULL_ALPHABET)).toBe('-----')
    expect(codeForCharacter('?', FULL_ALPHABET)).toBe('..--..')
  })

  it('never lets an extra set collide with a letter', () => {
    const letterCodes = new Set(Object.values(LETTER_CODE_BY_CHARACTER))

    for (const code of [...Object.values(DIGIT_CODE_BY_CHARACTER), ...Object.values(SPECIAL_CODE_BY_CHARACTER)]) {
      expect(letterCodes.has(code), code).toBe(false)
    }

    expect(enabledCodes(FULL_ALPHABET)).toHaveLength(
      Object.keys(LETTER_CODE_BY_CHARACTER).length +
        Object.keys(DIGIT_CODE_BY_CHARACTER).length +
        Object.keys(SPECIAL_CODE_BY_CHARACTER).length,
    )
  })

  it('reports which prefixes still have a character ahead of them', () => {
    expect(isResolvablePrefix('.', LETTERS_ONLY)).toBe(true)
    expect(isResolvablePrefix('....', LETTERS_ONLY)).toBe(true)
    // Nothing in ITU letters is five symbols long.
    expect(isResolvablePrefix('.....', LETTERS_ONLY)).toBe(false)
    expect(isResolvablePrefix('.....', FULL_ALPHABET)).toBe(true)
    expect(isResolvablePrefix('-.-.--', LETTERS_ONLY)).toBe(false)
    expect(isResolvablePrefix('-.-.--', FULL_ALPHABET)).toBe(true)
  })

  it('relies on silence because codes overlap as prefixes', () => {
    // `.` is E and `...` is S, so symbols alone never settle a character: the decoder
    // keeps reading until the gap says the letter is over. That is what makes the
    // letter-gap threshold the load-bearing number in the whole app.
    expect(isResolvablePrefix('.', LETTERS_ONLY)).toBe(true)
    expect(characterForCode('.')).toBe('E')
    expect(isResolvablePrefix('...', LETTERS_ONLY)).toBe(true)
    expect(characterForCode('...')).toBe('S')
    // Once nothing longer can start with the path, only the gap can end the letter.
    expect(isResolvablePrefix('....', LETTERS_ONLY)).toBe(true)
    expect(characterForCode('....')).toBe('H')
    expect(isResolvablePrefix('.....', LETTERS_ONLY)).toBe(false)
  })

  it('round-trips a path through symbols', () => {
    const morse = codeForCharacter('H') as string

    expect(symbolsToMorse(morseToSymbols(morse))).toBe(morse)
  })
})
