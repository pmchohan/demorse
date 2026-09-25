import { describe, expect, it } from 'vitest'
import {
  MORSE_BY_CHARACTER,
  characterForMorse,
  morseForCharacter,
  morseToSymbols,
  symbolsToMorse,
} from './morseAlphabet'

describe('morseAlphabet', () => {
  it('carries exactly the 26 ITU letters', () => {
    const letters = Object.keys(MORSE_BY_CHARACTER)

    expect(letters).toHaveLength(26)
    expect(new Set(letters).size).toBe(26)
  })

  it('looks letters up case-insensitively and back from morse', () => {
    expect(morseForCharacter('a')).toBe('.-')
    expect(morseForCharacter('Q')).toBe('--.-')
    expect(characterForMorse('.-')).toBe('A')
    expect(characterForMorse('..--')).toBeUndefined()
  })

  it('round-trips a path through symbols', () => {
    const morse = morseForCharacter('H') as string

    expect(symbolsToMorse(morseToSymbols(morse))).toBe(morse)
  })
})
