# API Endpoint Summary

Base URL: `/api/v1`

All authenticated endpoints require `Authorization: Bearer <access_token>` header.
Mobile clients should send `X-Device-Id` header for audit tracking.

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | Public | Login with email/password |
| POST | `/auth/refresh` | Public | Refresh access token |
| GET | `/auth/me` | Any | Get current user |

## Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users` | Owner | Create new user |

## Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products` | Any | List/search products |
| GET | `/products/:id` | Any | Get product by ID |
| POST | `/products/lookup-barcode` | Any | Lookup by barcode |

## Categories & Locations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | Any | List categories |
| GET | `/locations` | Any | List store locations |

## Count Sessions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/count-sessions` | Any | List sessions |
| POST | `/count-sessions` | Any | Create session |
| GET | `/count-sessions/:id` | Any | Get session with progress |
| PATCH | `/count-sessions/:id` | Any | Update session status |
| POST | `/count-sessions/:id/approve` | Manager+ | Approve session |
| POST | `/count-sessions/:id/unresolved-scans` | Any | Log unknown barcode |

## Count Lines

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/count-sessions/:id/lines` | Any | List lines (filter param) |
| PUT | `/count-sessions/:id/lines` | Any | Upsert count line |
| POST | `/count-sessions/:sid/lines/:lid/approve` | Manager+ | Approve line |

## Audit & Sync

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/audit-events` | Manager+ | List audit events |
| POST | `/sync/batch` | Any | Process offline sync queue |

## Dashboard & Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard` | Any | Dashboard stats |
| GET | `/reports/variance` | Manager+ | Variance by category |
| GET | `/reports/low-stock` | Any | Low stock items |

## Query Parameters

### GET /products
- `storeId` (required)
- `q` — search term (name, SKU)
- `categoryId` — filter by category
- `restrictedOnly` — boolean
- `limit`, `offset` — pagination

### GET /count-sessions/:id/lines
- `filter` — `all|matched|shortage|overage|restricted|uncounted|needs_approval`

## Response Format

Success:
```json
{ "success": true, "data": { ... }, "message": "optional" }
```

Error:
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable" } }
```

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health (no auth) |
