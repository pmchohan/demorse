# Component Planning

Plan **before** writing. A planned component lands in the right folder, has
the right props, and ships with all required states. An unplanned component
becomes the next `TeamMembersTable.tsx`.

---

## 1. Decide The Layer

Walk this decision tree before opening an editor.

```
Is the piece a smallest UI primitive (button, badge, input)?
└─ Yes → Layer 2 (atom).      components/atoms/<Name>/
└─ No  → next.

Is the piece composed of atoms with no domain copy hard-coded?
└─ Yes → Layer 3 (composite). components/<type>/<Name>/   (cards, tables, …)
└─ No  → next.

Does the piece mention a product / feature / domain term?
└─ Yes → Layer 4 (section/domain).
        ├─ Reused by 2+ pages?  components/domain/<module>/<Name>/
        └─ One page only?        pages/<page>/components/<Name>.tsx
└─ No  → next.

Is the piece an entire page shell (sidebar + main + topbar)?
└─ Yes → Layer 5 (layout). layouts/<LayoutName>/
```

If the piece does not fit any layer, the design is wrong before the code is.
Push back.

---

## 2. Decide The Variants

A variant is a different appearance / behaviour of the **same** component.
Variants are props, not new files.

Standard variant axes:

| Axis        | Typical values                                                    |
| ----------- | ----------------------------------------------------------------- |
| `variant`   | `default`, `primary`, `secondary`, `ghost`, `link`, `outline`     |
| `tone`      | `neutral`, `brand`, `success`, `warning`, `danger`, `info`        |
| `size`      | `xs`, `sm`, `md`, `lg`, `xl`                                      |
| `density`   | `compact`, `comfortable`                                          |
| `direction` | `ltr`, `rtl`                                                      |
| `as`        | the element/component a polymorphic atom renders as               |

Rules:

- Variant unions are typed and exported (`ButtonVariant`, `ButtonTone`).
- Two variants must produce a visually meaningful difference. If they do
  not, drop one.
- Adding a variant is a small change; adding a new component is a big one.
  Prefer the variant.

---

## 3. Decide The States

Every interactive component declares which states it supports:

| State           | Required when                              |
| --------------- | ------------------------------------------ |
| `default`       | always                                     |
| `hover`         | element is interactive                     |
| `focus-visible` | element is keyboard-focusable              |
| `active`        | element is clickable / toggleable          |
| `disabled`      | element can be turned off                  |
| `loading`       | element can fire an async action           |
| `read-only`     | inputs that may be displayed but not edited |
| `invalid`       | inputs that can fail validation            |
| `empty`         | composites that hold a list / collection   |
| `error`         | composites that fetch data                 |
| `coming-soon`   | composites flagged as future feature       |

Rules:

- A11y of every state must be checked.
- Every declared state must appear in the catalog page.
- A state that cannot be reached by toggle in the catalog is missing.

---

## 4. Define The Public API

Write the props type **before** the JSX. The types file is the contract.

```ts
// components/atoms/Button/Button.types.ts
import { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "outline";
export type ButtonTone    = "neutral" | "brand" | "danger" | "success" | "warning";
export type ButtonSize    = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  href?: string;          // when present, renders as <a>
  fullWidth?: boolean;
}
```

Rules:

- Every public component exports its props type.
- Defaults live in the component, not in the type.
- Never accept arbitrary `style` overrides that punch through tokens. Pass a
  `className` for **layout positioning only**.

---

## 5. Define The Slots

For composites that have sub-pieces, decide which slots a consumer can fill.
Slots are named sub-components, not boolean flags.

```tsx
// Good
<Card>
  <Card.Header>…</Card.Header>
  <Card.Body>…</Card.Body>
  <Card.Footer>…</Card.Footer>
</Card>

// Bad — proliferating boolean flags
<Card hasHeader headerText="…" hasFooter footerText="…" />
```

---

## 6. Decide The Data Shape

Components do **not** call APIs. They take typed data via props.

```ts
// components/tables/Table/Table.types.ts
export interface TableColumn<Row> {
  key: keyof Row | string;
  header: string;
  render?: (row: Row) => React.ReactNode;
  align?: "start" | "center" | "end";
  width?: number | string;
}

export interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  state?: "default" | "empty" | "loading" | "error";
  rowKey: (row: Row) => string;
}
```

Why: a `Table` that knows about `TeamMember` cannot render `Invoice`. A
`Table` that takes `columns` and `rows` can render both.

---

## 7. List The Edge Cases

Write down each edge case **before** you encounter it in production:

- Long text overflow (titles, badges, table cells).
- Narrow container (small viewport, sidebar collapsed).
- RTL direction.
- Very large numbers / dates far in the future / negative values.
- Missing optional props.
- Empty list / single item / 100 items / 100,000 items.
- Network failure / very slow response.
- Disabled while submitting.

A catalog "Edge cases" section must demonstrate each.

---

## 8. Plan The Tests

Before writing the component, decide the three tests you will write
(see `details/testing.md` for setup):

1. **Render test** — given default props, the component mounts with no
   `axe` violations.
2. **Interaction test** — keyboard activation / focus / disabled behaviour.
3. **State test** — `loading`, `error`, `empty` all render the right copy.

If the component is purely visual, the catalog page replaces (2) and (3) is
optional, but (1) is always required.

---

## 9. Write A Tiny Spec Block

Drop a 5-line spec at the top of the component's `README.md` before coding:

```
Component: Table
Layer: composite (Layer 3)
Variants: striped | bordered | plain
States: default | empty | loading | error
Slots: Toolbar, Body, EmptyState, Pagination
Used by: any page rendering tabular data (no domain coupling).
```

Spend two minutes here; save two hours later.

---

## Decision Examples

### "We need a Team Members list with avatars and a status pill."

- Layer: **composite** (`tables/Table`) + atom (`Avatar`) + atom (`Badge`).
- Variants: none new; existing `Table` density variant covers density.
- Slots: `Table.Toolbar` (search + filter), `Table.EmptyState`.
- Where: a generic `Table` in `components/tables/Table/`. The Team Members
  page passes its columns:

```tsx
<Table
  columns={[
    { key: "avatar", header: "",        render: r => <Avatar src={r.avatar} /> },
    { key: "name",   header: "Name" },
    { key: "role",   header: "Role" },
    { key: "status", header: "Status",  render: r => <Badge tone={r.tone}>{r.label}</Badge> },
  ]}
  rows={members}
  rowKey={r => r.id}
/>
```

No new component file is created.

### "We need a Brand Kit setup card with logo upload and color pickers."

- Layer: **section** (Layer 4). Used by exactly one page today
  (`/account/brand-kit`).
- Where: `pages/member/BrandKit/components/BrandKitSetup.tsx` for now.
- When a second project / page needs it, promote to
  `components/domain/brand-kit/BrandKitSetup/`.

### "We need an admin sidebar."

- Layer: **layout** (Layer 5).
- Where: `layouts/AdminLayout/partials/Sidebar.tsx`, owned by `AdminLayout`.

---

## Anti-Patterns

| Anti-pattern                                                       | Fix                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Starting with JSX and figuring out props later                     | Define props type first; types file is the contract                  |
| Adding a `BrandKitTable.tsx` instead of generic Table              | Pass `columns`/`rows` to existing `Table`                            |
| Adding a `LargeBrandKitTable.tsx` for one size variant             | Size is a prop on the existing component                             |
| One component handling 5 unrelated layouts via `variant` strings   | Split — 5 layouts is 5 components                                    |
| Accepting `style` / `className` to punch through tokens            | Add a new variant / token instead                                    |
| Putting a domain term in a Layer 2/3 component                     | Move to Layer 4 (`components/domain/`) or page-local                 |
| Forgetting `empty`/`loading`/`error` until the page calls it       | Plan states first; render every state in the catalog                 |

---

## Quick Checklist

- [ ] Layer decided (atom / composite / section / domain / layout).
- [ ] Folder chosen (`components/<type>/` or `pages/<page>/components/`).
- [ ] Variants typed and listed.
- [ ] States listed; each one has a catalog cell planned.
- [ ] Props type written before JSX.
- [ ] Slots are named sub-components, not boolean flags.
- [ ] No domain term in Layer 2/3.
- [ ] No `style`/`className` punch-through accepted.
- [ ] Three tests planned (render, interaction, state).
