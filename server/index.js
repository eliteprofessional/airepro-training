import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import trainingRoutes from './routes/training.js';
import adminRoutes from './routes/admin.js';
import { createCorsOptions } from './cors.js';
import { ROOT_DIR, TRAINING_DIR } from './resources.js';

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const isProduction = process.env.NODE_ENV === 'production';
const serveFrontend = process.env.SERVE_FRONTEND === 'true';

const app = express();

app.use(cors(createCorsOptions()));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'airepro-training-api',
  });
});

app.use('/api/training', trainingRoutes);
app.use('/api/admin', adminRoutes);

app.use('/training', express.static(TRAINING_DIR, { fallthrough: true }));

if (isProduction && serveFrontend) {
  app.use(express.static(DIST_DIR));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  const host = process.env.HOST || '0.0.0.0';
  console.log(`airepro-training API listening on http://${host}:${PORT}`);
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_TOKEN_SECRET) {
    console.warn(
      'Warning: set ADMIN_PASSWORD and ADMIN_TOKEN_SECRET in .env for admin login.',
    );
  }
});

server.on('error', (error) => {
  console.error('Server failed to start', error);
  process.exit(1);
});
