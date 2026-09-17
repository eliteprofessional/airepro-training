import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

let db;

export function getDbPath() {
  if (process.env.TRAINING_DB_PATH) {
    return path.isAbsolute(process.env.TRAINING_DB_PATH)
      ? process.env.TRAINING_DB_PATH
      : path.join(ROOT_DIR, process.env.TRAINING_DB_PATH);
  }
  return path.join(ROOT_DIR, 'data', 'training.sqlite');
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function nowIso() {
  return new Date().toISOString();
}

export function uid(prefix = '') {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function initDb({ reset = false } = {}) {
  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  if (reset && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  runMigrations(db);
  return db;
}

function runMigrations(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied = new Set(
    database.prepare('SELECT id FROM schema_migrations').all().map((r) => r.id),
  );

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    database.exec('BEGIN');
    try {
      database.exec(sql);
      database
        .prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)')
        .run(file, nowIso());
      database.exec('COMMIT');
      console.log(`Applied migration ${file}`);
    } catch (err) {
      database.exec('ROLLBACK');
      throw err;
    }
  }
}

export function parseJson(value, fallback = null) {
  if (value == null || value === '') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function closeDb() {
  if (db) {
    db.close();
    db = undefined;
  }
}
