const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return body;
}

export function fetchLogs(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  return request(`/api/logs?${query.toString()}`);
}

export function fetchFacets() {
  return request('/api/logs/facets');
}

export function uploadLogs(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/logs/bulk', { method: 'POST', body: formData });
}
