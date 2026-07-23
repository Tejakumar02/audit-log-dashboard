import { useEffect } from 'react';
import { SeverityBadge, StatusBadge } from './Badge.jsx';

const FIELDS = [
  ['actor', 'Actor'],
  ['role', 'Role'],
  ['action', 'Action'],
  ['resource', 'Resource'],
  ['resourceType', 'Resource type'],
  ['ipAddress', 'IP address'],
  ['region', 'Region'],
  ['timestamp', 'Timestamp'],
];

export default function LogDetailPanel({ log, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!log) return null;

  return (
    <aside className="detail-panel" role="dialog" aria-label="Log record detail">
      <div className="detail-panel__header">
        <div>
          <div className="detail-panel__eyebrow">Log record</div>
          <div className="detail-panel__title">{log.action}</div>
        </div>
        <button className="modal__close" onClick={onClose} aria-label="Close detail panel">
          ×
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <SeverityBadge value={log.severity} />
        <StatusBadge value={log.status} />
      </div>

      <dl className="detail-fields">
        {FIELDS.map(([key, label]) => (
          <div className="detail-fields__row" key={key}>
            <dt>{label}</dt>
            <dd>{key === 'timestamp' ? new Date(log[key]).toISOString() : log[key]}</dd>
          </div>
        ))}
        <div className="detail-fields__row">
          <dt>Record ID</dt>
          <dd>{log._id}</dd>
        </div>
      </dl>
    </aside>
  );
}
