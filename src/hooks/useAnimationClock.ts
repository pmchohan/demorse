import { useEffect, useRef } from 'react'

type TickListener = (atMs: number) => void

/**
 * Calls `onTick` on every animation frame while `isRunning` is true, and stops
 * the loop (releasing the frame) as soon as it goes false.
 */
export function useAnimationClock(isRunning: boolean, onTick: TickListener): void {
  const listenerRef = useRef(onTick)

  useEffect(() => {
    listenerRef.current = onTick
  }, [onTick])

  useEffect(() => {
    if (!isRunning) {
      return
    }

    let frameId = requestAnimationFrame(function runFrame() {
      listenerRef.current(performance.now())
      frameId = requestAnimationFrame(runFrame)
    })

    return () => cancelAnimationFrame(frameId)
  }, [isRunning])
}
