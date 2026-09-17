import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import MarkdownRenderer from '../components/training/MarkdownRenderer';
import { estimateReadingMinutes, extractToc } from '../lib/markdownToc';
import StatusBadge from '../components/ui/StatusBadge';
import Skeleton from '../components/ui/Skeleton';

function DocumentPage() {
  const { slug } = useParams();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [acked, setAcked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState('');

  const toc = useMemo(() => extractToc(doc?.bodyMd || ''), [doc?.bodyMd]);
  const readingMinutes = useMemo(
    () => estimateReadingMinutes(doc?.bodyMd || ''),
    [doc?.bodyMd],
  );

  useEffect(() => {
    setAcked(false);
    setProgress(0);
    setActiveHeading('');
    api
      .document(slug)
      .then((d) => setDoc(d.document))
      .catch((err) => setError(err.message));
  }, [slug]);

  useEffect(() => {
    if (!doc) return undefined;

    function onScroll() {
      const article = document.getElementById('doc-article');
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const total = article.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(Math.round((scrolled / Math.max(total, 1)) * 100));

      const headings = toc
        .map((item) => document.getElementById(item.id))
        .filter(Boolean);
      let current = toc[0]?.id || '';
      for (const el of headings) {
        if (el.getBoundingClientRect().top <= 120) {
          current = el.id;
        }
      }
      setActiveHeading(current);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [doc, toc]);

  async function acknowledge() {
    await api.acknowledgeDocument(slug);
    setAcked(true);
  }

  if (error) {
    return (
      <div className="page">
        <div className="callout callout--danger">{error}</div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="page doc-page--live">
        <Skeleton rows={6} />
      </div>
    );
  }

  const status = doc.status || 'PUBLISHED';
  const showPlaceholder = status === 'IN_REVIEW' || status === 'DRAFT';

  return (
    <div className="doc-page doc-page--live">
      <div className="doc-progress" aria-hidden="true">
        <div className="doc-progress__bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="doc-chrome">
        <div className="doc-chrome__inner">
          <Link className="doc-back" to="/knowledge">
            <span aria-hidden="true">←</span> Knowledge Base
          </Link>
          <div className="meta-row">
            <StatusBadge status={status}>{status}</StatusBadge>
            <StatusBadge status={doc.type}>{doc.type}</StatusBadge>
            {doc.sop?.code ? <StatusBadge status="SOP">{doc.sop.code}</StatusBadge> : null}
            <span className="muted">v{doc.version} · ~{readingMinutes} min</span>
          </div>
        </div>
      </div>

      <div className="doc-layout">
        <div className="doc-main">
          <header className="page-hero">
            <p className="eyebrow">{doc.category}</p>
            <h1>{doc.title}</h1>
            {doc.summary ? <p className="lede">{doc.summary}</p> : null}
          </header>

          {showPlaceholder ? (
            <div className="callout callout--warn">
              In review — treat as draft guidance until an administrator publishes the final version.
            </div>
          ) : null}

          <article id="doc-article" className="doc-paper prose-panel">
            <MarkdownRenderer markdown={doc.bodyMd || ''} />
          </article>

          {doc.type === 'policy' || doc.type === 'sop' ? (
            <section className="panel" style={{ marginTop: '1.25rem', maxWidth: 'var(--reading-width)' }}>
              <h2>Acknowledgement</h2>
              <p>Confirm you have read and understood this version ({doc.version}).</p>
              <button type="button" className="btn btn--primary" onClick={acknowledge} disabled={acked}>
                {acked ? 'Acknowledged' : 'I Understand'}
              </button>
            </section>
          ) : null}
        </div>

        {toc.length ? (
          <aside className="doc-toc" aria-label="On this page">
            <strong>On this page</strong>
            <ol>
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`${item.level === 3 ? 'level-3' : ''}${activeHeading === item.id ? ' is-active' : ''}`}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export default DocumentPage;
