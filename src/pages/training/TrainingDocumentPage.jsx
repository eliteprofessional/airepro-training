import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MarkdownRenderer from '../../components/training/MarkdownRenderer';
import { fetchTrainingResources, resolveApiUrl } from '../../lib/api';
import { estimateReadingMinutes, extractToc } from '../../lib/markdownToc';

function TrainingDocumentPage() {
  const { slug } = useParams();
  const [resource, setResource] = useState(null);
  const [markdown, setMarkdown] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState('');

  const toc = useMemo(() => extractToc(markdown), [markdown]);
  const readingMinutes = useMemo(
    () => estimateReadingMinutes(markdown),
    [markdown],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');
      setError('');
      setResource(null);
      setMarkdown('');
      setProgress(0);
      setActiveHeading('');

      try {
        const catalog = await fetchTrainingResources();
        const match = catalog.find((item) => item.slug === slug) ?? null;

        if (!match || !match.preview) {
          if (!cancelled) {
            setStatus('not-found');
            document.title = 'Document Not Found — Airepro Training';
          }
          return;
        }

        const response = await fetch(resolveApiUrl(match.file));
        if (!response.ok) {
          throw new Error(
            'Unable to load this training document. Please try again later.',
          );
        }
        const text = await response.text();

        if (!cancelled) {
          setResource(match);
          setMarkdown(text);
          setStatus('ready');
          document.title = `${match.title} — Airepro Training`;
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(
            err.message ||
              'Unable to load this training document. Please try again later.',
          );
          document.title = 'Document Error — Airepro Training';
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (status !== 'ready') return undefined;

    function onScroll() {
      const article = document.getElementById('doc-article');
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const total = article.offsetHeight - window.innerHeight;
      const scrolled = Math.min(
        Math.max(-rect.top, 0),
        Math.max(total, 1),
      );
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
  }, [status, toc]);

  if (status === 'loading') {
    return (
      <div className="doc-page">
        <div className="doc-progress" aria-hidden="true">
          <div className="doc-progress__bar" style={{ width: '18%' }} />
        </div>
        <div className="doc-chrome">
          <div className="doc-chrome__inner">
            <Link className="doc-back" to="/training">
              <span aria-hidden="true">←</span> Back to Training
            </Link>
          </div>
        </div>
        <div className="doc-layout" aria-busy="true" aria-live="polite">
          <div className="doc-main">
            <div className="doc-hero doc-hero--skeleton">
              <div className="doc-skeleton__line doc-skeleton__line--eyebrow" />
              <div className="doc-skeleton__line doc-skeleton__line--title" />
              <div className="doc-skeleton__line doc-skeleton__line--mid" />
            </div>
            <div className="doc-paper">
              <div className="doc-skeleton">
                <div className="doc-skeleton__line doc-skeleton__line--mid" />
                <div className="doc-skeleton__line" />
                <div className="doc-skeleton__line doc-skeleton__line--short" />
                <div className="doc-skeleton__line doc-skeleton__line--mid" />
                <div className="doc-skeleton__line" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="doc-page">
        <div className="doc-layout">
          <div className="doc-paper doc-paper--narrow not-found">
            <p className="doc-kicker">Training</p>
            <h1>Document Not Found</h1>
            <p>The training document you&apos;re looking for doesn&apos;t exist.</p>
            <Link className="button button--primary" to="/training">
              Back to Training
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="doc-page">
        <div className="doc-chrome">
          <div className="doc-chrome__inner">
            <Link className="doc-back" to="/training">
              <span aria-hidden="true">←</span> Back to Training
            </Link>
          </div>
        </div>
        <div className="doc-layout">
          <div className="doc-paper doc-paper--narrow">
            <p className="doc-status doc-status--error" role="alert">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-page">
      <div
        className="doc-progress"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div className="doc-progress__bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="doc-chrome">
        <div className="doc-chrome__inner">
          <nav className="doc-breadcrumb" aria-label="Breadcrumb">
            <Link to="/training">Training</Link>
            <span className="doc-breadcrumb__sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">{resource.title}</span>
          </nav>
        </div>
      </div>

      <div className="doc-layout">
        {toc.length > 0 && (
          <aside className="doc-toc" aria-label="On this page">
            <p className="doc-toc__label">On this page</p>
            <ol className="doc-toc__list">
              {toc.map((item) => (
                <li
                  key={item.id}
                  className={`doc-toc__item doc-toc__item--h${item.level}${
                    activeHeading === item.id ? ' is-active' : ''
                  }`}
                >
                  <a href={`#${item.id}`}>{item.title}</a>
                </li>
              ))}
            </ol>
          </aside>
        )}

        <div className="doc-main">
          <header className="doc-hero">
            <p className="doc-kicker">Training guide</p>
            <h1>{resource.title}</h1>
            {resource.description && (
              <p className="doc-hero__lede">{resource.description}</p>
            )}
            <div className="doc-meta">
              <span>{readingMinutes} min read</span>
              <span className="doc-meta__dot" aria-hidden="true" />
              <span>Backend team</span>
            </div>
          </header>

          <article id="doc-article" className="doc-paper">
            <MarkdownRenderer content={markdown} />
          </article>

          <footer className="doc-footer">
            <Link className="doc-back" to="/training">
              <span aria-hidden="true">←</span> All training guides
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default TrainingDocumentPage;
