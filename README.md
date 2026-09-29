# demorse

[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)

Decodes Morse code live as you key it. Every press is measured in
milliseconds, classified against configurable timing windows, and walked along an
interactive copy of the decoding chart. The whole chain stays lit — every dot and
dash from the start hub out to the letter you are spelling — and the decoded text
builds up beside it. Starting the next letter hands the highlight over, so the
chain behind you goes out.

Key one space bar and let its dwell time choose dot or dash, or switch to two keys
that name the symbols outright and key like a straight key at speed. Both modes can
sound a sidetone, and everything you change is remembered in this browser.

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

Hold the space bar and let go: a quick tap reads as a dot, a longer hold as a dash,
and pausing commits the letter. Prefer to key with two fingers? Switch to two keys in
the settings panel and bind your own. `npm test` runs the suite,
`npm run build` emits `dist/`.

## Features

- Live decoding driven by real dwell and silence measurements, no submit step
- One-key mode (dwell time picks the symbol) or two-key mode, with both keys
  rebindable to any key on the keyboard
- A sidetone and three key-click sounds synthesized in the browser — no audio files —
  with one volume control and a mute that keeps the browser quiet until you ask for sound
- Chart that keeps the whole chain lit, from the start hub to the letter, and
  holds the last committed letter on its own lit chain
- Three tiers of silence: the letter closes, then a word space, then a new line
- A settings panel with speed presets and per-threshold sliders, plus optional
  digits and punctuation on top of the 26 letters
- Seven timing windows seeded from `VITE_MORSE_*` environment variables and then
  tunable in the panel; every setting persists in `localStorage`
- A light/dark theme toggle, and a chart that stays legible down to phone widths
- Full unit, hook, component and page test coverage with Vitest

## Usage

Type `SOS` in Morse (`... --- ...`) by tapping fast, holding long, and pausing
between the letters — or switch to two-key mode in the settings and tap one key for
dots and another for dashes:

| Action | Result |
| --- | --- |
| Press shorter than `TAP_MIN_MS` | Dropped as key bounce, so a sticky key cannot corrupt the text |
| Press inside the tap window | Dot — the chart walks the dot branch |
| Press inside the hold window | Dash — the chart walks the dash branch |
| Press between the two windows | Resolved to the nearer bound and flagged as ambiguous |
| Press longer than `HOLD_MAX_MS` | Still a dash, flagged as over max, never discarded |
| Pause past `LETTER_GAP_MS` | Character closes and the letter is committed |
| Pause past `WORD_GAP_MS` | A word space follows the committed letter |
| Silence keeps going past `LINE_GAP_MS` | The space becomes a line break |
| Sequence with no character (for example `..--`) | Reported as unresolved rather than guessed at |

In two-key mode the dwell time is irrelevant — the key you pressed already named the
symbol — and holding a dash key down is treated as part of the element, not as the
silence after it.

Beside the chart sit the decoded text and a row of chips — one per committed letter,
carrying that letter's marks rather than repeating its character. While you key, a
strip shows the symbols of the character in flight and a meter fills toward whichever
tier of silence you are approaching.

## Project Structure

```
src/
  audio/        Synthesized sound presets — sidetone, relay, clack, bright
  config/       Env parsing for thresholds, user settings + localStorage, key labels
  domain/morse/ Alphabet, chart tree layout, timing classifier, decoder reducer
  hooks/        Press input, animation clock, session wiring, sidetone, settings, theme
  components/   Reusable atoms, such as the shared dot/pill mark and a toggle switch
  pages/        DecoderPage, its sections and page-local components
  test/         Setup file and the deterministic animation-clock harness
  theme/        globals.css — design tokens and reset, the only global sheet
```

## Configuration

The settings panel is where the app is tuned day to day: input mode, bound keys,
sound and volume, the seven timing windows, and whether digits and punctuation are
in play. Those choices are saved in `localStorage`, so they survive a reload.

Environment variables are the starting line for a build: they seed the timing
thresholds for someone who has never opened the panel. Copy `.env.example` to `.env`
and restart — Vite inlines them at build time. Missing or unusable values fall back
to the defaults in `src/config/morseTiming.ts`, the page footer lists the fallback,
and the panel refuses a set of numbers that cannot work as ordered windows.

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_MORSE_TAP_MIN_MS` | `40` | Shortest press still counted as a dot |
| `VITE_MORSE_TAP_MAX_MS` | `200` | Longest press still counted as a dot |
| `VITE_MORSE_HOLD_MIN_MS` | `250` | Shortest press counted as a dash |
| `VITE_MORSE_HOLD_MAX_MS` | `700` | Longest dash window; longer presses are flagged |
| `VITE_MORSE_LETTER_GAP_MS` | `250` | Silence that closes a character |
| `VITE_MORSE_WORD_GAP_MS` | `900` | Silence that also inserts a word space |
| `VITE_MORSE_LINE_GAP_MS` | `1800` | Silence that starts a new line |

Only `VITE_`-prefixed variables reach client code. To start from a real speed rather
than hand-tapping, pick a dot and scale from it: at 12 WPM one unit is about 100ms,
which is roughly `40 / 200 / 250 / 700` for the dwell windows and `300 / 900 / 1800`
for the three tiers of silence. The presets in the panel do this for the common
speeds.

## Contributing

Pull requests are welcome. Please open an issue first to discuss changes, and
run `npm test` plus `npm run lint` before sending them.
