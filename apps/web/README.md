# ShopCount Admin (`apps/web`)

Internal web portal for store **owners and managers**.

## Quick start

```bash
# From repo root
cp .env.example .env
npm run db:migrate && npm run db:seed

# Terminal 1 — API (port 3001)
npm run dev:api

# Terminal 2 — Web (port 3000)
cp apps/web/.env.example apps/web/.env.local
npm run dev:web
```

Open http://localhost:3000

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@desimart.com | password123 |
| Manager | manager@desimart.com | password123 |

Staff accounts are blocked from the web app (mobile only).

## Features

### Phase 2 — Catalog
- Product list, search, filters, create/edit, CSV export, inline toggles
- Category and location CRUD

### Phase 3 — Operations
- **Dashboard** — metric cards, Recharts (stock by category, variance, sessions, shrink), low-stock list, restricted overview, system health
- **Sessions** — list with filters, detail with status transitions, variance review with bulk approve/recount
- **Audit logs** — filterable trail with human-readable diffs

### Phase 4 — Settings (owner)
- Store profile (name, address, timezone)
- Variance auto-approval thresholds
- User list and invite

## Stack

Next.js 15 · Tailwind · TanStack Query · Zustand · Recharts · `@shopcount/types`

## API

Calls shared Express API at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api/v1`).

Key admin endpoints: `/dashboard/extended`, `/sync/health`, `/count-sessions/*/lines/bulk-approve`, `/stores/:id/settings`, `/users`

See [docs/WEB_ADMIN.md](../../docs/WEB_ADMIN.md) for architecture.

## Run with mobile

```bash
npm run dev:api     # API
npm run dev:web     # Admin web
npm run dev:mobile  # Expo app (uses same API)
```

Mobile caches product catalog on login; changes in Admin appear after mobile refresh/re-login.
