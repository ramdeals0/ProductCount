import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './lib/errors.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'shopcount-api', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'shopcount-api',
    message: 'ShopCount inventory API',
    health: '/health',
    api: '/api/v1',
    mobileEnvHint: 'Set EXPO_PUBLIC_API_URL=https://productcount.up.railway.app/api/v1',
  });
});

app.use('/api/v1', routes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found. API lives at /api/v1 — e.g. POST /api/v1/auth/login`,
    },
  });
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ShopCount API running on port ${PORT}`);
});

export default app;
