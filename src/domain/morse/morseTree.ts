import { MORSE_BY_CHARACTER, type MorseSymbol } from './morseAlphabet'

export interface ChartPoint {
  readonly x: number
  readonly y: number
}

/** Where the chart's start hub sits — the spine passes through it. */
export const CHART_START: ChartPoint = { x: 760, y: 216 }

/** Canvas of the reference chart, in its own pixel space. */
export const CHART_WIDTH = 1520
export const CHART_HEIGHT = 860

/** Visible window: trims the reference chart's title band and margins. */
export const CHART_VIEW_BOX = { x: 0, y: 60, width: CHART_WIDTH, height: 800 } as const

export const NODE_RADIUS = 12

/** Dash edges are drawn as a rounded mark sitting on the end of the edge. */
export const PILL_LENGTH = 64
export const PILL_THICKNESS = 22

export interface MorseTreeNode {
  /** Dot/dash sequence from the start, e.g. `'-.'` for N. The start node is `''`. */
  readonly path: string
  readonly character: string | null
  /** Symbol of the edge that reaches this node; null for the start node. */
  readonly symbol: MorseSymbol | null
  readonly point: ChartPoint
  /** Centre of the letter label, placed where the reference chart places it. */
  readonly labelPoint: ChartPoint
  /** Dot children are drawn as a filled circle; dash children are marked by their pill. */
  readonly isRinged: boolean
  readonly children: readonly MorseTreeNode[]
}

export interface MorseTreeEdge {
  /** Equals the child node path. */
  readonly path: string
  readonly symbol: MorseSymbol
  /** Polyline from the parent node to the child: one segment, or two for a dogleg. */
  readonly route: readonly ChartPoint[]
  /** Centre of the dash pill; null on dot edges, which end in a ringed node. */
  readonly markPoint: ChartPoint | null
  readonly parent: MorseTreeNode
  readonly to: MorseTreeNode
}

export interface MorseTree {
  readonly root: MorseTreeNode
  /** Start node first, then breadth-first — the order the chart draws. */
  readonly nodes: readonly MorseTreeNode[]
  readonly edges: readonly MorseTreeEdge[]
  readonly letters: readonly MorseTreeNode[]
}

interface LetterLayout {
  readonly character: string
  readonly point: ChartPoint
  /** Corner the edge turns at, for edges that do not run straight to the child. */
  readonly via?: ChartPoint
  readonly label: ChartPoint
}

interface MutableNode {
  readonly path: string
  readonly character: string | null
  readonly symbol: MorseSymbol | null
  readonly point: ChartPoint
  readonly labelPoint: ChartPoint
  readonly children: MutableNode[]
}

const DOT: MorseSymbol = '.'
const DASH: MorseSymbol = '-'

/**
 * Hand-authored geometry, read off `morse-code-decoder-chart-template`:
 * a horizontal spine runs through the start hub, dot children sit on it as filled
 * circles, dash children hang off it as pills, and deeper branches turn once.
 */
const LETTER_LAYOUT: readonly LetterLayout[] = [
  { character: 'E', point: { x: 500, y: 216 }, label: { x: 500, y: 170 } },
  { character: 'T', point: { x: 1075, y: 216 }, label: { x: 1044, y: 170 } },
  { character: 'I', point: { x: 308, y: 216 }, label: { x: 308, y: 170 } },
  { character: 'M', point: { x: 1257, y: 216 }, label: { x: 1226, y: 170 } },
  { character: 'S', point: { x: 200, y: 216 }, label: { x: 200, y: 170 } },
  { character: 'O', point: { x: 1440, y: 216 }, label: { x: 1410, y: 170 } },
  { character: 'H', point: { x: 89, y: 216 }, label: { x: 89, y: 170 } },
  { character: 'A', point: { x: 500, y: 358 }, label: { x: 545, y: 326 } },
  { character: 'U', point: { x: 308, y: 358 }, label: { x: 355, y: 326 } },
  { character: 'V', point: { x: 200, y: 358 }, label: { x: 245, y: 326 } },
  { character: 'N', point: { x: 1136, y: 524 }, via: { x: 1136, y: 216 }, label: { x: 1092, y: 525 } },
  { character: 'G', point: { x: 1320, y: 326 }, via: { x: 1320, y: 216 }, label: { x: 1278, y: 326 } },
  { character: 'W', point: { x: 500, y: 639 }, label: { x: 545, y: 608 } },
  { character: 'K', point: { x: 1257, y: 524 }, label: { x: 1226, y: 571 } },
  { character: 'J', point: { x: 500, y: 803 }, label: { x: 545, y: 771 } },
  { character: 'D', point: { x: 1136, y: 688 }, label: { x: 1093, y: 690 } },
  { character: 'Q', point: { x: 1440, y: 326 }, label: { x: 1408, y: 281 } },
  { character: 'Y', point: { x: 1440, y: 524 }, label: { x: 1408, y: 571 } },
  { character: 'Z', point: { x: 1320, y: 434 }, label: { x: 1361, y: 433 } },
  { character: 'R', point: { x: 444, y: 525 }, via: { x: 500, y: 525 }, label: { x: 443, y: 573 } },
  { character: 'C', point: { x: 1320, y: 628 }, via: { x: 1320, y: 524 }, label: { x: 1320, y: 669 } },
  { character: 'L', point: { x: 358, y: 525 }, label: { x: 358, y: 573 } },
  { character: 'F', point: { x: 355, y: 430 }, via: { x: 308, y: 430 }, label: { x: 399, y: 433 } },
  { character: 'B', point: { x: 1136, y: 792 }, label: { x: 1092, y: 792 } },
  { character: 'P', point: { x: 358, y: 688 }, via: { x: 500, y: 688 }, label: { x: 359, y: 731 } },
  { character: 'X', point: { x: 1257, y: 688 }, label: { x: 1222, y: 727 } },
]

function morseFor(character: string): string {
  const morse = MORSE_BY_CHARACTER[character]

  if (!morse) {
    throw new Error(`No Morse sequence for ${character} in the chart layout.`)
  }

  return morse
}

function createStartNode(): MutableNode {
  return {
    path: '',
    character: null,
    symbol: null,
    point: CHART_START,
    labelPoint: CHART_START,
    children: [],
  }
}

/** Places a dash pill on the last stretch of an edge, flush with the child node. */
function pillCentre(from: ChartPoint, to: ChartPoint): ChartPoint {
  const span = Math.hypot(to.x - from.x, to.y - from.y)
  const back = (PILL_LENGTH / 2) / span

  return { x: to.x - (to.x - from.x) * back, y: to.y - (to.y - from.y) * back }
}

function convert(node: MutableNode): MorseTreeNode {
  const ordered = [...node.children].sort((a, b) => (a.path < b.path ? -1 : 1))

  return {
    path: node.path,
    character: node.character,
    symbol: node.symbol,
    point: node.point,
    labelPoint: node.labelPoint,
    isRinged: node.symbol === DOT,
    children: ordered.map(convert),
  }
}

/** One edge per letter, in the same start-outwards order the nodes are listed in. */
function collectEdges(
  nodes: readonly MorseTreeNode[],
  viaByPath: ReadonlyMap<string, ChartPoint>,
): MorseTreeEdge[] {
  const byPath = new Map(nodes.map((node) => [node.path, node]))
  const edges: MorseTreeEdge[] = []

  for (const node of nodes) {
    // Only the start node has no symbol, and it is never a child.
    if (node.symbol === null) {
      continue
    }

    const parent = byPath.get(node.path.slice(0, -1))

    if (!parent) {
      throw new Error(`The chart layout has no parent node for ${node.path}.`)
    }

    const via = viaByPath.get(node.path)
    const lastFrom = via ?? parent.point

    edges.push({
      path: node.path,
      symbol: node.symbol,
      route: via ? [parent.point, via, node.point] : [parent.point, node.point],
      markPoint: node.symbol === DASH ? pillCentre(lastFrom, node.point) : null,
      parent,
      to: node,
    })
  }

  return edges
}

export function buildMorseTree(): MorseTree {
  const root = createStartNode()
  const byPath = new Map<string, MutableNode>([['', root]])
  const viaByPath = new Map<string, ChartPoint>()
  const ordered = [...LETTER_LAYOUT].sort(
    (a, b) => morseFor(a.character).length - morseFor(b.character).length,
  )

  for (const letter of ordered) {
    const morse = morseFor(letter.character)
    const parent = byPath.get(morse.slice(0, -1))

    if (!parent) {
      throw new Error(`The chart layout is missing the parent of ${letter.character} (${morse}).`)
    }

    const node: MutableNode = {
      path: morse,
      character: letter.character,
      symbol: morse.endsWith(DASH) ? DASH : DOT,
      point: letter.point,
      labelPoint: letter.label,
      children: [],
    }

    if (letter.via) {
      viaByPath.set(morse, letter.via)
    }

    parent.children.push(node)
    byPath.set(morse, node)
  }

  const shape = convert(root)
  const nodes = collectNodes(shape)

  return {
    root: shape,
    nodes,
    edges: collectEdges(nodes, viaByPath),
    letters: nodes.filter((node) => node.character !== null),
  }
}

/** Start node first, then breadth-first — the order the chart draws. */
function collectNodes(root: MorseTreeNode): MorseTreeNode[] {
  const nodes: MorseTreeNode[] = []
  const queue: MorseTreeNode[] = [root]

  while (queue.length > 0) {
    const node = queue.shift() as MorseTreeNode
    nodes.push(node)
    queue.push(...node.children)
  }

  return nodes
}

export const morseTree: MorseTree = buildMorseTree()

export function findMorseNode(path: string, tree: MorseTree = morseTree): MorseTreeNode | undefined {
  return tree.nodes.find((node) => node.path === path)
}

/** True when `path` is the start node, the chain's own path, or an ancestor of it. */
export function isPathOnChain(path: string, chain: string): boolean {
  return path === '' || chain.startsWith(path)
}

export function letterForPath(path: string, tree: MorseTree = morseTree): string | undefined {
  return findMorseNode(path, tree)?.character ?? undefined
}
