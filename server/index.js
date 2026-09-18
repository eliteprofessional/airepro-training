import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { createCorsOptions } from './cors.js';
import { initDb } from './db/index.js';
import { seedIfEmpty, ensureDemoUsers } from './db/seed.js';
import { getAuthMode } from './auth/service.js';
import authRoutes from './routes/auth.js';
import portalRoutes from './routes/portal.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

initDb();
seedIfEmpty();
if (getAuthMode() === 'demo') {
  ensureDemoUsers();
}

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
    authMode: process.env.AUTH_MODE || 'demo',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/admin', adminRoutes);

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
  if (!process.env.TRAINING_JWT_SECRET && !process.env.ADMIN_TOKEN_SECRET) {
    console.warn('Warning: set TRAINING_JWT_SECRET (or ADMIN_TOKEN_SECRET) in .env');
  }
});

server.on('error', (error) => {
  console.error('Server failed to start', error);
  process.exit(1);
});
