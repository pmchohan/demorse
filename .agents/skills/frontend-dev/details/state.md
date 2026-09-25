# State & Store

Three categories of state need three different homes. Putting them all in
one place is the most common cause of pain.

---

## Three Categories

| Category          | Lives                                                | Tool                          |
| ----------------- | ---------------------------------------------------- | ----------------------------- |
| **Local UI**      | A single component (open/closed, hover, draft text) | `useState` / `useReducer`     |
| **Cross-tree app**| Shared by multiple unrelated subtrees (theme, current user, role) | Redux Toolkit / Zustand / Context |
| **Server data**   | Comes from the backend; has loading/error/cache    | React Query / SWR / Redux Toolkit thunks |

Rules:

- Store data in **one** category. Do not duplicate the same data in two
  categories.
- Local state stays local until a real second consumer appears.
- Server data does **not** belong in plain `useState`. It needs cache,
  refetch, stale-while-revalidate, and error handling — features a store /
  query layer provides.

---

## Local UI State

```tsx
function ProfileForm() {
  const [draftName, setDraftName] = useState("");
  const [isOpen,    setIsOpen]    = useState(false);
  // …
}
```

Rules:

- Default everything to local first.
- Do not store derived values — compute on render or memoize when the
  computation is genuinely expensive.
- Don't lie about deps in `useEffect`. Include every value you read.

---

## Cross-Tree App State

For state that is genuinely shared across unrelated subtrees:
**theme**, **current user**, **role**, **feature flags**, **route-level
notifications**.

This project uses **Redux Toolkit** by convention (matching the existing
codebase). Other equally valid choices: Zustand, Jotai, Pinia.

```ts
// src/store/uiSlice.ts — UI flags only, never server data
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  activeBrand: string | null;
}

const uiSlice = createSlice({
  name: "ui",
  initialState: { theme: "light", sidebarCollapsed: false, activeBrand: null } as UIState,
  reducers: {
    setTheme:           (s, a: PayloadAction<UIState["theme"]>) => { s.theme = a.payload; },
    toggleSidebar:      (s) => { s.sidebarCollapsed = !s.sidebarCollapsed; },
    setActiveBrand:     (s, a: PayloadAction<string | null>) => { s.activeBrand = a.payload; },
  },
});

export const { setTheme, toggleSidebar, setActiveBrand } = uiSlice.actions;
export default uiSlice.reducer;
```

Rules:

- One slice per domain (`uiSlice`, `authSlice`, `featureFlagsSlice`).
- Slices that hold UI flags **only** stay simple — no thunks.
- The store composes all slices in `src/store/index.ts`.

---

## Server Data — Two Patterns

### Pattern A: Redux Toolkit Thunks (existing codebase pattern)

```ts
// src/store/devicesSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiService from "@/services/apiService";

const api = apiService();

export const fetchDevices = createAsyncThunk(
  "devices/fetchDevices",
  async () => (await api.get("/api/admin/devices")).data
);

export const addDevice = createAsyncThunk(
  "devices/addDevice",
  async (device: NewDevice) => (await api.post("/api/admin/devices", device)).data
);

interface DevicesState {
  list: Device[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const devicesSlice = createSlice({
  name: "devices",
  initialState: { list: [], status: "idle", error: null } as DevicesState,
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchDevices.pending,  (s) => { s.status = "loading"; })
      .addCase(fetchDevices.fulfilled, (s, a) => { s.list = a.payload; s.status = "succeeded"; })
      .addCase(fetchDevices.rejected,  (s, a) => { s.status = "failed"; s.error = a.error.message ?? "Unknown"; })
      .addCase(addDevice.fulfilled,    (s, a) => { s.list.push(a.payload); });
  },
});

export default devicesSlice.reducer;
```

Use thunks when:
- The project already uses Redux Toolkit and you need to match the convention.
- Several pages mutate the same collection and benefit from a shared store.

### Pattern B: Query Layer (React Query / SWR)

```ts
// src/hooks/queries/useDevices.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "@/services/apiService";

const api = apiService();

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get("/api/admin/devices").then(r => r.data),
  });
}

export function useAddDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (device: NewDevice) =>
      api.post("/api/admin/devices", device).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
}
```

Use a query layer when:
- The project starts fresh and you want cache + auto-refetch without
  hand-writing `pending/fulfilled/rejected`.
- Data is read by many pages and read freshness matters.

### Pick One Per Project

Mixing Redux thunks + React Query for the same data is the worst case.
Decide once. Then every domain follows the same pattern.

---

## Store Composition

```ts
// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import ui          from "./uiSlice";
import auth        from "./authSlice";
import devices     from "./devicesSlice";
import customers   from "./customersSlice";

const store = configureStore({
  reducer: { ui, auth, devices, customers },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
```

Rules:

- Always export typed `useAppDispatch` / `useAppSelector` so consumers don't
  re-type every selector.
- Reducer key matches slice name minus the `Slice` suffix.
- Provide the store via `<Provider store={store}>` in `main.tsx`.

---

## Services Layer

Slices and query hooks **do not** call `axios` directly. They call a service.

```ts
// src/services/apiService.ts — the only axios instance in the app
import axios from "axios";
import Cookies from "js-cookie";

export default function apiService() {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
  });
  instance.interceptors.request.use(cfg => {
    const t = Cookies.get("auth_token");
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });
  return instance;
}
```

Specialized services wrap a feature:

```ts
// src/services/AuthService.ts
import apiService from "./apiService";

const api = apiService();

export default {
  login:     (email: string, pw: string) => api.post("/api/auth/login", { email, password: pw }),
  logout:    () => api.post("/api/auth/logout"),
  checkAuth: () => api.get("/api/auth/me").then(r => r.data),
};
```

Rules:

- `services/` contains only API clients. No JSX, no React hooks.
- Components and slices import services. Services do not import either.

---

## Effects

Effects synchronize the component with something outside React.

Rules:

- Effects with `[]` deps that read props are a smell — derive the value
  during render or include `props.x` in the deps.
- Clean up subscriptions, timers, listeners.
- Cancel in-flight requests when the component unmounts (AbortController or
  query-layer cancellation).

---

## Forms

- Controlled inputs unless there is a clear reason for uncontrolled.
- Validate on blur or submit (live validation only when feedback must be
  immediate).
- Submit handler is idempotent: disable the button while submitting.
- For complex forms (10+ fields, multi-step), reach for React Hook Form.

---

## Anti-Patterns

| Anti-pattern                                                       | Fix                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Storing the same data in two places (Redux + local state)          | One owner. Render the other side from a selector / query                  |
| Server data in `useState` + manual `fetch` in `useEffect`          | Use a slice thunk or a query hook                                         |
| `useEffect` that mirrors a prop into state then `setState`         | Derive the value during render                                            |
| One mega-slice with `users`, `posts`, `campaigns`, `ui` all mixed  | One slice per domain                                                      |
| Direct `axios` calls inside components                             | Call a service (or a slice thunk / query hook)                            |
| Selectors that recompute heavy data every render                   | Use `reselect` / `createSelector` to memoize                              |
| Putting auth token in Redux                                        | Store the token in a cookie; keep "is authenticated" in `authSlice`       |
| Global event listeners attached in render with no cleanup          | Move to an effect with cleanup; or to a `useShortcut` hook                |
| Mutating arrays / objects in state directly                        | Use Redux Toolkit's Immer-backed reducers; or spread for plain `setState` |
| Mixing React Query and Redux thunks for the same domain            | Pick one per project; do not mix per-domain                               |

---

## Quick Checklist

- [ ] One owner per piece of state (local / app / server).
- [ ] Server data uses a slice thunk OR a query hook — not raw `useState` + `fetch`.
- [ ] One slice (or one query module) per domain.
- [ ] Services own all API calls; components / slices do not import `axios` directly.
- [ ] No effect mirrors a prop into local state.
- [ ] `useAppDispatch` / `useAppSelector` are typed once and reused.
- [ ] The store composes slices in `src/store/index.ts`; nothing else does.
- [ ] Auth tokens never sit in Redux — they live in cookies / secure storage.
