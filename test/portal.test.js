import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEST_DB = path.join(ROOT, 'data', 'test-training.sqlite');

process.env.AUTH_MODE = 'demo';
process.env.TRAINING_JWT_SECRET = 'test-secret-for-unit-tests';
process.env.TRAINING_DB_PATH = TEST_DB;
process.env.NODE_ENV = 'test';

const { initDb, closeDb, getDb, nowIso } = await import('../server/db/index.js');
const { seedIfEmpty } = await import('../server/db/seed.js');
const { authenticate, toPublicUser, getUserByEmail } = await import('../server/auth/service.js');
const { hasPermission } = await import('../server/rbac.js');
const { userCanSeeRoleGated } = await import('../server/auth/middleware.js');
const {
  scoreQuizAttempt,
  submitQuiz,
  revokeCertification,
  refreshExpiredCertifications,
  listUserCertifications,
} = await import('../server/services/certification.js');
const { listDocumentsForUser, listCoursesForUser } = await import('../server/services/catalog.js');

before(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  initDb({ reset: true });
  seedIfEmpty();
});

after(() => {
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

describe('auth (demo mode)', () => {
  it('logs in seeded admin', async () => {
    const user = await authenticate('admin@airepro.local', 'demo-admin');
    assert.equal(user.email, 'admin@airepro.local');
    assert.ok(user.trainingAccess);
    assert.ok(user.roles.includes('SUPER_ADMIN'));
  });

  it('rejects bad password', async () => {
    await assert.rejects(() => authenticate('admin@airepro.local', 'wrong'), /Invalid/);
  });
});

describe('RBAC', () => {
  it('grants admin permission wildcard', () => {
    assert.equal(hasPermission(['training.admin'], 'training.course.publish'), true);
  });

  it('denies missing permission', () => {
    assert.equal(hasPermission(['training.course.read'], 'training.users.manage'), false);
  });

  it('role-gates documents', async () => {
    const idv = toPublicUser(getUserByEmail('idv@airepro.local'));
    const payment = toPublicUser(getUserByEmail('payment@airepro.local'));
    const idvDocs = listDocumentsForUser(idv, { category: 'idv' });
    const payDocsForIdv = listDocumentsForUser(idv, { category: 'payments' });
    const payDocs = listDocumentsForUser(payment, { category: 'payments' });
    assert.ok(idvDocs.length > 0);
    assert.equal(payDocsForIdv.length, 0);
    assert.ok(payDocs.length > 0);
    assert.equal(userCanSeeRoleGated(idv, ['PAYMENT_AGENT']), false);
    assert.equal(userCanSeeRoleGated(payment, ['PAYMENT_AGENT']), true);
  });
});

describe('quiz scoring + certification', () => {
  it('scores a quiz correctly and issues certification', async () => {
    const user = toPublicUser(getUserByEmail('idv@airepro.local'));
    const courses = listCoursesForUser(user);
    const idvCourse = courses.find((c) => c.slug === 'idv-fundamentals');
    assert.ok(idvCourse);

    const quiz = getDb()
      .prepare('SELECT * FROM quizzes WHERE course_id = ?')
      .get(idvCourse.id);
    const questions = getDb()
      .prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order')
      .all(quiz.id);

    const wrong = scoreQuizAttempt(
      quiz.id,
      questions.map((q) => ({ questionId: q.id, selectedOptionIds: ['nope'] })),
    );
    assert.equal(wrong.passed, false);

    const answers = questions.map((q) => ({
      questionId: q.id,
      selectedOptionIds: JSON.parse(q.correct_option_ids_json),
    }));
    const result = submitQuiz({ userId: user.id, quizId: quiz.id, answers });
    assert.equal(result.passed, true);
    assert.ok(result.score >= 80);
    assert.equal(result.certification.status, 'PASSED');
    assert.ok(result.certification.certificate_id);

    const certs = listUserCertifications(user.id);
    assert.ok(certs.some((c) => c.status === 'PASSED' && c.course_id === idvCourse.id));
  });

  it('expires and revokes certifications', async () => {
    const user = toPublicUser(getUserByEmail('payment@airepro.local'));
    const courses = listCoursesForUser(user);
    const course = courses.find((c) => c.slug === 'payment-operations');
    const quiz = getDb().prepare('SELECT * FROM quizzes WHERE course_id = ?').get(course.id);
    const questions = getDb()
      .prepare('SELECT * FROM quiz_questions WHERE quiz_id = ?')
      .all(quiz.id);
    const answers = questions.map((q) => ({
      questionId: q.id,
      selectedOptionIds: JSON.parse(q.correct_option_ids_json),
    }));
    const result = submitQuiz({ userId: user.id, quizId: quiz.id, answers });
    assert.equal(result.certification.status, 'PASSED');

    const past = new Date(Date.now() - 86400000).toISOString();
    getDb()
      .prepare('UPDATE certifications SET expires_at = ? WHERE id = ?')
      .run(past, result.certification.id);
    refreshExpiredCertifications(user.id);
    const expired = listUserCertifications(user.id).find((c) => c.id === result.certification.id);
    assert.equal(expired.status, 'EXPIRED');

    // Re-issue then revoke
    const again = submitQuiz({ userId: user.id, quizId: quiz.id, answers });
    const revoked = revokeCertification(again.certification.id, 'test revoke', user.id);
    assert.equal(revoked.status, 'REVOKED');
  });
});
