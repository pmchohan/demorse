# Pages — Domain-Based Folders

Every page is a folder. The folder is named for the page. The page file
inside it has the same name as the folder. Page-local pieces live in a
sibling `components/` folder.

---

## Top-Level Grouping

Pages group by **role / surface**, then by **domain** inside.

```
src/pages/
├── guest/              # public marketing surface
├── auth/               # login, signup, forgot password
├── member/             # /account/*   — authed customer surface
├── admin/              # /admin/*     — admin console
├── developer/          # /developer/* — developer console
└── errors/             # 404, 500, maintenance
```

Surface choices map 1:1 to route groups in `src/routes/<role>.ts`.

---

## Page Folder Shape

```
pages/guest/Home/
├── Home.tsx                    # the page component
├── Home.types.ts               # local types (route params, view models)
├── Home.fixtures.ts            # optional — fixtures used by Home.test
├── Home.test.tsx               # integration test
├── sections/                   # page sections — one per visual region
│   ├── HeroSection.tsx
│   ├── FeaturesSection.tsx
│   ├── PricingSection.tsx
│   ├── TestimonialsSection.tsx
│   └── CTASection.tsx
└── components/                 # page-local components, not reused elsewhere
    ├── FeatureCard.tsx
    └── PricingToggle.tsx
```

### Sections vs Components

| Folder         | Purpose                                          | Naming                |
| -------------- | ------------------------------------------------ | --------------------- |
| `sections/`    | Full visual regions of the page (Hero, FAQ, CTA) | `*Section.tsx`        |
| `components/`  | Small pieces used inside sections or the page    | CapitalCase `.tsx`    |

Sections represent the major blocks a visitor sees top-to-bottom. Components
are smaller pieces that sections (or the page itself) compose.

### Dashboard Page Example

```
pages/member/Dashboard/
├── Dashboard.tsx
├── sections/
│   ├── KPISection.tsx
│   ├── ActivitySection.tsx
│   └── PerformanceSection.tsx
└── components/
    ├── KPICard.tsx
    └── ActivityRow.tsx
```

Rules:

- File name = folder name = exported component name. CapitalCase.
- The page imports its own layout. Layout selection never happens in routes.
- The page owns its data fetch. Either through Redux dispatch in `useEffect`
  or through a query hook (`useQuery`, `useSWR`).
- Pages with 3+ visual regions should use `sections/`.
- Small pages (a login form, a 404) may skip `sections/` and only use
  `components/` or nothing.

---

## Bigger Domains — Nest Further

When one domain owns many pages, nest a domain folder inside the role.

```
pages/admin/
├── Dashboard/                  # /admin
│   └── Dashboard.tsx
├── users/
│   ├── UsersManagement/        # /admin/users           — list + filters
│   ├── UserDetail/             # /admin/users/:id
│   └── CreateUserForm/         # /admin/users/create    — separate page
├── billing/
│   ├── BillingOverview/        # /admin/billing
│   └── InvoiceDetail/          # /admin/billing/:id
└── system/
    ├── SystemHealth/
    └── AuditLogs/
```

Rules:

- Domain folders inside a role are **lowercase**. Page folders are
  **CapitalCase**.
- A page that has its own separate sub-form (e.g. "create user") becomes a
  **sibling page folder**, not a section of the list page. This keeps routes
  one-to-one with pages.
- A page folder must contain a `.tsx` file with the same name. Anything else
  is a sub-component, a hook, or a fixture for that page.

---

## Page Component Anatomy

```tsx
// src/pages/guest/Home/Home.tsx
import SiteLayout from "@/layouts/SiteLayout/SiteLayout";
import HeroSection         from "./sections/HeroSection";
import FeaturesSection     from "./sections/FeaturesSection";
import PricingSection      from "./sections/PricingSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import CTASection          from "./sections/CTASection";

export default function Home() {
  return (
    <SiteLayout>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </SiteLayout>
  );
}
```

For a data-driven page:

```tsx
// src/pages/member/Dashboard/Dashboard.tsx
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchDashboardSummary } from "@/store/dashboardSlice";
import MemberLayout from "@/layouts/MemberLayout/MemberLayout";
import PageHeader   from "@/components/layout/PageHeader/PageHeader";
import KPISection          from "./sections/KPISection";
import ActivitySection     from "./sections/ActivitySection";
import PerformanceSection  from "./sections/PerformanceSection";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { summary, status } = useAppSelector((s) => s.dashboard);

  useEffect(() => { dispatch(fetchDashboardSummary()); }, [dispatch]);

  return (
    <MemberLayout>
      <PageHeader title="Dashboard" />
      <KPISection data={summary?.kpis} loading={status === "loading"} />
      <ActivitySection posts={summary?.upcoming ?? []} />
      <PerformanceSection trend={summary?.trend} />
    </MemberLayout>
  );
}
```

What the page is allowed to do:

- Import its layout from `layouts/<LayoutName>/`.
- Read params (`useParams`), call data hooks, dispatch.
- Compose `pages/<page>/components/*` and shared `components/<type>/*`.
- Render the page-level header / breadcrumbs.

What the page should not do:

- Define a reusable form, table, or card inline — extract to a component.
- Talk to the API directly — call a service or use a slice/query.
- Hold long-lived global state — that goes in `store/` or a context.

---

## Page-Local Components vs Shared Components

Page-local components live in `pages/<page>/components/`. Move them to
`src/components/<type>/` the moment **any** of these become true:

- A second page imports the same component.
- The component takes only generic props (no domain copy hard-coded).
- It would clearly help another project too.

Reverse direction: if a component in `src/components/<type>/` is only used by
one page, move it into that page's `components/` folder.

---

## Sections Live in `sections/`

A page typically has 3-8 sections (Hero, Features, Pricing, FAQ, CTA, ...).
Each section is a file inside `pages/<page>/sections/`.

```tsx
// src/pages/guest/Home/sections/HeroSection.tsx
import Button from "@/components/atoms/Button/Button";
import { PATHS } from "@/routes/paths";

export default function HeroSection() {
  return (
    <section className="hero">
      <h1 className="hero__title">Transform Your Business with AI Magic</h1>
      <p className="hero__subtitle">...</p>
      <div className="hero__cta">
        <Button href={PATHS.signup}>Start Free Trial</Button>
        <Button variant="ghost" href="#features">See Features</Button>
      </div>
    </section>
  );
}
```

Rules:

- One section per file. Name with `Section` suffix: `HeroSection`,
  `PricingSection`, `FAQSection`.
- Sections import shared components from `src/components/` and page-local
  components from `../components/`.
- Sections should not import another page's sections or components.
- If a section's inner piece (e.g. a PricingCard) is reused across pages,
  promote it to `src/components/<type>/`.

---

## Special Pages

| Page                     | Folder                                                  |
| ------------------------ | ------------------------------------------------------- |
| 404                      | `pages/errors/NotFoundPage/`                            |
| 500                      | `pages/errors/ServerErrorPage/`                         |
| Maintenance              | `pages/errors/MaintenancePage/`                         |
| Auth flow                | `pages/auth/{Login,Signup,ForgotPassword,VerifyEmail}/` |
| Legal                    | `pages/guest/legal/{Privacy,Terms,Cookies}/`            |
| Coming-soon placeholder  | `pages/<role>/ComingSoon/`                              |

A coming-soon page exists once; pages that are "coming soon" link to it
instead of being half-built.

---

## Anti-Patterns

| Anti-pattern                                                          | Fix                                                                          |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Flat `pages/Dashboard.tsx`, `pages/Profile.tsx`                       | Move into role folders with a page folder each                               |
| `pages/admin/UsersAndBilling.tsx` (two domains in one page)           | Split into `pages/admin/users/UsersManagement/` + `pages/admin/billing/`     |
| `pages/dashboard/index.tsx` with no folder                            | Rename folder + file to `pages/<role>/Dashboard/Dashboard.tsx`               |
| Page imports a layout HOC from the route file                         | Page imports the layout directly                                             |
| Page contains a 300-line table inline                                 | Extract to `components/tables/Table` (generic) or to `pages/<page>/components/<Name>Table` (page-local) |
| Page directly calls `axios.get(...)`                                  | Use `services/` + Redux slice or `useQuery`                                  |
| `data.ts` and `types.ts` placed inside `pages/<page>/`                | Use `<PageName>.types.ts` and `<PageName>.fixtures.ts` (typed, co-located)   |
| Two pages share the same `components/` directory above them           | Move shared component to `src/components/<type>/`                            |

---

## Quick Checklist

- [ ] Every page lives at `pages/<role>/[<domain>/]<PageName>/<PageName>.tsx`.
- [ ] Page name = folder name = main exported component name.
- [ ] Pages with 3+ visual regions have a `sections/` folder.
- [ ] Section files use `*Section.tsx` naming.
- [ ] Page-local components live in `components/`, not mixed with sections.
- [ ] Each page imports its own layout from `layouts/<LayoutName>/`.
- [ ] Simple sites use `SiteLayout` only; add other layouts only when needed.
- [ ] No reusable component is defined inside a page file body.
- [ ] No two pages share an ad-hoc components folder above either page.
- [ ] Errors (404, 500) live under `pages/errors/`.
