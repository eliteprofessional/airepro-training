import { Router } from 'express';
import { requireAuth, requireTrainingAccess, requirePermission } from '../auth/middleware.js';
import { getDb, nowIso, uid } from '../db/index.js';
import { writeAudit, getUserByEmail, toPublicUser, getUserById } from '../auth/service.js';
import { ROLES, ROLE_LIST } from '../rbac.js';
import { revokeCertification, listUserCertifications } from '../services/certification.js';
import { hashPassword } from '../db/seed.js';

const router = Router();

router.use(requireAuth, requireTrainingAccess);
router.use(requirePermission('training.admin', 'training.content.manage'));

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

router.get('/meta', (_req, res) => {
  res.json({
    roles: ROLE_LIST,
    documentTypes: [
      'article',
      'sop',
      'checklist',
      'decision_tree',
      'faq',
      'troubleshooting',
      'tutorial',
      'policy',
      'quiz',
    ],
    categories: ['general', 'idv', 'payments', 'support', 'jobs', 'internships', 'fraud'],
    statuses: ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'],
  });
});

router.get('/documents', (req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT d.*, s.sop_code FROM documents d
       LEFT JOIN sops s ON s.document_id = d.id
       ORDER BY d.updated_at DESC`,
    )
    .all();
  res.json({
    documents: rows.map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      type: d.type,
      category: d.category,
      status: d.status,
      version: d.version,
      sopCode: d.sop_code || null,
      updatedAt: d.updated_at,
    })),
  });
});

router.get('/documents/:id', (req, res) => {
  const d = getDb()
    .prepare(
      `SELECT d.*, s.sop_code, s.do_items_json, s.dont_items_json, s.related_sop_codes_json
       FROM documents d LEFT JOIN sops s ON s.document_id = d.id
       WHERE d.id = ? OR d.slug = ?`,
    )
    .get(req.params.id, req.params.id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  const roles = getDb()
    .prepare('SELECT role_id FROM document_roles WHERE document_id = ?')
    .all(d.id)
    .map((r) => r.role_id);
  res.json({
    document: {
      ...d,
      roles,
      doItems: JSON.parse(d.do_items_json || '[]'),
      dontItems: JSON.parse(d.dont_items_json || '[]'),
      related: JSON.parse(d.related_sop_codes_json || '[]'),
    },
  });
});

router.post('/documents', (req, res) => {
  const body = req.body || {};
  const title = body.title?.trim();
  if (!title) return res.status(400).json({ error: 'title is required' });
  const slug = slugify(body.slug || title);
  if (!slug) return res.status(400).json({ error: 'Invalid slug' });

  const db = getDb();
  if (db.prepare('SELECT id FROM documents WHERE slug = ?').get(slug)) {
    return res.status(409).json({ error: 'Slug already exists' });
  }

  const id = uid('doc');
  const ts = nowIso();
  const status = body.status || 'DRAFT';
  db.prepare(
    `INSERT INTO documents (
      id, slug, title, type, category, department, status, version, body_md, summary,
      owner, estimated_minutes, purpose, prerequisites_json, escalation_rules_json,
      tags_json, change_summary, author, created_at, updated_at, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    slug,
    title,
    body.type || 'article',
    body.category || 'general',
    body.department || null,
    status,
    body.version || '1.0',
    body.bodyMd || body.body_md || '',
    body.summary || null,
    body.owner || req.user.name || req.user.email,
    body.estimatedMinutes || 10,
    body.purpose || null,
    JSON.stringify(body.prerequisites || []),
    JSON.stringify(body.escalationRules || []),
    JSON.stringify(body.tags || []),
    body.changeSummary || 'Created via admin',
    req.user.email,
    ts,
    ts,
    status === 'PUBLISHED' ? ts : null,
  );

  if (body.type === 'sop' || body.sopCode) {
    db.prepare(
      `INSERT INTO sops (document_id, sop_code, do_items_json, dont_items_json, related_sop_codes_json)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      id,
      body.sopCode || `SOP-${slug.toUpperCase().slice(0, 12)}`,
      JSON.stringify(body.doItems || []),
      JSON.stringify(body.dontItems || []),
      JSON.stringify(body.related || []),
    );
  }

  const roleStmt = db.prepare('INSERT INTO document_roles (document_id, role_id) VALUES (?, ?)');
  for (const role of body.roles || []) {
    if (ROLE_LIST.includes(role)) roleStmt.run(id, role);
  }

  writeAudit({
    userId: req.user.id,
    action: 'content.created',
    resourceType: 'document',
    resourceId: id,
  });
  res.status(201).json({ id, slug });
});

router.put('/documents/:id', (req, res) => {
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM documents WHERE id = ? OR slug = ?')
    .get(req.params.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const body = req.body || {};
  const ts = nowIso();
  const status = body.status || existing.status;
  db.prepare(
    `UPDATE documents SET title = ?, type = ?, category = ?, department = ?, status = ?, version = ?,
     body_md = ?, summary = ?, purpose = ?, tags_json = ?, change_summary = ?, updated_at = ?,
     published_at = CASE WHEN ? = 'PUBLISHED' AND published_at IS NULL THEN ? ELSE published_at END
     WHERE id = ?`,
  ).run(
    body.title || existing.title,
    body.type || existing.type,
    body.category || existing.category,
    body.department ?? existing.department,
    status,
    body.version || existing.version,
    body.bodyMd ?? body.body_md ?? existing.body_md,
    body.summary ?? existing.summary,
    body.purpose ?? existing.purpose,
    JSON.stringify(body.tags || JSON.parse(existing.tags_json || '[]')),
    body.changeSummary || existing.change_summary,
    ts,
    status,
    ts,
    existing.id,
  );

  if (Array.isArray(body.roles)) {
    db.prepare('DELETE FROM document_roles WHERE document_id = ?').run(existing.id);
    const roleStmt = db.prepare('INSERT INTO document_roles (document_id, role_id) VALUES (?, ?)');
    for (const role of body.roles) {
      if (ROLE_LIST.includes(role)) roleStmt.run(existing.id, role);
    }
  }

  writeAudit({
    userId: req.user.id,
    action: status === 'PUBLISHED' ? 'content.published' : 'content.updated',
    resourceType: 'document',
    resourceId: existing.id,
  });
  res.json({ ok: true });
});

router.delete('/documents/:id', (req, res) => {
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM documents WHERE id = ? OR slug = ?')
    .get(req.params.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM document_roles WHERE document_id = ?').run(existing.id);
  db.prepare('DELETE FROM sops WHERE document_id = ?').run(existing.id);
  db.prepare('DELETE FROM documents WHERE id = ?').run(existing.id);
  writeAudit({
    userId: req.user.id,
    action: 'content.deleted',
    resourceType: 'document',
    resourceId: existing.id,
  });
  res.json({ ok: true });
});

router.get('/courses', (_req, res) => {
  const courses = getDb().prepare('SELECT * FROM courses ORDER BY sort_order, title').all();
  res.json({ courses });
});

router.get('/users', requirePermission('training.users.manage', 'training.admin'), (_req, res) => {
  const users = getDb()
    .prepare('SELECT id, email, name, department, training_access, last_login_at, created_at FROM users ORDER BY email')
    .all()
    .map((u) => toPublicUser(u));
  res.json({ users });
});

router.patch(
  '/users/:id',
  requirePermission('training.users.manage', 'training.admin'),
  (req, res) => {
    const db = getDb();
    const user = getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const body = req.body || {};
    const ts = nowIso();

    if (body.trainingAccess != null) {
      db.prepare('UPDATE users SET training_access = ?, updated_at = ? WHERE id = ?').run(
        body.trainingAccess ? 1 : 0,
        ts,
        user.id,
      );
    }
    if (body.name != null) {
      db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(body.name, ts, user.id);
    }
    if (body.department != null) {
      db.prepare('UPDATE users SET department = ?, updated_at = ? WHERE id = ?').run(
        body.department,
        ts,
        user.id,
      );
    }
    if (Array.isArray(body.roles)) {
      db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(user.id);
      const stmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      for (const role of body.roles) {
        if (ROLE_LIST.includes(role)) stmt.run(user.id, role);
      }
    }

    writeAudit({
      userId: req.user.id,
      action: 'users.updated',
      resourceType: 'user',
      resourceId: user.id,
      meta: { roles: body.roles, trainingAccess: body.trainingAccess },
    });
    res.json({ user: toPublicUser(getUserById(user.id)) });
  },
);

router.post(
  '/users',
  requirePermission('training.users.manage', 'training.admin'),
  (req, res) => {
    const { email, name, department, roles, password, trainingAccess = true } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (getUserByEmail(email)) return res.status(409).json({ error: 'User already exists' });

    const id = uid('user');
    const ts = nowIso();
    getDb()
      .prepare(
        `INSERT INTO users (id, email, name, department, training_access, demo_password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        email.toLowerCase(),
        name || email,
        department || null,
        trainingAccess ? 1 : 0,
        password ? hashPassword(password) : null,
        ts,
        ts,
      );

    const stmt = getDb().prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
    for (const role of roles || [ROLES.OPERATIONS_AGENT]) {
      if (ROLE_LIST.includes(role)) stmt.run(id, role);
    }

    writeAudit({
      userId: req.user.id,
      action: 'users.provisioned',
      resourceType: 'user',
      resourceId: id,
    });
    res.status(201).json({ user: toPublicUser(getUserById(id)) });
  },
);

router.get(
  '/certifications',
  requirePermission('training.certification.read', 'training.admin'),
  (req, res) => {
    if (req.query.userId) {
      return res.json({ certifications: listUserCertifications(req.query.userId) });
    }
    const rows = getDb()
      .prepare(
        `SELECT c.*, u.email, u.name, co.title AS course_title
         FROM certifications c
         JOIN users u ON u.id = c.user_id
         JOIN courses co ON co.id = c.course_id
         ORDER BY c.updated_at DESC LIMIT 200`,
      )
      .all();
    res.json({ certifications: rows });
  },
);

router.post(
  '/certifications/:id/revoke',
  requirePermission('training.certification.revoke', 'training.admin'),
  (req, res) => {
    try {
      const cert = revokeCertification(req.params.id, req.body?.reason, req.user.id);
      res.json({ certification: cert });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },
);

router.get('/announcements', (_req, res) => {
  res.json({
    announcements: getDb()
      .prepare('SELECT * FROM announcements ORDER BY created_at DESC')
      .all(),
  });
});

router.post('/announcements', (req, res) => {
  const { title, bodyMd, importance = 'NORMAL', status = 'PUBLISHED' } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  const id = uid('ann');
  const ts = nowIso();
  getDb()
    .prepare(
      `INSERT INTO announcements (id, title, body_md, importance, status, published_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, title, bodyMd || '', importance, status, status === 'PUBLISHED' ? ts : null, ts);
  res.status(201).json({ id });
});

export default router;
