# ShopCount MVP

Production-ready inventory counting app for small neighborhood stores (Indian groceries, alcohol, tobacco). Built as a monorepo with offline-first mobile app and REST API backend.

## Architecture Overview

```
shopcount/
├── apps/
│   ├── mobile/          # Expo React Native app (offline-first)
│   └── api/             # Express + PostgreSQL API
├── packages/
│   ├── types/           # Shared Zod schemas & TypeScript types
│   ├── ui/              # Shared design tokens
│   └── config/          # Shared TS config
└── docs/                # Architecture & API documentation
```

### Data Flow

1. **Staff** scans barcodes or enters counts on mobile (SQLite local-first)
2. Count lines saved locally with `syncStatus: pending`
3. Sync queue batches changes when network available
4. **API** validates, calculates variance, enforces restricted-item rules
5. **Manager** reviews variances, approves lines/sessions
6. **Audit trail** records all actions (including offline events)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo 52, Expo Router, NativeWind |
| State | Zustand (local), React Query (server) |
| Offline DB | expo-sqlite + Drizzle ORM |
| Backend | Node.js, Express, Drizzle ORM |
| Database | PostgreSQL |
| Validation | Zod (shared package) |
| Forms | React Hook Form |
| Auth | JWT + refresh tokens |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Expo Go app (for mobile testing) or iOS/Android simulator

### 1. Install dependencies

```bash
npm install
npm run build -w @shopcount/types
```

### 2. Configure environment

```bash
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
```

Edit `.env` with your PostgreSQL connection string and JWT secrets.

### 3. Setup database

```bash
# Create database
createdb shopcount

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

### 4. Start API server

```bash
npm run dev:api
# API available at http://localhost:3001
```

### 5. Start mobile app

```bash
npm run dev:mobile
# Scan QR code with Expo Go, or press 'i'/'a' for simulator
```

**Important:** Update `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`:
- iOS Simulator: `http://localhost:3001/api/v1`
- Android Emulator: `http://10.0.2.2:3001/api/v1`
- Physical device: `http://<your-computer-ip>:3001/api/v1`

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@desimart.com | password123 |
| Manager | manager@desimart.com | password123 |
| Staff | staff@desimart.com | password123 |

## Mobile Screens

| # | Screen | Route |
|---|--------|-------|
| 1 | Splash / Auth Loading | `/` |
| 2 | Login | `/login` |
| 3 | Dashboard | `/(tabs)/dashboard` |
| 4 | Products List | `/(tabs)/products` |
| 5 | Product Detail | `/product/[id]` |
| 6 | Count Sessions List | `/(tabs)/counts` |
| 7 | Create Count Session | `/count/create` |
| 8 | Count Session Detail | `/count/[id]` |
| 9 | Scan Count | `/count/scan` |
| 10 | Manual Count Entry | `/count/manual` |
| 11 | Variance Review | `/count/review` |
| 12 | Restricted Items Review | `/count/restricted` |
| 13 | Audit History | `/audit` |
| 14 | Settings | `/(tabs)/settings` |

## Testing

```bash
npm test
```

## Live deployment

| Resource | URL |
|----------|-----|
| **API** | https://shopcount-api-production.up.railway.app |
| **Health** | https://shopcount-api-production.up.railway.app/health |
| **API base** | https://shopcount-api-production.up.railway.app/api/v1 |
| **Railway project** | https://railway.com/project/ef579065-578c-4560-af3b-dc663aea1063 |

Mobile app env:
```
EXPO_PUBLIC_API_URL=https://shopcount-api-production.up.railway.app/api/v1
```

## Deploy to Railway

The API is ready to deploy to [Railway](https://railway.com) with the included `Dockerfile`.

**Quick steps:**
1. Connect this GitHub repo in Railway → **Deploy from GitHub**
2. Add a **PostgreSQL** database to the project
3. Reference `DATABASE_URL` on the API service
4. Set `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `RUN_SEED=true` (first deploy)
5. Generate a public domain → use as `EXPO_PUBLIC_API_URL`

Full guide: [docs/RAILWAY.md](docs/RAILWAY.md)

## Platform-Specific TODOs

- [ ] Replace placeholder app icons in `apps/mobile/assets/`
- [ ] Configure EAS Build for production iOS/Android builds
- [ ] Set production JWT secrets and DATABASE_URL
- [ ] Enable HTTPS/TLS for API in production
- [ ] Configure push notifications for manager review alerts (future)
- [ ] Test barcode scanning on physical devices (camera permissions)
- [ ] Android: verify `networkSecurityConfig` for cleartext HTTP in dev

## Example API Requests

### Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@desimart.com","password":"password123","deviceId":"test-device"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "staff@desimart.com", "name": "Amit Kumar", "role": "staff", "storeId": "..." },
    "tokens": { "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }
  }
}
```

### Lookup Barcode

```bash
curl -X POST http://localhost:3001/api/v1/products/lookup-barcode \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"barcode":"8901234567001","storeId":"STORE_ID"}'
```

### Upsert Count Line

```bash
curl -X PUT http://localhost:3001/api/v1/count-sessions/$SESSION_ID/lines \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Device-Id: test-device" \
  -H "Content-Type: application/json" \
  -d '{"productId":"...","locationId":"...","countedQty":22,"increment":false}'
```

See [docs/API.md](docs/API.md) for full endpoint reference.

## Documentation

- [Architecture & ER Diagram](docs/ARCHITECTURE.md)
- [API Endpoint Summary](docs/API.md)
- [Assumptions](docs/ASSUMPTIONS.md)
- [Future Enhancements](docs/FUTURE.md)

## License

Private — internal use only.
