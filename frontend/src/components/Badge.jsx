const SEVERITY_CLASS = {
  CRITICAL: 'badge--critical',
  HIGH: 'badge--high',
  MEDIUM: 'badge--medium',
  LOW: 'badge--low',
};

const STATUS_CLASS = {
  Unresolved: 'badge--critical',
  'In Progress': 'badge--medium',
  Resolved: 'badge--low',
  Ignored: 'badge--neutral',
};

export function SeverityBadge({ value }) {
  const cls = SEVERITY_CLASS[value] || 'badge--neutral';
  return <span className={`badge ${cls}`}>{value}</span>;
}

export function StatusBadge({ value }) {
  const cls = STATUS_CLASS[value] || 'badge--neutral';
  return <span className={`badge ${cls}`}>{value}</span>;
}
