# Lazy Loading

Default: load nothing extra on first paint. Load on demand at three levels —
**routes**, **modules**, and **assets**.

---

## Level 1 — Route-Level Lazy Loading

Every page outside the initial path is `React.lazy`. The wirer wraps lazy
imports in `<Suspense>`. The first paint downloads only the bundle the user
needs.

### What to lazy-load

- All pages **outside** the initial route for the user's role.
- All pages in roles the user is not in (admin pages for a customer, etc.).

### What NOT to lazy-load

- The initial route's page (it would just delay first paint).
- Login / signup if they are the unauthenticated entry points.
- Layout shells (sidebars, navbars) — they belong to the layout file.
- The 404/500 error pages (they must be available offline-of-network).

### Pattern

Keep route files data-only by re-exporting lazy components:

```ts
// src/routes/admin.ts
import { lazy } from "react";

const Dashboard      = lazy(() => import("@/pages/admin/Dashboard/Dashboard"));
const UsersList      = lazy(() => import("@/pages/admin/users/UsersList/UsersList"));
const UserDetail     = lazy(() => import("@/pages/admin/users/UserDetail/UserDetail"));
const CreateUserForm = lazy(() => import("@/pages/admin/users/CreateUserForm/CreateUserForm"));

const admin_routes = {
  "/":              Dashboard,
  "/users":         UsersList,
  "/users/:id":     UserDetail,
  "/users/create":  CreateUserForm,
};

export default admin_routes;
```

The wirer wraps every route in `<Suspense>`:

```tsx
// src/App.tsx (excerpt)
import { Suspense } from "react";
import Loading from "@/components/feedback/Loading/Loading";

<Route
  path={prefix + path}
  element={
    <Suspense fallback={<Loading />}>
      <Wrapped />
    </Suspense>
  }
/>
```

Rules:

- One `<Suspense>` boundary per route (not per component).
- Fallback is a `Loading` from `components/feedback/`, never raw text.
- Never `lazy()` a layout — layouts mount once, lazy adds a flash.

---

## Level 2 — Module-Level Dynamic Import

Heavy libraries used by only one page (charts, editors, PDF, video) are
dynamically imported **inside** the page or component that uses them.

### Heuristic: lazy when

- The module adds > 30 KB minified to the bundle, **or**
- The module is used by < 30% of users, **or**
- The module needs a worker, canvas, or WebAssembly init.

Examples:
- `monaco-editor`, `react-monaco-editor`
- `slate`, `tinymce`, `tiptap`
- `pdfjs-dist`, `pdf-lib`
- `chart.js`, large `recharts` bundles in low-traffic pages
- `xlsx`, `papaparse`
- `mermaid`, `neovis.js`
- 3D libraries (`three`, `@react-three/fiber`)

### Pattern

```tsx
// src/pages/member/Reports/Reports.tsx
import { Suspense, lazy } from "react";
import Loading from "@/components/feedback/Loading/Loading";

const PerformanceChart = lazy(
  () => import("@/components/charts/PerformanceChart/PerformanceChart")
);

export default function Reports() {
  return (
    <>
      <h1>Reports</h1>
      <Suspense fallback={<Loading />}>
        <PerformanceChart data={…} />
      </Suspense>
    </>
  );
}
```

Or for non-component modules:

```tsx
async function exportCSV(rows: Row[]) {
  const { default: papaparse } = await import("papaparse");
  const csv = papaparse.unparse(rows);
  download(csv);
}
```

Rules:

- Dynamic-import the actual heavy module, not a wrapper that re-exports it.
- Wrap the call in user action (button click, modal open) so the network
  request happens at intent time.
- Always handle the import error: heavy modules sometimes fail to load on
  flaky networks.

---

## Level 3 — Asset-Level Lazy Loading

### Images

```tsx
<img
  src="/hero.webp"
  alt="Dashboard overview"
  width={1280}
  height={720}
/>                               // above the fold — eager (default)

<img
  src="/testimonial-3.webp"
  alt="Customer quote"
  width={400}
  height={400}
  loading="lazy"
  decoding="async"
/>                               // below the fold — lazy
```

Rules:

- Always provide `width` and `height` to prevent Cumulative Layout Shift.
- Use modern formats (`.webp`, `.avif`) with fallbacks.
- Lazy-load all images below the fold.
- Never lazy-load the LCP (Largest Contentful Paint) image — it tanks
  Core Web Vitals.

### Iframes

```html
<iframe src="https://www.youtube.com/embed/..." loading="lazy" title="Demo" />
```

### Web Fonts

```html
<link rel="preload" as="font" type="font/woff2" href="/fonts/Inter.woff2" crossorigin>
```

Preload only the **active** font face for first paint. Lazy-load extras via
CSS (`@font-face` with `font-display: swap`).

---

## Code-Splitting Strategy

| Split point        | Tool                                   |
| ------------------ | -------------------------------------- |
| Per route          | `React.lazy(() => import('./Page'))`   |
| Per heavy module   | `await import('./big')`                |
| Per vendor chunk   | Bundler default chunking is fine; do not micro-manage |
| Per CSS file       | One bundle for tokens + base; per-route CSS via CSS Modules |

Anti-pattern: pre-fetching every route on hover before the user has shown
intent — this defeats the bundle reduction. Use the bundler's hint
mechanism only for the next-most-likely-next-route.

---

## Measure, Don't Guess

Before adding any lazy boundary, check the bundle. Adding a `Suspense`
boundary without evidence is just complexity.

```bash
# CRA
npm run build && npx source-map-explorer 'build/static/js/*.js'

# Vite
npm run build -- --report
npx vite-bundle-visualizer

# Next.js
ANALYZE=true npm run build
```

Add lazy boundaries where the analyzer shows a heavy module in a route
chunk it does not need to be in.

---

## Anti-Patterns

| Anti-pattern                                                       | Fix                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `lazy()` on the initial route's page                               | Eager-import it; lazy hurts first paint                                   |
| `lazy()` on every component including atoms                        | Lazy is for routes and heavy modules, not buttons                         |
| `<Suspense>` without a fallback (`fallback={null}`)                | Always provide a `Loading` fallback                                       |
| Importing `monaco-editor` at the top of a route file               | Move inside the page; dynamic-import on user action                       |
| `<img loading="lazy">` on the hero image                           | Hero stays eager; lazy below the fold only                                |
| `<img>` without `width`/`height` (lazy or not)                     | Always specify intrinsic dimensions                                       |
| Prefetching every linked route on hover                            | Prefetch only the next-likely route, or rely on bundler defaults          |
| Adding lazy boundaries without measuring                           | Run the bundle analyzer first; add boundaries where it shows value        |
| Lazy module fails on flaky network with no fallback                | Catch the import error; show a "retry" UI                                 |

---

## Quick Checklist

- [ ] Every page outside the initial path uses `React.lazy`.
- [ ] One `<Suspense>` per route, with a real `Loading` fallback.
- [ ] Login / initial page / layouts are **not** lazy.
- [ ] Heavy modules (charts, editors, PDF) are dynamically imported inside
      the using page or on user action.
- [ ] Below-the-fold images use `loading="lazy"` + `width` + `height`.
- [ ] The hero / LCP image is eager.
- [ ] A bundle analysis was run before adding any boundary.
- [ ] Dynamic-import errors are caught and a retry UI is shown.
