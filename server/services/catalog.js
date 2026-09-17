import { getDb, nowIso, parseJson } from '../db/index.js';
import { userCanSeeRoleGated } from '../auth/middleware.js';
import { hasPermission } from '../rbac.js';
import { listUserCertifications } from './certification.js';

export function documentRoles(documentId) {
  return getDb()
    .prepare('SELECT role_id FROM document_roles WHERE document_id = ?')
    .all(documentId)
    .map((r) => r.role_id);
}

export function treeRoles(treeId) {
  return getDb()
    .prepare('SELECT role_id FROM decision_tree_roles WHERE tree_id = ?')
    .all(treeId)
    .map((r) => r.role_id);
}

export function courseRoles(courseId) {
  return getDb()
    .prepare('SELECT role_id, required FROM course_roles WHERE course_id = ?')
    .all(courseId);
}

export function serializeDocument(row, { includeBody = false } = {}) {
  if (!row) return null;
  const base = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    category: row.category,
    department: row.department,
    status: row.status,
    version: row.version,
    summary: row.summary,
    owner: row.owner,
    estimatedMinutes: row.estimated_minutes,
    purpose: row.purpose,
    prerequisites: parseJson(row.prerequisites_json, []),
    escalationRules: parseJson(row.escalation_rules_json, []),
    sla: row.sla,
    effectiveDate: row.effective_date,
    reviewDate: row.review_date,
    tags: parseJson(row.tags_json, []),
    changeSummary: row.change_summary,
    author: row.author,
    reviewer: row.reviewer,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    roles: documentRoles(row.id),
  };
  if (includeBody) base.bodyMd = row.body_md;
  if (row.sop_code) {
    base.sop = {
      code: row.sop_code,
      doItems: parseJson(row.do_items_json, []),
      dontItems: parseJson(row.dont_items_json, []),
      related: parseJson(row.related_sop_codes_json, []),
    };
  }
  return base;
}

export function listDocumentsForUser(user, { type, category, q } = {}) {
  const db = getDb();
  const isAdmin = hasPermission(user.permissions || [], 'training.content.manage');
  let rows = db
    .prepare(
      `SELECT d.*, s.sop_code, s.do_items_json, s.dont_items_json, s.related_sop_codes_json
       FROM documents d
       LEFT JOIN sops s ON s.document_id = d.id
       ORDER BY d.updated_at DESC`,
    )
    .all();

  rows = rows.filter((row) => {
    if (!isAdmin && row.status !== 'PUBLISHED') return false;
    return userCanSeeRoleGated(user, documentRoles(row.id));
  });

  if (type) rows = rows.filter((r) => r.type === type);
  if (category) rows = rows.filter((r) => r.category === category);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) => {
      const hay = `${r.title} ${r.summary || ''} ${r.body_md || ''} ${r.tags_json || ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }

  return rows.map((r) => serializeDocument(r));
}

export function getDocumentForUser(user, slugOrId, { includeBody = true } = {}) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT d.*, s.sop_code, s.do_items_json, s.dont_items_json, s.related_sop_codes_json
       FROM documents d
       LEFT JOIN sops s ON s.document_id = d.id
       WHERE d.slug = ? OR d.id = ?`,
    )
    .get(slugOrId, slugOrId);
  if (!row) return null;
  const isAdmin = hasPermission(user.permissions || [], 'training.content.manage');
  if (!isAdmin && row.status !== 'PUBLISHED') return null;
  if (!userCanSeeRoleGated(user, documentRoles(row.id))) return null;
  return serializeDocument(row, { includeBody });
}

export function listDecisionTreesForUser(user) {
  const db = getDb();
  const isAdmin = hasPermission(user.permissions || [], 'training.content.manage');
  let rows = db.prepare('SELECT * FROM decision_trees ORDER BY title').all();
  rows = rows.filter((row) => {
    if (!isAdmin && row.status !== 'PUBLISHED') return false;
    return userCanSeeRoleGated(user, treeRoles(row.id));
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    status: r.status,
    version: r.version,
    description: r.description,
    updatedAt: r.updated_at,
  }));
}

export function getDecisionTreeForUser(user, slugOrId) {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM decision_trees WHERE slug = ? OR id = ?')
    .get(slugOrId, slugOrId);
  if (!row) return null;
  const isAdmin = hasPermission(user.permissions || [], 'training.content.manage');
  if (!isAdmin && row.status !== 'PUBLISHED') return null;
  if (!userCanSeeRoleGated(user, treeRoles(row.id))) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    status: row.status,
    version: row.version,
    description: row.description,
    rootNodeId: row.root_node_id,
    nodes: parseJson(row.nodes_json, {}),
    updatedAt: row.updated_at,
  };
}

export function listCoursesForUser(user) {
  const db = getDb();
  const isAdmin = hasPermission(user.permissions || [], 'training.course.read');
  let rows = db.prepare('SELECT * FROM courses ORDER BY sort_order, title').all();
  rows = rows.filter((row) => {
    if (row.status !== 'PUBLISHED' && !hasPermission(user.permissions || [], 'training.admin')) {
      return false;
    }
    const roles = courseRoles(row.id).map((r) => r.role_id);
    return userCanSeeRoleGated(user, roles);
  });

  return rows.map((row) => {
    const roleRows = courseRoles(row.id);
    const progress = db
      .prepare('SELECT * FROM user_course_progress WHERE user_id = ? AND course_id = ?')
      .get(user.id, row.id);
    const cert = db
      .prepare('SELECT status, expires_at FROM certifications WHERE user_id = ? AND course_id = ?')
      .get(user.id, row.id);
    const required = roleRows.some((r) => r.required && user.roles.includes(r.role_id));
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      status: row.status,
      version: row.version,
      estimatedMinutes: row.estimated_minutes,
      passingScore: row.passing_score,
      certExpiryDays: row.cert_expiry_days,
      required,
      progress: progress || { status: 'NOT_STARTED', percent: 0 },
      certificationStatus: cert?.status || 'NOT_STARTED',
      certificationExpiresAt: cert?.expires_at || null,
    };
  });
}

export function getCourseDetail(user, slugOrId) {
  const courses = listCoursesForUser(user);
  const course = courses.find((c) => c.slug === slugOrId || c.id === slugOrId);
  if (!course) return null;
  const db = getDb();
  const modules = db
    .prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY sort_order')
    .all(course.id)
    .map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      sortOrder: m.sort_order,
      lessons: db
        .prepare('SELECT * FROM lessons WHERE module_id = ? ORDER BY sort_order')
        .all(m.id)
        .map((l) => {
          const done = db
            .prepare(
              'SELECT completed_at FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?',
            )
            .get(user.id, l.id);
          return {
            id: l.id,
            title: l.title,
            sortOrder: l.sort_order,
            durationMinutes: l.duration_minutes,
            completed: Boolean(done),
            bodyMd: l.body_md,
          };
        }),
    }));

  const quiz = db
    .prepare('SELECT id, slug, title, description, passing_score, max_attempts FROM quizzes WHERE course_id = ?')
    .get(course.id);

  return { ...course, modules, quiz: quiz || null };
}

export function completeLesson(userId, lessonId) {
  const db = getDb();
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
  if (!lesson) {
    const err = new Error('Lesson not found');
    err.status = 404;
    throw err;
  }
  const ts = nowIso();
  db.prepare(
    `INSERT INTO user_lesson_progress (user_id, lesson_id, completed_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET completed_at = excluded.completed_at`,
  ).run(userId, lessonId, ts);

  const module = db.prepare('SELECT course_id FROM modules WHERE id = ?').get(lesson.module_id);
  if (module) {
    const total = db
      .prepare(
        `SELECT COUNT(*) AS c FROM lessons l
         JOIN modules m ON m.id = l.module_id
         WHERE m.course_id = ?`,
      )
      .get(module.course_id).c;
    const done = db
      .prepare(
        `SELECT COUNT(*) AS c FROM user_lesson_progress ulp
         JOIN lessons l ON l.id = ulp.lesson_id
         JOIN modules m ON m.id = l.module_id
         WHERE ulp.user_id = ? AND m.course_id = ?`,
      )
      .get(userId, module.course_id).c;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const status = percent >= 100 ? 'COMPLETED' : done > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
    db.prepare(
      `INSERT INTO user_course_progress (user_id, course_id, status, percent, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, course_id) DO UPDATE SET status = excluded.status, percent = excluded.percent, updated_at = excluded.updated_at`,
    ).run(userId, module.course_id, status === 'COMPLETED' ? 'IN_PROGRESS' : status, Math.min(percent, 99), ts);
    // Cap at 99 until quiz/cert — quiz completion sets 100
  }
  return { ok: true };
}

export function buildDashboard(user) {
  const courses = listCoursesForUser(user);
  const required = courses.filter((c) => c.required);
  const completed = required.filter(
    (c) => c.certificationStatus === 'PASSED' || c.progress?.status === 'COMPLETED',
  );
  const percent = required.length
    ? Math.round((completed.length / required.length) * 100)
    : 0;

  const announcements = getDb()
    .prepare(
      `SELECT id, title, body_md, importance, published_at FROM announcements
       WHERE status = 'PUBLISHED' ORDER BY published_at DESC LIMIT 5`,
    )
    .all();

  const recentDocs = listDocumentsForUser(user).slice(0, 5);
  const certifications = listUserCertifications(user.id);

  return {
    welcomeName: user.name || user.email,
    role: user.roles[0] || null,
    roles: user.roles,
    department: user.department,
    progress: {
      percent,
      completed: completed.length,
      required: required.length,
    },
    requiredCourses: required,
    certifications,
    announcements,
    recentProcedures: recentDocs,
    quickLinks: [
      { label: 'IDV Operations', path: '/operations/idv' },
      { label: 'Payment Operations', path: '/operations/payments' },
      { label: 'Support Tickets', path: '/operations/support' },
      { label: 'Fraud & Risk', path: '/operations/fraud' },
      { label: 'Search Knowledge Base', path: '/knowledge' },
    ],
  };
}

export function searchKnowledge(user, query) {
  const q = String(query || '').trim();
  const docs = listDocumentsForUser(user, { q });
  const trees = listDecisionTreesForUser(user).filter((t) => {
    if (!q) return true;
    const hay = `${t.title} ${t.description || ''} ${t.category || ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });
  return { documents: docs, decisionTrees: trees, query: q };
}
