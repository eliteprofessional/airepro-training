import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SupportCard from '../../components/support/SupportCard';
import { fetchSupportResources } from '../../lib/api';

const FEATURED_SLUGS = new Set(['profile-verification', 'idv-hire', 'getting-started']);

const GUIDE_META = {
  'getting-started': { index: '01', tone: 'start' },
  'account-management': { index: '02', tone: 'account' },
  'profile-verification': { index: '03', tone: 'trust' },
  'idv-hire': { index: '04', tone: 'trust' },
  'subscription-guide': { index: '05', tone: 'billing' },
  faq: { index: '06', tone: 'faq' },
};

function SupportPage() {
  const [resources, setResources] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = 'Airepro Support — Documentation & Help Center';

    let cancelled = false;

    async function load() {
      setStatus('loading');
      setError('');
      try {
        const data = await fetchSupportResources();
        if (!cancelled) {
          setResources(Array.isArray(data) ? data : []);
          setStatus('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(err.message || 'Failed to load support documents.');
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
          <p className="home-hero__brand">Airepro Support</p>
          <h1 id="home-hero-title">Documentation &amp; Help Center</h1>
          <p className="home-hero__lede">
            Clear guides for Hire — from first login to verification, billing,
            and day-to-day account help.
          </p>

          <form
            className="home-search"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="visually-hidden" htmlFor="support-search">
              Search support guides
            </label>
            <input
              id="support-search"
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
              <strong>Hire</strong>
              <span>focused</span>
            </div>
            <div>
              <strong>IDV</strong>
              <span>covered</span>
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
              <p>The essentials most people need first on Hire.</p>
            </div>
            <div className="support-grid support-grid--featured">
              {featured.map((resource, index) => (
                <SupportCard
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
                  : 'Account, billing, and answers to common questions.'}
              </p>
            </div>
            <div className="support-grid">
              {rest.map((resource, index) => (
                <SupportCard
                  key={resource.id || resource.slug}
                  resource={resource}
                  meta={GUIDE_META[resource.slug]}
                  style={{ '--reveal-delay': `${index * 50}ms` }}
                />
              ))}
            </div>
          </section>
        )}

        <aside className="home-aside" aria-label="Need more help">
          <div>
            <p className="home-aside__eyebrow">Still stuck?</p>
            <h2>Open Identity Verification in Hire</h2>
            <p>
              For live ID checks and document upload, continue in product under
              Settings → Identity Verification.
            </p>
          </div>
          <Link className="button button--primary" to="/support/idv-hire">
            Read the IDV guide
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default SupportPage;
