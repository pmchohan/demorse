import { describe, expect, it } from 'vitest'
import {
  DIGIT_CODE_BY_CHARACTER,
  FULL_ALPHABET,
  LETTERS_ONLY,
  SPECIAL_CODE_BY_CHARACTER,
  type AlphabetSelection,
} from './morseAlphabet'
import {
  buildExtensionChart,
  buildExtensionCharts,
  extensionChartSpecs,
  type ExtensionChart,
} from './generatedChart'

/* Layout constants mirrored from generatedChart.ts — geometry changes must
   update the module and these expectations together. */
const COLUMN_SPAN = 116
const PAD_X = 96
const PAD_TOP = 84
const PAD_BOTTOM = 92
const LABEL_DROP = 34

function chartFor(id: 'digits' | 'specials', selection: AlphabetSelection): ExtensionChart {
  const chart = buildExtensionCharts(selection).find((candidate) => candidate.id === id)

  if (!chart) {
    throw new Error(`The ${id} chart was not built for ${JSON.stringify(selection)}.`)
  }

  return chart
}

describe('generatedChart', () => {
  it('follows the alphabet selection, digits first', () => {
    expect(extensionChartSpecs(LETTERS_ONLY)).toHaveLength(0)
    expect(buildExtensionCharts(LETTERS_ONLY)).toHaveLength(0)

    expect(extensionChartSpecs({ digits: true, specials: false }).map((spec) => spec.id)).toEqual(['digits'])
    expect(extensionChartSpecs({ digits: false, specials: true }).map((spec) => spec.id)).toEqual(['specials'])
    expect(extensionChartSpecs(FULL_ALPHABET).map((spec) => spec.id)).toEqual(['digits', 'specials'])
  })

  it('gives every digit its own column and one row per symbol depth', () => {
    const chart = chartFor('digits', { digits: true, specials: false })
    const leaves = chart.characters

    expect(leaves).toHaveLength(10)
    expect(leaves.every((leaf) => leaf.path.length === 5)).toBe(true)

    // Leaves sit on the deepest row, one column apart, left to right.
    const columns = [...leaves].map((leaf) => leaf.point.x).sort((a, b) => a - b)

    expect(new Set(columns).size).toBe(10)
    expect(columns[0]).toBe(PAD_X)
    expect(columns[columns.length - 1]).toBe(PAD_X + 9 * COLUMN_SPAN)
    expect(columns.slice(1).map((x, index) => x - columns[index])).toEqual(
      Array.from({ length: 9 }, () => COLUMN_SPAN),
    )

    const leafRowY = PAD_TOP + 5 * ((PAD_TOP + PAD_BOTTOM + 5 * COLUMN_SPAN) / 5)

    expect(leaves.every((leaf) => leaf.point.y === leafRowY)).toBe(true)
    expect(leaves.every((leaf) => leaf.labelPoint.y === leafRowY + LABEL_DROP)).toBe(true)
  })

  it('centers each branch over the leaves it leads to', () => {
    const chart = chartFor('digits', { digits: true, specials: false })
    const byPath = new Map(chart.nodes.map((node) => [node.path, node]))

    for (const node of chart.nodes) {
      if (node.children.length === 0) {
        continue
      }

      const expected =
        node.children.reduce((total, child) => total + child.point.x, 0) / node.children.length

      expect(node.point.x).toBe(expected)
      // Deeper rows sit further down, so no edge can run flat.
      expect(node.children.every((child) => child.point.y > node.point.y)).toBe(true)
      expect(byPath.get(node.path)).toBeDefined()
    }
  })

  it('wires exactly one edge into every node but the start', () => {
    const chart = chartFor('digits', { digits: true, specials: false })

    // A full five-symbol fan: 1 start + 2 + 4 + 6 + 8 prefixes + 10 leaves.
    expect(chart.nodes).toHaveLength(31)
    expect(chart.edges).toHaveLength(30)
    expect(chart.nodes[0].path).toBe('')

    const order = new Map(chart.nodes.map((node, index) => [node.path, index]))

    for (const edge of chart.edges) {
      expect(edge.to.path).toBe(edge.path)
      expect(edge.parent.path).toBe(edge.path.slice(0, -1))
      expect(edge.symbol).toBe(edge.path.slice(-1))
      expect(edge.route).toEqual([edge.parent.point, edge.to.point])
      expect(order.get(edge.parent.path)).toBeLessThan(order.get(edge.path) as number)
    }
  })

  it('marks dash edges with a pill and dot children as rings', () => {
    const chart = chartFor('digits', { digits: true, specials: false })

    for (const edge of chart.edges) {
      expect(edge.markPoint === null).toBe(edge.symbol !== '-')
    }

    for (const node of chart.nodes) {
      if (node.symbol !== null) {
        expect(node.isRinged).toBe(node.symbol === '.')
      }
    }
  })

  it('carries exactly the enabled codes, never the letters', () => {
    const digits = chartFor('digits', FULL_ALPHABET)
    const specials = chartFor('specials', FULL_ALPHABET)

    expect([...digits.characters].map((leaf) => leaf.character).sort()).toEqual(
      Object.keys(DIGIT_CODE_BY_CHARACTER).sort(),
    )
    expect([...specials.characters].map((leaf) => leaf.character).sort()).toEqual(
      Object.keys(SPECIAL_CODE_BY_CHARACTER).sort(),
    )

    // Every leaf resolves back to its own code, and no letter ever rides along.
    for (const leaf of digits.characters) {
      expect(leaf.character !== null && DIGIT_CODE_BY_CHARACTER[leaf.character]).toBe(leaf.path)
    }

    for (const leaf of specials.characters) {
      expect(leaf.character !== null && SPECIAL_CODE_BY_CHARACTER[leaf.character]).toBe(leaf.path)
    }

    for (const chart of [digits, specials]) {
      for (const leaf of chart.characters) {
        expect(leaf.character).not.toMatch(/^[A-Z]$/)
      }
    }
  })

  it('sizes each viewBox to its fan-out and depth', () => {
    const digits = chartFor('digits', FULL_ALPHABET)
    const specials = chartFor('specials', FULL_ALPHABET)

    // Digits: ten physical leaves, five symbols deep.
    expect(digits.viewBox).toEqual({
      x: 0,
      y: 0,
      width: PAD_X * 2 + 9 * COLUMN_SPAN,
      height: PAD_TOP + 5 * ((PAD_TOP + PAD_BOTTOM + 5 * COLUMN_SPAN) / 5) + PAD_BOTTOM,
    })

    // Punctuation: eighteen characters, but the "(" leaf is internal on the way to
    // ")", so sixteen columns carry them; the $ mark runs seven symbols deep.
    expect(specials.viewBox).toEqual({
      x: 0,
      y: 0,
      width: PAD_X * 2 + 15 * COLUMN_SPAN,
      height: PAD_TOP + 7 * ((PAD_TOP + PAD_BOTTOM + 7 * COLUMN_SPAN) / 7) + PAD_BOTTOM,
    })

    const leafDepths = [...specials.characters].map((leaf) => leaf.path.length)

    expect(Math.max(...leafDepths)).toBe(7)
    expect(Math.min(...leafDepths)).toBe(5)
  })

  it('never lets a sequence resolve on two extension charts', () => {
    const digits = chartFor('digits', FULL_ALPHABET)
    const specials = chartFor('specials', FULL_ALPHABET)
    const digitPaths = new Set(digits.characters.map((leaf) => leaf.path))

    for (const leaf of specials.characters) {
      expect(digitPaths.has(leaf.path)).toBe(false)
    }
  })

  it('builds a single chart straight from a spec', () => {
    const [spec] = extensionChartSpecs({ digits: false, specials: true })
    const chart = buildExtensionChart(spec)

    expect(chart.id).toBe('specials')
    expect(chart.title).toBe(spec.title)
    expect(chart.hint).toBe(spec.hint)
    expect(chart.characters).toHaveLength(18)
  })
})
