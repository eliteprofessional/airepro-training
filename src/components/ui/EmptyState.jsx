import { Link } from 'react-router-dom';

export function EmptyState({ title, description, actionLabel, actionTo, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state__glow" aria-hidden="true" />
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {actionTo && actionLabel ? (
        <Link className="btn btn--primary" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
      {onAction && actionLabel ? (
        <button type="button" className="btn btn--primary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default EmptyState;
