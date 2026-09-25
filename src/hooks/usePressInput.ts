import { useCallback, useEffect, useRef } from 'react'

export interface PressInputOptions {
  readonly onPressStart: (atMs: number) => void
  readonly onPressEnd: (atMs: number) => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Turns space-bar presses into start/end events stamped with `performance.now()`,
 * so the decoder, the clock and the browser share one time base. Global key
 * handling lives here rather than in a component, which is also what keeps the
 * space bar from scrolling the page.
 */
export function usePressInput({ onPressStart, onPressEnd }: PressInputOptions): void {
  const isPressedRef = useRef(false)
  const callbacksRef = useRef({ onPressStart, onPressEnd })

  useEffect(() => {
    callbacksRef.current = { onPressStart, onPressEnd }
  }, [onPressStart, onPressEnd])

  const beginPress = useCallback(() => {
    if (isPressedRef.current) {
      return
    }

    isPressedRef.current = true
    callbacksRef.current.onPressStart(performance.now())
  }, [])

  const endPress = useCallback(() => {
    if (!isPressedRef.current) {
      return
    }

    isPressedRef.current = false
    callbacksRef.current.onPressEnd(performance.now())
  }, [])

  useEffect(() => {
    const isSpace = (event: KeyboardEvent) => event.code === 'Space' || event.key === ' '

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSpace(event) || isTypingTarget(event.target)) {
        return
      }

      // Space would otherwise scroll the page while you are transmitting.
      event.preventDefault()

      if (event.repeat) {
        return
      }

      beginPress()
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isSpace(event) || isTypingTarget(event.target)) {
        return
      }

      event.preventDefault()
      endPress()
    }

    // Losing focus mid-press must not leave a stuck symbol.
    const handleWindowBlur = () => endPress()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [beginPress, endPress])
}
