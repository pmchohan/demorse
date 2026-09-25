import { describe, expect, it } from 'vitest'
import { MORSE_BY_CHARACTER } from './morseAlphabet'
import {
  CHART_START,
  CHART_VIEW_BOX,
  PILL_LENGTH,
  buildMorseTree,
  findMorseNode,
  isPathOnChain,
  letterForPath,
  morseTree,
  type ChartPoint,
} from './morseTree'

function edgeFor(path: string) {
  const edge = morseTree.edges.find((candidate) => candidate.path === path)

  if (!edge) {
    throw new Error(`No edge for ${path}`)
  }

  return edge
}

function expectClose(actual: ChartPoint | null, expected: ChartPoint): void {
  expect(actual).not.toBeNull()
  expect(actual?.x).toBeCloseTo(expected.x)
  expect(actual?.y).toBeCloseTo(expected.y)
}

function insideViewBox(point: ChartPoint): boolean {
  return (
    point.x >= CHART_VIEW_BOX.x &&
    point.x <= CHART_VIEW_BOX.x + CHART_VIEW_BOX.width &&
    point.y >= CHART_VIEW_BOX.y &&
    point.y <= CHART_VIEW_BOX.y + CHART_VIEW_BOX.height
  )
}

describe('morseTree', () => {
  it('builds one node per letter plus the start node', () => {
    expect(morseTree.nodes).toHaveLength(27)
    expect(morseTree.edges).toHaveLength(26)
    expect(morseTree.letters.map((node) => node.character).sort()).toEqual(
      Object.keys(MORSE_BY_CHARACTER).sort(),
    )
  })

  it('orders nodes from the start node outwards', () => {
    expect(morseTree.nodes[0].path).toBe('')
    expect(morseTree.nodes[0].symbol).toBeNull()
    expect(morseTree.nodes[1].path.length).toBe(1)
    expect(morseTree.nodes[2].path.length).toBe(1)
  })

  it('places the letters where the reference chart places them', () => {
    expect(CHART_START).toEqual({ x: 760, y: 216 })
    expect(findMorseNode('.')).toMatchObject({ character: 'E', point: { x: 500, y: 216 } })
    expect(findMorseNode('....')).toMatchObject({ character: 'H', point: { x: 89, y: 216 } })
    expect(findMorseNode('---')).toMatchObject({ character: 'O', point: { x: 1440, y: 216 } })
    expect(findMorseNode('-...')).toMatchObject({ character: 'B', point: { x: 1136, y: 792 } })
    expect(findMorseNode('.---')).toMatchObject({ character: 'J', point: { x: 500, y: 803 } })
    expect(findMorseNode('..-.')).toMatchObject({ character: 'F', point: { x: 355, y: 430 } })
  })

  it('labels every letter beside its node', () => {
    expect(findMorseNode('...')?.labelPoint).toEqual({ x: 200, y: 170 })
    expect(findMorseNode('...-')?.labelPoint).toEqual({ x: 245, y: 326 })
    expect(findMorseNode('-.')?.labelPoint).toEqual({ x: 1092, y: 525 })
    expect(findMorseNode('-..-')?.labelPoint).toEqual({ x: 1222, y: 727 })
  })

  it('keeps every node and label inside the chart view box', () => {
    for (const node of morseTree.nodes) {
      expect(insideViewBox(node.point), node.path).toBe(true)
      expect(insideViewBox(node.labelPoint), node.path).toBe(true)
    }
  })

  it('marks dot children with a circle and dash children with a pill', () => {
    expect(findMorseNode('.')?.isRinged).toBe(true)
    expect(findMorseNode('...')?.isRinged).toBe(true)
    expect(findMorseNode('.-')?.isRinged).toBe(false)
    expect(findMorseNode('-')?.isRinged).toBe(false)

    for (const edge of morseTree.edges) {
      expect(edge.markPoint === null, edge.path).toBe(edge.symbol === '.')
    }
  })

  it('sits each pill on the last stretch of its edge, flush with the child', () => {
    // Values read off the reference chart: the dash pills sit here.
    expectClose(edgeFor('-').markPoint, { x: 1043, y: 216 })
    expectClose(edgeFor('--').markPoint, { x: 1225, y: 216 })
    expectClose(edgeFor('.-').markPoint, { x: 500, y: 326 })
    expectClose(edgeFor('..-').markPoint, { x: 308, y: 326 })
    expectClose(edgeFor('...-').markPoint, { x: 200, y: 326 })

    for (const edge of morseTree.edges) {
      if (!edge.markPoint) {
        continue
      }

      const reach = Math.hypot(
        edge.to.point.x - edge.markPoint.x,
        edge.to.point.y - edge.markPoint.y,
      )

      expect(reach, edge.path).toBeCloseTo(PILL_LENGTH / 2)
    }
  })

  it('runs every edge from the parent node to the child node', () => {
    for (const edge of morseTree.edges) {
      expect(edge.route[0], edge.path).toEqual(edge.parent.point)
      expect(edge.route[edge.route.length - 1], edge.path).toEqual(edge.to.point)
    }

    // Deeper branches turn once, the way the reference chart routes them.
    expect(edgeFor('-.').route).toEqual([
      { x: 1075, y: 216 },
      { x: 1136, y: 216 },
      { x: 1136, y: 524 },
    ])
    expect(edgeFor('.-.').route).toEqual([
      { x: 500, y: 358 },
      { x: 500, y: 525 },
      { x: 444, y: 525 },
    ])
    expect(edgeFor('-').route).toEqual([
      { x: 760, y: 216 },
      { x: 1075, y: 216 },
    ])
  })

  it('reports unknown sequences instead of inventing a node', () => {
    expect(findMorseNode('..--')).toBeUndefined()
    expect(letterForPath('..--')).toBeUndefined()
    expect(letterForPath('...')).toBe('S')
  })

  it('treats the start node as always on a chain', () => {
    expect(isPathOnChain('', '.-')).toBe(true)
    expect(isPathOnChain('.', '.-')).toBe(true)
    expect(isPathOnChain('-', '.-')).toBe(false)
    expect(isPathOnChain('.-', '.-')).toBe(true)
    expect(isPathOnChain('..', '.-')).toBe(false)
  })

  it('builds an independent tree on each call', () => {
    const first = buildMorseTree()
    const second = buildMorseTree()

    expect(first.nodes).not.toBe(second.nodes)
    expect(first.nodes.map((node) => node.path)).toEqual(second.nodes.map((node) => node.path))
  })
})
