# Routing — Grouped, Nested, JSON-Driven

Routes are **data**, not JSX. One file per role group. A single composer file
combines them with prefixes. Framework wiring lives only in `App.tsx`.

---

## Layout

```
src/
├── routes/
│   ├── index.ts            # composes all groups with prefixes
│   ├── guest.ts
│   ├── auth.ts
│   ├── member.ts           # or account.ts — paths under /account
│   ├── admin.ts            # paths under /admin
│   ├── developer.ts        # paths under /developer
│   └── redirects.ts
├── middleware/
│   ├── AuthMiddleware.tsx
│   ├── RoleGuard.tsx
│   └── GuestMiddleware.tsx
└── App.tsx                 # the only file that converts data → framework
```

Rules:

- Route files are `.ts` / `.js` — no JSX.
- A route entry is a plain `(path → Page component)` mapping. The page itself
  imports its own layout; the route does not wrap pages in layout HOCs.
- Middlewares wrap pages to enforce auth/role; they live in `src/middleware/`.

---

## A Route Group

```ts
// src/routes/member.ts
import Dashboard from "@/pages/member/Dashboard/Dashboard";
import Profile   from "@/pages/member/Profile/Profile";
import Settings  from "@/pages/member/Settings/Settings";

const member_routes = {
  "/":         Dashboard,
  "/profile":  Profile,
  "/settings": Settings,
};

export default member_routes;
```

```ts
// src/routes/guest.ts
import Home    from "@/pages/guest/Home/Home";
import About   from "@/pages/guest/About/About";
import Pricing from "@/pages/guest/Pricing/Pricing";
import Contact from "@/pages/guest/Contact/Contact";

const guest_routes = {
  "/":        Home,
  "/about":   About,
  "/pricing": Pricing,
  "/contact": Contact,
};

export default guest_routes;
```

---

## The Composer

```ts
// src/routes/index.ts
import guest_routes     from "./guest";
import auth_routes      from "./auth";
import member_routes    from "./member";
import admin_routes     from "./admin";
import developer_routes from "./developer";

const routes = [
  { prefix: "/admin",     routes: admin_routes,     middleware: ["auth", "admin"]    },
  { prefix: "/developer", routes: developer_routes, middleware: ["auth", "developer"] },
  { prefix: "/account",   routes: member_routes,    middleware: ["auth", "member"]   },
  { prefix: "/",          routes: auth_routes,      middleware: ["guest"]            },
  { prefix: "/",          routes: guest_routes,     middleware: []                   },
];

export default routes;
```

Rules:

- `prefix` is the mount point.
- `middleware` is a list of names — keep it data, not function calls.
- Order matters when prefixes overlap; longer prefixes go first.

---

## The Wirer (`App.tsx`)

This is the **only** file that converts route data into framework objects.

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import routes from "./routes";
import AuthMiddleware  from "./middleware/AuthMiddleware";
import RoleGuard       from "./middleware/RoleGuard";
import GuestMiddleware from "./middleware/GuestMiddleware";
import NotFoundPage    from "./pages/errors/NotFoundPage";

const middlewares = {
  auth:      AuthMiddleware,
  admin:     (C) => RoleGuard(C, "admin"),
  developer: (C) => RoleGuard(C, "developer"),
  member:    (C) => RoleGuard(C, "member"),
  guest:     GuestMiddleware,
};

function wrap(Component, mwNames: string[]) {
  return mwNames.reduce((C, name) => middlewares[name](C), Component);
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.flatMap(({ prefix, routes: group, middleware = [] }) =>
          Object.entries(group).map(([path, Component]) => {
            const Wrapped = wrap(Component, middleware);
            return (
              <Route
                key={prefix + path}
                path={prefix + path}
                element={<Wrapped />}
              />
            );
          })
        )}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

Rules:

- The wirer never knows the path strings. It iterates `routes`.
- Middlewares are applied by name; adding a new guard means adding it to
  `middlewares` once.

---

## Nested Routes

For deeply nested URLs, nest the data — do not flatten path strings.

```ts
// src/routes/admin.ts
import Dashboard       from "@/pages/admin/Dashboard/Dashboard";
import UsersList       from "@/pages/admin/users/UsersList/UsersList";
import UserDetail      from "@/pages/admin/users/UserDetail/UserDetail";
import CreateUserForm  from "@/pages/admin/users/CreateUserForm/CreateUserForm";

const admin_routes = {
  "/":        Dashboard,
  "/users":   UsersList,
  "/users/:id":     UserDetail,
  "/users/create":  CreateUserForm,
};

export default admin_routes;
```

If the wirer supports nested data, prefer:

```ts
const admin_routes = {
  "/":      Dashboard,
  "/users": {
    "":         UsersList,
    "/:id":     UserDetail,
    "/create":  CreateUserForm,
  },
};
```

Pick **one** shape per project and stick with it.

---

## Middleware

Middlewares are higher-order components in `src/middleware/`.

```tsx
// src/middleware/AuthMiddleware.tsx
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import AuthService from "@/services/AuthService";
import Loading from "@/components/feedback/Loading/Loading";

const AuthMiddleware = (Wrapped: React.ComponentType<any>) => {
  return function GuardedRoute(props: any) {
    const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

    useEffect(() => {
      const token = Cookies.get("auth_token");
      if (!token) { setState("denied"); window.location.href = "/login"; return; }
      AuthService.checkAuth()
        .then(({ authenticated }) =>
          setState(authenticated ? "ok" : "denied"))
        .catch(() => setState("denied"));
    }, []);

    if (state === "loading") return <Loading />;
    if (state === "denied")  return null;
    return <Wrapped {...props} />;
  };
};

export default AuthMiddleware;
```

Rules:

- One middleware = one responsibility (auth, role, guest, feature flag).
- Middlewares never own business logic — they delegate to a service.
- Middlewares never embed redirect URLs from query strings without validation.

---

## Redirects

Keep redirects in their own data file so they read like a list, not code.

```ts
// src/routes/redirects.ts
const redirects: Record<string, string> = {
  "/old-pricing": "/pricing",
  "/docs":        "/help-center",
};

export default redirects;
```

The wirer turns these into `<Navigate to={...} replace />` entries.

---

## Anti-Patterns

| Anti-pattern                                                       | Fix                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `routes/guest.tsx` rendering `<Route element={<Home />} />`        | Make it `.ts` data; render in `App.tsx` only                        |
| `withGuestLayout(Home)` inside route files                         | Page imports its own layout; route file stays clean                 |
| One mega-route file `routes/all.ts` for every prefix               | One file per role group + composer                                  |
| Auth check inlined in every page                                   | One `AuthMiddleware` applied via route group                        |
| Routes that perform `useEffect` to fetch page data                 | Page owns its data fetch; route only wires path → page              |
| Hard-coded paths sprinkled across components                       | Export a `PATHS` constants map from `routes/paths.ts`               |

---

## Constants Map

For places that need to link or programmatically navigate, expose a constants
map so paths are not stringly-typed across the app.

```ts
// src/routes/paths.ts
export const PATHS = {
  home:    "/",
  login:   "/login",
  pricing: "/pricing",
  member: {
    dashboard: "/account",
    profile:   "/account/profile",
  },
  admin: {
    dashboard:   "/admin",
    users:       "/admin/users",
    userDetail:  (id: string) => `/admin/users/${id}`,
  },
} as const;
```

Use `PATHS.admin.users` instead of `"/admin/users"` in `<Link>`s and
`navigate(...)` calls.
