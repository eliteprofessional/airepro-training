import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import SearchField from '../components/ui/SearchField';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import Skeleton from '../components/ui/Skeleton';

function KnowledgeBasePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function search(query) {
    const trimmed = String(query || '').trim();
    setError('');
    setLoading(true);
    try {
      const data = await api.search(trimmed);
      setResults(data);
      if (trimmed) setSearchParams({ q: trimmed });
      else setSearchParams({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    setQ(qParam);
    if (qParam) {
      search(qParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function onSubmit(e) {
    e.preventDefault();
    search(q);
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Knowledge Base"
        title="Search operational guidance"
        lede="Find SOPs, articles, and decision guides by keyword or issue."
      />

      <SearchField
        value={q}
        onChange={setQ}
        onSubmit={onSubmit}
        placeholder='e.g. "payment deducted but order failed"'
        label="Search knowledge base"
        buttonLabel="Find procedure"
      />

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {loading ? <Skeleton rows={4} /> : null}

      {!loading && results ? (
        results.documents.length || results.decisionTrees.length ? (
          <div className="grid-2">
            <section className="panel">
              <h2>Documents ({results.documents.length})</h2>
              <ul className="link-list">
                {results.documents.map((d) => (
                  <li key={d.id}>
                    <Link to={`/docs/${d.slug}`}>{d.title}</Link>
                    <span className="muted">
                      <StatusBadge status={d.type}>{d.type}</StatusBadge> · {d.category} · v
                      {d.version}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="panel">
              <h2>Decision guides ({results.decisionTrees.length})</h2>
              <ul className="link-list">
                {results.decisionTrees.map((t) => (
                  <li key={t.id}>
                    <Link to={`/decision-guides/${t.slug}`}>{t.title}</Link>
                    <span className="muted">{t.category}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : (
          <EmptyState
            title="No matches"
            description="Try a shorter keyword, or browse Operations and SOPs."
            actionLabel="Browse operations"
            actionTo="/operations"
          />
        )
      ) : null}

      {!loading && !results ? (
        <EmptyState
          title="Start with a situation"
          description="Describe the issue in the search field — we will surface the right SOP or decision guide."
          actionLabel="Browse SOPs"
          actionTo="/sops"
        />
      ) : null}
    </div>
  );
}

export default KnowledgeBasePage;
