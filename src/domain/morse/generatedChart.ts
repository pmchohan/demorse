import {
  DIGIT_CODE_BY_CHARACTER,
  SPECIAL_CODE_BY_CHARACTER,
  type AlphabetSelection,
  type MorseSymbol,
} from './morseAlphabet'
import {
  pillCentre,
  type ChartPoint,
  type MorseTreeEdge,
  type MorseTreeNode,
} from './morseTree'

const DOT: MorseSymbol = '.'
const DASH: MorseSymbol = '-'

/** Layout of a generated chart: one column per leaf, one row per symbol depth. */
const COLUMN_SPAN = 116
const PAD_X = 96
const PAD_TOP = 84
const PAD_BOTTOM = 92
/** Extra room under a leaf for its label. */
const LABEL_DROP = 34

export interface ExtensionChart {
  readonly id: 'digits' | 'specials'
  readonly title: string
  readonly hint: string
  readonly viewBox: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
  readonly root: MorseTreeNode
  /** Root first, then breadth-first — the order the chart draws. */
  readonly nodes: readonly MorseTreeNode[]
  readonly edges: readonly MorseTreeEdge[]
  /** Nodes that carry a character, i.e. the leaves of this chart. */
  readonly characters: readonly MorseTreeNode[]
}

export interface ExtensionChartSpec {
  readonly id: ExtensionChart['id']
  readonly title: string
  readonly hint: string
  readonly codeByCharacter: Readonly<Record<string, string>>
}

/**
 * Charts to show alongside the hand-authored letter chart. Letters never appear
 * here — their geometry is drawn from the reference illustration and stays put.
 */
export function extensionChartSpecs(selection: AlphabetSelection): ExtensionChartSpec[] {
  const specs: ExtensionChartSpec[] = []

  if (selection.digits) {
    specs.push({
      id: 'digits',
      title: 'Numbers',
      hint: 'Five symbols, alternating from the count of dashes.',
      codeByCharacter: DIGIT_CODE_BY_CHARACTER,
    })
  }

  if (selection.specials) {
    specs.push({
      id: 'specials',
      title: 'Punctuation',
      hint: 'ITU marks — these run deeper than any letter.',
      codeByCharacter: SPECIAL_CODE_BY_CHARACTER,
    })
  }

  return specs
}

interface MutableExtensionNode {
  readonly path: string
  /** Assigned while the leaves are walked, before the node is frozen for drawing. */
  character: string | null
  readonly symbol: MorseSymbol | null
  readonly children: MutableExtensionNode[]
  point: ChartPoint
  labelPoint: ChartPoint
}

function createNode(path: string): MutableExtensionNode {
  return {
    path,
    character: null,
    symbol: path === '' ? null : path.endsWith(DASH) ? DASH : DOT,
    children: [],
    point: { x: 0, y: 0 },
    labelPoint: { x: 0, y: 0 },
  }
}

function sortedChildren(node: MutableExtensionNode): MutableExtensionNode[] {
  return [...node.children].sort((a, b) => (a.path < b.path ? -1 : 1))
}

/**
 * Builds a binary chart for one set of symbol sequences.
 *
 * The letter chart is hand-authored geometry and cannot absorb more labels without
 * fighting the reference illustration, so extras get their own generated chart:
 * every leaf is given one column left to right, and a branch sits above the middle
 * of the leaves below it, which keeps the fan-out even however deep the codes run.
 */
export function buildExtensionChart(spec: ExtensionChartSpec): ExtensionChart {
  const root = createNode('')
  const byPath = new Map<string, MutableExtensionNode>([['', root]])

  for (const [character, code] of Object.entries(spec.codeByCharacter)) {
    for (let depth = 1; depth <= code.length; depth += 1) {
      const path = code.slice(0, depth)

      if (!byPath.has(path)) {
        const node = createNode(path)

        byPath.set(path, node)

        const parent = byPath.get(path.slice(0, -1))

        if (!parent) {
          throw new Error(`The ${spec.title} chart lost the parent of ${path}.`)
        }

        parent.children.push(node)
      }

      if (depth === code.length) {
        const leaf = byPath.get(path)

        if (!leaf) {
          throw new Error(`The ${spec.title} chart lost the leaf for ${path}.`)
        }

        leaf.character = character
      }
    }
  }

  let leafIndex = 0
  let maxDepth = 0

  // Pass one: leaves claim columns left to right, branches take the middle of theirs.
  const place = (node: MutableExtensionNode, depth: number): number => {
    maxDepth = Math.max(maxDepth, depth)

    if (node.children.length === 0) {
      node.point = { x: PAD_X + leafIndex * COLUMN_SPAN, y: 0 }
      leafIndex += 1

      return node.point.x
    }

    const centres = sortedChildren(node).map((child) => place(child, depth + 1))
    const middle = centres.reduce((total, x) => total + x, 0) / centres.length

    node.point = { x: middle, y: 0 }

    return middle
  }

  place(root, 0)

  const leafCount = Math.max(1, leafIndex)
  const width = PAD_X * 2 + (leafCount - 1) * COLUMN_SPAN
  const rowSpan = (PAD_TOP + PAD_BOTTOM + maxDepth * COLUMN_SPAN) / Math.max(1, maxDepth)

  // Pass two: rows are only knowable once the deepest branch and the width are set.
  const paint = (node: MutableExtensionNode, depth: number): void => {
    node.point = { x: node.point.x, y: PAD_TOP + depth * rowSpan }
    node.labelPoint = { x: node.point.x, y: node.point.y + LABEL_DROP }

    for (const child of node.children) {
      paint(child, depth + 1)
    }
  }

  paint(root, 0)

  const height = PAD_TOP + maxDepth * rowSpan + PAD_BOTTOM
  const breadthFirst: MutableExtensionNode[] = []
  const queue: MutableExtensionNode[] = [root]

  while (queue.length > 0) {
    const node = queue.shift() as MutableExtensionNode

    breadthFirst.push(node)
    queue.push(...sortedChildren(node))
  }

  const freeze = (node: MutableExtensionNode): MorseTreeNode => ({
    path: node.path,
    character: node.character,
    symbol: node.symbol,
    point: node.point,
    labelPoint: node.labelPoint,
    isRinged: node.symbol === DOT,
    children: sortedChildren(node).map(freeze),
  })

  const frozenNodes = new Map(breadthFirst.map((node) => [node.path, freeze(node)]))
  const edges: MorseTreeEdge[] = []

  for (const node of breadthFirst) {
    if (node.symbol === null) {
      continue
    }

    const parent = frozenNodes.get(node.path.slice(0, -1))
    const to = frozenNodes.get(node.path)

    if (!parent || !to) {
      throw new Error(`The ${spec.title} chart has no parent edge for ${node.path}.`)
    }

    edges.push({
      path: node.path,
      symbol: node.symbol,
      route: [parent.point, to.point],
      markPoint: node.symbol === DASH ? pillCentre(parent.point, to.point) : null,
      parent,
      to,
    })
  }

  return {
    id: spec.id,
    title: spec.title,
    hint: spec.hint,
    viewBox: { x: 0, y: 0, width, height },
    root: frozenNodes.get('') as MorseTreeNode,
    nodes: breadthFirst.map((node) => frozenNodes.get(node.path) as MorseTreeNode),
    edges,
    characters: breadthFirst
      .filter((node) => node.character !== null)
      .map((node) => frozenNodes.get(node.path) as MorseTreeNode),
  }
}

export function buildExtensionCharts(selection: AlphabetSelection): ExtensionChart[] {
  return extensionChartSpecs(selection).map(buildExtensionChart)
}

