---
name: frontend-dev
description: Scaffolds, reviews, and refactors frontend projects with grouped/nested JSON-driven routing, domain-based pages, splittable type-organized components, planned reusability, lazy loading, strict naming, and automated tests.
version: 3.0.0
author: MAbdullahAhmad
tags: [frontend, react, routing, pages, components, lazy-load, testing, redux]
triggers:
  - "scaffold a frontend project"
  - "add a new page"
  - "set up routing"
  - "add a middleware / route guard"
  - "split this component"
  - "is this component reusable"
  - "add lazy loading"
  - "add tests for this component"
  - "review this frontend file"
  - "fix this folder structure"
---

# SKILL: Frontend Development

## When to Use This Skill

Activate when the user asks to:
- Scaffold a new frontend project or set up its routing / store / layouts.
- Add or refactor a route, middleware, page, or layout.
- Build or split a component; decide whether a component is reusable.
- Plan a component before writing it (props, variants, states).
- Add lazy loading at the route, module, or asset level.
- Add or review automated tests (unit, integration, visual, a11y).
- Audit a frontend file or folder for naming, structure, or reuse issues.

Do NOT activate when:
- The work is a backend HTTP route or controller → use `api-dev`.
- The work is project layer boundaries / module split → use `software-architecture`.
- The work is purely about naming or comment style of plain code → use `programming-style`.

---

## Phase 1 — Detect Issues

Run the relevant check script(s) on the file(s) or folder. Each script is
focused — run only what applies to the current task.

| Script                  | Use when                                              |
| ----------------------- | ----------------------------------------------------- |
| `check-structure.py`    | Auditing project layout, layouts, naming, file sizes  |
| `check-routing.py`      | Adding/reviewing routes or lazy loading               |
| `check-pages.py`        | Adding/reviewing pages, sections, page components     |
| `check-components.py`   | Adding/reviewing shared components                    |
| `check-a11y.py`         | Accessibility audit on any JSX/Vue/Svelte file        |
| `check-styling.py`      | Styling audit (CSS/SCSS + inline styles)              |
| `check-correctness.py`  | General correctness (keys, secrets, DOM, console)     |

```bash
python3 skills/frontend-dev/scripts/check-pages.py src/pages/
python3 skills/frontend-dev/scripts/check-components.py src/components/
python3 skills/frontend-dev/scripts/check-a11y.py src/pages/guest/Home/
python3 skills/frontend-dev/scripts/check-structure.py src/
```

Findings format: `path:line: [SEVERITY] [RULE] message`.
All scripts accept files or directories. See `scripts/README.md` for rule details.

---

## Phase 2 — Plan Structure Before Writing Code

Before adding pages or components, lock these decisions in this order:

1. **Routing** — group routes by role (`guest`, `auth`, `member`/`account`,
   `admin`, `developer`). Each group is a `.ts`/`.js` data file exporting an
   object (or array) of `path → Page`. A single `routes/index.ts` composes the
   groups with prefixes. Middlewares (`AuthMiddleware`, `RoleGuard`) wrap
   pages — routes never render JSX. See `details/routing.md`.
2. **Pages** — domain-based folders under `src/pages/<role>/<PageName>/`.
   Each page is its own folder with `sections/` for page sections (Hero,
   Pricing, FAQ) and `components/` for page-local components. Big pages
   split further (`pages/admin/users/CreateUserForm/`). See
   `details/pages.md`.
3. **Components** — `src/components/` holds **all reusable components**.
   This includes atoms (Button, Input), composites (Card, Modal, Table),
   and any component reused across pages (`HeroSliderComponent`,
   `TestimonialCarousel`, `PricingCard`). Organize by type folder:
   `atoms/`, `forms/`, `tables/`, `cards/`, `sliders/`, `overlays/`,
   `navigation/`, `feedback/`, `layout/`, `marketing/`, etc. Domain-
   specific composites used by multiple pages go in
   `components/domain/<module>/`. See `details/components.md`.
4. **Component planning** — decide the layer (atom / composite / section /
   template / domain), props, variants, and required states (`default`,
   `hover`, `focus`, `active`, `disabled`, `loading`, `empty`, `error`,
   `coming-soon`) before writing. See `details/component-planning.md`.
5. **Lazy loading** — route-level `React.lazy` for every page outside the
   initial path; module-level dynamic import for heavy libraries (charts,
   editors, PDF); `loading="lazy"` on below-the-fold images. See
   `details/lazy-loading.md`.
6. **Naming** — see `details/naming.md`. Components CapitalCase; hooks
   `useThing`; routes are `.ts`/`.js` data; layouts each get their own
   folder; styles use tokens not magic values.
7. **Tests** — Vitest + RTL for unit/integration; Playwright for visual
   regression; axe-core for a11y. Tests mirror source paths. See
   `details/testing.md`.

---

## Phase 3 — Apply Fixes

Apply in this priority order:

1. **Project layout** — fix routes-as-JSX, missing middleware split,
   pages outside `pages/<role>/`, components organized by domain instead
   of by type, layouts without their own folder, giant `App.css`/`index.css`.
2. **Reusability** — promote duplicated UI into `components/<type>/`;
   reject project-name component files (`TeamMembersTable.tsx`,
   `PublishRunTable.tsx`) — turn them into a generic `Table` with props.
3. **Accessibility** — `alt`, `<label>` association, semantic
   button/anchor, focus outlines, `tabIndex`. See `details/accessibility.md`.
4. **Correctness** — stable `key`, no DOM reach-ins, no unsafe HTML, no
   leaked secrets.
5. **State boundaries** — local state stays in component; cross-tree
   state in a store (Redux Toolkit / Zustand / Pinia); server data in a
   query layer (React Query / SWR). See `details/state.md`.
6. **Styling** — design tokens via CSS variables; one styling system per
   project. See `details/styling.md`.
7. **Lazy loading** — apply route-level + heavy-module + image lazy
   loading. See `details/lazy-loading.md`.
8. **Tests** — add a unit test for any new pure component, a catalog
   sample for any new visual variant, an integration test for any new page.
   See `details/testing.md`.

---

## Phase 4 — Verify

1. Re-run the relevant `scripts/check-*.py` — must have no WARN findings.
2. Tab through any new component: every interactive element reachable;
   visible focus.
3. Routes are `.ts`/`.js`, contain no JSX, and registration lives only in
   `App.tsx` / `main.tsx`.
4. Every `pages/<role>/<PageName>/` has a `<PageName>.tsx` and (if the
   page is non-trivial) `sections/` and/or `components/`.
5. No file in `components/` is named after a single project page or
   tenant role.
6. No "above-the-fold" content is lazy-loaded; everything else considered.
7. Report changes as `file:line - rule - fix` plus a "moves" list
   (`from → to`) when files were relocated.

---

## Quick Reference

### Source Layout

```
src/
├── routes/
│   ├── index.ts            # composes { prefix, routes } groups
│   ├── guest.ts
│   ├── auth.ts
│   ├── member.ts           # or account.ts
│   ├── admin.ts
│   └── developer.ts
├── middleware/
│   ├── AuthMiddleware.tsx
│   ├── RoleGuard.tsx
│   └── GuestMiddleware.tsx
├── layouts/
│   ├── SiteLayout/         # simple sites need ONLY this
│   │   ├── SiteLayout.tsx
│   │   └── partials/{Header,Footer,Navbar}.tsx
│   ├── AdminLayout/        # add only when admin panel exists
│   ├── MemberLayout/       # add only when member dashboard exists
│   └── BlankLayout/        # add only when needed (auth, modals)
├── pages/
│   ├── guest/Home/
│   │   ├── Home.tsx
│   │   ├── sections/{Hero,Features,Pricing,FAQ,CTA}.tsx
│   │   └── components/{...page-local components...}
│   ├── auth/Login/Login.tsx + components/
│   ├── member/Dashboard/Dashboard.tsx + sections/ + components/
│   └── admin/users/{UsersManagement,CreateUserForm}/...
├── components/             # ALL reusable components
│   ├── atoms/{Button,Input,Badge,...}/
│   ├── forms/
│   ├── tables/
│   ├── cards/
│   ├── sliders/{HeroSlider,TestimonialCarousel,...}/
│   ├── typography/
│   ├── charts/
│   ├── overlays/{Modal,Drawer,...}/
│   ├── navigation/
│   ├── feedback/
│   ├── layout/
│   ├── marketing/{PricingCard,FeatureGrid,...}/
│   └── domain/<module>/    # cross-page domain composites
├── hooks/
├── store/                  # redux slices OR query-layer setup
│   ├── index.ts
│   └── <domain>Slice.ts
├── services/               # API clients only — no UI
├── theme/                  # tokens + CSS variables
├── mocks/                  # fixtures for catalog + tests
├── App.tsx
└── main.tsx
```

### Layout Decisions

| Project type               | Layouts needed                              |
| -------------------------- | ------------------------------------------- |
| Simple website / landing   | `SiteLayout` only                           |
| Website + auth pages       | `SiteLayout` + `BlankLayout`                |
| SaaS with member dashboard | `SiteLayout` + `MemberLayout` + `BlankLayout` |
| SaaS with admin panel      | All four (Site, Member, Admin, Blank)       |

Start with `SiteLayout`. Add others only when you have pages that need them.

### Routing Quick Decisions

| Need                                | Where it goes                                 |
| ----------------------------------- | --------------------------------------------- |
| Path → page mapping                 | `routes/<role>.ts` as data (no JSX)           |
| Combine groups + prefixes           | `routes/index.ts`                             |
| Auth / role enforcement             | `middleware/<Name>Middleware.tsx`             |
| Layout selection                    | Page imports its layout; routes never wrap    |
| Convert JSON routes → framework     | `App.tsx` only                                |

### Component Layer Decisions

| Question                                               | Location                                           |
| ------------------------------------------------------ | -------------------------------------------------- |
| Smallest UI primitive (button, badge, input)           | `components/atoms/`                                |
| Composed of atoms; reusable (card, modal, table)       | `components/<type>/` (cards, overlays, tables)     |
| Reusable across pages (HeroSlider, PricingCard)        | `components/<type>/` (sliders, marketing, etc.)    |
| Domain composite used by multiple pages                | `components/domain/<module>/`                      |
| Whole layout shell (sidebar + main + topbar)           | `layouts/<LayoutName>/`                            |
| Full section of a page (Hero, FAQ, Features)           | `pages/<page>/sections/`                           |
| Used by only one page                                  | `pages/<page>/components/`                         |

### Lazy-Load Decisions

| Asset / module                          | Lazy?               |
| --------------------------------------- | ------------------- |
| Pages outside initial path              | Yes (`React.lazy`)  |
| Login page / initial layout             | No                  |
| Charts / editors / PDF / heavy SDKs     | Yes (dynamic import inside the using page) |
| Below-the-fold images                   | Yes (`loading="lazy"`) |
| Above-the-fold hero / logo              | No                  |
| Sidebar, navbar, primary CTA            | No                  |

### Test Decisions

| Surface                                     | Tool                 |
| ------------------------------------------- | -------------------- |
| Pure component / hook unit                  | Vitest + RTL         |
| Page integration (forms, navigation)        | Vitest + RTL + MSW   |
| Visual regression of every variant         | Playwright snapshots |
| Accessibility on every catalog page         | axe-core via Playwright |
| End-to-end critical flow                    | Playwright (real or mocked backend) |

---

## Common Mistakes to Avoid

| Anti-pattern                                                          | Correct approach                                                                 |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Routes file `.tsx` rendering JSX wrappers (`withGuestLayout(Page)`)   | Route file is `.ts` data; layout is imported inside the page                     |
| `components/teamroles/TeamMembersTable.tsx` (domain-named in shared)  | `components/tables/Table.tsx` with `columns` + `rows` props                      |
| `components/auth/LoginForm.tsx` reused only by `/login`               | Move to `pages/auth/Login/components/LoginForm.tsx`                              |
| Flat `pages/admin/` with one file per page                            | `pages/admin/<Domain>/<PageName>/<PageName>.tsx` with `components/`              |
| Mixed case files (`publishContentAssets.ts` + `PublishContentCard.tsx`) | Components CapitalCase; data/hook files camelCase                              |
| Layout files dumped in `layouts/components/`                          | `layouts/<LayoutName>/{LayoutName.tsx, partials/}`                               |
| `data.ts` / `types.ts` inside `components/` or `layouts/`             | Move to `mocks/` (data) and component's `.types.ts` (types)                      |
| One giant `index.css` / `App.css`                                     | Token-driven utility classes + per-component CSS modules / `<style scoped>`      |
| Loading every page on first render                                    | `React.lazy(() => import('./pages/...'))` for every non-initial page             |
| Storing server data and UI flags in the same Redux slice              | Server data → React Query / SWR; only app-wide UI flags → Redux                   |
| Same fetch logic copied across pages                                  | Extract into a Redux slice thunk or a `useQuery` hook                            |
| No tests, only manual click-through                                   | At least one Vitest test per component + Playwright snapshot per catalog page   |

---

## Quality Checklist

- [ ] Relevant `scripts/check-*.py` return no WARN findings.
- [ ] Routes are `.ts`/`.js`, contain no JSX, register only in `App.tsx`.
- [ ] Middlewares (`AuthMiddleware`, `RoleGuard`) wrap pages, not layouts.
- [ ] Every page lives at `pages/<role>/<PageName>/<PageName>.tsx`.
- [ ] Pages have `sections/` for page regions and `components/` for local pieces.
- [ ] `src/components/` contains all reusable components (atoms through
      composites like `HeroSlider`, `PricingCard`, etc.).
- [ ] Simple sites use only `SiteLayout`; extra layouts added only when needed.
- [ ] Each layout has its own folder with `partials/`.
- [ ] One component per file; file name matches the exported component.
- [ ] All non-initial pages are wrapped in `React.lazy`; heavy modules
      use dynamic import.
- [ ] Below-the-fold `<img>` use `loading="lazy"` with `width`/`height`.
- [ ] Server data lives in a query layer / Redux thunk, not in component state.
- [ ] Theme values come from tokens / CSS variables, never magic strings.
- [ ] Each new component has at least one Vitest test and a catalog sample.
- [ ] No `console.log`/`debug` left in committed code.

---

## Detail Index

| Topic                | File                                |
| -------------------- | ----------------------------------- |
| Routing              | `details/routing.md`                |
| Pages                | `details/pages.md`                  |
| Components (by type) | `details/components.md`             |
| Component planning   | `details/component-planning.md`     |
| Lazy loading         | `details/lazy-loading.md`           |
| Naming               | `details/naming.md`                 |
| Testing              | `details/testing.md`                |
| State & store        | `details/state.md`                  |
| Accessibility        | `details/accessibility.md`          |
| Styling              | `details/styling.md`                |
| Performance          | `details/performance.md`            |

---

## Changelog

| Version | Date       | Change                                                                 |
| ------- | ---------- | ---------------------------------------------------------------------- |
| 3.0.0   | 2026-05-21 | Simplified layouts (SiteLayout default), added sections/ to pages, broadened components/ to hold any reusable component, split into 7 focused check scripts. |
| 2.0.0   | 2026-05-21 | Major rewrite: routing, pages, splittable components, planning, lazy loading, testing, project-specific anti-patterns from EigenSol/SRC report. |
| 1.0.0   | 2026-05-21 | Initial release (a11y, state, components, styling, performance).        |
