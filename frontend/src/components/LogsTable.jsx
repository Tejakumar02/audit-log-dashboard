import { SeverityBadge, StatusBadge } from './Badge.jsx';

const COLUMNS = [
  { key: 'timestamp', label: 'Timestamp', sortable: true },
  { key: 'actor', label: 'Actor', sortable: true },
  { key: 'role', label: 'Role', sortable: false },
  { key: 'action', label: 'Action', sortable: true },
  { key: 'resource', label: 'Resource', sortable: false },
  { key: 'resourceType', label: 'Type', sortable: false },
  { key: 'ipAddress', label: 'IP address', sortable: false },
  { key: 'region', label: 'Region', sortable: true },
  { key: 'severity', label: 'Severity', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

const SEVERITY_VAR = {
  CRITICAL: 'var(--severity-critical)',
  HIGH: 'var(--severity-high)',
  MEDIUM: 'var(--severity-medium)',
  LOW: 'var(--severity-low)',
};

function formatTimestamp(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

export default function LogsTable({ logs, sortBy, order, onSort, onSelectRow, rowOffset }) {
  return (
    <table className="logs-table">
      <thead>
        <tr>
          <th aria-hidden="true"></th>
          {COLUMNS.map((col) => {
            const isActive = sortBy === col.key;
            return (
              <th
                key={col.key}
                className={col.sortable ? 'sortable' : undefined}
                onClick={col.sortable ? () => onSort(col.key) : undefined}
                aria-sort={isActive ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                <span className="th-inner">
                  {col.label}
                  {isActive && <span className="sort-caret">{order === 'asc' ? '▲' : '▼'}</span>}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {logs.map((log, i) => (
          <tr key={log._id} onClick={() => onSelectRow(log)}>
            <td
              className="col-index"
              style={{ borderLeftColor: SEVERITY_VAR[log.severity] || 'transparent' }}
            >
              {rowOffset + i + 1}
            </td>
            <td className="mono">{formatTimestamp(log.timestamp)}</td>
            <td className="col-actor">{log.actor}</td>
            <td>{log.role}</td>
            <td>{log.action}</td>
            <td className="col-resource" title={log.resource}>
              {log.resource}
            </td>
            <td>{log.resourceType}</td>
            <td className="mono">{log.ipAddress}</td>
            <td>{log.region}</td>
            <td>
              <SeverityBadge value={log.severity} />
            </td>
            <td>
              <StatusBadge value={log.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
