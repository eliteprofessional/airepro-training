export function StatusBadge({ status, children }) {
  const label = children || status || '';
  const key = String(status || label || '')
    .toUpperCase()
    .replace(/\s+/g, '_');
  let tone = 'neutral';
  if (['PASSED', 'PUBLISHED', 'COMPLETED', 'SUCCESS', 'ACTIVE'].includes(key)) tone = 'success';
  if (['IN_REVIEW', 'PENDING', 'IN_PROGRESS', 'IMPORTANT', 'REQUIRED', 'INFO'].includes(key))
    tone = 'warn';
  if (['FAILED', 'EXPIRED', 'REVOKED', 'DANGER', 'DRAFT'].includes(key)) tone = 'danger';
  if (['SOP', 'IDV', 'PAYMENTS', 'SUPPORT', 'OPTIONAL'].includes(key) || key.startsWith('SOP'))
    tone = 'accent';

  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
}

export default StatusBadge;
