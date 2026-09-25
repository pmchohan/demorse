# Accessibility

Accessibility is a correctness concern, not a nice-to-have.

## Images

- Every `<img>` needs `alt`.
- Decorative images use empty `alt=""` and `role="presentation"`.
- SVG icons used as buttons need an accessible label (`aria-label`).

## Forms

- Every input has an associated `<label>` (via `htmlFor`/`for`) or is wrapped.
- Group related inputs with `<fieldset>` and `<legend>`.
- Required inputs use `required` and an accessible error message via
  `aria-describedby`.

## Buttons and Links

- A clickable thing that performs an action is a `<button>`.
- A clickable thing that navigates is an `<a href="…">`.
- Do not use `<div onClick>` — it is not keyboard accessible.
- Buttons in icon-only form need `aria-label`.

## Keyboard

- All interactive elements must be reachable by Tab.
- Visible focus styles must be preserved (do not remove `outline` without a
  replacement).
- Custom widgets need explicit key handlers (Space/Enter for buttons, Esc to
  close dialogs, arrow keys for lists/menus).

## Headings and Landmarks

- One `<h1>` per page.
- Use `<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>` for landmarks.
- Do not skip heading levels.

## Color and Contrast

- Body text contrast ratio ≥ 4.5:1.
- Large text contrast ratio ≥ 3:1.
- Never use color alone to convey state (add an icon or text).

## ARIA

- Prefer native HTML over ARIA.
- Use ARIA only when no native element fits.
- Roles, states, and properties must match what the widget actually does.

## Anti-Patterns

- `tabindex="-1"` on a primary action.
- `<div role="button">` with no key handler.
- Modal dialogs without focus trap or `aria-modal`.
- Toasts that vanish before a screen reader can announce them.
