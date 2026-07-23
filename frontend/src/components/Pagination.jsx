function buildPageWindow(current, totalPages) {
  const pages = new Set([1, totalPages, current, current - 1, current + 1]);
  return [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
}

export default function Pagination({ page, limit, total, totalPages, onPageChange, onLimitChange }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pageWindow = buildPageWindow(page, totalPages);

  return (
    <div className="pagination">
      <span className="pagination__summary">
        Showing {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
      </span>

      <div className="pagination__controls">
        <button
          className="pagination__page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>

        {pageWindow.map((p, i) => (
          <span key={p} style={{ display: 'contents' }}>
            {i > 0 && pageWindow[i - 1] !== p - 1 && (
              <span className="pagination__page-btn" aria-hidden="true" style={{ cursor: 'default' }}>
                …
              </span>
            )}
            <button
              className={`pagination__page-btn${p === page ? ' is-active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          </span>
        ))}

        <button
          className="pagination__page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      <div className="pagination__size">
        <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))} aria-label="Rows per page">
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>
    </div>
  );
}
