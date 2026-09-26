import { HUB_SHAPE } from '@/domain/morse/morseTree'
import styles from './MorseChart.module.css'

export interface SignalHubProps {
  readonly cx: number
  readonly cy: number
  readonly radius: number
  readonly isTransmitting: boolean
}

const CARDINAL_TICKS = [0, 90, 180, 270]
const MINOR_TICKS = [30, 60, 120, 150, 210, 240, 300, 330]

/**
 * Abstract signal origin standing where the reference chart draws its ship's helm:
 * a dashed ring that idles slowly and spins up while you transmit, cardinal ticks
 * reading outward, and a core that pulses on every press.
 */
export function SignalHub({ cx, cy, radius, isTransmitting }: SignalHubProps) {
  return (
    <g
      className={styles.hub}
      data-part="signal-hub"
      data-transmitting={isTransmitting}
      transform={`translate(${cx} ${cy})`}
    >
      <circle className={styles.hubGlow} r={radius * HUB_SHAPE.glow} />
      <g className={styles.hubSpin}>
        <circle className={styles.hubDashedRing} r={radius * HUB_SHAPE.dashedRing} />
      </g>
      <circle className={styles.hubRing} r={radius * HUB_SHAPE.ring} />
      {CARDINAL_TICKS.map((angle) => (
        <line
          key={`cardinal-${angle}`}
          className={styles.hubTickCardinal}
          x1={0}
          y1={-radius * HUB_SHAPE.tickCardinal.from}
          x2={0}
          y2={-radius * HUB_SHAPE.tickCardinal.to}
          transform={`rotate(${angle})`}
        />
      ))}
      {MINOR_TICKS.map((angle) => (
        <line
          key={`minor-${angle}`}
          className={styles.hubTick}
          x1={0}
          y1={-radius * HUB_SHAPE.tickMinor.from}
          x2={0}
          y2={-radius * HUB_SHAPE.tickMinor.to}
          transform={`rotate(${angle})`}
        />
      ))}
      <circle className={styles.hubCoreRing} r={radius * HUB_SHAPE.coreRing} />
      <circle className={styles.hubCore} r={radius * HUB_SHAPE.core} />
      <text
        className={styles.hubLabel}
        y={radius * HUB_SHAPE.label}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        Start
      </text>
    </g>
  )
}
