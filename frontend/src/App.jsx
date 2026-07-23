import { useEffect, useState } from 'react';
import { fetchLogs, fetchFacets } from './api/client.js';
import TopBar from './components/TopBar.jsx';
import FilterToolbar from './components/FilterToolbar.jsx';
import LogsTable from './components/LogsTable.jsx';
import Pagination from './components/Pagination.jsx';
import UploadDialog from './components/UploadDialog.jsx';
import LogDetailPanel from './components/LogDetailPanel.jsx';
import EmptyState from './components/EmptyState.jsx';

const EMPTY_FILTERS = { severity: '', status: '', region: '', role: '', resourceType: '', action: '' };

export default function App() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [dates, setDates] = useState({ from: '', to: '' });
  const [sortBy, setSortBy] = useState('timestamp');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [grandTotal, setGrandTotal] = useState(0);
  const [facets, setFacets] = useState({});

  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  // Debounce the search box so every keystroke doesn't trigger a request.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Refetch the page of logs whenever any query parameter changes.
  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    fetchLogs({
      search,
      ...filters,
      dateFrom: dates.from,
      dateTo: dates.to,
      sortBy,
      order,
      page,
      limit,
    })
      .then((res) => {
        if (cancelled) return;
        setLogs(res.data);
        setPagination(res.pagination);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (cancelled) return;
        setFetching(false);
        setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters, dates, sortBy, order, page, limit, refreshToken]);

  // Facets (dropdown options) and the unfiltered record count only need to
  // change on mount and after a new upload, not on every filter change.
  useEffect(() => {
    fetchFacets()
      .then(setFacets)
      .catch(() => {});
    fetchLogs({ page: 1, limit: 1 })
      .then((res) => setGrandTotal(res.pagination.total))
      .catch(() => {});
  }, [refreshToken]);

  function updateFilter(field, value) {
    setFilters((f) => ({ ...f, [field]: value }));
    setPage(1);
  }

  function updateDate(which, value) {
    const key = which === 'dateFrom' ? 'from' : 'to';
    setDates((d) => ({ ...d, [key]: value }));
    setPage(1);
  }

  function handleSort(field) {
    if (sortBy === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setOrder('desc');
    }
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setDates({ from: '', to: '' });
    setSearchInput('');
    setSearch('');
    setPage(1);
  }

  function handleUploaded() {
    setPage(1);
    setRefreshToken((t) => t + 1);
  }

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + (dates.from || dates.to ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="app-shell">
      <TopBar total={grandTotal} onUploadClick={() => setUploadOpen(true)} />

      <main className="app-main">
        <FilterToolbar
          search={searchInput}
          onSearchChange={setSearchInput}
          filters={filters}
          onFilterChange={updateFilter}
          facets={facets}
          dateFrom={dates.from}
          dateTo={dates.to}
          onDateChange={updateDate}
          onClear={clearFilters}
          activeCount={activeFilterCount}
        />

        {error && <div className="banner banner--danger">Couldn't refresh logs: {error}</div>}

        {initialLoading ? (
          <EmptyState title="Loading logs…" hint="Fetching the latest audit records." />
        ) : logs.length === 0 ? (
          grandTotal === 0 ? (
            <EmptyState
              title="No logs uploaded yet"
              hint="Use “Upload logs” to bulk-load a JSON file of audit records."
            />
          ) : (
            <EmptyState
              title="No records match these filters"
              hint="Try clearing a filter or widening the date range."
            />
          )
        ) : (
          <div className={`table-scroll${fetching ? ' is-fetching' : ''}`}>
            <LogsTable
              logs={logs}
              sortBy={sortBy}
              order={order}
              onSort={handleSort}
              onSelectRow={setSelectedLog}
              rowOffset={(pagination.page - 1) * pagination.limit}
            />
          </div>
        )}

        {logs.length > 0 && (
          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            onLimitChange={(n) => {
              setLimit(n);
              setPage(1);
            }}
          />
        )}
      </main>

      {uploadOpen && (
        <UploadDialog onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />
      )}

      {selectedLog && <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
