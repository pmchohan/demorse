# Morse Code Decoder

[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)

Decodes Morse code live as you hold the space bar. Every press is measured in
milliseconds, classified against configurable timing windows, and walked along an
interactive copy of the decoding chart. The whole chain stays lit — every dot and
dash from the start hub out to the letter you are spelling — and the decoded text
builds up underneath.

The chart mirrors `morse-code-decoder-chart-template-62459640-2850254368.jpg` in
this folder: a spine runs through the start hub, dot children sit on it as
circles, dash children hang off it as pills, and deeper branches turn once. The
reference chart's ship's helm is redrawn as an abstract signal hub.

<details>
<summary>Table of Contents</summary>

- [Quick Start](#quick-start)
- [Features](#features)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

</details>

## Quick Start

```bash
npm install
cp .env.example .env     # tune the thresholds, then restart
npm run dev              # -> http://localhost:5173
```

Hold the space bar and let go. Short presses read as dots, longer holds as
dashes, and pausing commits the letter. `npm test` runs the suite,
`npm run build` emits `dist/`.

## Features

- Live decoding driven by real dwell and silence measurements, no submit step
- Chart that keeps the whole chain lit, from the start hub to the letter, and
  holds the last committed letter on its own lit chain
- Word breaks inserted automatically once the pause passes the gap maximum
- Six timing windows configurable through `VITE_MORSE_*` environment variables
- Space-bar input, a chart that stays legible down to phone widths, and a
  light/dark theme toggle
- Full unit, hook, component and page test coverage with Vitest

## Usage

Type `SOS` in Morse (`... --- ...`) by tapping fast, holding long, and pausing
between the letters:

| Action | Result |
| --- | --- |
| Press shorter than `TAP_MIN_MS` | Dropped as key bounce, so a sticky key cannot corrupt the text |
| Press inside the tap window | Dot — the chart walks the dot branch |
| Press inside the hold window | Dash — the chart walks the dash branch |
| Press between the two windows | Resolved to the nearer bound and flagged as ambiguous |
| Press longer than `HOLD_MAX_MS` | Still a dash, flagged as over max, never discarded |
| Pause past `GAP_MIN_MS` | Character closes and the letter is committed |
| Pause past `GAP_MAX_MS` | Character closes and a word space is inserted |
| Sequence with no letter (for example `..--`) | Reported as unresolved rather than guessed at |

The decoded text, and one chip per committed letter, appear under the chart.

## Project Structure

```
src/
  config/       Env parsing for the timing thresholds, plus warnings
  domain/morse/ Alphabet, chart tree layout, timing classifier, decoder reducer
  hooks/        Press input, animation clock, session wiring, colour theme
  components/   Reusable atoms, such as the shared dot/pill mark
  pages/        DecoderPage, its sections and page-local components
  test/         Setup file and the deterministic animation-clock harness
  theme/        globals.css — design tokens and reset, the only global sheet
```

## Configuration

Thresholds come from environment variables, read once when the dev server
starts or the app is built. Copy `.env.example` to `.env` and restart. Missing or
unusable values fall back to the defaults in `src/config/morseTiming.ts`, and the
page footer lists the fallback and any overlapping windows.

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_MORSE_TAP_MIN_MS` | `40` | Shortest press still counted as a dot |
| `VITE_MORSE_TAP_MAX_MS` | `200` | Longest press still counted as a dot |
| `VITE_MORSE_HOLD_MIN_MS` | `250` | Shortest press counted as a dash |
| `VITE_MORSE_HOLD_MAX_MS` | `700` | Longest dash window; longer presses are flagged |
| `VITE_MORSE_GAP_MIN_MS` | `250` | Silence that closes a character |
| `VITE_MORSE_GAP_MAX_MS` | `900` | Silence that also inserts a word space |

Only `VITE_`-prefixed variables reach client code. To start from a real speed
rather than hand-tapping, set a dot of one unit and scale the rest: at 12 WPM one
unit is about 100ms, so `100 / 300 / 300 / 900` for tap, hold, gap and gap max.

## Contributing

Pull requests are welcome. Please open an issue first to discuss changes, and
run `npm test` plus `npm run lint` before sending them.

## License

No license has been chosen for this project yet — add a `LICENSE` file before
distributing it.
