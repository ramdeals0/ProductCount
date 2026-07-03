# ShopCount Admin (`apps/web`)

Internal web portal for store **owners and managers**.

## Quick start

```bash
# From repo root
cp .env.example .env          # API database + JWT
npm run db:migrate && npm run db:seed

# Terminal 1 — API (port 3001)
npm run dev:api

# Terminal 2 — Web (port 3000)
cp apps/web/.env.example apps/web/.env.local
npm run dev:web
```

Open http://localhost:3000 and sign in:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@desimart.com | password123 |
| Manager | manager@desimart.com | password123 |

Staff accounts are blocked from the web app.

## Phase 2 features

- JWT login with role guard (owner/manager only)
- Sidebar navigation shell
- **Products** — list, search, filters, create/edit, inline toggles, CSV export
- **Categories** — list, create, edit, delete
- **Locations** — list, create, edit, deactivate
- **Dashboard** — basic metric cards from `/dashboard` API

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS
- TanStack Query + Zustand
- `@shopcount/types` for shared validation types

## API

The web app calls the shared Express API at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api/v1`).

New admin endpoints (Phase 2):

- `POST/PATCH/DELETE /products`
- `GET /products/export`
- `POST /products/import` (scaffold)
- `POST/PATCH/DELETE /categories`
- `POST/PATCH/DELETE /locations`

See [docs/WEB_ADMIN.md](../../docs/WEB_ADMIN.md) for full architecture.

## Coming next

- **Phase 3:** Sessions, variance review, charts, audit viewer
- **Phase 4:** Settings, thresholds, seed enhancements, tests
