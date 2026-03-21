# Stock Manager - Frontend

React frontend for the Investments Manager application. Built with Vite, TypeScript, and shadcn/ui.

## Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **UI**: shadcn/ui + Tailwind CSS v4
- **State**: Zustand (client) + TanStack Query (server)
- **Charts**: Recharts
- **Auth**: JWT Bearer token (stored in cookies via js-cookie)
- **HTTP**: Axios

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on port 5000

### Installation

```bash
npm install
```

### Setup

1. Copy `.env` and update if needed:
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Investments Manager
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm run preview
```

## Project Structure

```
src/
├── config/envConfig.ts           # All env vars + API endpoints
├── lib/
│   ├── api/apiService.ts         # Axios instance + generic API service
│   ├── queryClient.ts            # TanStack Query config
│   ├── queryKeys.ts              # Query key factory
│   └── utils.ts                  # cn() helper
├── stores/
│   ├── createGenericStore.ts     # Generic Zustand store factory
│   ├── useAuthStore.ts           # Auth state
│   └── useUIStore.ts             # Theme, sidebar state
├── hooks/queries/                # TanStack Query hooks
├── components/
│   ├── ui/                       # shadcn components
│   ├── layout/                   # AppLayout, Sidebar, Topbar
│   └── common/                   # StatCard, ConfirmDialog
├── pages/                        # Route pages
├── types/                        # Shared TS types
├── index.css                     # Theme variables (CSS vars)
├── App.tsx                       # Router
└── main.tsx                      # Entry point
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Sign in |
| Register | `/register` | Create account |
| Dashboard | `/` | Overview, charts, recent transactions |
| Portfolios | `/portfolios` | Portfolio list, create/delete |
| Portfolio Detail | `/portfolios/:id` | Assets by type, add asset |
| Transactions | `/transactions` | Full buy/sell history |
| SIPs | `/sips` | Recurring investments |
| Alerts | `/alerts` | Price alerts, Telegram link |
| Settings | `/settings` | Profile, theme, Telegram config |

## Environment Variables

All env vars are accessed through `config/envConfig.ts`. Never use `import.meta.env` directly in components.

## Theming

CSS variables are defined in `index.css` for light/dark modes. shadcn components consume these variables automatically. Toggle theme via Settings page or Topbar button.

## API Calls

Use the `api` object from `lib/api/apiService.ts`:

```ts
import { api } from '@/lib/api/apiService';

// Simple GET
const data = await api.get<MyType>('/portfolios');

// POST with body
const result = await api.post<ReturnType, BodyType>('/portfolios', body);
```

The token is automatically attached as `Authorization: Bearer <token>` header.

## State Management

- **Zustand**: Client-side UI state (theme, sidebar, auth user)
- **TanStack Query**: Server state (portfolios, assets, transactions, etc.)

They complement each other - Zustand holds filters/selections, TanStack Query uses them as query keys.
