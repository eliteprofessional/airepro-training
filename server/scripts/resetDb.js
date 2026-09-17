import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { initDb, closeDb, getDbPath } from '../db/index.js';
import { seedIfEmpty } from '../db/seed.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(ROOT, '.env') });

process.env.TRAINING_DB_PATH =
  process.env.TRAINING_DB_PATH || path.join(ROOT, 'data', 'training.sqlite');

closeDb();
initDb({ reset: true });
seedIfEmpty();
console.log('Reset database at', getDbPath());
closeDb();
