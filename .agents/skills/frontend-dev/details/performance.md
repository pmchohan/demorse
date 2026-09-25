# Performance

Lazy loading (route / module / asset) is covered in `details/lazy-loading.md`.
This file covers everything else.

---

## Cheap Defaults

Apply always, no measurement needed:

- Provide stable keys in lists (`row.id`, not array index).
- Provide `width`/`height` on every `<img>` to prevent Cumulative Layout Shift.
- Pass `loading="lazy"` on below-the-fold images.
- Animate `transform` and `opacity`, not `top`/`left`/`width`/`height`.
- Use `Intl.NumberFormat` / `Intl.DateTimeFormat` instead of ad-hoc string ops.
- Use AbortController to cancel in-flight requests on unmount.
- Memoize selectors that compute derived data from a store
  (`createSelector` / `reselect`).

---

## Measure Before Optimizing

Don't add `useMemo` / `useCallback` / `React.memo` without evidence. A bad
memo costs more than the render it tries to skip.

Tools:

| Goal                              | Tool                                                |
| --------------------------------- | --------------------------------------------------- |
| Find slow renders                 | React DevTools Profiler                             |
| Find big bundle chunks            | source-map-explorer, vite-bundle-visualizer, `@next/bundle-analyzer` |
| Measure Core Web Vitals           | `web-vitals` package, Lighthouse, PageSpeed Insights |
| Find blocking JS                  | Chrome Performance panel                            |
| Find layout thrash                | Chrome Performance panel (Layout / Paint events)    |

---

## Render Optimization

| Smell                                              | Fix                                                     |
| -------------------------------------------------- | ------------------------------------------------------- |
| Parent re-renders → 50 children all re-render      | `React.memo` the child if its props don't change        |
| Inline `{() => …}` passed to a memoized child      | Stabilize with `useCallback` (only after measuring)     |
| Inline `{{ … }}` object literals in props          | Promote to a `useMemo` (only after measuring)           |
| Expensive computation runs on every keystroke      | `useMemo` the computation, key on the inputs that matter |
| 200 rows render at once with one row visible       | Virtualize with `react-window` / `react-virtual`        |

`useMemo` / `useCallback` cost rules:

- Skip if the inputs don't change rarely enough to matter.
- Skip if the computation is < 0.1 ms.
- Keep if a profiler trace shows wasted child renders disappearing.

---

## Lists

- Stable key from data, not array index, especially when items reorder.
- Virtualize when > 100 visible items at once.
- Paginate or "load more" for large data sets.
- Use `key` to **identify**, not to force remount. Don't change key on each render.

---

## Images

- Modern formats (`.webp` / `.avif`) with fallbacks for older browsers.
- Always set `width` and `height`.
- Use `<picture>` with `srcset` for responsive images at multiple sizes.
- Lazy-load below the fold; eager for hero / LCP.

---

## Bundle Size

- Import only what you use. Named imports beat namespace imports:
  ```ts
  // Bad — pulls in everything
  import * as _ from "lodash";

  // Good
  import debounce from "lodash/debounce";
  ```
- Audit the bundle for accidental heavyweights:
  - `moment` (use `date-fns` or `dayjs`)
  - Full `lodash` (use per-function imports)
  - Full icon sets (cherry-pick the icons you use)
- Per-route code splitting via `React.lazy` (see `details/lazy-loading.md`).

---

## Network

- One fetch path per data source. Wrap in a slice thunk or `useQuery`.
- Cache server data; do not re-fetch on every navigation.
- Debounce search inputs (250–400 ms).
- Cancel stale requests when the user types again or unmounts.
- Co-locate prefetching with `onMouseEnter` for the next-likely route, not
  for everything in the navigation.

---

## CSS

- Avoid global selectors that match thousands of nodes (`*`, `body *`).
- Avoid `!important` to override another rule — fix the rule instead.
- Avoid hand-rolled animation loops; use CSS transitions / Framer Motion
  for stateful animations.
- Avoid huge `box-shadow` chains during scroll (they kill compositing).

---

## Web Vitals Targets

| Metric                   | Target            |
| ------------------------ | ----------------- |
| Largest Contentful Paint | ≤ 2.5 s           |
| Interaction to Next Paint| ≤ 200 ms          |
| Cumulative Layout Shift  | ≤ 0.1             |
| First Contentful Paint   | ≤ 1.8 s           |
| Total Blocking Time      | ≤ 200 ms          |

Track these in CI (Lighthouse) for the marketing site at minimum.

---

## Anti-Patterns

| Anti-pattern                                                       | Fix                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Memoizing everything "just in case"                                | Measure first; memo only what the profiler shows                     |
| `useEffect(() => { setX(f(props)) }, [props])`                     | Derive `x` during render                                             |
| Re-fetching the same data on every navigation                      | Cache via a slice thunk or query layer                               |
| Loading 80 icons from a giant icon set                             | Per-icon imports, or a curated `icons/` re-export                    |
| Animating `width` / `top` in a hot path                            | Animate `transform` / `opacity`; the GPU composites these            |
| `<img>` without `width`/`height`                                   | Always specify; prevents CLS                                         |
| Inline `style={{ ... }}` recreated on every render in a hot list   | Promote to a stable token / class                                    |
| Long lists rendered eagerly                                        | Virtualize with `react-window` / `react-virtual`                     |
| `box-shadow` on every row while scrolling 1000 rows                | Apply shadow once on a parent layer or on hover only                  |

---

## Quick Checklist

- [ ] Bundle was analyzed; heavy modules are dynamically imported.
- [ ] All `<img>` have `width` + `height` and use `loading="lazy"` when
      below the fold.
- [ ] Lists with > 100 visible items are virtualized.
- [ ] No `useMemo`/`useCallback` was added without a profiler trace
      supporting it.
- [ ] No effect mirrors a prop into state.
- [ ] Animations use `transform` / `opacity`.
- [ ] Core Web Vitals are tracked in CI for the marketing site.
