# Styling

One styling system per project. Tokens are CSS variables. Components never
hard-code colors, spacing, or font values.

---

## Pick One System

| System                       | When to choose                                       |
| ---------------------------- | ---------------------------------------------------- |
| **Tailwind + tokens**        | Default for new projects; classes resolve to CSS variables |
| **CSS Modules + tokens**     | When utility classes are not desired                 |
| **MUI / Chakra / Mantine**   | When a heavy component library is the foundation; theme drives tokens |
| **styled-components / Emotion** | Existing project already uses it                  |

Mixing two systems casually is the main cause of styling drift. **Pick one
per project and never break that rule.**

---

## Tokens Are CSS Variables

```css
/* src/theme/globals.css */
:root {
  --color-bg-app:        220 14% 100%;
  --color-bg-surface:    220 14% 98%;
  --color-fg-default:    220 14% 10%;
  --color-fg-muted:      220 14% 40%;
  --color-brand-500:     222 84% 56%;
  --color-danger-500:    0 84% 60%;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;

  --font-display: "Inter Variable", system-ui, sans-serif;
  --font-body:    "Inter Variable", system-ui, sans-serif;
}

:root[data-theme="dark"] {
  --color-bg-app:        220 14% 6%;
  --color-bg-surface:    220 14% 10%;
  --color-fg-default:    220 14% 96%;
  --color-fg-muted:      220 14% 70%;
}

:root[data-brand="brand-a"] {
  --color-brand-500: 14 92% 60%;
  --radius-md: 0.75rem;
}
```

Rules:

- Token name is **semantic** (`bg-app`, `fg-muted`), not literal (`gray-200`).
- Two themes ship by default (light + dark). Brand themes layer on top.
- Switch themes by toggling `data-theme` / `data-brand` on `<html>` — no
  re-render, no JS state library.

---

## Components Use Tokens, Not Values

```tsx
// Good — classes resolve to tokens
<button className="bg-brand-500 text-fg-on-brand rounded-md px-3 py-2">

// Good — CSS module
<button className={s.primary}>
```

```css
.primary {
  background: hsl(var(--color-brand-500));
  color:      hsl(var(--color-fg-on-brand));
  border-radius: var(--radius-md);
}
```

```tsx
// Bad
<button style={{ background: "#3b82f6", borderRadius: 8 }}>
<button className="bg-[#3b82f6] rounded-[8px]">
<div style={{ marginTop: 17 }}>
```

Rules:

- No hex / rgb / px / pt literals in component files.
- No font-family literals in components — use the typography tokens.
- No magic-number margins or paddings — use the spacing scale.

---

## Inline `style={{ … }}` — Limited Cases Only

Inline `style` is acceptable for:
- One-off **dynamic** values that cannot be expressed in classes
  (computed positions, drag offsets, computed grid templates).

Inline `style` is **not** acceptable for:
- Design tokens (colors, spacing, radius, font sizes).
- Anything that would be repeated on a second element.

---

## Class Naming (When Not Using Tailwind)

For CSS Modules — short, component-local names:

```css
.root      { … }
.title     { … }
.title--large { … }
.body      { … }
```

For plain CSS (no modules) — use BEM:

```css
.card                { … }
.card__header        { … }
.card__body          { … }
.card--featured      { … }
.card--featured .card__header { … }
```

For Tailwind — keep class lists scannable. Extract to a component when a
class list exceeds ~6 utilities **and** is reused.

---

## No Giant Global Stylesheets

The 18-report flagged `index.css` / `App.css` containing hundreds of lines
of page-level rules as a major smell. It hides what a component looks like
and makes themes impossible.

Allowed global stylesheets:

| File                  | Allowed contents                                       |
| --------------------- | ------------------------------------------------------ |
| `theme/globals.css`   | CSS variable definitions, Tailwind base layer, reset   |
| `theme/print.css`     | Print-only overrides                                   |

Everything else lives next to its component (CSS module, scoped style, or
Tailwind classes inside JSX).

---

## Responsiveness

- **Mobile-first.** Base styles target the smallest viewport; `@media (min-width: ...)`
  scales up.
- Avoid fixed pixel widths. Use `rem`, `%`, `min()` / `max()` / `clamp()`.
- Test at small (≤375 px), medium, and large breakpoints. Catalog pages
  must render at each breakpoint.
- Sidebar collapses at the medium breakpoint by default (configurable via
  layout prop).

---

## Animation

- Default: CSS transitions on `transform` / `opacity`.
- Reach for Framer Motion only when a transition has multiple stages or
  needs gesture handling.
- Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

Animations and transitions must be present on interactive elements —
hover, focus, open/close, scroll-in. A site without any motion looks
broken (per the 18-report finding).

---

## Anti-Patterns

| Anti-pattern                                                       | Fix                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `style={{ color: "#ff5500" }}` in many files                       | Move to a token; reference via class                                 |
| `bg-[#3b82f6]` arbitrary Tailwind values                           | Use the token class (`bg-brand-500`)                                 |
| Multiple competing global stylesheets                              | One `theme/globals.css` for variables + reset only                   |
| `App.css` / `index.css` with page-level rules                       | Co-locate styles next to components                                  |
| `!important` to defeat another rule                                | Fix the other rule                                                   |
| Different font sizes in every component                            | Use the typography scale tokens                                      |
| Animations / transitions missing on hover and focus                | Add CSS transitions; respect `prefers-reduced-motion`                |
| Sidebar that doesn't collapse on narrow viewports                  | Mobile-first responsive layout in the layout component               |
| `outline: none` on a focusable element                             | Provide a custom focus ring                                          |
| Mixing two styling systems (Tailwind + styled-components)          | Pick one per project; migrate, don't mix                             |

---

## Quick Checklist

- [ ] One styling system in the project; no mixing.
- [ ] No hex / rgb / px literals in component files.
- [ ] No `style={{ ... }}` for design tokens.
- [ ] One `theme/globals.css` for CSS variables + reset; no other globals.
- [ ] Light + dark themes work via `data-theme` toggle without re-render.
- [ ] Components render at small, medium, and large breakpoints.
- [ ] Interactive elements have visible hover and focus styles.
- [ ] Animations respect `prefers-reduced-motion`.
- [ ] No `!important` used to override another rule.
