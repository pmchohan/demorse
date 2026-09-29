import { useMemo } from 'react'
import { MorseMark } from '@/components/atoms/MorseMark/MorseMark'
import {
  LETTERS_ONLY,
  morseToSymbols,
  type AlphabetSelection,
} from '@/domain/morse/morseAlphabet'
import type { DecodedLetter } from '@/domain/morse/decoderReducer'
import { buildExtensionCharts, type ExtensionChart } from '@/domain/morse/generatedChart'
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
  /**
   * Which character sets are switched on. Letters always draw from the hand-authored
   * geometry; anything extra is generated into its own chart beneath it.
   */
  readonly selection?: AlphabetSelection
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

/** What the highlight is doing: chasing live input, resting on the last commit, or off. */
interface ChainContext {
  readonly activePath: string
  readonly committedPath: string
  readonly hasHandedOver: boolean
}

/**
 * New input hands the highlight over. It starts with the press itself — a symbol is
 * only classified on release — so the previous character's chain goes out the moment
 * the next press begins or a symbol is already in flight, rather than staying lit
 * beside the path being typed.
 */
function chainStateOf({ activePath, committedPath, hasHandedOver }: ChainContext) {
  return (path: string): ChartChainState => {
    if (hasHandedOver) {
      return isPathOnChain(path, activePath) ? 'active' : 'idle'
    }

    return committedPath !== '' && isPathOnChain(path, committedPath) ? 'committed' : 'idle'
  }
}

function nodeStateOf(context: ChainContext, node: MorseTreeNode): ChartNodeState {
  return context.activePath !== '' && node.path === context.activePath
    ? 'current'
    : chainStateOf(context)(node.path)
}

interface ExtensionFigureProps {
  readonly chart: ExtensionChart
  readonly context: ChainContext
  readonly commitCount: number
}

/**
 * A generated chart for the sets the reference illustration never drew — digits and
 * punctuation. It shares the marks, the lit-chain rule and the pulse of the letter
 * chart, but lays its own leaves out in one column each because it has no reference
 * image to stay faithful to.
 */
function ExtensionFigure({ chart, context, commitCount }: ExtensionFigureProps) {
  const lit = chainStateOf(context)
  const summary = `${chart.title} chart. ${chart.hint}`
  const litPath = context.activePath !== '' ? context.activePath : context.committedPath

  return (
    <figure className={styles.extension}>
      <figcaption className={styles.extensionHead}>
        <span className={styles.extensionTitle}>{chart.title}</span>
        <span className={styles.extensionHint}>{chart.hint}</span>
      </figcaption>

      <div className={styles.viewport}>
        <svg
          className={styles.extensionChart}
          viewBox={`${chart.viewBox.x} ${chart.viewBox.y} ${chart.viewBox.width} ${chart.viewBox.height}`}
          role="img"
          aria-label={summary}
        >
          <title>{chart.title} chart</title>
          <desc>{summary}</desc>

          <g>
            {chart.edges.map((edge) => (
              <ChartEdge key={edge.path} edge={edge} state={lit(edge.path)} />
            ))}
          </g>

          <g>
            {chart.nodes.map((node) => (
              <ChartNode
                key={node.path === litPath ? `${node.path}:${commitCount}` : node.path}
                node={node}
                state={nodeStateOf(context, node)}
              />
            ))}
          </g>

          <g>
            {chart.characters.map((node) => (
              <text
                key={node.path}
                className={styles.label}
                data-part="label"
                data-path={node.path}
                data-state={nodeStateOf(context, node)}
                x={node.labelPoint.x}
                y={node.labelPoint.y}
                dominantBaseline="central"
                textAnchor="middle"
              >
                {node.character}
              </text>
            ))}
          </g>
        </svg>
      </div>
    </figure>
  )
}

/**
 * The decoding chart, drawn the way the reference chart draws it: a spine through
 * the start hub, dot children as circles on it, dash children as pills hanging off
 * it. The whole chain from the start to the letter stays lit, not just the last mark.
 *
 * Digits and punctuation are not on that illustration, so when they are switched on
 * they arrive as extra charts underneath rather than crowding the letters out of it.
 */
export function MorseChart({
  activePath,
  pendingCharacter,
  lastLetter,
  commitCount,
  isPressing,
  isTransmitting,
  selection = LETTERS_ONLY,
}: MorseChartProps) {
  const hasActivePath = activePath !== ''
  const committedPath = lastLetter?.path ?? ''
  const hasHandedOver = hasActivePath || isPressing
  const context: ChainContext = { activePath, committedPath, hasHandedOver }
  const chainState = chainStateOf(context)
  const nodeState = (node: MorseTreeNode): ChartNodeState => nodeStateOf(context, node)
  const extensions = useMemo(() => buildExtensionCharts(selection), [selection])

  const summary = hasActivePath
    ? `Transmitting ${activePath} — ${pendingCharacter ?? 'no letter on that branch'}.`
    : lastLetter
      ? `Idle at start. Last letter ${lastLetter.character}, ${lastLetter.morse}.`
      : 'Idle at start. Tap the space bar to transmit the first symbol.'

  return (
    <>
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
                <ChartEdge key={edge.path} edge={edge} state={chainState(edge.path)} />
              ))}
            </g>

            <g>
              {morseTree.letters.map((node) => (
                <ChartNode
                  // Re-keying on commit restarts the pulse for the fresh letter.
                  key={node.path === committedPath ? `${node.path}:${commitCount}` : node.path}
                  node={node}
                  state={nodeState(node)}
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
                  data-state={nodeState(node)}
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

      {extensions.map((chart) => (
        <ExtensionFigure key={chart.id} chart={chart} context={context} commitCount={commitCount} />
      ))}
    </>
  )
}
