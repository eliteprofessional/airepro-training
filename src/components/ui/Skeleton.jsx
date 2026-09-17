export function Skeleton({ rows = 3, className = '' }) {
  return (
    <div className={`skeleton-stack ${className}`} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-line ${i === 0 ? 'skeleton-line--title' : ''} ${i === rows - 1 ? 'skeleton-line--short' : ''}`}
        />
      ))}
    </div>
  );
}

export default Skeleton;
