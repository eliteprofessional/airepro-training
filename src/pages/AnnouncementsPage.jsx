import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import MarkdownRenderer from '../components/training/MarkdownRenderer';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

function AnnouncementsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    const d = await api.announcements();
    setItems(d.announcements);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function ack(id) {
    await api.ackAnnouncement(id);
    await load();
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Announcements"
        title="Operational updates"
        lede="Acknowledge important notices so your team knows you are current."
      />
      {error ? <div className="callout callout--danger">{error}</div> : null}
      {!items ? (
        <Skeleton rows={4} />
      ) : items.length ? (
        items.map((a) => (
          <article key={a.id} className="panel">
            {a.importance === 'IMPORTANT' ? (
              <StatusBadge status="IMPORTANT">Important</StatusBadge>
            ) : (
              <StatusBadge status="INFO">Update</StatusBadge>
            )}
            <h2>{a.title}</h2>
            <MarkdownRenderer markdown={a.bodyMd || ''} />
            {a.acknowledgedAt ? (
              <p className="muted">Acknowledged {a.acknowledgedAt.slice(0, 10)}</p>
            ) : (
              <button type="button" className="btn btn--primary" onClick={() => ack(a.id)}>
                Acknowledge
              </button>
            )}
          </article>
        ))
      ) : (
        <EmptyState
          title="No announcements"
          description="When operations publishes an update, it will show up here."
          actionLabel="Back to dashboard"
          actionTo="/dashboard"
        />
      )}
    </div>
  );
}

export default AnnouncementsPage;
