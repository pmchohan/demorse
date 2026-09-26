# Agent Notes — demorse

Single-page React app that decodes live Morse input (space bar only), walks a decoding chart shaped like the reference illustration, and reads timing thresholds from `VITE_MORSE_*` env variables. No backend, no router, no global state library.

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

- `src/config/morseTiming.ts` — env parsing and validation for the six timing thresholds; the only file that reads `import.meta.env`.
- `src/domain/morse/` — pure decoding logic: `decoderReducer.ts` (clock-injected reducer), `timingClassifier.ts` (press/gap classification), `morseTree.ts` (hand-authored chart geometry: node points, label points, edge routes, dash pills), `morseAlphabet.ts` (letters A–Z).
- `src/hooks/` — `usePressInput` (global space-bar handling), `useAnimationClock` (requestAnimationFrame), `useMorseSession` (composition), `useColorTheme`.
- `src/components/atoms/` — shared presentational pieces; `MorseMark` draws the dot/pill mark used by the chart and the transcript.
- `src/pages/DecoderPage/` — the page plus four components: `MorseChart` (chart, caption, chain lighting), `MorseChart/SignalHub` (abstract start hub), `DecodedTranscript`, `PageHeader`. `DecoderPage.module.css` holds the `.workbench` row that puts `MorseChart` on the left and `DecodedTranscript` on the right.
- `src/theme/globals.css` — the only global stylesheet: design tokens, reset, light and dark palettes.
- `src/test/` — Vitest setup and the deterministic `fakeAnimationClock` used by timing tests.
- `.env` and `.env.example` — `VITE_MORSE_TAP_MIN_MS`, `TAP_MAX_MS`, `HOLD_MIN_MS`, `HOLD_MAX_MS`, `GAP_MIN_MS`, `GAP_MAX_MS` in milliseconds; keep the two files in sync.

## Architecture Rules

- Decoding logic is pure: the reducer and classifier receive timestamps as arguments and never read the real clock. Time enters only through `useAnimationClock` and `usePressInput`.
- `src/config/morseTiming.ts` is the single consumer of `import.meta.env`; everything else receives resolved values as props.
- Thresholds are build-time inlined: changing `.env` requires restarting the dev server or rebuilding to take effect. Unusable values fall back to defaults with warnings listed in the page footer.
- The decoder covers A–Z only, matching the reference chart; unknown symbol paths are reported as unresolved, never guessed.
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
- Add or update tests for any behavior changed, including boundary cases: threshold edges, key bounce, word gaps, unresolved paths.
- The chart renders exactly 26 letter nodes, 26 edges and one start hub, and tests assert that; dash pills are asserted against the coordinates measured off the reference chart, so geometry changes must update code and tests together.

## Gotchas

- Do not add router, state, or styling libraries without an explicit request; the app is deliberately minimal.
- `dist/` and `node_modules/` are build artifacts and never hand-edited.
- The space bar must never scroll the page; global key handling lives in `usePressInput` — keep new key logic there, not in components.
- There is no on-screen transmit pad: the space bar is the only input surface, and it is the reason `usePressInput` carries no pointer handlers.
- `morseTree.ts` is not a binary-tree slot layout — it mirrors the reference illustration (spine through the hub, dot children as circles, dash children as pills). Do not re-derive positions from depth; edit `LETTER_LAYOUT` and re-check against the image.
