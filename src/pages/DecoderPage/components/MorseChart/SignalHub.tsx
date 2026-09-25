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
      <circle className={styles.hubGlow} r={radius * 1.45} />
      <g className={styles.hubSpin}>
        <circle className={styles.hubDashedRing} r={radius * 0.95} />
      </g>
      <circle className={styles.hubRing} r={radius * 0.72} />
      {CARDINAL_TICKS.map((angle) => (
        <line
          key={`cardinal-${angle}`}
          className={styles.hubTickCardinal}
          x1={0}
          y1={-radius * 1.02}
          x2={0}
          y2={-radius * 1.34}
          transform={`rotate(${angle})`}
        />
      ))}
      {MINOR_TICKS.map((angle) => (
        <line
          key={`minor-${angle}`}
          className={styles.hubTick}
          x1={0}
          y1={-radius * 1.06}
          x2={0}
          y2={-radius * 1.22}
          transform={`rotate(${angle})`}
        />
      ))}
      <circle className={styles.hubCoreRing} r={radius * 0.34} />
      <circle className={styles.hubCore} r={radius * 0.13} />
      <text className={styles.hubLabel} y={radius * 1.62} textAnchor="middle" dominantBaseline="middle">
        Start
      </text>
    </g>
  )
}
