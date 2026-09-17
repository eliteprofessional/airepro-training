import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import MarkdownRenderer from '../components/training/MarkdownRenderer';
import StatStrip from '../components/ui/StatStrip';
import Skeleton from '../components/ui/Skeleton';
import StatusBadge from '../components/ui/StatusBadge';

const SHORTCUT_BLURBS = {
  '/operations/idv': 'Consent, docs, face match, approve/reject',
  '/operations/payments': 'Statuses, failures, refunds, reconciliation',
  '/operations/support': 'Lifecycle, SLA, escalation, closure',
  '/operations/fraud': 'Cross-cutting risk signals',
  '/knowledge': 'Search SOPs and decision guides',
};

function daysUntil(iso) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const urgency = useMemo(() => {
    if (!data?.certifications) return { expired: [], dueSoon: [] };
    const expired = data.certifications.filter((c) => c.status === 'EXPIRED' || c.status === 'REVOKED');
    const dueSoon = data.certifications.filter((c) => {
      if (c.status !== 'PASSED' || !c.expires_at) return false;
      const d = daysUntil(c.expires_at);
      return d !== null && d >= 0 && d <= 30;
    });
    return { expired, dueSoon };
  }, [data]);

  if (error) {
    return (
      <div className="page">
        <div className="callout callout--danger">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <Skeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="page">
      <section className="dash-hero">
        <p className="eyebrow">Airepro Agent Portal</p>
        <h1>Welcome back, {data.welcomeName}</h1>
        <p className="lede">
          <StatusBadge status={data.role}>{data.role}</StatusBadge>
          {data.department ? <span className="muted"> · {data.department}</span> : null}
        </p>
      </section>

      <StatStrip
        items={[
          { label: 'Training complete', value: `${data.progress.percent}%` },
          {
            label: 'Required courses',
            value: `${data.progress.completed}/${data.progress.required}`,
          },
          { label: 'Certs needing attention', value: urgency.expired.length + urgency.dueSoon.length },
          { label: 'Open announcements', value: data.announcements?.length || 0 },
        ]}
      />

      {(urgency.expired.length > 0 || urgency.dueSoon.length > 0) && (
        <section className="dash-urgency" aria-label="Certification attention">
          {urgency.expired.map((c) => (
            <div key={c.id} className="dash-urgency__item dash-urgency__item--danger">
              <div>
                <StatusBadge status="EXPIRED">Expired</StatusBadge>
                <strong style={{ display: 'block', marginTop: '0.35rem' }}>{c.course_title}</strong>
                <span className="muted">Re-train before performing this operation.</span>
              </div>
              <Link className="btn btn--primary btn--sm" to={`/training/${c.course_slug}`}>
                Retake
              </Link>
            </div>
          ))}
          {urgency.dueSoon.map((c) => (
            <div key={c.id} className="dash-urgency__item">
              <div>
                <StatusBadge status="PENDING">Due soon</StatusBadge>
                <strong style={{ display: 'block', marginTop: '0.35rem' }}>{c.course_title}</strong>
                <span className="muted">Expires {c.expires_at?.slice(0, 10)}</span>
              </div>
              <Link className="btn btn--ghost btn--sm" to="/certifications">
                View
              </Link>
            </div>
          ))}
        </section>
      )}

      <section style={{ marginBottom: '1.5rem' }}>
        <header className="page-hero" style={{ marginBottom: '0.85rem' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>
            Required training
          </h2>
          <p className="lede" style={{ marginTop: '0.35rem' }}>
            Complete modules, then pass the course quiz.
          </p>
        </header>
        <div className="course-action-grid">
          {data.requiredCourses.map((c) => {
            const done =
              c.certificationStatus === 'PASSED' || c.progress?.status === 'COMPLETED';
            return (
              <Link key={c.id} className="course-action-card" to={`/training/${c.slug}`}>
                <div className="meta-row">
                  <StatusBadge status={done ? 'PASSED' : 'IN_PROGRESS'}>
                    {done ? 'Complete' : 'In progress'}
                  </StatusBadge>
                  <StatusBadge status={c.certificationStatus}>{c.certificationStatus}</StatusBadge>
                </div>
                <h3>{c.title}</h3>
                <div className="progress-bar progress-bar--sm">
                  <div
                    className="progress-bar__fill"
                    style={{ width: `${c.progress?.percent || 0}%` }}
                  />
                </div>
                <p className="muted">{c.progress?.percent || 0}% complete</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <header className="page-hero" style={{ marginBottom: '0.85rem' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>
            Quick ops
          </h2>
        </header>
        <div className="ops-shortcut-grid">
          {data.quickLinks.map((link) => (
            <Link key={link.path} className="ops-shortcut" to={link.path}>
              <strong>{link.label}</strong>
              <span>{SHORTCUT_BLURBS[link.path] || 'Open playbook'}</span>
            </Link>
          ))}
        </div>
      </section>

      {data.announcements?.length ? (
        <section className="announce-strip" aria-label="Announcements">
          {data.announcements.slice(0, 3).map((a) => (
            <article key={a.id} className="announce-strip__item">
              {a.importance === 'IMPORTANT' ? (
                <StatusBadge status="IMPORTANT">Important</StatusBadge>
              ) : (
                <StatusBadge status="INFO">Update</StatusBadge>
              )}
              <h3>{a.title}</h3>
              <MarkdownRenderer markdown={a.body_md || ''} />
              <Link to="/announcements">View all</Link>
            </article>
          ))}
        </section>
      ) : null}

      <section className="panel">
        <h2>Recently updated procedures</h2>
        <ul className="link-list">
          {data.recentProcedures.map((d) => (
            <li key={d.id}>
              <Link to={`/docs/${d.slug}`}>{d.title}</Link>
              <span className="muted">
                {d.category} · v{d.version}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default DashboardPage;
