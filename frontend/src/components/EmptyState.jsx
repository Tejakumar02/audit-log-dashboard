export default function EmptyState({ title, hint }) {
  return (
    <div className="empty-state">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8.5 12.5h7M8.5 16h4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__hint">{hint}</p>
    </div>
  );
}
