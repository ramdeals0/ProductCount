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

app.use('/api/v1', routes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ShopCount API running on http://localhost:${PORT}`);
});

export default app;
