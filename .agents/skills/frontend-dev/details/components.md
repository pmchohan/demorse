# Components — All Reusable, Organized By Type

`src/components/` holds **every reusable component** — from small atoms
(Button, Badge) through composites (Card, Modal) to larger reusable pieces
(HeroSlider, PricingCard, TestimonialCarousel). If a component is used by
more than one page, it belongs here. Organize by type folder, not by domain.

---

## The Five Layers

```
Layer 5 — Page Templates       layouts/* + templates/*
Layer 4 — Sections & Domain    components/domain/<module>/ + pages/<page>/components/
Layer 3 — Composites           components/{cards,overlays,tables,navigation,...}/
Layer 2 — Atoms                components/atoms/
Layer 1 — Tokens               theme/* (CSS variables, scales, themes)
```

Rules:

- Higher layers may import lower layers. Lower layers must never import higher.
- Layer 1 is pure data (no React).
- Layers 2–3 must not mention any product name, tenant, or domain term.
- Layer 4 is the first layer allowed to be domain-specific.
- Layer 5 owns page shells (sidebar + main + topbar).

---

## Type-Based Folder Layout

```
src/components/
├── atoms/                   # Layer 2 — smallest primitives
│   ├── Button/
│   ├── IconButton/
│   ├── Badge/
│   ├── Avatar/
│   ├── Spinner/
│   ├── Skeleton/
│   ├── Divider/
│   └── Tooltip/
├── forms/                   # Layer 2 — form atoms
│   ├── TextField/
│   ├── SelectField/
│   ├── CheckboxField/
│   ├── RadioField/
│   ├── ToggleSwitch/
│   ├── DatePicker/
│   ├── FileInput/
│   └── SearchField/
├── typography/              # Layer 2 — semantic text
│   ├── Heading/
│   ├── Paragraph/
│   ├── Code/
│   └── Eyebrow/
├── tables/                  # Layer 3 — composite
│   └── Table/
├── cards/                   # Layer 3
│   ├── Card/
│   ├── MetricCard/
│   ├── StatCard/
│   └── KeyValueList/
├── sliders/                 # Layer 3 — any reusable slider/carousel
│   ├── HeroSlider/
│   ├── TestimonialCarousel/
│   └── ImageGallery/
├── overlays/                # Layer 3
│   ├── Modal/
│   ├── Drawer/
│   ├── DropdownMenu/
│   ├── Popover/
│   └── ConfirmDialog/
├── navigation/              # Layer 3
│   ├── Breadcrumbs/
│   ├── Tabs/
│   ├── Stepper/
│   └── Pagination/
├── feedback/                # Layer 3
│   ├── Alert/
│   ├── Toast/
│   ├── EmptyState/
│   ├── ErrorState/
│   ├── Loading/
│   └── Skeleton/
├── layout/                  # Layer 3 — primitives, NOT page shells
│   ├── Stack/
│   ├── Grid/
│   ├── Container/
│   ├── Divider/
│   └── PageHeader/
├── charts/                  # Layer 3
│   ├── LineChart/
│   ├── BarChart/
│   ├── DonutChart/
│   └── ChartCard/
├── marketing/               # Layer 3 — reusable marketing/landing pieces
│   ├── PricingCard/
│   ├── FeatureGrid/
│   ├── LogoCloud/
│   └── SocialProof/
└── domain/                  # Layer 4 — first allowed to know about the product
    ├── campaigns/
    ├── inbox/
    ├── billing/
    └── …
```

The key principle: **any component reused across pages belongs here**.
Not just atoms — also composites like `HeroSlider`, `PricingCard`,
`TestimonialCarousel`. Create a new type folder when no existing one fits
(e.g. `sliders/`, `marketing/`, `media/`).

Why type-folders not domain-folders:

- A `tables/Table` with `columns` + `rows` props serves Team Members, Publish
  Run, Customers, Invoices, Audit Logs. One implementation, many uses.
- `components/teamroles/TeamMembersTable.tsx` cannot be reused in any other
  project, in any other tenant, or even in the same project's admin panel.

---

## Component Folder Shape

Every component owns a folder, not a flat file.

```
components/atoms/Button/
├── Button.tsx               # implementation
├── Button.types.ts          # props + variant unions, exported
├── Button.variants.ts       # CVA variant config
├── Button.fixtures.ts       # demo data for catalog
├── Button.test.tsx          # Vitest + RTL
├── README.md                # short API + usage
└── index.ts                 # named re-export
```

Larger composites with sub-components keep them inside the same folder:

```
components/tables/Table/
├── Table.tsx
├── Table.Toolbar.tsx
├── Table.Body.tsx
├── Table.Row.tsx
├── Table.Pagination.tsx
├── Table.EmptyState.tsx
├── Table.types.ts
├── Table.test.tsx
└── index.ts
```

Rules:

- File name = component name (CapitalCase).
- Named exports only — no `export default` on components.
- `index.ts` is the only entry point other folders import from.

---

## Variants Live In Props, Not In New Files

A `Card` with a header strip and a `Card` with a metric value are the same
component with different variants.

```tsx
// Good
<Card variant="default">…</Card>
<Card variant="metric">…</Card>
<Card variant="elevated" tone="danger">…</Card>

// Bad — do not create these
components/cards/MetricCard.tsx
components/cards/DangerCard.tsx
components/cards/ElevatedDangerCard.tsx
```

If a "variant" needs a different DOM shape, it is genuinely a different
component (e.g. `Card` vs `MetricCard` — fine — but never
`TeamMembersMetricCard`).

---

## Atoms Compose Nothing

An atom (Button, Input, Badge) never imports another atom. If you find
yourself doing this, the atom is now a composite — move it.

Atoms accept token-driven props only: `tone`, `size`, `variant`, `state`.
Never accept arbitrary `style` overrides; never accept random color hex.

---

## Composites Compose Atoms

A composite (Card, Modal, Tabs) imports atoms freely. It exposes named
sub-components for parts a consumer may want to override:

```tsx
<Table>
  <Table.Toolbar>
    <SearchField />
    <Button variant="primary">New</Button>
  </Table.Toolbar>
  <Table.Body columns={cols} rows={rows} />
  <Table.EmptyState>No data yet.</Table.EmptyState>
  <Table.Pagination total={total} pageSize={20} />
</Table>
```

Rules:

- Composites are headless about content. They take `children`, `items`,
  `columns`, `slots` — never product strings.
- Every composite declares state variants: `default`, `empty`, `loading`,
  `error`, plus interaction states.

---

## Domain Components (Layer 4)

Domain components are the **first** layer allowed to mention product-specific
terms. They live in `components/domain/<module>/`.

```
components/domain/campaigns/
├── PostSequenceEditor/
├── PostSequenceRow/
├── CampaignTypeSelector/
└── CampaignAnalyticsPanel/
```

Rules:

- Domain components compose atoms + composites. They render layout.
- They still take **content via props** — no API calls inside.
- Must be used by **multiple pages** to justify living here.
- A domain component used by only one page belongs in
  `pages/<page>/components/`.

Note: **page sections** (Hero, Pricing, FAQ) live in `pages/<page>/sections/`,
not here. See `details/pages.md`.

---

## Layouts (Layer 5)

Each layout has its own folder. **Start with `SiteLayout` only** — add
others as the project grows.

```
src/layouts/
├── SiteLayout/              # simple sites need ONLY this
│   ├── SiteLayout.tsx
│   └── partials/{Header,Footer,Navbar}.tsx
├── AdminLayout/             # add only when admin panel exists
│   ├── AdminLayout.tsx
│   └── partials/{Sidebar,Topbar,NotificationsDrawer}.tsx
├── MemberLayout/            # add only when member dashboard exists
│   └── partials/{Sidebar,Topbar,SearchBar}.tsx
└── BlankLayout/             # add only when needed (auth pages, modals)
    └── BlankLayout.tsx
```

| Project type               | Layouts needed                              |
| -------------------------- | ------------------------------------------- |
| Simple website / landing   | `SiteLayout` only                           |
| Website + auth pages       | `SiteLayout` + `BlankLayout`                |
| SaaS with member dashboard | `SiteLayout` + `MemberLayout` + `BlankLayout` |
| SaaS with admin panel      | All four (Site, Member, Admin, Blank)       |

Rules:

- A layout is a **layout function**: takes `children` and slots; lays them out.
- A layout owns scroll containers, breakpoints, and global keyboard
  shortcuts that belong to the shell.
- A layout never owns business logic. A page never owns layout logic.
- Do not create layouts speculatively — add them when the first page needs them.

---

## Catalog / Sample Pages

Every reusable component variant must appear in the catalog.

```
src/pages/dev/catalog/
├── foundations/{colors,typography,spacing,radii}/Page.tsx
├── atoms/{buttons,badges,inputs}/Page.tsx
├── tables/Page.tsx
├── cards/Page.tsx
├── overlays/Page.tsx
└── …
```

Rules:

- Catalog pages render **all** variants of the components they cover.
- A new component must ship with at least one catalog cell. If a variant is
  not on a sample page, it does not exist.
- Catalog pages drive visual-regression (`Playwright snapshots`) and a11y
  (`axe-core`) tests.

See `details/testing.md` for the testing wiring.

---

## Promotion / Demotion Rules

A component **moves up** when reuse appears:

```
pages/admin/users/UsersList/components/UsersTable.tsx   (1 page)
        ↓ second page wants a table
src/components/tables/Table.tsx                          (generic; columns + rows)
```

A component **moves down** when reuse disappears:

```
src/components/cards/BrandKitCard.tsx                    (only one page uses it)
        ↓ no longer used by another page
pages/member/BrandKit/components/BrandKitCard.tsx
```

---

## Anti-Patterns

| Anti-pattern                                                    | Fix                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------- |
| `components/teamroles/TeamMembersTable.tsx`                     | `components/tables/Table.tsx` + columns prop                         |
| `components/auth/LoginForm.tsx` reused only by `/login`         | Move to `pages/auth/Login/components/LoginForm.tsx`                  |
| `components/HeroSlider.tsx` at root level                       | `components/sliders/HeroSlider/HeroSlider.tsx` — group by type       |
| `components/Forms.tsx` exporting 30 inputs                      | One folder per input under `components/forms/`                       |
| `components/Card.tsx` and `components/MetricCard.tsx` at root   | Group under `components/cards/`                                      |
| `components/HeroSection.tsx` (page section in components/)      | Move to `pages/<page>/sections/HeroSection.tsx`                      |
| Mixed casing: `publishContentAssets.ts` + `PublishContentCard.tsx` | Components CapitalCase; data files camelCase                        |
| `data.ts` / `types.ts` inside `components/`                     | `<Component>.fixtures.ts` and `<Component>.types.ts` co-located      |
| Four layouts created on day one                                  | Start with `SiteLayout` only; add others when needed                 |
| Atom importing another atom                                     | Promote to composite OR extract the shared piece to a new atom       |
| Default export on a component                                   | Use named exports; default exports break refactors and barrels       |

---

## Quick Checklist

- [ ] Every folder under `components/` is a **type**, not a domain
      (atoms / forms / tables / cards / sliders / marketing / overlays / charts / …).
- [ ] Any component reused across pages lives in `components/<type>/`.
      Create new type folders as needed (sliders/, marketing/, media/, …).
- [ ] No component file name embeds a domain noun (`Team`, `Publish`,
      `BrandKit`) unless it lives in `components/domain/<module>/`.
- [ ] Each component owns a folder with `<Name>.tsx`, types, fixtures,
      test, and `index.ts`.
- [ ] Page sections (Hero, Pricing, FAQ) live in `pages/<page>/sections/`,
      not in `components/`.
- [ ] Variants are props, not new files.
- [ ] Start with `SiteLayout` only — add others when needed.
- [ ] Every public component variant has at least one catalog cell.
