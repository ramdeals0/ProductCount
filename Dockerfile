# ShopCount API — production image for Railway
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install only API workspaces; skip mobile peer deps (expo/react-native) pulled by drizzle-orm
RUN npm ci --omit=peer --workspace=@shopcount/api --workspace=@shopcount/types --include-workspace-root
RUN npm run build -w @shopcount/types && npm run build -w @shopcount/api
RUN npm prune --omit=dev --omit=peer

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["sh", "-c", "node dist/db/migrate.js && if [ \"$RUN_SEED\" = \"true\" ]; then node dist/db/seed.js; fi && node dist/index.js"]
