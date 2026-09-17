import { getDb, nowIso, uid, parseJson } from '../db/index.js';
import { writeAudit } from '../auth/service.js';

export function scoreQuizAttempt(quizId, answers) {
  const db = getDb();
  const questions = db
    .prepare(
      'SELECT id, correct_option_ids_json FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order',
    )
    .all(quizId);

  if (!questions.length) {
    return { score: 0, passed: false, total: 0, correct: 0 };
  }

  const answerMap = new Map(
    (answers || []).map((a) => [a.questionId, new Set(a.selectedOptionIds || [])]),
  );

  let correct = 0;
  for (const q of questions) {
    const expected = new Set(parseJson(q.correct_option_ids_json, []));
    const selected = answerMap.get(q.id) || new Set();
    if (expected.size === selected.size && [...expected].every((id) => selected.has(id))) {
      correct += 1;
    }
  }

  const score = Math.round((correct / questions.length) * 100);
  const quiz = db.prepare('SELECT passing_score FROM quizzes WHERE id = ?').get(quizId);
  const passing = quiz?.passing_score ?? 80;
  return { score, passed: score >= passing, total: questions.length, correct, passingScore: passing };
}

export function submitQuiz({ userId, quizId, answers }) {
  const db = getDb();
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);
  if (!quiz || quiz.status !== 'PUBLISHED') {
    const err = new Error('Quiz not found');
    err.status = 404;
    throw err;
  }

  if (quiz.max_attempts != null) {
    const attempts = db
      .prepare(
        'SELECT COUNT(*) AS c FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? AND submitted_at IS NOT NULL',
      )
      .get(quizId, userId).c;
    if (attempts >= quiz.max_attempts) {
      const err = new Error('Maximum quiz attempts reached');
      err.status = 429;
      throw err;
    }
  }

  const result = scoreQuizAttempt(quizId, answers);
  const attemptId = uid('attempt');
  const ts = nowIso();
  db.prepare(
    `INSERT INTO quiz_attempts (id, quiz_id, user_id, score, passed, answers_json, started_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    attemptId,
    quizId,
    userId,
    result.score,
    result.passed ? 1 : 0,
    JSON.stringify(answers || []),
    ts,
    ts,
  );

  writeAudit({
    userId,
    action: 'quiz.submitted',
    resourceType: 'quiz',
    resourceId: quizId,
    meta: { score: result.score, passed: result.passed, attemptId },
  });

  let certification = null;
  if (quiz.course_id) {
    certification = upsertCertificationFromQuiz({
      userId,
      courseId: quiz.course_id,
      attemptId,
      score: result.score,
      passed: result.passed,
    });
  }

  return { attemptId, ...result, certification };
}

export function upsertCertificationFromQuiz({ userId, courseId, attemptId, score, passed }) {
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course) return null;

  const existing = db
    .prepare('SELECT * FROM certifications WHERE user_id = ? AND course_id = ?')
    .get(userId, courseId);

  const ts = nowIso();
  refreshExpiredCertifications(userId);

  if (!passed) {
    if (existing) {
      if (existing.status === 'PASSED' || existing.status === 'REVOKED') {
        return existing;
      }
      db.prepare(
        `UPDATE certifications SET status = 'FAILED', score = ?, quiz_attempt_id = ?, updated_at = ? WHERE id = ?`,
      ).run(score, attemptId, ts, existing.id);
      return db.prepare('SELECT * FROM certifications WHERE id = ?').get(existing.id);
    }
    const id = uid('cert');
    const certificateId = `CERT-${course.slug.toUpperCase()}-${id.slice(-8).toUpperCase()}`;
    db.prepare(
      `INSERT INTO certifications (
        id, certificate_id, user_id, course_id, quiz_attempt_id, status, score,
        issued_at, expires_at, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'FAILED', ?, NULL, NULL, ?, ?, ?)`,
    ).run(id, certificateId, userId, courseId, attemptId, score, course.version, ts, ts);
    return db.prepare('SELECT * FROM certifications WHERE id = ?').get(id);
  }

  let expiresAt = null;
  if (course.cert_expiry_days != null) {
    const d = new Date(ts);
    d.setUTCDate(d.getUTCDate() + Number(course.cert_expiry_days));
    expiresAt = d.toISOString();
  }

  if (existing) {
    db.prepare(
      `UPDATE certifications SET status = 'PASSED', score = ?, quiz_attempt_id = ?, issued_at = ?,
       expires_at = ?, version = ?, revoked_at = NULL, revoke_reason = NULL, updated_at = ?
       WHERE id = ?`,
    ).run(score, attemptId, ts, expiresAt, course.version, ts, existing.id);
    writeAudit({
      userId,
      action: 'certification.issued',
      resourceType: 'certification',
      resourceId: existing.id,
      meta: { courseId, score },
    });
    db.prepare(
      `INSERT INTO user_course_progress (user_id, course_id, status, percent, updated_at)
       VALUES (?, ?, 'COMPLETED', 100, ?)
       ON CONFLICT(user_id, course_id) DO UPDATE SET status = 'COMPLETED', percent = 100, updated_at = excluded.updated_at`,
    ).run(userId, courseId, ts);
    return db.prepare('SELECT * FROM certifications WHERE id = ?').get(existing.id);
  }

  const id = uid('cert');
  const certificateId = `CERT-${course.slug.toUpperCase()}-${id.slice(-8).toUpperCase()}`;
  db.prepare(
    `INSERT INTO certifications (
      id, certificate_id, user_id, course_id, quiz_attempt_id, status, score,
      issued_at, expires_at, version, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'PASSED', ?, ?, ?, ?, ?, ?)`,
  ).run(id, certificateId, userId, courseId, attemptId, score, ts, expiresAt, course.version, ts, ts);

  writeAudit({
    userId,
    action: 'certification.issued',
    resourceType: 'certification',
    resourceId: id,
    meta: { courseId, score },
  });

  db.prepare(
    `INSERT INTO user_course_progress (user_id, course_id, status, percent, updated_at)
     VALUES (?, ?, 'COMPLETED', 100, ?)
     ON CONFLICT(user_id, course_id) DO UPDATE SET status = 'COMPLETED', percent = 100, updated_at = excluded.updated_at`,
  ).run(userId, courseId, ts);

  return db.prepare('SELECT * FROM certifications WHERE id = ?').get(id);
}

export function refreshExpiredCertifications(userId = null) {
  const db = getDb();
  const ts = nowIso();
  if (userId) {
    db.prepare(
      `UPDATE certifications SET status = 'EXPIRED', updated_at = ?
       WHERE user_id = ? AND status = 'PASSED' AND expires_at IS NOT NULL AND expires_at < ?`,
    ).run(ts, userId, ts);
  } else {
    db.prepare(
      `UPDATE certifications SET status = 'EXPIRED', updated_at = ?
       WHERE status = 'PASSED' AND expires_at IS NOT NULL AND expires_at < ?`,
    ).run(ts, ts);
  }
}

export function revokeCertification(certId, reason, actorId) {
  const db = getDb();
  const cert = db.prepare('SELECT * FROM certifications WHERE id = ?').get(certId);
  if (!cert) {
    const err = new Error('Certification not found');
    err.status = 404;
    throw err;
  }
  const ts = nowIso();
  db.prepare(
    `UPDATE certifications SET status = 'REVOKED', revoked_at = ?, revoke_reason = ?, updated_at = ? WHERE id = ?`,
  ).run(ts, reason || 'Revoked by admin', ts, certId);
  writeAudit({
    userId: actorId,
    action: 'certification.revoked',
    resourceType: 'certification',
    resourceId: certId,
    meta: { reason, subjectUserId: cert.user_id },
  });
  return db.prepare('SELECT * FROM certifications WHERE id = ?').get(certId);
}

export function listUserCertifications(userId) {
  refreshExpiredCertifications(userId);
  return getDb()
    .prepare(
      `SELECT c.*, co.title AS course_title, co.slug AS course_slug
       FROM certifications c
       JOIN courses co ON co.id = c.course_id
       WHERE c.user_id = ?
       ORDER BY c.updated_at DESC`,
    )
    .all(userId);
}
