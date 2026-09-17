import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TrainingCard from '../../components/training/TrainingCard';
import { fetchTrainingResources } from '../../lib/api';

const FEATURED_SLUGS = new Set(['overview', 'idv-backend-ops', 'obo-ops']);

const GUIDE_META = {
  overview: { index: '01', tone: 'start' },
  'idv-backend-ops': { index: '02', tone: 'trust' },
  'obo-ops': { index: '03', tone: 'account' },
  'trust-and-safety': { index: '04', tone: 'billing' },
  troubleshooting: { index: '05', tone: 'faq' },
};

function TrainingPage() {
  const [resources, setResources] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = 'Airepro Training — IDV, OBO & Trust & Safety';

    let cancelled = false;

    async function load() {
      setStatus('loading');
      setError('');
      try {
        const data = await fetchTrainingResources();
        if (!cancelled) {
          setResources(Array.isArray(data) ? data : []);
          setStatus('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(err.message || 'Failed to load training guides.');
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter((item) => {
      const haystack = `${item.title} ${item.description} ${item.slug}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [resources, query]);

  const featured = useMemo(() => {
    if (query.trim()) return [];
    return filtered.filter((item) => FEATURED_SLUGS.has(item.slug) && item.preview);
  }, [filtered, query]);

  const rest = useMemo(() => {
    if (query.trim()) return filtered;
    return filtered.filter((item) => !FEATURED_SLUGS.has(item.slug));
  }, [filtered, query]);

  return (
    <div className="home">
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero__glow" aria-hidden="true" />
        <div className="home-hero__inner">
          <p className="home-hero__brand">Airepro Training</p>
          <h1 id="home-hero-title">Backend operations guides</h1>
          <p className="home-hero__lede">
            Internal playbooks for Hire IDV, OBO console workflows, and Trust &amp;
            Safety — systems, ownership, and where to look when things break.
          </p>

          <form
            className="home-search"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="visually-hidden" htmlFor="training-search">
              Search training guides
            </label>
            <input
              id="training-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search guides…"
              autoComplete="off"
            />
            <span className="home-search__hint" aria-hidden="true">
              /
            </span>
          </form>

          <div className="home-hero__stats" aria-live="polite">
            <div>
              <strong>{status === 'ready' ? resources.length : '—'}</strong>
              <span>guides</span>
            </div>
            <div>
              <strong>IDV</strong>
              <span>ops</span>
            </div>
            <div>
              <strong>OBO</strong>
              <span>+ TNS</span>
            </div>
          </div>
        </div>
      </section>

      <div className="home-body">
        {status === 'loading' && (
          <div className="home-skeleton" aria-busy="true" aria-live="polite">
            <div className="home-skeleton__card" />
            <div className="home-skeleton__card" />
            <div className="home-skeleton__card" />
          </div>
        )}

        {status === 'error' && (
          <p className="doc-status doc-status--error" role="alert">
            {error}
          </p>
        )}

        {status === 'ready' && filtered.length === 0 && (
          <div className="home-empty">
            <h2>No matching guides</h2>
            <p>Try another search term, or browse the full catalog.</p>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setQuery('')}
            >
              Clear search
            </button>
          </div>
        )}

        {status === 'ready' && featured.length > 0 && (
          <section className="home-section" aria-labelledby="featured-heading">
            <div className="home-section__head">
              <h2 id="featured-heading">Start here</h2>
              <p>Orientation and the two core ops surfaces.</p>
            </div>
            <div className="training-grid training-grid--featured">
              {featured.map((resource, index) => (
                <TrainingCard
                  key={resource.id || resource.slug}
                  resource={resource}
                  meta={GUIDE_META[resource.slug]}
                  featured
                  style={{ '--reveal-delay': `${index * 60}ms` }}
                />
              ))}
            </div>
          </section>
        )}

        {status === 'ready' && rest.length > 0 && (
          <section className="home-section" aria-labelledby="all-guides-heading">
            <div className="home-section__head">
              <h2 id="all-guides-heading">
                {query.trim() ? 'Matching guides' : 'More guides'}
              </h2>
              <p>
                {query.trim()
                  ? `${rest.length} result${rest.length === 1 ? '' : 's'}`
                  : 'Trust & Safety ownership and troubleshooting.'}
              </p>
            </div>
            <div className="training-grid">
              {rest.map((resource, index) => (
                <TrainingCard
                  key={resource.id || resource.slug}
                  resource={resource}
                  meta={GUIDE_META[resource.slug]}
                  style={{ '--reveal-delay': `${index * 50}ms` }}
                />
              ))}
            </div>
          </section>
        )}

        <aside className="home-aside" aria-label="Deep dive">
          <div>
            <p className="home-aside__eyebrow">Need the full IDV runbook?</p>
            <h2>Hire IDV &amp; Meet liveness</h2>
            <p>
              Bookings, webhooks, IDV session links, env vars, and smoke tests for
              backend engineers.
            </p>
          </div>
          <Link className="button button--primary" to="/training/idv-backend-ops">
            Open IDV backend ops
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default TrainingPage;
