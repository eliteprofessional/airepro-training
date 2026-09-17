import { initDb, getDb, closeDb } from '../db/index.js';

initDb();
const db = getDb();
const docs = db.prepare('SELECT slug, status, body_md FROM documents').all();
const ph = docs.filter((d) => d.body_md.includes('TRAINING PLACEHOLDER'));
const pending = docs.filter((d) => d.body_md.includes('Pending ops approval'));
console.log(
  JSON.stringify(
    {
      published: docs.filter((d) => d.status === 'PUBLISHED').length,
      in_review: docs.filter((d) => d.status === 'IN_REVIEW').length,
      placeholderBanners: ph.length,
      pendingBanners: pending.length,
      wave2: docs.filter((d) => d.status === 'IN_REVIEW').map((d) => d.slug),
    },
    null,
    2,
  ),
);
closeDb();
