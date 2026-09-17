export function StatStrip({ items = [] }) {
  return (
    <div className="stat-strip" role="group" aria-label="Key metrics">
      {items.map((item) => (
        <div key={item.label} className="stat-strip__item">
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default StatStrip;
