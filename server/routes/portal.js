import { Router } from 'express';
import { requireAuth, requireTrainingAccess } from '../auth/middleware.js';
import {
  buildDashboard,
  listCoursesForUser,
  getCourseDetail,
  completeLesson,
  listDocumentsForUser,
  getDocumentForUser,
  listDecisionTreesForUser,
  getDecisionTreeForUser,
  searchKnowledge,
} from '../services/catalog.js';
import { getDb, nowIso, uid } from '../db/index.js';
import { writeAudit } from '../auth/service.js';
import { submitQuiz, listUserCertifications } from '../services/certification.js';

const router = Router();

router.use(requireAuth, requireTrainingAccess);

router.get('/dashboard', (req, res) => {
  res.json(buildDashboard(req.user));
});

router.get('/courses', (req, res) => {
  res.json({ courses: listCoursesForUser(req.user) });
});

router.get('/courses/:slug', (req, res) => {
  const course = getCourseDetail(req.user, req.params.slug);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  return res.json({ course });
});

router.post('/lessons/:id/complete', (req, res) => {
  try {
    completeLesson(req.user.id, req.params.id);
    writeAudit({
      userId: req.user.id,
      action: 'lesson.completed',
      resourceType: 'lesson',
      resourceId: req.params.id,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/documents', (req, res) => {
  const { type, category, q } = req.query;
  res.json({
    documents: listDocumentsForUser(req.user, { type, category, q }),
  });
});

router.get('/documents/:slug', (req, res) => {
  const doc = getDocumentForUser(req.user, req.params.slug, { includeBody: true });
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  writeAudit({
    userId: req.user.id,
    action: 'document.viewed',
    resourceType: 'document',
    resourceId: doc.id,
  });
  return res.json({ document: doc });
});

router.post('/documents/:slug/acknowledge', (req, res) => {
  const doc = getDocumentForUser(req.user, req.params.slug, { includeBody: false });
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  getDb()
    .prepare(
      `INSERT INTO document_acknowledgements (document_id, user_id, version, acknowledged_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(document_id, user_id, version) DO UPDATE SET acknowledged_at = excluded.acknowledged_at`,
    )
    .run(doc.id, req.user.id, doc.version, nowIso());
  writeAudit({
    userId: req.user.id,
    action: 'document.acknowledged',
    resourceType: 'document',
    resourceId: doc.id,
    meta: { version: doc.version },
  });
  res.json({ ok: true });
});

router.get('/sops', (req, res) => {
  res.json({
    documents: listDocumentsForUser(req.user, { type: 'sop', category: req.query.category }),
  });
});

router.get('/decision-trees', (req, res) => {
  res.json({ trees: listDecisionTreesForUser(req.user) });
});

router.get('/decision-trees/:slug', (req, res) => {
  const tree = getDecisionTreeForUser(req.user, req.params.slug);
  if (!tree) return res.status(404).json({ error: 'Decision tree not found' });
  writeAudit({
    userId: req.user.id,
    action: 'decision_tree.viewed',
    resourceType: 'decision_tree',
    resourceId: tree.id,
  });
  res.json({ tree });
});

router.get('/knowledge/search', (req, res) => {
  const q = String(req.query.q || '');
  const results = searchKnowledge(req.user, q);
  getDb()
    .prepare(
      `INSERT INTO search_logs (id, user_id, query, result_count, created_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      uid('search'),
      req.user.id,
      q,
      results.documents.length + results.decisionTrees.length,
      nowIso(),
    );
  res.json(results);
});

router.get('/quizzes', (req, res) => {
  const db = getDb();
  const courses = listCoursesForUser(req.user);
  const courseIds = new Set(courses.map((c) => c.id));
  const quizzes = db
    .prepare(
      `SELECT q.id, q.slug, q.title, q.description, q.passing_score, q.max_attempts, q.course_id, c.title AS course_title, c.slug AS course_slug
       FROM quizzes q
       LEFT JOIN courses c ON c.id = q.course_id
       WHERE q.status = 'PUBLISHED'`,
    )
    .all()
    .filter((q) => !q.course_id || courseIds.has(q.course_id));
  res.json({ quizzes });
});

router.get('/quizzes/:slug', (req, res) => {
  const db = getDb();
  const quiz = db
    .prepare('SELECT * FROM quizzes WHERE (slug = ? OR id = ?) AND status = ?')
    .get(req.params.slug, req.params.slug, 'PUBLISHED');
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  if (quiz.course_id) {
    const courses = listCoursesForUser(req.user);
    if (!courses.some((c) => c.id === quiz.course_id)) {
      return res.status(403).json({ error: 'Quiz not available for your role' });
    }
  }

  const questions = db
    .prepare(
      'SELECT id, type, prompt, options_json, sort_order FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order',
    )
    .all(quiz.id)
    .map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: JSON.parse(q.options_json || '[]'),
      sortOrder: q.sort_order,
    }));

  const attempts = db
    .prepare(
      `SELECT id, score, passed, submitted_at FROM quiz_attempts
       WHERE quiz_id = ? AND user_id = ? AND submitted_at IS NOT NULL
       ORDER BY submitted_at DESC`,
    )
    .all(quiz.id, req.user.id);

  writeAudit({
    userId: req.user.id,
    action: 'quiz.started',
    resourceType: 'quiz',
    resourceId: quiz.id,
  });

  res.json({
    quiz: {
      id: quiz.id,
      slug: quiz.slug,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passing_score,
      maxAttempts: quiz.max_attempts,
      courseId: quiz.course_id,
      questions,
      attempts,
    },
  });
});

router.post('/quizzes/:slug/submit', (req, res) => {
  try {
    const db = getDb();
    const quiz = db
      .prepare('SELECT * FROM quizzes WHERE (slug = ? OR id = ?) AND status = ?')
      .get(req.params.slug, req.params.slug, 'PUBLISHED');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const result = submitQuiz({
      userId: req.user.id,
      quizId: quiz.id,
      answers: req.body?.answers || [],
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/certifications', (req, res) => {
  res.json({ certifications: listUserCertifications(req.user.id) });
});

router.get('/announcements', (req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT a.*, aa.acknowledged_at
       FROM announcements a
       LEFT JOIN announcement_acks aa ON aa.announcement_id = a.id AND aa.user_id = ?
       WHERE a.status = 'PUBLISHED'
       ORDER BY a.published_at DESC`,
    )
    .all(req.user.id);
  res.json({
    announcements: rows.map((a) => ({
      id: a.id,
      title: a.title,
      bodyMd: a.body_md,
      importance: a.importance,
      publishedAt: a.published_at,
      acknowledgedAt: a.acknowledged_at || null,
    })),
  });
});

router.post('/announcements/:id/acknowledge', (req, res) => {
  getDb()
    .prepare(
      `INSERT INTO announcement_acks (announcement_id, user_id, acknowledged_at)
       VALUES (?, ?, ?)
       ON CONFLICT(announcement_id, user_id) DO UPDATE SET acknowledged_at = excluded.acknowledged_at`,
    )
    .run(req.params.id, req.user.id, nowIso());
  res.json({ ok: true });
});

router.get('/profile', (req, res) => {
  res.json({
    user: req.user,
    certifications: listUserCertifications(req.user.id),
    courses: listCoursesForUser(req.user),
  });
});

export default router;
