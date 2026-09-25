import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MorseChart } from './MorseChart'

const idleProps = {
  activePath: '',
  pendingCharacter: null,
  lastLetter: null,
  commitCount: 0,
  isTransmitting: false,
}

const committedS = { character: 'S', morse: '...', path: '...' }

function pathsOf(container: HTMLElement, part: string, state: string): string[] {
  return [...container.querySelectorAll(`[data-part="${part}"][data-state="${state}"]`)].map(
    (element) => element.getAttribute('data-path') as string,
  )
}

describe('MorseChart', () => {
  it('draws one node, edge and label per letter, plus the start hub', () => {
    const { container } = render(<MorseChart {...idleProps} />)

    expect(container.querySelectorAll('[data-part="node"]')).toHaveLength(26)
    expect(container.querySelectorAll('[data-part="edge"]')).toHaveLength(26)
    expect(container.querySelectorAll('[data-part="label"]')).toHaveLength(26)
    expect(container.querySelector('[data-part="signal-hub"]')).not.toBeNull()
    expect(screen.getByRole('img', { name: /idle at start/i })).toBeInTheDocument()
  })

  it('leaves the chart unlit until the first press', () => {
    const { container } = render(<MorseChart {...idleProps} />)

    expect(pathsOf(container, 'edge', 'idle')).toHaveLength(26)
    expect(pathsOf(container, 'node', 'idle')).toHaveLength(26)
    expect(container.querySelector('[data-part="node"][data-state="current"]')).toBeNull()
  })

  it('lights the whole chain, not just the newest mark', () => {
    const { container } = render(
      <MorseChart {...idleProps} activePath=".-." pendingCharacter="R" isTransmitting />,
    )

    expect(pathsOf(container, 'edge', 'active')).toEqual(['.', '.-', '.-.'])
    expect(pathsOf(container, 'node', 'active')).toEqual(['.', '.-'])
    expect(pathsOf(container, 'node', 'current')).toEqual(['.-.'])
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Transmitting .-. — R.')
  })

  it('walks a four-mark chain out from the hub', () => {
    const { container } = render(
      <MorseChart {...idleProps} activePath="...." pendingCharacter="H" isTransmitting />,
    )

    expect(pathsOf(container, 'edge', 'active')).toEqual(['.', '..', '...', '....'])
    expect(pathsOf(container, 'node', 'current')).toEqual(['....'])
  })

  it('keeps the committed letter on its lit chain', () => {
    const { container } = render(
      <MorseChart {...idleProps} lastLetter={committedS} commitCount={3} />,
    )

    expect(pathsOf(container, 'edge', 'committed')).toEqual(['.', '..', '...'])
    // The whole chain stays lit, and the letter itself is the node that pulses.
    expect(pathsOf(container, 'node', 'committed')).toEqual(['.', '..', '...'])
    expect(container.querySelector('[data-part="node"][data-path="..."]')).not.toBeNull()
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'Idle at start. Last letter S, ....',
    )
  })

  it('shows the committed chain and the new one side by side', () => {
    const { container } = render(
      <MorseChart
        {...idleProps}
        activePath="-"
        pendingCharacter="T"
        lastLetter={committedS}
        commitCount={3}
        isTransmitting
      />,
    )

    expect(pathsOf(container, 'edge', 'active')).toEqual(['-'])
    expect(pathsOf(container, 'edge', 'committed')).toEqual(['.', '..', '...'])
  })

  it('reports paths that walk off the chart', () => {
    const { container } = render(<MorseChart {...idleProps} activePath="..--" isTransmitting />)

    expect(container.querySelector('[data-unresolved="true"]')?.textContent).toBe('no letter')
    expect(pathsOf(container, 'node', 'current')).toEqual([])
    // The chart stops at U: there is no ..-- branch to light up.
    expect(pathsOf(container, 'node', 'active')).toEqual(['.', '..', '..-'])
    expect(pathsOf(container, 'edge', 'active')).toEqual(['.', '..', '..-'])
  })

  it('marks dash children with a pill and dot children with a ring', () => {
    const { container } = render(<MorseChart {...idleProps} />)

    expect(container.querySelectorAll('[data-part="edge"][data-symbol="-"]')).toHaveLength(12)
    expect(container.querySelectorAll('[data-part="node"][data-ringed="true"]')).toHaveLength(14)
  })
})
