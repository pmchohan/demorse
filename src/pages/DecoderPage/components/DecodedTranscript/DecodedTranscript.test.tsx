import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { DecodedLetter, DecoderNotice } from '@/domain/morse/decoderReducer'
import { DecodedTranscript } from './DecodedTranscript'

const h: DecodedLetter = { character: 'H', morse: '....', path: '....' }
const e: DecodedLetter = { character: 'E', morse: '.', path: '.' }

function renderTranscript(overrides: {
  text?: string
  letters?: readonly DecodedLetter[]
  notice?: DecoderNotice | null
}) {
  const onClear = () => undefined

  return render(
    <DecodedTranscript
      text={overrides.text ?? ''}
      letters={overrides.letters ?? []}
      notice={overrides.notice ?? null}
      onClear={onClear}
    />,
  )
}

describe('DecodedTranscript', () => {
  it('keeps the letters in the text and only the marks in the chips', () => {
    renderTranscript({ text: 'HE', letters: [h, e] })

    expect(screen.getByText('HE')).toBeInTheDocument()

    const chips = screen.getAllByRole('listitem')

    // The character is not repeated under the text: it is the chip's accessible name.
    expect(chips.map((chip) => chip.textContent)).toEqual(['', ''])
    expect(chips.map((chip) => chip.getAttribute('aria-label'))).toEqual(['H ....', 'E .'])
    expect(chips[0].querySelectorAll('[data-symbol]')).toHaveLength(4)
    expect(chips[1].querySelectorAll('[data-symbol]')).toHaveLength(1)
  })

  it('marks the newest chip and shows no row until a letter lands', () => {
    const { rerender } = renderTranscript({})

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByText(/waiting for the first tap/i)).toBeInTheDocument()

    rerender(<DecodedTranscript text="H" letters={[h]} notice={null} onClear={() => undefined} />)

    const chips = screen.getAllByRole('listitem')

    expect(chips).toHaveLength(1)
    expect(chips[0].getAttribute('data-latest')).toBe('true')
  })

  it('reports unresolved paths and only enables clear once there is content', () => {
    renderTranscript({
      notice: {
        kind: 'unresolved-sequence',
        message: '..-- is not a letter on the decoding chart — nothing was appended.',
      },
    })

    expect(screen.getByRole('status')).toHaveTextContent('is not a letter')
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
  })
})
