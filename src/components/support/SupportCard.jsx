import { Link } from 'react-router-dom';

function SupportCard({ resource, meta, featured = false, style }) {
  const { title, description, slug, preview } = resource;
  const showPreview = Boolean(preview);
  const indexLabel = meta?.index || '••';
  const tone = meta?.tone || 'default';

  if (!showPreview) {
    return (
      <article
        className={`support-card support-card--static support-card--${tone}`}
        style={style}
      >
        <div className="support-card__top">
          <span className="support-card__index" aria-hidden="true">
            {indexLabel}
          </span>
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
      </article>
    );
  }

  return (
    <Link
      className={`support-card support-card--link${featured ? ' support-card--featured' : ''} support-card--${tone}`}
      to={`/support/${slug}`}
      style={style}
    >
      <div className="support-card__top">
        <span className="support-card__index" aria-hidden="true">
          {indexLabel}
        </span>
        <span className="support-card__cta">
          Open
          <span aria-hidden="true"> →</span>
        </span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </Link>
  );
}

export default SupportCard;
