# Frontend Architecture Guide

Low-level details of the investments manager frontend.

---

## Config (`config/envConfig.ts`)

Single source of truth for all environment variables and API endpoints. Every component imports from here instead of using `import.meta.env` directly.

### Structure

```ts
const API = VITE_API_BASE_URL || 'http://localhost:5000/api';

export const envConfig = {
  APP_NAME: 'Investments Manager',
  API_BASE_URL: API,
  AUTH: { LOGIN: `${API}/auth/login`, ... },
  PORTFOLIOS: { LIST: `${API}/portfolios`, GET: (id) => ..., ... },
  // ... all other endpoints
};
```

### Endpoints as Functions

Dynamic endpoints (with IDs) are functions:
```ts
envConfig.PORTFOLIOS.GET('abc-123')  // returns '/api/portfolios/abc-123'
envConfig.ASSETS.LIST('portfolio-id') // returns '/api/portfolios/portfolio-id/assets'
```

---

## API Service (`lib/api/apiService.ts`)

### Axios Instance

Single axios instance with:
- `baseURL` from envConfig
- Request interceptor: reads `access_token` from cookie, attaches as `Authorization: Bearer` header
- Response interceptor: catches 401, attempts token refresh, retries original request

### Token Refresh Flow

```
1. Request fails with 401
2. Check if refresh is already in progress
3. If yes: queue this request
4. If no: call POST /auth/refresh with refresh_token from cookie
5. On success: store new tokens in cookies, retry all queued requests
6. On failure: clear cookies, redirect to /login
```

### Generic API Service

```ts
// All calls go through this single function
apiService<TResponse, TBody>({
  endpoint: '/portfolios',
  method: 'POST',
  body: { name: 'My Portfolio' },
  headers: {},  // optional
  params: {},   // optional query params
  signal: abortController.signal,  // optional
});
```

Convenience methods: `api.get`, `api.post`, `api.put`, `api.patch`, `api.delete`

---

## Zustand Store (`stores/createGenericStore.ts`)

### Generic Store Factory

```ts
function createGenericStore<T>(
  initialValue: T,
  persistStore: boolean = false,
  persistKey: string = 'generic-store'
)
```

Creates a store with:
- `data: T` — the state
- `setData(value)` — update state
- `isLoading: boolean` — loading flag
- `setIsLoading(value)` — toggle loading
- `reset()` — reset to initial value

### Usage Pattern

```ts
// Define a typed store
const useAuthStore = createGenericStore<AuthData>(
  { user: null, isAuthenticated: false },
  true,        // persist to localStorage
  'auth-store' // localStorage key
);

// In components
const { data, setData, reset } = useAuthStore();
setData({ user: userData, isAuthenticated: true });
```

### Stores

| Store | Persisted | Purpose |
|-------|-----------|---------|
| `useAuthStore` | Yes | User data, isAuthenticated |
| `useUIStore` | Yes | Theme, sidebar state |

---

## TanStack Query (`hooks/queries/`)

### Query Key Factory (`lib/queryKeys.ts`)

Single source of truth for all query keys. Prevents typos and makes invalidation easy.

```ts
queryKeys.portfolios.lists()                    // ['portfolios', 'list']
queryKeys.portfolios.detail('id')               // ['portfolios', 'detail', 'id']
queryKeys.assets.list('portfolioId')            // ['assets', 'list', 'portfolioId']
queryKeys.transactions.listAll()                // ['transactions', 'list', 'all']
```

### Hook Pattern

Each entity has its own hook file with:
- `useXxx()` — fetch list
- `useXxx(id)` — fetch single item
- `useCreateXxx()` — create mutation
- `useUpdateXxx()` — update mutation
- `useDeleteXxx()` — delete mutation

Every mutation invalidates the relevant queries on success.

### Example

```ts
export function usePortfolios() {
  return useQuery({
    queryKey: queryKeys.portfolios.lists(),
    queryFn: () => api.get<Portfolio[]>('/portfolios'),
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post<Portfolio>('/portfolios', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.portfolios.lists() }),
  });
}
```

---

## Theming (`index.css`)

### CSS Variables

All colors defined as OKLCH values on `:root` (light) and `.dark` (dark):

```css
:root {
  --primary: oklch(0.205 0 0);
  --profit: oklch(0.65 0.2 145);  /* green for gains */
  --loss: oklch(0.55 0.2 27);     /* red for losses */
}
```

### Tailwind v4 Registration

```css
@theme inline {
  --color-primary: var(--primary);
  --color-profit: var(--profit);
  --color-loss: var(--loss);
}
```

### Usage

```tsx
<div className="text-profit">+$1,234</div>
<div className="text-loss">-$567</div>
<div className="bg-primary text-primary-foreground">Button</div>
```

### Dark Mode Toggle

```ts
document.documentElement.classList.toggle('dark');
```

---

## Auth Flow

### Login

1. User submits email/password
2. `useLogin` mutation calls `POST /auth/login`
3. Backend returns `{ token, refreshToken, user }`
4. Tokens stored in cookies (`js-cookie`)
5. Zustand auth store updated with user data
6. React Router navigates to dashboard

### Every Request

1. Axios interceptor reads `access_token` from cookie
2. Attaches `Authorization: Bearer <token>` header
3. No manual token management needed in components

### 401 Auto-Refresh

1. Response interceptor catches 401
2. Calls `POST /auth/refresh` with `refresh_token`
3. Stores new tokens
4. Retries original request
5. If refresh fails: clears cookies, redirects to `/login`

### Logout

1. Calls `POST /auth/logout` with `refreshToken`
2. Clears all cookies
3. Resets Zustand auth store
4. Clears TanStack Query cache
5. Redirects to `/login`

---

## Page Structure

Every page follows this pattern:

```tsx
export function PageName() {
  // 1. TanStack Query hooks for data
  const { data, isLoading } = useSomeQuery();

  // 2. Mutations
  const createXxx = useCreateXxx();

  // 3. Local state for forms/dialogs
  const [dialogOpen, setDialogOpen] = useState(false);

  // 4. Form handlers
  const handleSubmit = (e) => { ... };

  // 5. Loading state
  if (isLoading) return <Loading />;

  // 6. Render
  return (
    <div className="space-y-6">
      {/* Header with title + create button */}
      {/* Content: cards, tables, charts */}
      {/* Dialogs for create/edit */}
    </div>
  );
}
```

---

## Layout

### AppLayout

- Checks `auth.isAuthenticated` — redirects to `/login` if false
- Renders `Sidebar` + `Topbar` + `<Outlet />`
- Sidebar width toggled by `ui.sidebarOpen`

### Sidebar

- Fixed left sidebar with navigation links
- Highlights active route
- Icons from Lucide React

### Topbar

- Sidebar toggle button
- Theme toggle (light/dark)
- User dropdown with logout

---

## Adding New Features

### New Page

1. Create page component in `pages/`
2. Add route in `App.tsx`
3. Add nav item in `components/layout/Sidebar.tsx`

### New API Endpoint

1. Add endpoint constant in `config/envConfig.ts`
2. Create query/mutation hooks in `hooks/queries/`
3. Add query keys in `lib/queryKeys.ts`
4. Use hooks in page components

### New Zustand Store

1. Create store in `stores/` using `createGenericStore`
2. Export typed hook
3. Use in components via `const { data, setData } = useMyStore()`
