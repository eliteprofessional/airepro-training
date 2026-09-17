import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

function CertificationsPage() {
  const [certs, setCerts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .certifications()
      .then((d) => setCerts(d.certifications))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Certifications"
        title="Your credentials"
        lede="Statuses: NOT_STARTED, IN_PROGRESS, PASSED, FAILED, EXPIRED, REVOKED. Expired certs require re-training."
      />
      {error ? <div className="callout callout--danger">{error}</div> : null}
      {!certs ? (
        <Skeleton rows={4} />
      ) : certs.length ? (
        <div className="card-grid">
          {certs.map((c) => (
            <article key={c.id} className="ops-card ops-card--tone-default">
              <StatusBadge status={c.status}>{c.status}</StatusBadge>
              <h2>{c.course_title}</h2>
              <p className="muted">{c.certificate_id}</p>
              <p>
                Score: {c.score ?? '—'}% · Issued: {c.issued_at ? c.issued_at.slice(0, 10) : '—'}
              </p>
              {c.expires_at ? <p>Expires: {c.expires_at.slice(0, 10)}</p> : null}
              {c.status === 'EXPIRED' ? (
                <div className="callout callout--warn">
                  Certification expired. Complete updated training before performing this operation.
                  <div>
                    <Link to={`/training/${c.course_slug}`}>Retake training</Link>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No certifications yet"
          description="Complete a course quiz from My Training to earn your first credential."
          actionLabel="My Training"
          actionTo="/training"
        />
      )}
    </div>
  );
}

export default CertificationsPage;
