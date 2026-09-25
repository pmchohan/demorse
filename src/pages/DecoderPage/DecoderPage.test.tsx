import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { installFakeAnimationClock, type FakeAnimationClock } from '@/test/fakeAnimationClock'
import { DecoderPage } from './DecoderPage'

const installed: FakeAnimationClock[] = []

function startClock(startMs?: number): FakeAnimationClock {
  const clock = installFakeAnimationClock(startMs)
  installed.push(clock)

  return clock
}

afterEach(() => {
  installed.splice(0).forEach((clock) => clock.uninstall())
})

function transcript(): Element | null {
  return document.querySelector('p[aria-live="polite"]')
}

describe('DecoderPage', () => {
  it('renders the headline, the chart and the decoded text', () => {
    render(<DecoderPage />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /idle at start/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Decoded text' })).toBeInTheDocument()
  })

  it('keeps the developer panels off the page', () => {
    render(<DecoderPage />)

    expect(screen.queryByRole('button', { name: /space/i })).toBeNull()
    expect(screen.queryByText(/transmit pad/i)).toBeNull()
    expect(screen.queryByText(/threshold inspector/i)).toBeNull()
    expect(screen.queryByRole('meter')).toBeNull()
    expect(screen.queryByText(/VITE_MORSE_/)).toBeNull()
  })

  it('decodes a tapped letter end to end and clears it again', () => {
    const clock = startClock(50_000)
    render(<DecoderPage />)

    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    clock.advance(96)
    fireEvent.keyUp(window, { code: 'Space', key: ' ' })
    clock.advance(320)

    expect(transcript()?.textContent).toBe('E')
    expect(screen.getByText('1 letter committed')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(transcript()?.textContent).toContain('Waiting for the first tap')
    expect(screen.getByText('Nothing decoded yet')).toBeInTheDocument()
  })

  it('lights the chart chain the key presses walk', () => {
    const clock = startClock(50_000)
    const { container } = render(<DecoderPage />)

    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    clock.advance(500)
    fireEvent.keyUp(window, { code: 'Space', key: ' ' })

    expect(
      container.querySelector('[data-part="edge"][data-state="active"]')?.getAttribute('data-path'),
    ).toBe('-')
  })

  it('switches the colour theme from the header', () => {
    render(<DecoderPage />)

    const before = document.documentElement.dataset.theme

    fireEvent.click(screen.getByRole('button', { name: /^switch to/i }))

    expect(document.documentElement.dataset.theme).not.toBe(before)
  })
})
