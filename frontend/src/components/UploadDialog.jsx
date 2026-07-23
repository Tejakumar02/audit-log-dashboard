import { useRef, useState } from 'react';
import { uploadLogs } from '../api/client.js';

export default function UploadDialog({ onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  function pickFile(candidate) {
    setError(null);
    setResult(null);
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith('.json')) {
      setError('Only .json files are accepted.');
      return;
    }
    setFile(candidate);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadLogs(file);
      setResult(res);
      onUploaded();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
        <div className="modal__header">
          <div>
            <h2 className="modal__title" id="upload-title">
              Upload audit logs
            </h2>
            <p className="modal__subtitle">A JSON file containing an array of log records.</p>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div
          className={`dropzone${dragOver ? ' is-dragover' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files[0]);
          }}
        >
          <p>Drag a .json file here, or</p>
          <button className="dropzone__browse" onClick={() => inputRef.current.click()}>
            browse your files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => pickFile(e.target.files[0])}
          />
          {file && <p className="dropzone__filename">{file.name}</p>}
        </div>

        {error && <div className="banner banner--danger" style={{ margin: '16px 0 0' }}>{error}</div>}

        {result && (
          <div className="upload-result">
            <div className="upload-result__row">
              <span>Records in file</span>
              <strong>{result.receivedCount.toLocaleString()}</strong>
            </div>
            <div className="upload-result__row">
              <span>Inserted</span>
              <strong>{result.insertedCount.toLocaleString()}</strong>
            </div>
            <div className="upload-result__row">
              <span>Skipped</span>
              <strong>{result.rejectedCount.toLocaleString()}</strong>
            </div>
            {result.sampleErrors?.length > 0 && (
              <div className="upload-result__row" style={{ display: 'block' }}>
                <span>First skipped rows:</span>
                <div style={{ marginTop: 6, color: 'var(--color-text-faint)' }}>
                  {result.sampleErrors.map((e, i) => (
                    <div key={i}>
                      Row {e.index}: {e.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button className="btn btn--primary" onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
