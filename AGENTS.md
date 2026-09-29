# Agent Notes — demorse

Single-page React app that decodes live Morse input (one keyed space bar, or two
rebindable symbol keys), walks a decoding chart shaped like the reference
illustration, seeds timing thresholds from `VITE_MORSE_*` env variables, and lets the
operator retune everything — mode, keys, sound, thresholds, alphabet — in a settings
panel persisted to `localStorage`. No backend, no router, no global state library.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` | Type-check plus production build (`tsc -b && vite build`) |
| `npm run lint` | oxlint over `src/` and `vite.config.ts` |
| `npm run test` | Full Vitest suite, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npx tsc -b` | Type-check only |

Validation bar before finishing any task: `npx tsc -b`, `npx oxlint src vite.config.ts`, and `npx vitest run` all pass from the repo root.

## Project Map

- `src/config/morseTiming.ts` — env parsing and validation for the seven timing thresholds, the WPM-style presets and `timingPresetIdOf`; the only file that reads `import.meta.env`.
- `src/config/userSettings.ts` — the persisted `UserSettings` shape (mode, bindings, sound, thresholds, alphabet) plus `mergeUserSettings`/`loadUserSettings`/`saveUserSettings`; `mergeUserSettings(raw, fallback)` layers stored values over the env-derived defaults and is pure, so it is tested without a browser.
- `src/config/keyLabels.ts` — human labels for `KeyboardEvent.code` values shown on the binding buttons.
- `src/domain/morse/` — pure decoding logic: `decoderReducer.ts` (clock-injected reducer), `timingClassifier.ts` (press/gap classification plus `findThresholdConflicts`), `morseTree.ts` (hand-authored letter-chart geometry: node points, label points, edge routes, dash pills), `generatedChart.ts` (digits/punctuation trees derived from codes, appended to the chart when switched on), `morseAlphabet.ts` (A–Z always, digits and specials behind `AlphabetSelection`).
- `src/audio/soundPresets.ts` — the four synthesized sounds (sidetone, relay, clack, bright) built from oscillators/noise buffers, no audio files.
- `src/hooks/` — `usePressInput` (global keyboard handling for both modes and for rebinding), `useAnimationClock` (requestAnimationFrame), `useMorseSession` (composition), `useSidetone` (Web Audio rig), `useUserSettings` (state + `localStorage`), `useColorTheme`.
- `src/components/atoms/` — shared presentational pieces; `MorseMark` draws the dot/pill mark used by the chart and the transcript, `ToggleSwitch` the settings toggles.
- `src/pages/DecoderPage/` — the page plus its components: `MorseChart` (chart, caption, chain lighting), `MorseChart/SignalHub` (abstract start hub), `DecodedTranscript`, `PageHeader`, `TransmitConsole` (mode tabs, keying pad, element strip, `GapMeter`), `SettingsPanel` (sound, keys, thresholds, alphabet). `DecoderPage.module.css` holds the `.workbench` row that puts `MorseChart` on the left and `DecodedTranscript` on the right.
- `src/theme/globals.css` — the only global stylesheet: design tokens, reset, light and dark palettes.
- `src/test/` — Vitest setup and the deterministic `fakeAnimationClock` used by timing tests.
- `.env` and `.env.example` — `VITE_MORSE_TAP_MIN_MS`, `TAP_MAX_MS`, `HOLD_MIN_MS`, `HOLD_MAX_MS`, `LETTER_GAP_MS`, `WORD_GAP_MS`, `LINE_GAP_MS` in milliseconds; keep the two files in sync.

## Architecture Rules

- Decoding logic is pure: the reducer and classifier receive timestamps as arguments and never read the real clock. Time enters only through `useAnimationClock` and `usePressInput` (`performance.now()`, the same base the sidetone schedules against).
- `src/config/morseTiming.ts` is the single consumer of `import.meta.env`; everything else receives resolved values as props.
- Env thresholds are the floor, `localStorage` is the operator's own tuning: `DecoderPage` resolves env first and hands it to `useUserSettings` as the fallback, so a first visit gets `.env` and a returning visit gets their sliders.
- Thresholds are build-time inlined: changing `.env` requires restarting the dev server or rebuilding to take effect. Unusable values fall back to defaults with warnings listed in the page footer; a slider set that cannot be ordered is refused in the panel via `findThresholdConflicts`.
- The decoder resolves A–Z always, digits and specials only when switched on; unknown symbol paths are reported as unresolved, never guessed.
- Two-key mode names the symbol on keydown, so dwell time never classifies it. A key held past the letter-gap threshold must not read as silence: `key-pause` shifts the running gap start to the moment the key came up, and `useAnimationClock` is parked while any symbol key is down.
- The chart lights exactly one chain at a time. New input hands the highlight over: the committed chain is lit only while nothing new is coming in, so `MorseChart` receives `isPressing` (press held) as well as `isTransmitting` — a symbol is only classified on release, so the press itself is what ends the previous highlight.
- Chart scale is set by the `.chart` `max-width` (the drawing scales with its rendered width). The `.workbench` split at `72rem` is derived from that cap's floor: 43rem chart column + 2rem gap + 22rem text column + 4rem page padding = 71rem.

## Code Style

- TypeScript strict; named exports only; one primary export per file; components CapitalCase, hooks `use`-prefixed camelCase; props interfaces named `<Component>Props` with `readonly` fields.
- Path alias `@/*` for everything under `src/`.
- Styling is CSS Modules consuming tokens from `src/theme/globals.css`. No literal colors, spacing, or durations in component CSS; computed chart geometry travels as SVG attributes, not inline styles.
- Semantic HTML for the page structure (`main`, `section`, `figure`/`figcaption`, `button`); `aria-live` for decoded text; `:focus-visible` and `prefers-reduced-motion` respected.
- Motion uses exponential ease-out curves only (`--ease-out-expo`, `--ease-out-quint`); bounce and elastic easing is banned; animate `transform` and `opacity` only.
- Text contrast must stay at 4.5:1 or better in both themes; check token changes against both palettes before committing.

## Testing Conventions

- Tests live next to the code as `<name>.test.ts(x)`, written in Vitest with Testing Library.
- Timing scenarios use the fake clock in `src/test/fakeAnimationClock.ts` — never real timers.
- Add or update tests for any behavior changed, including boundary cases: threshold edges, key bounce, word and line gaps, held dash key, unresolved paths.
- `useMorseSession` takes a `UserSettingsActions` object, so hook tests pass a plain object with `vi.fn()` setters and `DEFAULT_USER_SETTINGS` spread with overrides — no provider needed.
- The chart renders exactly 26 letter nodes, 26 edges and one start hub, and tests assert that; dash pills are asserted against the coordinates measured off the reference chart, so geometry changes must update code and tests together.
- Two `aria-live` regions exist (transcript and gap meter), so page tests scope their selector to `section[aria-labelledby="transcript-title"]`.

## Gotchas

- Do not add router, state, or styling libraries without an explicit request; the app is deliberately minimal.
- `dist/` and `node_modules/` are build artifacts and never hand-edited.
- The space bar must never scroll the page; global key handling lives in `usePressInput` — keep new key logic there, not in components. That hook is also the only place that calls `preventDefault` on bound keys (space, arrows, `/`) and the only reader of `KeyboardEvent.code` for rebinding.
- Keying is keyboard plus the `TransmitConsole` pad: the pad handlers live in `TransmitConsole` and call the session's `pressStart`/`pressEnd`/`symbolDown`/`symbolUp`, so never duplicate the dwell logic there.
- No `AudioContext` is created until the operator picks a sound — autoplay policy means a context built outside a gesture starts suspended and the first key is silent.
- `morseTree.ts` is not a binary-tree slot layout — it mirrors the reference illustration (spine through the hub, dot children as circles, dash children as pills). Do not re-derive positions from depth; edit `LETTER_LAYOUT` and re-check against the image. Digits and specials are laid out by `generatedChart.ts`, which does derive positions from code depth.
