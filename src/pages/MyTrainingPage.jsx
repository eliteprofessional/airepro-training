import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import MarkdownRenderer from '../components/training/MarkdownRenderer';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

function MyTrainingPage() {
  const { slug } = useParams();
  const [courses, setCourses] = useState(null);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (!slug) {
      api
        .courses()
        .then((d) => setCourses(d.courses))
        .catch((err) => setError(err.message));
      return;
    }
    api
      .course(slug)
      .then((d) => setCourse(d.course))
      .catch((err) => setError(err.message));
  }, [slug]);

  async function markComplete(lessonId) {
    setBusy(lessonId);
    try {
      await api.completeLesson(lessonId);
      const d = await api.course(slug);
      setCourse(d.course);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  if (error) {
    return (
      <div className="page">
        <div className="callout callout--danger">{error}</div>
      </div>
    );
  }

  if (!slug) {
    if (!courses) {
      return (
        <div className="page">
          <Skeleton rows={4} />
        </div>
      );
    }
    return (
      <div className="page">
        <PageHeader
          eyebrow="My Training"
          title="Assigned courses"
          lede="Complete modules, then take the course quiz to earn certification."
        />
        {courses.length ? (
          <div className="card-grid">
            {courses.map((c) => (
              <Link key={c.id} className="ops-card ops-card--tone-default" to={`/training/${c.slug}`}>
                <StatusBadge status={c.required ? 'REQUIRED' : 'OPTIONAL'}>
                  {c.required ? 'Required' : 'Optional'}
                </StatusBadge>
                <h2>{c.title}</h2>
                <p>{c.description}</p>
                <div className="progress-bar progress-bar--sm">
                  <div
                    className="progress-bar__fill"
                    style={{ width: `${c.progress?.percent || 0}%` }}
                  />
                </div>
                <p className="muted">
                  {c.progress?.percent || 0}% · Cert: {c.certificationStatus}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No courses assigned"
            description="When your administrator assigns training, it will appear here."
            actionLabel="Open dashboard"
            actionTo="/dashboard"
          />
        )}
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page">
        <Skeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="page">
      <p>
        <Link to="/training">← My Training</Link>
      </p>
      <PageHeader
        eyebrow={`Course · v${course.version}`}
        title={course.title}
        lede={course.description}
        actions={
          <StatusBadge status={course.certificationStatus || 'IN_PROGRESS'}>
            {course.certificationStatus || 'In progress'}
          </StatusBadge>
        }
      />

      {course.modules?.map((mod) => (
        <section key={mod.id} className="panel">
          <h2>{mod.title}</h2>
          {mod.lessons.map((lesson) => (
            <details key={lesson.id} className="lesson" open={false}>
              <summary>
                {lesson.completed ? '✓ ' : ''}
                {lesson.title}
                <span className="muted"> · {lesson.durationMinutes || 5} min</span>
              </summary>
              <MarkdownRenderer markdown={lesson.bodyMd || ''} />
              {!lesson.completed ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={busy === lesson.id}
                  onClick={() => markComplete(lesson.id)}
                >
                  Mark complete
                </button>
              ) : (
                <p className="muted">Completed</p>
              )}
            </details>
          ))}
        </section>
      ))}

      {course.quiz ? (
        <section className="panel panel--accent">
          <h2>Knowledge check</h2>
          <p>Pass the quiz to earn your certification for this course.</p>
          <Link className="btn btn--primary" to={`/quizzes/${course.quiz.slug}`}>
            Take quiz: {course.quiz.title}
          </Link>
        </section>
      ) : null}
    </div>
  );
}

export default MyTrainingPage;
