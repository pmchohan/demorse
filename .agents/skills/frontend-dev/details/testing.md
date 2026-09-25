# Automated Tests

Four test layers cover a frontend project. Each layer has one tool. Tests are
co-located with the code they test.

---

## Stack

| Layer              | Tool                              | What it proves                                  |
| ------------------ | --------------------------------- | ----------------------------------------------- |
| Unit / Integration | **Vitest** + **React Testing Library** | Components render, hooks work, pages mount correctly |
| API mocking        | **MSW**                           | Page behaves correctly against a faked backend  |
| Visual regression  | **Playwright** snapshots          | Components look right across browsers / themes  |
| Accessibility      | **axe-core** via Playwright       | No serious a11y violations on any catalog page  |
| E2E (optional)     | **Playwright**                    | Critical flows work end-to-end                  |

(If the project uses Jest + RTL instead of Vitest, the conventions are the
same — only the runner differs.)

---

## Test Placement

Tests live next to the code:

```
components/atoms/Button/
├── Button.tsx
├── Button.test.tsx              # Vitest + RTL

pages/admin/users/UsersManagement/
├── UsersManagement.tsx
├── UsersManagement.test.tsx     # integration test with MSW

hooks/useDisclosure.ts
hooks/useDisclosure.test.ts      # hook test

src/__tests__/                   # cross-cutting / utility tests only
```

Rules:

- **Mirror source paths** for any test that lives in a separate `tests/`
  folder.
- Tests of one component live next to that component.
- Tests of a page integration live next to that page.

---

## Setup Skeleton

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    coverage: { provider: "v8", reporter: ["text", "html"] },
  },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "@/mocks/server";   // MSW server

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());
```

---

## Unit Test — Component

```tsx
// components/atoms/Button/Button.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("calls onClick when activated by keyboard", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalled();
  });

  it("ignores clicks when disabled", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Button>Save</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

What every component test must include:

1. **Render** — default props mount.
2. **Interaction** — keyboard activation + disabled behaviour.
3. **States** — `loading`, `error`, `empty` render the right copy.
4. **A11y** — `axe` returns no violations.

---

## Hook Test

```ts
// hooks/useDisclosure.test.ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDisclosure } from "./useDisclosure";

describe("useDisclosure", () => {
  it("starts closed", () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current.isOpen).toBe(false);
  });

  it("opens and closes", () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });
});
```

---

## Integration Test — Page

```tsx
// pages/admin/users/UsersManagement/UsersManagement.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { makeTestStore } from "@/test/store";
import UsersManagement from "./UsersManagement";

function renderPage() {
  return render(
    <Provider store={makeTestStore()}>
      <MemoryRouter initialEntries={["/admin/users"]}>
        <UsersManagement />
      </MemoryRouter>
    </Provider>
  );
}

describe("UsersManagement", () => {
  it("renders users from the API", async () => {
    renderPage();
    expect(await screen.findByText("Loading…")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("alice@example.test")).toBeInTheDocument()
    );
  });

  it("shows an error when the API fails", async () => {
    server.use(
      http.get("/api/admin/users", () => HttpResponse.error())
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/could not load users/i)).toBeInTheDocument()
    );
  });

  it("opens the create-user form", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /new user/i }));
    expect(screen.getByRole("dialog", { name: /create user/i })).toBeInTheDocument();
  });
});
```

Rules:

- Always wrap in real `MemoryRouter` + real `Provider` — never mock the
  router or store.
- Use MSW for the API. Never let a test hit the real network.
- One test = one behavior. Don't pack three assertions into one test.

---

## MSW — Fake The Backend

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/admin/users", () =>
    HttpResponse.json([
      { id: "u-1", email: "alice@example.test", role: "admin" },
      { id: "u-2", email: "bob@example.test",   role: "member" },
    ])
  ),
  http.post("/api/admin/users", async ({ request }) => {
    const body = (await request.json()) as { email: string };
    return HttpResponse.json({ id: "u-new", email: body.email, role: "member" }, { status: 201 });
  }),
];
```

```ts
// src/mocks/server.ts (node)
import { setupServer } from "msw/node";
import { handlers } from "./handlers";
export const server = setupServer(...handlers);

// src/mocks/browser.ts (catalog / dev)
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
export const worker = setupWorker(...handlers);
```

Rules:

- Tests configure `onUnhandledRequest: "error"` to catch missing handlers.
- Catalog / dev environment uses `worker.start({ onUnhandledRequest: "bypass" })`.
- Handlers live in `src/mocks/` alongside fixtures.

---

## Fixtures

```
src/mocks/
├── server.ts
├── browser.ts
├── handlers.ts
├── users.ts                # exports `usersSmall` (3-10) + `usersLarge` (~100)
├── campaigns.ts
├── posts.ts
└── conversations.ts
```

Rules:

- Fixtures are typed using the same public types the components / API use.
- Each fixture exports a **small** set (for inline examples) and a **large**
  set (for tables / pagination / virtualization).
- No real customer names. Use `alice@example.test`, `customer-001`, etc.
- Fixtures must not import from `components/` — components depend on
  fixtures, never the reverse.

---

## Catalog Pages As Tests

The catalog is the project's primary visual testbed. Every variant of every
reusable component appears on a `/dev/catalog/*` page (see
`details/components.md`).

```
src/pages/dev/catalog/
├── atoms/buttons/Buttons.tsx
├── cards/Cards.tsx
├── tables/Tables.tsx
├── overlays/Overlays.tsx
└── …
```

Playwright snapshots run against these pages.

---

## Visual Regression — Playwright

```ts
// e2e/catalog.spec.ts
import { test, expect } from "@playwright/test";
import catalog from "../src/pages/dev/catalog/registry";

for (const entry of catalog) {
  test(`visual: ${entry.id}`, async ({ page }) => {
    await page.goto(entry.path);
    await expect(page).toHaveScreenshot({ fullPage: true });
  });

  test(`visual dark: ${entry.id}`, async ({ page }) => {
    await page.goto(`${entry.path}?theme=dark`);
    await expect(page).toHaveScreenshot({ fullPage: true });
  });
}
```

Rules:

- Snapshot **every catalog page** at **every theme**.
- Failing snapshots block CI. Diffs are reviewed and accepted explicitly.
- Snapshots are captured at three viewports: `360px`, `1024px`, `1440px`.

---

## Accessibility Tests

```ts
// e2e/a11y.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import catalog from "../src/pages/dev/catalog/registry";

for (const entry of catalog) {
  test(`a11y: ${entry.id}`, async ({ page }) => {
    await page.goto(entry.path);
    const result = await new AxeBuilder({ page }).analyze();
    const serious = result.violations.filter(v =>
      v.impact === "serious" || v.impact === "critical"
    );
    expect(serious).toEqual([]);
  });
}
```

Rules:

- Any `serious` or `critical` violation fails CI.
- Keyboard-only navigation is tested separately for modals, menus, command
  palette, inbox: open → traverse → close → focus restored.

---

## E2E Test — Critical Flow

```ts
// e2e/login.spec.ts
import { test, expect } from "@playwright/test";

test("user logs in and lands on dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alice@example.test");
  await page.getByLabel("Password").fill("correct-horse");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
});
```

Keep E2E small. Three to ten flows total covering: login, signup, the
critical user task, the critical admin task.

---

## Coverage Targets

| Surface                                | Target                     |
| -------------------------------------- | -------------------------- |
| Reusable component (atom / composite)  | ≥ 1 unit + 1 catalog cell  |
| Page                                   | ≥ 1 integration test       |
| Hook                                   | ≥ 1 unit test              |
| Critical flow                          | ≥ 1 E2E test               |

Numeric line coverage is not a goal. "Every component has a behavior test
and a visual catalog cell" is.

---

## Anti-Patterns

| Anti-pattern                                                       | Fix                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Mocking the router / store                                         | Wrap in real `MemoryRouter` / `Provider`                                  |
| Tests hitting the real network                                     | MSW handlers; `onUnhandledRequest: "error"`                               |
| Testing implementation details (state names, internal handlers)    | Test what the user sees and does (`getByRole`, `getByText`)               |
| One mega-test asserting 20 things                                  | One behavior per test                                                     |
| Snapshot tests of raw JSX (`toMatchSnapshot`)                      | Use Playwright screenshots against catalog pages                          |
| Real customer data in fixtures                                     | Synthetic deterministic data (`user-001@example.test`)                    |
| Skipping a11y tests because "it's just internal"                   | Run axe on every catalog page; fail CI on serious violations              |
| Adding `data-testid` everywhere                                    | Use accessible roles/labels; reserve `data-testid` for genuinely needed cases |
| Page tests that import a hook only to mock it                      | Test through the page; mock at the network layer (MSW)                    |

---

## Quick Checklist

- [ ] Every reusable component has a `<Name>.test.tsx` next to it.
- [ ] Every page has a `<PageName>.test.tsx` covering at least: render,
      one success path, one failure path.
- [ ] Every hook has a `<name>.test.ts`.
- [ ] MSW handlers exist for every API the tests touch.
- [ ] Catalog page exists for every reusable component variant.
- [ ] Playwright snapshots run on every catalog page + theme.
- [ ] axe-core runs on every catalog page; CI fails on serious findings.
- [ ] No test mocks the router or the store.
- [ ] No real customer data in fixtures.
- [ ] At least 3 critical-flow E2E tests exist (login, primary task,
      destructive action).
