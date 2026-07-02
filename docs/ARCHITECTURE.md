# ShopCount Architecture

## Entity Relationship Diagram

```mermaid
erDiagram
    stores ||--o{ users : employs
    stores ||--o{ categories : has
    stores ||--o{ locations : has
    stores ||--o{ products : stocks
    stores ||--o{ count_sessions : runs

    categories ||--o{ products : categorizes
    products ||--o{ product_barcodes : has
    products ||--o{ inventory_snapshots : tracked_in
    products ||--o{ count_lines : counted_as

    users ||--o{ count_sessions : creates
    users ||--o{ count_lines : enters
    users ||--o{ audit_events : performs
    users ||--o{ approvals : approves
    users ||--o{ refresh_tokens : has

    count_sessions ||--o{ count_lines : contains
    count_sessions ||--o{ count_session_assignments : assigns
    count_sessions ||--o{ approvals : receives
    count_sessions ||--o{ unresolved_scans : logs

    locations ||--o{ count_lines : at
    locations ||--o{ inventory_snapshots : at

    count_lines ||--o| approvals : may_have

    stores {
        uuid id PK
        text name
        text code UK
        boolean active
    }

    users {
        uuid id PK
        uuid store_id FK
        text email UK
        enum role
        boolean active
    }

    products {
        uuid id PK
        uuid store_id FK
        uuid category_id FK
        text sku
        text name
        enum unit_type
        text barcode_primary
        boolean restricted_category
        enum restricted_type
        real expected_qty
        real reorder_level
    }

    product_barcodes {
        uuid id PK
        uuid product_id FK
        text barcode UK
        boolean is_primary
    }

    count_sessions {
        uuid id PK
        uuid store_id FK
        uuid created_by FK
        text session_name
        enum count_type
        enum status
        jsonb assigned_to
        jsonb category_ids
        jsonb location_ids
        enum sync_status
    }

    count_lines {
        uuid id PK
        uuid session_id FK
        uuid product_id FK
        uuid location_id FK
        real expected_qty
        real counted_qty
        real variance_qty
        boolean requires_approval
        boolean approved
        enum reason_code
        enum sync_status
    }

    audit_events {
        uuid id PK
        enum entity_type
        text entity_id
        enum action
        jsonb old_value
        jsonb new_value
        uuid user_id FK
        boolean offline
    }

    approvals {
        uuid id PK
        uuid session_id FK
        uuid line_id FK
        uuid approved_by FK
    }

    sync_events {
        uuid id PK
        text device_id
        enum operation
        text entity_type
        jsonb payload
        enum status
    }
```

## Folder Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Bottom tab navigation
│   ├── count/             # Count workflow screens
│   └── product/           # Product detail
├── src/
│   ├── api/               # HTTP client
│   ├── components/        # Reusable UI
│   ├── db/                # SQLite + Drizzle schema
│   ├── lib/               # Auth, sync, utils
│   └── stores/            # Zustand stores

apps/api/
├── src/
│   ├── db/                # PostgreSQL schema, seed, migrate
│   ├── lib/               # JWT, password, variance
│   ├── middleware/        # Auth middleware
│   ├── repositories/      # Data access layer
│   ├── routes/            # Express routes
│   └── services/          # Business logic
└── drizzle/               # SQL migrations

packages/types/
└── src/
    ├── enums.ts           # Shared enums
    ├── schemas.ts         # Zod validation schemas
    └── api.ts             # API response types
```

## Mobile Navigation Plan

```
Root Stack
├── index (splash → redirect)
├── login
├── (tabs)
│   ├── dashboard
│   ├── products
│   ├── counts
│   └── settings
├── product/[id]
├── count/create
├── count/[id]
├── count/scan
├── count/manual
├── count/review
├── count/restricted
└── audit
```

## Offline-First Sync Strategy

1. All count operations write to local SQLite first
2. Each mutation enqueues a sync item with client timestamp
3. Background sync processes queue when online (FIFO)
4. Server applies last-write-wins with full audit trail
5. Conflicts logged in `sync_events` with status `failed`
6. UI shows per-session sync status chips

## Restricted Item Business Rules

- Alcohol/tobacco flagged with purple badge in UI
- Variance ≥ 2 units OR ≥ 5% requires manager approval
- Any negative variance on restricted items requires approval
- Manual edits after initial count always logged in audit trail
- Reason codes required for restricted discrepancies

## Role Permissions

| Action | Staff | Manager | Owner |
|--------|-------|---------|-------|
| Create/edit count lines | ✅ | ✅ | ✅ |
| Submit session for review | ✅ | ✅ | ✅ |
| Review variances | ❌ | ✅ | ✅ |
| Approve lines/sessions | ❌ | ✅ | ✅ |
| View audit history | ❌ | ✅ | ✅ |
| Manage products/users | ❌ | ❌ | ✅ |
| View reports | ❌ | ✅ | ✅ |
