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
  // Settings persist to localStorage, and every test in this file renders the page
  // again: leave no tuning behind for the next one.
  window.localStorage.clear()
})

function transcript(): Element | null {
  // Scoped to the transcript: the gap meter is a live region too, and it sits earlier
  // in the document.
  return document.querySelector(
    'section[aria-labelledby="transcript-title"] p[aria-live="polite"]',
  )
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

  it('keys with two bound keys and keeps a held dash inside one character', () => {
    const clock = startClock(50_000)
    render(<DecoderPage />)

    fireEvent.click(screen.getByRole('tab', { name: 'Two keys' }))

    fireEvent.keyDown(window, { code: 'KeyF' })
    fireEvent.keyUp(window, { code: 'KeyF' })

    fireEvent.keyDown(window, { code: 'KeyJ' })
    // Well past the letter-gap threshold, but the key is still down: that is the dash
    // being held, not a pause, so the character must not close under the finger.
    clock.advance(600)
    fireEvent.keyUp(window, { code: 'KeyJ' })
    clock.advance(320)

    expect(transcript()?.textContent).toBe('A')
    // The choice of input mode is the operator's, so it outlives the page.
    expect(window.localStorage.getItem('demorse.settings.v1')).toContain('"dual"')
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

  it('puts the chart and the decoded text on one row', () => {
    const { container } = render(<DecoderPage />)

    const chart = container.querySelector('section[aria-labelledby="chart-title"]')
    const transcript = container.querySelector('section[aria-labelledby="transcript-title"]')

    // Same column wrapper: the pair is laid out as a two-column workbench.
    expect(chart?.parentElement).toBe(transcript?.parentElement)
    expect(chart?.parentElement?.tagName).toBe('DIV')
    expect(transcript?.parentElement).not.toBe(chart)
  })

  it('hands the chart highlight over when the next letter starts', () => {
    const clock = startClock(50_000)
    const { container } = render(<DecoderPage />)

    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    clock.advance(96)
    fireEvent.keyUp(window, { code: 'Space', key: ' ' })
    clock.advance(320)

    // E is committed and its chain is the lit one.
    expect(container.querySelector('[data-part="edge"][data-state="committed"]')).not.toBeNull()

    // The next press starts new input: E's chain finishes there and then.
    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    clock.advance(96)

    expect(container.querySelector('[data-part="edge"][data-state="committed"]')).toBeNull()

    // Releasing classifies the new symbol, which lights the path being typed.
    fireEvent.keyUp(window, { code: 'Space', key: ' ' })
    clock.advance(96)

    const active = container.querySelector('[data-part="edge"][data-state="active"]')
    expect(active?.getAttribute('data-path')).toBe('.')
    expect(container.querySelector('[data-part="edge"][data-state="committed"]')).toBeNull()
  })

  it('grows the digit chart and starts resolving numbers when switched on', () => {
    const clock = startClock(50_000)
    const { container } = render(<DecoderPage />)

    // Two-key mode names the symbol on keydown, so the test needs no dwell frames.
    fireEvent.click(screen.getByRole('tab', { name: 'Two keys' }))

    const keyFiveDashes = () => {
      for (let index = 0; index < 5; index += 1) {
        fireEvent.keyDown(window, { code: 'KeyJ' })
        fireEvent.keyUp(window, { code: 'KeyJ' })
        clock.advance(20)
      }

      // Past the character gap, the sequence must resolve or be reported.
      clock.advance(320)
    }

    // Letters only: the all-dash path walks past O and off the chart.
    keyFiveDashes()

    expect(transcript()?.textContent).toContain('Waiting for the first tap')
    expect(
      screen.getByText(/is not a character the chart can resolve — nothing was appended/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /numbers chart/i })).toBeNull()

    // Numbers switched on: the digit chart appears underneath the letter chart.
    fireEvent.click(screen.getByRole('checkbox', { name: /numbers 0–9/i }))

    expect(screen.getByRole('img', { name: /numbers chart/i })).toBeInTheDocument()
    expect(container.querySelectorAll('svg')).toHaveLength(2)

    // ...and the same five dashes now print 0.
    keyFiveDashes()

    expect(transcript()?.textContent).toBe('0')
    expect(screen.getByText('1 letter committed')).toBeInTheDocument()
    expect(window.localStorage.getItem('demorse.settings.v1')).toContain('"digits":true')
  })

  it('switches the colour theme from the header', () => {
    render(<DecoderPage />)

    const before = document.documentElement.dataset.theme

    fireEvent.click(screen.getByRole('button', { name: /^switch to/i }))

    expect(document.documentElement.dataset.theme).not.toBe(before)
  })
})
