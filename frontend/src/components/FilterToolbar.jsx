const FIELD_LABELS = {
  severity: 'Severity',
  status: 'Status',
  region: 'Region',
  role: 'Role',
  resourceType: 'Resource type',
  action: 'Action',
};

const FIELD_ORDER = ['severity', 'status', 'region', 'action', 'role', 'resourceType'];

export default function FilterToolbar({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  facets,
  dateFrom,
  dateTo,
  onDateChange,
  onClear,
  activeCount,
}) {
  return (
    <div className="toolbar">
      <div className="search-field">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search actor, action, resource, IP…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search logs"
        />
      </div>

      {FIELD_ORDER.map((field) => (
        <select
          key={field}
          className="filter-select"
          value={filters[field] || ''}
          onChange={(e) => onFilterChange(field, e.target.value)}
          aria-label={FIELD_LABELS[field]}
        >
          <option value="">All {FIELD_LABELS[field].toLowerCase()}</option>
          {(facets[field] || []).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      ))}

      <div className="date-field">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateChange('dateFrom', e.target.value)}
          aria-label="From date"
        />
        <span>–</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateChange('dateTo', e.target.value)}
          aria-label="To date"
        />
      </div>

      <div className="toolbar__spacer" />

      {activeCount > 0 && (
        <button className="toolbar__clear" onClick={onClear}>
          Clear filters <span className="active-filter-count">{activeCount}</span>
        </button>
      )}
    </div>
  );
}
