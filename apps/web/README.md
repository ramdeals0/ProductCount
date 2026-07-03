# ShopCount Admin (`apps/web`)

Internal web portal for store **owners and managers**. Staff use the mobile app only.

> **Phase 1 complete** — architecture and shared types are defined. Implementation begins in Phase 2.

## Documentation

- [Web Admin Architecture](../../docs/WEB_ADMIN.md) — full spec, data flow, API plan, folder structure
- [Monorepo Architecture](../../docs/ARCHITECTURE.md) — shared database and mobile sync
- [API Reference](../../docs/API.md) — existing REST endpoints

## Planned stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + `@shopcount/ui` tokens
- TanStack Query + Zustand
- Auth via existing JWT API (`/api/v1/auth/*`)
- Charts: Recharts

## Run (Phase 2+)

```bash
# From repo root — requires API running
npm run dev:api    # port 3001
npm run dev:web    # port 3000 (added in Phase 2)
```

Login: `owner@desimart.com` or `manager@desimart.com` / `password123`
