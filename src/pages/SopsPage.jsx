import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

function SopsPage() {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .sops()
      .then((d) => setDocs(d.documents))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="page">
        <div className="callout callout--danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="SOPs"
        title="Standard operating procedures"
        lede="Versioned procedures with purpose, steps, do/don't, and escalation."
      />
      {!docs ? (
        <Skeleton rows={4} />
      ) : docs.length ? (
        <div className="card-grid">
          {docs.map((d) => (
            <Link
              key={d.id}
              className={`ops-card ops-card--tone-${d.category || 'default'}`}
              to={`/docs/${d.slug}`}
            >
              <StatusBadge status="SOP">{d.sop?.code || d.slug}</StatusBadge>
              <h2>{d.title}</h2>
              <p>{d.summary}</p>
              <p className="muted">
                v{d.version} · {d.category} · ~{d.estimatedMinutes} min
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No SOPs published"
          description="Published procedures for your role will appear here."
          actionLabel="Search knowledge"
          actionTo="/knowledge"
        />
      )}
    </div>
  );
}

export default SopsPage;
