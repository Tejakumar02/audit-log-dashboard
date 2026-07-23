export default function TopBar({ total, onUploadClick }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand__mark" aria-hidden="true" />
        <span className="brand__name">Auditline</span>
        <span className="brand__divider" aria-hidden="true" />
        <span className="brand__subtitle">Audit log investigation</span>
      </div>
      <div className="topbar__right">
        <span className="record-count">
          <strong>{total.toLocaleString()}</strong> records stored
        </span>
        <button className="btn btn--primary" onClick={onUploadClick}>
          Upload logs
        </button>
      </div>
    </header>
  );
}
