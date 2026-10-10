/** Clickable KPI card. */
export default function KpiCard({ label, value, note, tone, onClick, testId }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`kpi-card ${onClick ? 'kpi-clickable' : ''} ${tone ? `kpi-${tone}` : ''}`} onClick={onClick} data-testid={testId}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {note && <div className="kpi-note">{note}</div>}
    </Tag>
  );
}
