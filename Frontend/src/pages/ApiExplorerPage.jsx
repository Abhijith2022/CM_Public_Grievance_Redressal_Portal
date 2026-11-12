import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { apiRequest } from '../services/api';

const PRESET_REQUESTS = [
  { label: 'GET /api/health', method: 'GET', path: '/health', body: '' },
  { label: 'GET /api/public/overview', method: 'GET', path: '/public/overview', body: '' },
  { label: 'GET /api/departments', method: 'GET', path: '/departments', body: '' },
  {
    label: 'GET /api/grievances/track/KL-CMO-2026-1001',
    method: 'GET',
    path: '/grievances/track/KL-CMO-2026-1001',
    body: '',
  },
  {
    label: 'POST /api/ai/optimize-complaint (Auth)',
    method: 'POST',
    path: '/ai/optimize-complaint',
    body: JSON.stringify(
      {
        subject: 'hospital ambulance delay and shortage',
        description:
          'local primary health centre in idukki has no night doctor and ambulance took 2 hours during accident yesterday urgent help',
        district: 'Idukki',
        category: 'Healthcare & Sanitation',
      },
      null,
      2
    ),
  },
  { label: 'GET /api/cmo/stats (CMO)', method: 'GET', path: '/cmo/stats', body: '' },
  { label: 'GET /api/officer/grievances (Officer)', method: 'GET', path: '/officer/grievances', body: '' },
];

export default function ApiExplorerPage() {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/health');
  const [bodyText, setBodyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);

  async function runRequest(e) {
    e.preventDefault();
    setLoading(true);
    const start = performance.now();
    try {
      const parsedBody = method !== 'GET' && bodyText.trim() ? JSON.parse(bodyText) : null;
      const res = await apiRequest(path, { method, body: parsedBody });
      setOutput({
        status: '200 OK',
        durationMs: Math.round(performance.now() - start),
        data: res,
      });
    } catch (err) {
      setOutput({
        status: `Error ${err.status || ''}`,
        durationMs: Math.round(performance.now() - start),
        error: err.payload || { message: err.message },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <section className="page-header">
        <div className="page-header-inner">
          <h1>Developer REST API Explorer</h1>
          <p>Test any backend REST API endpoint directly from the browser using your active session.</p>
        </div>
      </section>

      <div className="container">
        <div className="grid-2">
          <div className="card card-blue-accent">
            <h3 style={{ marginTop: 0 }}>Send Request</h3>
            <div className="row" style={{ marginBottom: 12 }}>
              {PRESET_REQUESTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setMethod(p.method);
                    setPath(p.path);
                    setBodyText(p.body);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <form onSubmit={runRequest}>
              <div className="grid-2">
                <div className="form-group">
                  <label>HTTP Method</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PATCH">PATCH</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Path (under /api)</label>
                  <input value={path} onChange={(e) => setPath(e.target.value)} required />
                </div>
              </div>

              {method !== 'GET' && (
                <div className="form-group">
                  <label>JSON Body</label>
                  <textarea
                    rows={7}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-green" disabled={loading}>
                <Play size={15} /> {loading ? 'Executing...' : 'Send API Request'}
              </button>
            </form>
          </div>

          <div className="card card-green-accent">
            <h3 style={{ marginTop: 0 }}>JSON Response</h3>
            {output ? (
              <div>
                <div className="row" style={{ marginBottom: 8 }}>
                  <span className="badge badge-submitted">{output.status}</span>
                  <span className="muted">{output.durationMs} ms</span>
                </div>
                <pre className="json-box">
                  {JSON.stringify(output.data || output.error, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="muted">Choose a preset or enter a route to inspect live JSON payloads.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
