import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MorseMark } from './MorseMark'

describe('MorseMark', () => {
  it('renders the symbol as a decorative mark', () => {
    const { container } = render(<MorseMark symbol="-" />)
    const mark = container.querySelector('[data-symbol="-"]')

    expect(mark).not.toBeNull()
    expect(mark?.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders a different shape for dot, dash and each size', () => {
    const { container } = render(
      <>
        <MorseMark symbol="." size="sm" />
        <MorseMark symbol="-" size="lg" />
      </>,
    )

    const dot = container.querySelector('[data-symbol="."]')
    const dash = container.querySelector('[data-symbol="-"]')

    expect(dot?.className).not.toBe(dash?.className)
  })

  it('mutes the mark on request', () => {
    const muted = render(<MorseMark symbol="." tone="muted" />)
    const plain = render(<MorseMark symbol="." />)

    expect(muted.container.querySelector('[data-symbol="."]')?.className).not.toBe(
      plain.container.querySelector('[data-symbol="."]')?.className,
    )
  })
})
