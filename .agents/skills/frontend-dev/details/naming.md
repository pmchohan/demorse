# Naming

Names tell a reader **what** the file is and **where** it should live.

---

## Files & Folders

| Kind                          | Case          | Example                                              |
| ----------------------------- | ------------- | ---------------------------------------------------- |
| Component file                | CapitalCase   | `Button.tsx`, `UserDetail.tsx`                       |
| Component folder              | CapitalCase   | `components/atoms/Button/`                           |
| Component-type folder         | lowercase     | `components/atoms/`, `components/tables/`            |
| Page file & page folder       | CapitalCase   | `pages/admin/users/UsersManagement/UsersManagement.tsx` |
| Page domain folder            | lowercase     | `pages/admin/users/`, `pages/member/billing/`        |
| Layout file & folder          | CapitalCase   | `layouts/AdminLayout/AdminLayout.tsx`                |
| Hook file                     | camelCase     | `hooks/useDisclosure.ts`                             |
| Store / slice file            | camelCase     | `store/devicesSlice.ts`                              |
| Route group file              | lowercase     | `routes/admin.ts`, `routes/guest.ts`                 |
| Middleware file               | CapitalCase   | `middleware/AuthMiddleware.tsx`                      |
| Service file                  | CapitalCase   | `services/AuthService.ts`, `services/apiService.ts`  |
| Theme / token file            | camelCase     | `theme/colors.ts`, `theme/spacing.ts`                |
| Test file                     | `<Name>.test` | `Button.test.tsx`, `Dashboard.test.tsx`              |
| Fixtures / mocks              | `<Name>.fixtures` or `mocks/<name>.ts` | `Button.fixtures.ts`, `mocks/users.ts` |
| Types co-located              | `<Name>.types` | `Button.types.ts`                                    |
| Variants config               | `<Name>.variants` | `Button.variants.ts`                              |

Rules:

- **One primary export per file.** File name = main exported symbol.
- Pick one case for non-component files (camelCase) and one for components
  (CapitalCase). Never mix `publishContentAssets.ts` next to
  `PublishContentCard.tsx` in the same folder.
- **No `data.ts` or `types.ts` inside `components/` or `layouts/`.** Use
  `<Name>.fixtures.ts` and `<Name>.types.ts` co-located with the component.
- **No generic dump folders** (`components/utils/`, `components/helpers/`,
  `components/common/`). Use type-based folders.

---

## Components

```
Button.tsx                     // Layer 2 atom
IconButton.tsx                 // Layer 2 atom (variant of button family but a distinct DOM)
Card.tsx                       // Layer 3 composite
MetricCard.tsx                 // Layer 3 composite — distinct DOM, not just a variant
Modal.tsx                      // Layer 3 composite
PostSequenceEditor.tsx         // Layer 4 domain section
SiteLayout.tsx                 // Layer 5 layout
```

Disallowed component names:

- `MainComponent`, `BaseComponent`, `Generic*`, `Common*`, `Misc*`.
- Vendor-prefixed: `MuiButton`, `AntCard`, `RadixModal`. Wrap vendors behind
  a project-named atom (`Button` that internally uses Radix).
- Domain-named in Layer 2/3: `TeamMembersTable`, `PublishRunTable`,
  `BrandKitCard`. These belong in Layer 4 (`components/domain/`) or in
  `pages/<page>/components/`.

---

## Pages

```
pages/<role>/<PageName>/<PageName>.tsx                          // simple
pages/<role>/<domain>/<PageName>/<PageName>.tsx                 // bigger
pages/admin/users/UsersManagement/UsersManagement.tsx           // canonical
```

Disallowed page names:

- `Index.tsx` (use the parent folder's name).
- `Page.tsx` as a generic file name (use the page's actual name).
- `Dashboard.tsx` placed in `pages/` root (must live under a role folder).

---

## Routes

```
routes/index.ts        // composer (data only)
routes/guest.ts        // group
routes/auth.ts         // group
routes/member.ts       // group
routes/admin.ts        // group
routes/developer.ts    // group
routes/redirects.ts    // redirects map
routes/paths.ts        // PATHS constants
```

Rules:

- Route group file name = role name, lowercase, **no extension `.tsx`**.
- Route files contain **only data** (object/array of `path → Page`).
- Routes never re-export pages directly under a new name; they import
  pages by their real name.

---

## Middleware & Services

```
middleware/AuthMiddleware.tsx
middleware/RoleGuard.tsx
middleware/GuestMiddleware.tsx
middleware/FeatureFlagMiddleware.tsx
services/AuthService.ts
services/apiService.ts
services/PaymentsService.ts
```

Rules:

- Middleware ends with `Middleware` or `Guard`.
- Service ends with `Service` (except `apiService.ts` which is the shared
  axios/fetch instance).
- One responsibility per file.

---

## Hooks

```
hooks/useAuth.ts
hooks/useDisclosure.ts
hooks/useDebouncedValue.ts
hooks/useMediaQuery.ts
hooks/useShortcut.ts
hooks/useThemeMode.ts
```

Rules:

- Always starts with `use`.
- camelCase.
- File contains a single `export function useThing(...)`.
- No JSX in a hook file.

---

## Store / Slices

For Redux Toolkit:

```
store/index.ts                     // configureStore
store/devicesSlice.ts              // <domain>Slice.ts
store/customersSlice.ts
store/campaignsSlice.ts
store/uiSlice.ts                   // app-wide UI state only
```

Rules:

- One slice = one domain.
- Slice file exports the reducer as default and the thunks/actions as named.
- Reducer key in `configureStore` matches the slice name without `Slice`.

For Zustand / Pinia / Jotai, follow the library convention but keep the
"one store file per domain" rule.

---

## Theme

```
theme/
├── colors.ts
├── typography.ts
├── spacing.ts
├── radii.ts
├── shadows.ts
├── motion.ts
├── breakpoints.ts
├── zIndex.ts
├── themes/
│   ├── light.ts
│   ├── dark.ts
│   └── brand-a-light.ts
└── globals.css                # CSS variables emitted from tokens
```

Rules:

- Token files are camelCase.
- Tokens are semantic (`bg-subtle`, not `gray-200`).
- No `App.css` / `index.css` with global page styling. The only allowed
  global stylesheet is `theme/globals.css` (CSS variables + Tailwind base /
  reset).

---

## Symbols Inside Files

| Kind                | Case        | Example                              |
| ------------------- | ----------- | ------------------------------------ |
| React component     | CapitalCase | `function UserDetail()`              |
| Hook                | camelCase   | `function useDisclosure()`           |
| Helper function     | camelCase   | `function formatCurrency()`          |
| Constant            | UPPER_CASE  | `const MAX_FILE_SIZE = 5_000_000`    |
| Type / interface    | CapitalCase | `interface UserListResponse`         |
| Enum                | CapitalCase | `enum UserStatus`                    |
| CSS variable        | kebab-case  | `--color-bg-subtle`                  |
| Tailwind class      | kebab-case  | `bg-surface text-fg-default`         |

Rules:

- No `let` for module-level data that never reassigns — use `const`.
- No `any` in public component types. If unavoidable inside, comment why.
- Never use vendor terms in public symbol names (`fetchMuiUsers`,
  `usePgBossJob`).

---

## File Order Inside A Component File

```tsx
// 1. Imports — built-in, then external, then local
// 2. Local types
// 3. Local constants
// 4. Local helpers (small)
// 5. Component
// 6. Optional sub-components (named exports)
```

For class-shaped components or large composites with sub-components,
prefer one file per sub-component (`Table.Toolbar.tsx`) over a long file.

---

## Anti-Patterns

| Anti-pattern                                                  | Fix                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Layput/`, `compoenents/`, `seervices/` typos                 | Match the canonical directory names exactly                              |
| `helpers.ts`, `utils.ts`, `data.ts`, `types.ts` in components | Co-locate as `<Component>.fixtures.ts` / `<Component>.types.ts`          |
| `App.css` / `index.css` with page styling                     | Move to `theme/globals.css` (tokens only) + per-component CSS modules    |
| Routes as `routes/guest.tsx`                                  | Rename to `routes/guest.ts` and remove JSX                               |
| Mixed casing within one folder                                | Pick CapitalCase for components, camelCase for everything else           |
| Generic component file `MainTable.tsx`                        | `tables/Table.tsx` with `columns` prop                                   |
| Slice files outside `store/`                                  | All slices live under `store/<domain>Slice.ts`                           |
| Hook file containing JSX                                      | Move JSX into a component; hook returns data/handlers only               |
| Layout in `layouts/components/Sidebar.tsx` with no parent     | `layouts/<LayoutName>/partials/Sidebar.tsx`                              |

---

## Quick Checklist

- [ ] Component file & folder names are CapitalCase and match the export.
- [ ] Hook files are camelCase and start with `use`.
- [ ] Route group files are `<role>.ts` (no JSX, no `.tsx`).
- [ ] No `data.ts` / `types.ts` / `helpers.ts` inside `components/` or
      `layouts/`.
- [ ] No `App.css` / `index.css` with page styling.
- [ ] No generic component folders (`components/utils/`, `helpers/`,
      `common/`, `misc/`).
- [ ] No file name contains a vendor word (`Mui*`, `Ant*`, `Radix*`).
- [ ] No Layer 2/3 component name contains a domain term.
