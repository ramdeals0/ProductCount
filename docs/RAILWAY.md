# Deploy ShopCount to Railway

This guide deploys the **ShopCount API** and **PostgreSQL** to [Railway](https://railway.com). The mobile app runs on Expo and connects to the deployed API URL.

## Auto-deploy via GitHub Actions

A workflow at `.github/workflows/deploy-railway.yml` deploys on push to `main`.

**One-time setup** — add this secret to your GitHub repo (Settings → Secrets → Actions):

1. In Railway: open project **shopcount-api** → **Settings** → **Tokens** → **Create Project Token**
2. In GitHub: add secret `RAILWAY_TOKEN` with that token value

Future pushes to `main` will auto-deploy.

## Option A: Deploy from GitHub (recommended)

1. **Push this repo to GitHub** (already done if you merged the PR).

2. **Create a Railway project**
   - Go to [railway.com/new](https://railway.com/new)
   - Choose **Deploy from GitHub repo**
   - Select `ProductCount` / `shopcount` repository
   - Railway detects the `Dockerfile` automatically

3. **Add PostgreSQL**
   - In your Railway project, click **+ New** → **Database** → **PostgreSQL**
   - Railway creates a `DATABASE_URL` variable automatically

4. **Link Postgres to the API service**
   - Open the API service → **Variables** tab
   - Click **Add Reference** → select PostgreSQL → `DATABASE_URL`
   - Or use **Connect** from the Postgres service to inject variables

5. **Set required environment variables** on the API service:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Reference from PostgreSQL service |
   | `JWT_SECRET` | Long random string (32+ chars) |
   | `JWT_REFRESH_SECRET` | Different long random string |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | `*` (or your app domain) |
   | `RUN_SEED` | `true` (first deploy only, then remove or set `false`) |

   Generate secrets:
   ```bash
   openssl rand -hex 32   # use for JWT_SECRET
   openssl rand -hex 32   # use for JWT_REFRESH_SECRET
   ```

6. **Deploy**
   - Railway builds the Docker image and runs migrations on startup
   - With `RUN_SEED=true`, demo data is loaded on first boot
   - Open the service **Settings** → **Networking** → **Generate Domain**
   - Your API base URL: `https://<your-domain>.up.railway.app/api/v1`

7. **Verify**
   ```bash
   curl https://<your-domain>.up.railway.app/health
   curl -X POST https://<your-domain>.up.railway.app/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"staff@desimart.com","password":"password123"}'
   ```

8. **Point the mobile app** — set in `apps/mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=https://<your-domain>.up.railway.app/api/v1
   ```

## Option B: Deploy with Railway CLI

```bash
# Install CLI
npm install -g @railway/cli

# Login (opens browser)
railway login

# From repo root
railway init          # create or link project
railway add -d postgres   # add PostgreSQL

# Set secrets
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set JWT_REFRESH_SECRET=$(openssl rand -hex 32)
railway variables set NODE_ENV=production
railway variables set RUN_SEED=true

# Deploy
railway up

# Generate public URL
railway domain
```

## What runs on deploy

The Docker `CMD` executes:

1. `node dist/db/migrate.js` — applies PostgreSQL migrations
2. `node dist/db/seed.js` — only if `RUN_SEED=true`
3. `node dist/index.js` — starts Express on `$PORT` (Railway injects this)

Health check: `GET /health`

## Architecture on Railway

```
┌─────────────────────────────────────┐
│  Railway Project                    │
│                                     │
│  ┌──────────────┐  ┌─────────────┐  │
│  │ ShopCount API│──│ PostgreSQL  │  │
│  │ (Docker)     │  │             │  │
│  └──────┬───────┘  └─────────────┘  │
│         │                           │
│         │ https://*.up.railway.app  │
└─────────┼───────────────────────────┘
          │
    ┌─────▼──────┐
    │ Expo Mobile│
    │ (local/EAS)│
    └────────────┘
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check Railway build logs; ensure `package-lock.json` is committed |
| DB connection error | Verify `DATABASE_URL` is referenced from Postgres service |
| 502 on health check | Migrations may be slow; increase `healthcheckTimeout` in `railway.toml` |
| Login fails after deploy | Set `RUN_SEED=true` and redeploy once, or run seed manually |
| Mobile can't reach API | Use the public Railway HTTPS URL, not `localhost` |

## Cost note

Railway offers a free trial / hobby tier with usage limits. PostgreSQL + one API service typically fits a small MVP. Monitor usage in the Railway dashboard.

## Security checklist for production

- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `RUN_SEED=false` after initial seed
- [ ] Restrict `CORS_ORIGIN` to known origins if possible
- [ ] Change demo user passwords or disable demo accounts
- [ ] Enable Railway private networking if adding internal services later
