import { Link } from 'react-router-dom';

function TrainingCard({ resource, meta, featured = false, style }) {
  const { title, description, slug, preview } = resource;
  const showPreview = Boolean(preview);
  const indexLabel = meta?.index || '••';
  const tone = meta?.tone || 'default';

  if (!showPreview) {
    return (
      <article
        className={`training-card training-card--static training-card--${tone}`}
        style={style}
      >
        <div className="training-card__top">
          <span className="training-card__index" aria-hidden="true">
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
      className={`training-card training-card--link${featured ? ' training-card--featured' : ''} training-card--${tone}`}
      to={`/training/${slug}`}
      style={style}
    >
      <div className="training-card__top">
        <span className="training-card__index" aria-hidden="true">
          {indexLabel}
        </span>
        <span className="training-card__cta">
          Open
          <span aria-hidden="true"> →</span>
        </span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </Link>
  );
}

export default TrainingCard;
