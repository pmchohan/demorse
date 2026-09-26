import { MorseMark } from '@/components/atoms/MorseMark/MorseMark'
import { morseToSymbols } from '@/domain/morse/morseAlphabet'
import type { DecodedLetter } from '@/domain/morse/decoderReducer'
import {
  CHART_START,
  CHART_VIEW_BOX,
  HUB_RADIUS,
  NODE_RADIUS,
  PILL_LENGTH,
  PILL_THICKNESS,
  isPathOnChain,
  morseTree,
  type ChartPoint,
  type MorseTreeEdge,
  type MorseTreeNode,
} from '@/domain/morse/morseTree'
import { SignalHub } from './SignalHub'
import styles from './MorseChart.module.css'

export type ChartChainState = 'idle' | 'active' | 'committed'
export type ChartNodeState = ChartChainState | 'current'

export interface MorseChartProps {
  readonly activePath: string
  readonly pendingCharacter: string | null
  readonly lastLetter: DecodedLetter | null
  readonly commitCount: number
  /** A press is being held right now: new input has started. */
  readonly isPressing: boolean
  readonly isTransmitting: boolean
}

function pointsAttr(route: readonly ChartPoint[]): string {
  return route.map((point) => `${point.x},${point.y}`).join(' ')
}

/** Direction of the last segment, so a pill lies along its edge. */
function angleOf(route: readonly ChartPoint[]): number {
  const to = route[route.length - 1]
  const from = route[route.length - 2]

  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
}

function ChartEdge({ edge, state }: { edge: MorseTreeEdge; state: ChartChainState }) {
  return (
    <g
      className={styles.edge}
      data-part="edge"
      data-path={edge.path}
      data-symbol={edge.symbol}
      data-state={state}
    >
      <polyline className={styles.edgeLine} points={pointsAttr(edge.route)} />
      {edge.markPoint ? (
        <rect
          className={styles.edgePill}
          x={edge.markPoint.x - PILL_LENGTH / 2}
          y={edge.markPoint.y - PILL_THICKNESS / 2}
          width={PILL_LENGTH}
          height={PILL_THICKNESS}
          rx={PILL_THICKNESS / 2}
          transform={`rotate(${angleOf(edge.route)} ${edge.markPoint.x} ${edge.markPoint.y})`}
        />
      ) : null}
    </g>
  )
}

function ChartNode({ node, state }: { node: MorseTreeNode; state: ChartNodeState }) {
  return (
    <g
      className={styles.node}
      data-part="node"
      data-path={node.path}
      data-symbol={node.symbol}
      data-ringed={node.isRinged}
      data-state={state}
      transform={`translate(${node.point.x} ${node.point.y})`}
    >
      <circle className={styles.nodeHalo} r={NODE_RADIUS * 2.1} />
      <circle className={styles.nodeDisc} r={NODE_RADIUS} />
    </g>
  )
}

/**
 * The decoding chart, drawn the way the reference chart draws it: a spine through
 * the start hub, dot children as circles on it, dash children as pills hanging off
 * it. The whole chain from the start to the letter stays lit, not just the last mark.
 */
export function MorseChart({
  activePath,
  pendingCharacter,
  lastLetter,
  commitCount,
  isPressing,
  isTransmitting,
}: MorseChartProps) {
  const hasActivePath = activePath !== ''
  const committedPath = lastLetter?.path ?? ''

  /**
   * New input hands the highlight over. It starts with the press itself — a symbol is
   * only classified on release — so the previous letter's chain goes out the moment
   * the next press begins or a symbol is already in flight, rather than staying lit
   * beside the path being typed.
   */
  const hasHandedOver = hasActivePath || isPressing

  const chainStateOf = (path: string): ChartChainState => {
    if (hasHandedOver) {
      return isPathOnChain(path, activePath) ? 'active' : 'idle'
    }

    return committedPath !== '' && isPathOnChain(path, committedPath) ? 'committed' : 'idle'
  }

  const nodeStateOf = (node: MorseTreeNode): ChartNodeState =>
    hasActivePath && node.path === activePath ? 'current' : chainStateOf(node.path)

  const summary = hasActivePath
    ? `Transmitting ${activePath} — ${pendingCharacter ?? 'no letter on that branch'}.`
    : lastLetter
      ? `Idle at start. Last letter ${lastLetter.character}, ${lastLetter.morse}.`
      : 'Idle at start. Tap the space bar to transmit the first symbol.'

  return (
    <figure className={styles.root}>
      <div className={styles.viewport}>
        <svg
          className={styles.chart}
          viewBox={`${CHART_VIEW_BOX.x} ${CHART_VIEW_BOX.y} ${CHART_VIEW_BOX.width} ${CHART_VIEW_BOX.height}`}
          role="img"
          aria-label={summary}
        >
          <title>Morse decoding chart</title>
          <desc>{summary}</desc>

          <g>
            {morseTree.edges.map((edge) => (
              <ChartEdge key={edge.path} edge={edge} state={chainStateOf(edge.path)} />
            ))}
          </g>

          <g>
            {morseTree.letters.map((node) => (
              <ChartNode
                // Re-keying on commit restarts the pulse for the fresh letter.
                key={node.path === committedPath ? `${node.path}:${commitCount}` : node.path}
                node={node}
                state={nodeStateOf(node)}
              />
            ))}
          </g>

          <g>
            {morseTree.letters.map((node) => (
              <text
                key={node.path}
                className={styles.label}
                data-part="label"
                data-path={node.path}
                data-state={nodeStateOf(node)}
                x={node.labelPoint.x}
                y={node.labelPoint.y}
                dominantBaseline="central"
                textAnchor="middle"
              >
                {node.character}
              </text>
            ))}
          </g>

          <SignalHub
            cx={CHART_START.x}
            cy={CHART_START.y}
            radius={HUB_RADIUS}
            isTransmitting={isTransmitting}
          />
        </svg>
      </div>

      <figcaption className={styles.caption}>
        <div className={styles.readout}>
          <span className={styles.readoutLabel}>Path</span>
          <span className={styles.marks}>
            {hasActivePath ? (
              morseToSymbols(activePath).map((symbol, index) => (
                <MorseMark key={`${symbol}-${index}`} symbol={symbol} size="sm" />
              ))
            ) : (
              <span className={styles.emptyPath}>—</span>
            )}
          </span>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
          <span className={styles.pending} data-unresolved={hasActivePath && !pendingCharacter}>
            {hasActivePath ? (pendingCharacter ?? 'no letter') : '—'}
          </span>
        </div>

        <ul className={styles.legend}>
          <li className={styles.legendItem}>
            <MorseMark symbol="." size="sm" />
            dot — circle on the spine
          </li>
          <li className={styles.legendItem}>
            <MorseMark symbol="-" size="sm" />
            dash — pill on the branch
          </li>
        </ul>
      </figcaption>
    </figure>
  )
}
