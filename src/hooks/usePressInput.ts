import { useEffect, useRef } from 'react'
import type { InputMode, KeyBindings } from '../config/userSettings'
import type { MorseSymbol } from '../domain/morse/morseAlphabet'

/** Which key the next press should be captured for, while rebinding. */
export type CaptureTarget = 'dit' | 'dah' | null

export interface PressInputOptions {
  readonly mode: InputMode
  readonly bindings: KeyBindings
  /** Set while the user is choosing a new key: keys rebind instead of keying. */
  readonly capture: CaptureTarget
  readonly onCapture: (target: Exclude<CaptureTarget, null>, code: string) => void
  /** Single mode: dwell time decides the symbol, so the press is bracketed. */
  readonly onPressStart: (atMs: number) => void
  readonly onPressEnd: (atMs: number) => void
  /** Dual mode: the key itself names the symbol; up is for the sidetone break. */
  readonly onSymbolDown: (symbol: MorseSymbol, atMs: number) => void
  readonly onSymbolUp: (symbol: MorseSymbol, atMs: number) => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** Keys that must stay free for the browser and screen readers. */
function isReserved(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey
}

function isSpace(event: KeyboardEvent): boolean {
  return event.code === 'Space' || event.key === ' '
}

/**
 * Turns keyboard input into keying events stamped with `performance.now()`, so
 * the decoder, the sidetone and the browser share one time base. In single mode
 * the space bar brackets a press; in dual mode the two bound keys name their
 * symbol outright. Global key handling lives here rather than in components,
 * which is also what keeps bound keys (space, arrows, `/`) from scrolling or
 * quick-finding the page.
 */
export function usePressInput(options: PressInputOptions): void {
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const heldRef = useRef<{ kind: 'press' } | { kind: 'symbol'; code: string; symbol: MorseSymbol } | null>(
    null,
  )

  useEffect(() => {
    const symbolFor = (code: string): MorseSymbol | null => {
      const { bindings } = optionsRef.current

      if (code === bindings.ditCode) {
        return '.'
      }

      if (code === bindings.dahCode) {
        return '-'
      }

      return null
    }

    const releaseHeld = () => {
      const held = heldRef.current

      heldRef.current = null

      if (!held) {
        return
      }

      if (held.kind === 'press') {
        optionsRef.current.onPressEnd(performance.now())
      } else {
        optionsRef.current.onSymbolUp(held.symbol, performance.now())
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const current = optionsRef.current

      if (isTypingTarget(event.target)) {
        return
      }

      if (current.capture) {
        // Rebinding: modifiers alone never name a key.
        if (isReserved(event) || ['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
          return
        }

        event.preventDefault()

        if (!event.repeat) {
          current.onCapture(current.capture, event.code)
        }

        return
      }

      if (isReserved(event) || event.repeat) {
        return
      }

      if (current.mode === 'single') {
        if (!isSpace(event)) {
          return
        }

        // Space would otherwise scroll the page while you are transmitting.
        event.preventDefault()

        if (heldRef.current) {
          return
        }

        heldRef.current = { kind: 'press' }
        current.onPressStart(performance.now())
        return
      }

      const symbol = symbolFor(event.code)

      if (symbol === null) {
        return
      }

      event.preventDefault()

      if (heldRef.current) {
        return
      }

      heldRef.current = { kind: 'symbol', code: event.code, symbol }
      current.onSymbolDown(symbol, performance.now())
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const held = heldRef.current

      if (!held || isTypingTarget(event.target)) {
        return
      }

      if (held.kind === 'press') {
        if (!isSpace(event)) {
          return
        }

        event.preventDefault()
      } else if (event.code !== held.code) {
        return
      } else {
        event.preventDefault()
      }

      releaseHeld()
    }

    // Losing focus mid-press must not leave a stuck symbol or a held tone.
    const handleWindowBlur = () => releaseHeld()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [])
}

