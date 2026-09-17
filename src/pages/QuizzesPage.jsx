import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

function QuizzesPage() {
  const { slug } = useParams();
  const [quizzes, setQuizzes] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setResult(null);
    setAnswers({});
    setIndex(0);
    if (!slug) {
      api
        .quizzes()
        .then((d) => setQuizzes(d.quizzes))
        .catch((err) => setError(err.message));
      return;
    }
    api
      .quiz(slug)
      .then((d) => setQuiz(d.quiz))
      .catch((err) => setError(err.message));
  }, [slug]);

  const questions = quiz?.questions || [];
  const current = questions[index];
  const progressPct = questions.length
    ? Math.round(((index + (result ? 1 : 0)) / questions.length) * 100)
    : 0;

  const allAnswered = useMemo(() => {
    if (!questions.length) return false;
    return questions.every((q) => (answers[q.id] || []).length > 0);
  }, [questions, answers]);

  function selectOption(questionId, optionId) {
    setAnswers((prev) => ({ ...prev, [questionId]: [optionId] }));
  }

  async function onSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const payload = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedOptionIds: answers[q.id] || [],
      }));
      const data = await api.submitQuiz(slug, payload);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !quiz && !quizzes) {
    return (
      <div className="page">
        <div className="callout callout--danger">{error}</div>
      </div>
    );
  }

  if (!slug) {
    if (!quizzes) {
      return (
        <div className="page">
          <Skeleton rows={4} />
        </div>
      );
    }
    return (
      <div className="page">
        <PageHeader
          eyebrow="Quizzes"
          title="Knowledge checks"
          lede="One question at a time. Answers stay hidden until you submit. Passing issues a certification."
        />
        {quizzes.length ? (
          <div className="card-grid">
            {quizzes.map((q) => (
              <Link key={q.id} className="ops-card ops-card--tone-default" to={`/quizzes/${q.slug}`}>
                <StatusBadge status="REQUIRED">Pass {q.passing_score}%</StatusBadge>
                <h2>{q.title}</h2>
                <p>{q.course_title || 'Standalone assessment'}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No quizzes available"
            description="Complete course modules first, then return here for knowledge checks."
            actionLabel="My Training"
            actionTo="/training"
          />
        )}
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="page">
        <Skeleton rows={4} />
      </div>
    );
  }

  if (result) {
    return (
      <div className="page quiz-focus">
        <p>
          <Link to="/quizzes">← Quizzes</Link>
        </p>
        <div className={`quiz-outcome ${result.passed ? 'quiz-outcome--pass' : 'quiz-outcome--fail'}`}>
          <StatusBadge status={result.passed ? 'PASSED' : 'FAILED'}>
            {result.passed ? 'Passed' : 'Not passed'}
          </StatusBadge>
          <h2>{result.passed ? 'Certification unlocked' : 'Keep practicing'}</h2>
          <p className="quiz-outcome__score">{result.score}%</p>
          <p className="muted">
            {result.correct}/{result.total} correct · pass mark {quiz.passingScore}%
          </p>
          {result.certification ? (
            <p>
              Certification: <strong>{result.certification.status}</strong>
              {result.certification.certificate_id
                ? ` · ${result.certification.certificate_id}`
                : null}
            </p>
          ) : null}
          <div className="choice-row" style={{ marginTop: '1.25rem' }}>
            <Link className="btn btn--primary" to="/certifications">
              View certifications
            </Link>
            {!result.passed ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setIndex(0);
                }}
              >
                Try again
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page quiz-focus">
      <p>
        <Link to="/quizzes">← Quizzes</Link>
      </p>
      <PageHeader
        eyebrow={`Quiz · pass ${quiz.passingScore}%`}
        title={quiz.title}
        lede={quiz.description || 'Select an answer, then continue.'}
      />

      {error ? <div className="callout callout--danger">{error}</div> : null}

      <div className="quiz-progress">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <div className="progress-bar progress-bar--sm" style={{ flex: 1, maxWidth: '14rem' }}>
          <div className="progress-bar__fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {current ? (
        <section className="quiz-card" key={current.id}>
          <p className="quiz-card__prompt">
            <span className="muted">[{current.type}] </span>
            {current.prompt}
          </p>
          <div className="quiz-options">
            {current.options.map((opt) => {
              const selected = (answers[current.id] || []).includes(opt.id);
              return (
                <label key={opt.id} className={`quiz-option${selected ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name={current.id}
                    checked={selected}
                    onChange={() => selectOption(current.id, opt.id)}
                  />
                  {opt.text}
                </label>
              );
            })}
          </div>

          <div className="quiz-nav">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </button>
            {index < questions.length - 1 ? (
              <button
                type="button"
                className="btn btn--primary"
                disabled={!(answers[current.id] || []).length}
                onClick={() => setIndex((i) => i + 1)}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                disabled={!allAnswered || submitting}
                onClick={onSubmit}
              >
                {submitting ? 'Submitting…' : 'Submit answers'}
              </button>
            )}
          </div>
          {quiz.attempts?.length ? (
            <p className="muted" style={{ marginTop: '1rem' }}>
              Previous attempts: {quiz.attempts.length}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export default QuizzesPage;
