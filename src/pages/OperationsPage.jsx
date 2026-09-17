import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

const CATEGORIES = [
  {
    id: 'idv',
    title: 'IDV Operations',
    blurb: 'Consent, documents, face match, approve/reject, escalation.',
  },
  {
    id: 'payments',
    title: 'Payment Operations',
    blurb: 'Statuses, failed payments, refunds, reconciliation.',
  },
  {
    id: 'support',
    title: 'Support Tickets',
    blurb: 'Lifecycle, SLA, first response, escalation, closure.',
  },
  {
    id: 'jobs',
    title: 'Job Operations',
    blurb: 'Review, approve, reject, suspicious listings.',
  },
  {
    id: 'internships',
    title: 'Internship Operations',
    blurb: 'Review, employer validation, approvals.',
  },
  {
    id: 'fraud',
    title: 'Fraud & Risk',
    blurb: 'Cross-cutting risk signals (see IDV / payments guides).',
  },
];

function OperationsPage() {
  const { category } = useParams();
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');

  const active = useMemo(
    () => CATEGORIES.find((c) => c.id === category) || null,
    [category],
  );

  useEffect(() => {
    if (!category) return;
    setDocs(null);
    api
      .documents({ category })
      .then((d) => setDocs(d.documents))
      .catch((err) => setError(err.message));
  }, [category]);

  if (!category) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Operations"
          title="Operational playbooks"
          lede="Pick a category. Content is role-filtered for your shift."
        />
        <div className="card-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.id} className={`ops-card ops-card--tone-${c.id}`} to={`/operations/${c.id}`}>
              <StatusBadge status={c.id.toUpperCase()}>{c.id}</StatusBadge>
              <h2>{c.title}</h2>
              <p>{c.blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <p>
        <Link to="/operations">← Operations</Link>
      </p>
      <PageHeader
        eyebrow="Operations"
        title={active?.title || category}
        lede={active?.blurb}
      />
      {error ? <div className="callout callout--danger">{error}</div> : null}
      {docs === null && !error ? (
        <Skeleton rows={4} />
      ) : docs?.length ? (
        <div className="card-grid">
          {docs.map((d) => (
            <Link key={d.id} className={`ops-card ops-card--tone-${category}`} to={`/docs/${d.slug}`}>
              <div className="meta-row">
                <StatusBadge status={d.status}>{d.status}</StatusBadge>
                <StatusBadge status={d.type}>{d.type}</StatusBadge>
              </div>
              <h2>{d.title}</h2>
              <p>{d.summary || `v${d.version}`}</p>
              <p className="muted">v{d.version}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No published docs yet"
          description="Nothing in this category is published for your role."
          actionLabel="Search knowledge"
          actionTo="/knowledge"
        />
      )}
    </div>
  );
}

export default OperationsPage;
