// Every log record has exactly these fields. Keeping the list in one place
// means the bulk-upload validator, the filter whitelist and the facets
// endpoint can't silently drift apart from each other.
const REQUIRED_FIELDS = [
  'actor',
  'role',
  'action',
  'resource',
  'resourceType',
  'ipAddress',
  'region',
  'severity',
  'status',
  'timestamp',
];

// Fields that support exact-match / multi-select filtering (?severity=HIGH,CRITICAL).
const FILTERABLE_FIELDS = ['severity', 'status', 'region', 'role', 'resourceType', 'action'];

// Fields the table header can sort by. Whitelisted so a client can never
// force a sort on an unindexed or non-existent field.
const SORTABLE_FIELDS = ['timestamp', 'severity', 'status', 'actor', 'action', 'region'];

// Fields scanned by the free-text search box.
const SEARCHABLE_FIELDS = ['actor', 'action', 'resource', 'ipAddress', 'resourceType'];

// Fields with a small, closed vocabulary - exposed via GET /api/logs/facets
// so the UI can render real dropdown options instead of free-text inputs.
const FACET_FIELDS = ['severity', 'status', 'region', 'role', 'resourceType', 'action'];

module.exports = {
  REQUIRED_FIELDS,
  FILTERABLE_FIELDS,
  SORTABLE_FIELDS,
  SEARCHABLE_FIELDS,
  FACET_FIELDS,
};
