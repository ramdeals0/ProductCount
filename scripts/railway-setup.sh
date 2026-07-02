#!/usr/bin/env bash
set -euo pipefail

# One-time Railway project setup (run after `railway login` or with RAILWAY_TOKEN set)
#
# Usage:
#   npx railway login
#   ./scripts/railway-setup.sh
#
# Or non-interactive:
#   RAILWAY_TOKEN=xxx ./scripts/railway-setup.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> ShopCount Railway setup"

if ! npx railway whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: npx railway login"
  echo "Or set RAILWAY_TOKEN to a project token."
  exit 1
fi

echo "==> Creating/linking Railway project..."
if [ ! -f .railway/config.json ]; then
  npx railway init --name shopcount-api
fi

echo "==> Adding PostgreSQL (skip if already added)..."
npx railway add -d postgres 2>/dev/null || echo "Postgres may already exist"

JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-$(openssl rand -hex 32)}"

echo "==> Setting environment variables..."
npx railway variables set \
  JWT_SECRET="$JWT_SECRET" \
  JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  JWT_EXPIRES_IN=15m \
  JWT_REFRESH_EXPIRES_IN=7d \
  NODE_ENV=production \
  CORS_ORIGIN='*' \
  RUN_SEED=true

echo "==> Deploying..."
npx railway up --ci

echo "==> Generating domain (if not set)..."
npx railway domain 2>/dev/null || true

echo ""
echo "==> Setup complete!"
echo "API health: check your Railway dashboard for the public URL + /health"
echo ""
echo "Next steps:"
echo "  1. Copy the public URL from Railway dashboard"
echo "  2. Set EXPO_PUBLIC_API_URL=https://<domain>.up.railway.app/api/v1"
echo "  3. Create a project token and add RAILWAY_TOKEN to GitHub secrets for auto-deploy"
echo "  4. Set RUN_SEED=false after first deploy"
