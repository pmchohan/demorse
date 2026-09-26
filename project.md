# demorse — what we are building

## The idea in one paragraph

`demorse` is a single-page React app that decodes Morse code **live, from the
timing of your fingers, with no submit step**. You hold and release the space
bar: a short press is a dot, a long press is a dash, and the silence after a
symbol closes the letter. Nothing is typed into a box and nothing is submitted —
the moment a symbol is classified, the app walks that symbol onto an
interactive copy of a classic **Morse decoding chart**, lighting the entire chain
from the start hub out to the letter, while the decoded text builds up
alongside. The whole point is to make the *invisible* thing — the rhythm of
dwell and silence — visible. A Morse decoder normally shows you text at the end;
this one shows you the journey.

## Why it exists

- **Teaching tool.** A decoding chart is a maze. Watching the walk light the
  route from `Start` to `S` teaches the branching structure of the alphabet
  faster than reading a table.
- **Timing is the actual skill.** Morse is not memorised as dots and dashes, it
  is felt as rhythm. By making the timing windows explicit and configurable, the
  app teaches the rhythm instead of hiding it behind a fixed decoder.
- **Legible failure.** Real transmitting has noise. Key bounce, a press that
  lands between the dot and dash windows, a hold that runs long, a sequence
  that is not a letter. Every one of those is surfaced as an honest notice
  instead of being silently coerced into a guess.

## The core loop

```
hold space  ->  dot (.)     chart walks the dot branch,  ring lights on the spine
hold longer ->  dash (-)    chart walks the dash branch, pill lights on the branch
pause       ->  letter      chain commits, the letter's chain stays lit
pause longer->  word        a space is inserted, the chain is released
```

Repeat. The chart is the primary surface; the transcript is the receipt.

## What the user actually sees

1. **PageHeader** — the `demorse` wordmark drawn as `-.-` marks, and a
   light/dark theme toggle persisted in `localStorage`.
2. **Hero** — one headline, one short lead. No feature list, no CTA button:
   the only input surface is the space bar, so there is nothing to click.
3. **MorseChart** (left, dominant) — the decoding chart, drawn as SVG from
   hand-measured geometry. Exactly 26 letter nodes, 26 edges, one start hub.
   Node states are `idle` / `active` / `committed` / `current`. Beneath the
   drawing, a caption shows the live path as marks (`• — •`) resolving to a
   letter, plus a legend for the two mark shapes.
4. **SignalHub** — the reference chart's ship's helm redrawn as an abstract
   signal origin: a dashed ring that idles slowly and spins up while you
   transmit, cardinal and minor ticks, and a core that pulses.
5. **DecodedTranscript** (right) — the decoded string in an `aria-live` region,
   a Clear button, the current notice, and a row of chips — one per committed
   letter, each chip showing that letter's *marks* rather than repeating its
   character.
6. **Footer** — scope statement (A–Z only) and any timing warnings surfaced
   from config.

### The chart-handover rule

The chart lights **one** chain at a time. A new press hands the highlight over
from the committed letter to the letter being typed, so the chain behind you
goes out. The handover starts with the press *itself* (`isPressing`), not with
the first classified symbol, because a symbol only exists after release — if we
waited, the previous letter would stay lit beside the new one being typed.

## How it works

```
space bar
   │  usePressInput        performance.now() stamps, preventDefault, key-repeat
   ▼                       guard, blur guard
dispatch press-start / press-end
   │
   ▼
decoderReducer             pure, clock-injected state machine
   │                       (idle | holding | waiting)
   ├── timingClassifier    durationMs / gapMs -> dot | dash | too-short
   │                       gapMs -> intra | letter | word
   ├── morseAlphabet       A–Z, symbol <-> character
   └── morseTree           hand-authored chart geometry, path -> letter
   │
   ▼  useAnimationClock    rAF ticks drive the live elapsed time
useMorseSession            composes input + clock + reducer, memoised reducer
   │
   ▼
DecoderPage -> MorseChart + DecodedTranscript
```

Timestamps only enter through `usePressInput` and `useAnimationClock`. The
reducer and classifier never read a clock, which is why every timing rule in the
app is unit-testable with a deterministic fake clock instead of real timers.

## The timing model

Six thresholds, all in milliseconds, all configurable:

| Key | Env var | Default | Meaning |
| --- | --- | --- | --- |
| `tapMinMs` | `VITE_MORSE_TAP_MIN_MS` | 40 | Below this, a press is key bounce and is dropped |
| `tapMaxMs` | `VITE_MORSE_TAP_MAX_MS` | 200 | Dot window upper bound |
| `holdMinMs` | `VITE_MORSE_HOLD_MIN_MS` | 250 | Dash window lower bound |
| `holdMaxMs` | `VITE_MORSE_HOLD_MAX_MS` | 700 | Past this a press is still a dash, flagged |
| `gapMinMs` | `VITE_MORSE_GAP_MIN_MS` | 250 | Silence that closes a character |
| `gapMaxMs` | `VITE_MORSE_GAP_MAX_MS` | 900 | Silence that also inserts a word space |

The interesting decisions encoded in `timingClassifier.ts`:

- **Nothing is discarded except bounce.** A press past `holdMaxMs` is still a
  dash, flagged `over-max`. Losing input is worse than an imprecise symbol.
- **The dead zone between the windows resolves to the nearer bound**, flagged
  `ambiguous`. A human's 225ms press is *either* — picking the nearer bound and
  saying so is honest; refusing to decode is not useful.
- **Overlapping or inverted windows are configuration errors, and they are
  reported**, not silently tolerated: `findThresholdConflicts` output lands in
  the page footer.
- **Thresholds are build-time inlined.** Changing `.env` requires a dev-server
  restart or a rebuild. That is accepted: the timing defines the instrument, and
  an instrument that retunes itself mid-sentence would be disorienting.

## Architecture rules (load-bearing, not style)

- **Pure decoding core.** `src/domain/morse/` takes timestamps as arguments.
  If a decoder file ever imports `performance.now()`, the architecture is broken.
- **One env consumer.** `src/config/morseTiming.ts` is the only file that reads
  `import.meta.env`. Everything downstream receives resolved values as props.
- **A–Z only.** The chart carries the ITU letters that the reference chart
  carries. Digits, punctuation and prosigns are not on it, so those sequences
  are reported as unresolved — never guessed at.
- **Chart geometry is measured, not derived.** `morseTree.ts` mirrors the
  reference illustration: a spine through the hub, dot children as circles on
  it, dash children as pills hanging off it, deeper branches turning once. It
  is *not* a binary-tree slot layout; do not re-derive positions from depth.
- **Minimal by intent.** No router, no state library, no CSS framework, no
  on-screen transmit pad. The space bar is the only input surface, which is
  exactly why `usePressInput` carries no pointer handlers.
- **Tokens, not literals.** Styling is CSS Modules over the design tokens in
  `src/theme/globals.css`. No literal colours, spacing or durations in
  component CSS. Chart geometry travels as SVG attributes, never inline styles.
- **Motion is exponential ease-out only.** `--ease-out-expo` and
  `--ease-out-quint`; bounce/elastic curves are banned; only `transform` and
  `opacity` animate. `prefers-reduced-motion` is respected globally.

## Visual direction

A dark, instrument-like signal room, not a nautical poster. Deep teal-black
surfaces, teal brand accents, a cyan dash signal against a mint dot signal so
the two mark types are distinguishable at a glance and not only by shape. The
chart's scale is set by the `.chart` box (40rem floor, 62rem cap); the drawing
scales with its rendered width, and the two-column `.workbench` split at `72rem`
is derived from that floor (43rem chart + 2rem gap + 22rem text + 4rem page
padding), so the chart is never clipped once both columns appear. Text
contrast holds at 4.5:1 or better in both themes — light-mode accents are
deliberately darkened for exactly this reason.

## Project map

| Path | Role |
| --- | --- |
| `src/config/morseTiming.ts` | Env parsing, defaults, warnings |
| `src/domain/morse/timingClassifier.ts` | Duration/gap -> verdict + confidence + note |
| `src/domain/morse/decoderReducer.ts` | Pure clock-injected decoding state machine |
| `src/domain/morse/morseAlphabet.ts` | A–Z symbol table |
| `src/domain/morse/morseTree.ts` | Hand-authored chart geometry, chain helpers |
| `src/hooks/usePressInput.ts` | Global space bar -> stamped press events |
| `src/hooks/useAnimationClock.ts` | rAF loop, only while transmitting |
| `src/hooks/useMorseSession.ts` | Composition root for the decoding session |
| `src/hooks/useColorTheme.ts` | `data-theme` toggle + localStorage |
| `src/components/atoms/MorseMark/` | The shared dot/pill mark |
| `src/pages/DecoderPage/` | The page, chart, hub, transcript, header |
| `src/theme/globals.css` | Tokens, reset, light + dark palettes |
| `src/test/fakeAnimationClock.ts` | Deterministic clock for timing tests |

## Commands and validation bar

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | `tsc -b` + production build |
| `npm run lint` | oxlint |
| `npm run test` | Vitest, single run |

Before finishing any change: `npx tsc -b`, `npx oxlint src vite.config.ts`,
and `npx vitest run` must all pass. Current state: **12 test files, 68 tests,
all green.**

Timing scenarios are always tested through the fake clock — never real timers.
Behaviour changes require test updates, including boundaries: threshold edges,
key bounce, word gaps, unresolved paths. The chart tests assert 26 letter nodes,
26 edges and one hub, and dash-pill coordinates are asserted against the
reference image, so geometry edits must move code and tests together.

## Current state, and what is open

Shipped and working: live decoding, chart chain lighting and handover, word
breaks, notices, chips, theme toggle, responsive layout, full test coverage.

Known gaps, honestly stated:

- `state.liveElapsedMs` is computed and tested but **not rendered** anywhere. The
  reducer even refers to a "metre" that does not exist yet. A dwell/gap meter
  that fills toward the next threshold is the obvious next feature — it would
  make the timing windows visible instead of merely felt.
- Thresholds are build-time only. A runtime tuning panel would need the
  classifier to take thresholds per-call rather than once at reducer creation.
- Letters are capped at four symbols because the chart is. A character sequence
  longer than any chart branch reports as unresolved, which is correct but not
  a general Morse decoder.
