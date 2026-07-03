# ShopCount Admin — Web Application Architecture (Phase 1)

ShopCount Admin is the internal web portal for **owners and managers** to maintain product master data, review inventory counts, approve variances, and monitor store operations. Staff use the mobile app only.

---

## 1. Requirements Analysis & Assumptions

### In scope (MVP → production)

| Area | Owner | Manager | Staff (mobile only) |
|------|-------|---------|---------------------|
| Product master CRUD | ✅ | ✅ | ❌ |
| Category / location config | ✅ | ✅ | ❌ |
| Count session governance | ✅ | ✅ | ❌ |
| Variance review & approvals | ✅ | ✅ | ❌ |
| Audit log viewer | ✅ | ✅ | ❌ |
| Dashboard & reports | ✅ | ✅ | read-only subset on mobile |
| User management | ✅ | limited (view, no role change) | ❌ |
| Store settings / thresholds | ✅ | ❌ | ❌ |

### Assumptions (aligned with `docs/ASSUMPTIONS.md`)

1. **Single store per deployment** in MVP UI, but schema remains multi-store via `storeId`.
2. **Product master source of truth** is ShopCount Admin (web) + API — mobile never creates products.
3. **Shared PostgreSQL database** — web and mobile read/write the same tables via `apps/api`.
4. **REST API** — extend existing Express `/api/v1` routes; mobile already consumes this contract.
5. **Drizzle ORM** — the monorepo uses Drizzle, not Prisma. Web app has **no direct DB access**; all persistence goes through the API.
6. **JWT auth** — reuse existing login/refresh; web stores tokens in httpOnly cookies (Next.js) with optional Zustand mirror for client UX.
7. **Restricted items** — alcohol/tobacco variances above threshold (2 units OR 5%) require explicit manager/owner approval; no auto-approve.
8. **Audit immutability** — all product changes and approvals write to `audit_events`.
9. **CSV import** — scaffold endpoint in Phase 2; full validation pipeline in Phase 4.
10. **English-only UI** for v1.

### Spec vs existing schema mapping

| Web spec field | Existing model | Notes |
|----------------|----------------|-------|
| `subcategoryId` | `categories.parentId` | Subcategories are child categories, not a separate table |
| `subcategory` (text) | `products.subcategory` | Optional free-text label; prefer `parentId` for structured subcats |
| `barcodeAlternates[]` | `product_barcodes` table | Loaded via join; `barcodePrimary` on `products` |
| `image` | `products.imageUrl` | URL only in v1 |
| Session `assignedTo[]` | `count_sessions.assignedTo` (jsonb) + `count_session_assignments` | Both used |
| Settings thresholds | **New** `store_settings` (Phase 4) | Currently hardcoded in `@shopcount/types` enums |

---

## 2. System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ShopCount Monorepo                        │
├──────────────┬──────────────────────┬───────────────────────────┤
│  apps/web    │     apps/mobile      │        apps/api           │
│  Next.js 15  │     Expo RN 54       │   Express + Drizzle       │
│  TanStack Q  │     Zustand + SQLite │   PostgreSQL              │
│  Zustand     │     offline sync     │   JWT auth                │
└──────┬───────┴──────────┬───────────┴─────────────┬─────────────┘
       │                  │                         │
       │   HTTPS REST     │   HTTPS REST + sync     │
       └──────────────────┴─────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL       │
                    │   (shared DB)      │
                    └───────────────────┘

packages/types  ──► Zod schemas + TS interfaces (shared by all apps)
packages/ui     ──► Design tokens (extend for web Tailwind preset)
packages/config ──► Shared tsconfig, env validation
```

### Request flow (web)

1. User logs in → `POST /api/v1/auth/login` → JWT stored in httpOnly cookie.
2. Next.js middleware checks cookie + role (`owner` | `manager` only).
3. Server Components / Route Handlers proxy to API with `Authorization: Bearer`.
4. TanStack Query caches responses; mutations invalidate relevant keys.
5. Product writes emit `audit_events` on the API layer (already partially implemented).

### Mobile ↔ web coordination

| Data | Writer | Reader |
|------|--------|--------|
| Products, categories, locations | Web (owner/manager) | Mobile (cache on login) |
| Count sessions & lines | Mobile (staff) | Web (review/approve) |
| Approvals | Web (manager/owner) | Mobile (status refresh) |
| Audit events | API (both) | Web audit viewer |
| Sync events | Mobile sync batch | Web system health widget |

---

## 3. Tech Stack Decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 15** App Router | SSR, route groups, middleware |
| Language | TypeScript | Matches monorepo |
| Styling | Tailwind CSS | Fast ops-dashboard UI |
| Data fetching | TanStack Query v5 | Cache, mutations, devtools |
| Client state | Zustand | Auth session, sidebar, table prefs |
| Validation | Zod (`@shopcount/types`) | Shared with API |
| ORM | **Drizzle** (API only) | Already in production |
| API | **REST** (`/api/v1`) | Mobile compatibility |
| Auth | NextAuth v5 Credentials + JWT from API | Or custom cookie JWT wrapper |
| Charts | Recharts | Lightweight, React-native |

**Not using:** Prisma (would duplicate ORM), tRPC (mobile can't consume it without extra layer).

---

## 4. Database Schema Confirmation (Drizzle)

All models exist in `apps/api/src/db/schema.ts`. No Phase 1 migration required.

### Core entities ✅

- `stores`, `users`, `refresh_tokens`
- `categories` (supports subcategories via `parentId`)
- `locations`
- `products`, `product_barcodes`
- `count_sessions`, `count_session_assignments`
- `count_lines`, `approvals`
- `audit_events`, `sync_events`
- `inventory_snapshots`, `unresolved_scans`

### Phase 4 additions (planned)

```typescript
// store_settings — one row per store
{
  storeId: uuid PK/FK,
  varianceAutoApprovePercent: real,      // default 10
  varianceAutoApprovePercentRestricted: real, // default 2
  varianceAutoApproveQtyRestricted: real,       // default 2
  defaultCountType: count_type,
  notifyRestrictedVariance: boolean,
  timezone: text,                        // e.g. America/New_York
  updatedAt: timestamp
}

// stores additions
timezone: text
```

### New audit actions (Phase 3, optional migration)

- `product_created`, `product_deleted`, `category_updated`, `session_status_changed`, `bulk_import`

---

## 5. API Surface — Existing vs Planned

### Existing (mobile + partial admin)

| Method | Path | Roles |
|--------|------|-------|
| POST | `/auth/login`, `/auth/refresh` | public |
| GET | `/auth/me` | any |
| GET | `/products`, `/products/:id` | any |
| POST | `/products/lookup-barcode` | any |
| GET | `/categories`, `/locations` | any |
| GET/PATCH | `/count-sessions`, `/count-sessions/:id` | any / manager+ for approve |
| GET/PUT | `/count-sessions/:id/lines` | any |
| POST | `/count-sessions/.../approve` | manager, owner |
| GET | `/audit-events` | manager, owner |
| GET | `/dashboard`, `/reports/variance`, `/reports/low-stock` | any / manager+ |
| POST | `/users` | owner |
| POST | `/sync/batch` | any (mobile) |

### Planned for web (Phase 2–4)

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| POST | `/products` | owner, manager | 2 |
| PATCH | `/products/:id` | owner, manager | 2 |
| DELETE | `/products/:id` | owner | 2 |
| GET | `/products/export.csv` | owner, manager | 2 |
| POST | `/products/import` | owner, manager | 2 (scaffold) |
| POST/PATCH/DELETE | `/categories`, `/categories/:id` | owner, manager | 2 |
| POST/PATCH/DELETE | `/locations`, `/locations/:id` | owner, manager | 2 |
| GET | `/users` | owner, manager | 4 |
| PATCH | `/users/:id` | owner | 4 |
| GET/PATCH | `/stores/:id`, `/stores/:id/settings` | owner | 4 |
| GET | `/sync/health` | owner, manager | 3 |
| POST | `/count-sessions/:id/lines/bulk-approve` | manager, owner | 3 |
| POST | `/count-sessions/:id/lines/bulk-recount` | manager, owner | 3 |

---

## 6. `apps/web` Folder Structure (Phase 2 scaffold)

```
apps/web/
├── app/
│   ├── layout.tsx                 # Root layout, providers
│   ├── page.tsx                   # Redirect → /dashboard
│   ├── login/page.tsx
│   ├── (dashboard)/               # Authenticated shell
│   │   ├── layout.tsx             # Sidebar + header
│   │   ├── dashboard/page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx           # List + filters
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── locations/page.tsx
│   │   ├── sessions/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Session detail
│   │   │       └── lines/page.tsx # Variance review
│   │   ├── audit/page.tsx
│   │   └── settings/page.tsx
│   └── api/auth/[...nextauth]/route.ts  # Optional NextAuth
├── components/
│   ├── layout/                    # Sidebar, Header, PageShell
│   ├── ui/                        # Button, Badge, Table, Skeleton
│   ├── products/                  # ProductForm, ProductTable
│   ├── sessions/                  # SessionStatusBadge, LineReviewTable
│   ├── dashboard/                 # MetricCard, charts/*
│   └── audit/                     # AuditDiffViewer
├── lib/
│   ├── api-client.ts              # Fetch wrapper → apps/api
│   ├── auth.ts                    # Session helpers
│   ├── rbac.ts                    # Role checks
│   └── query-keys.ts
├── hooks/
│   ├── use-products.ts
│   ├── use-sessions.ts
│   └── use-dashboard.ts
├── stores/
│   └── auth-store.ts              # Zustand
├── styles/
│   └── globals.css
├── middleware.ts                  # Route protection
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── README.md
```

---

## 7. Shared Types (`packages/types`)

Phase 1 adds `packages/types/src/admin.ts`:

- RBAC permission map (`WebPermission`, `canAccess`)
- Filter schemas: `sessionListFilterSchema`, `auditEventFilterSchema`, `productListFilterSchema`
- CRUD inputs: `createCategorySchema`, `createLocationSchema`, `storeSettingsSchema`
- Dashboard extensions: `DashboardExtendedStats`, `SystemHealth`, `StockByCategoryChart`
- Bulk import scaffold: `productImportRowSchema`, `productImportResultSchema`

All exported from `@shopcount/types`.

---

## 8. RBAC Model

```typescript
// Web-only roles (staff redirected to "mobile app required" page)
const WEB_ROLES = ['owner', 'manager'];

// Permission examples
owner:  products.*, categories.*, locations.*, sessions.*, audit.read,
        users.*, settings.*
manager: products.*, categories.*, locations.*, sessions.*, audit.read,
         users.read (no role assignment)
```

Enforcement layers:

1. **Next.js middleware** — cookie present + role in WEB_ROLES
2. **API middleware** — `authorize('owner', 'manager')` on admin routes
3. **UI guards** — hide Settings/Users nav for managers

---

## 9. Business Rules (non-obvious)

```typescript
// Restricted auto-approve blocked when:
requiresApproval = (
  product.restrictedType !== 'none' &&
  (Math.abs(varianceQty) >= RESTRICTED_VARIANCE_THRESHOLD_QTY ||
   Math.abs(variancePercent) >= RESTRICTED_VARIANCE_THRESHOLD_PERCENT ||
   varianceQty < 0)
);

// Bulk "approve low variance" skips any line where requiresApproval === true
// Session status transitions: draft → in_progress → review → approved → posted
//   (only manager/owner can move review → approved → posted)
```

---

## 10. Implementation Phases

| Phase | Deliverables | Status |
|-------|-------------|--------|
| **1** | Architecture doc, shared types, schema confirmation | ✅ Done |
| **2** | Scaffold `apps/web`, auth, layout, product/category/location CRUD + API routes | ✅ Done |
| **3** | Sessions, variance review, dashboard charts, audit viewer, sync health | ✅ Done |
| **4** | Settings, seed data, tests, README run instructions | ✅ Done |

---

## 11. Local Development (preview)

```bash
# Terminal 1 — API + DB
cp .env.example .env
npm run db:migrate && npm run db:seed
npm run dev:api

# Terminal 2 — Web (Phase 2+)
npm run dev:web

# Terminal 3 — Mobile (optional)
npm run dev:mobile
```

Web env (`apps/web/.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

Demo logins: `owner@desimart.com` / `manager@desimart.com` — `password123`

---

## 12. Design System Notes

- **Palette:** neutral grays, accent indigo (`#635bff`), semantic red/amber/green
- **Restricted badge:** purple/violet distinct from warning amber
- **Tables:** sticky header, server-side pagination, inline filters
- **Empty states:** illustrated placeholder + primary action
- **Loading:** skeleton rows matching table column layout

See `demos/inventory-dashboard.html` for early visual reference (static mock).
