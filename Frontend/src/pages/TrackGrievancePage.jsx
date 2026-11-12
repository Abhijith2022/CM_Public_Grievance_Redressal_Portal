import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Building2, Calendar } from 'lucide-react';
import { portalApi } from '../services/api';
import { StatusBadge, PriorityBadge, WorkflowStepper } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';

export default function TrackGrievancePage() {
  const { refId } = useParams();
  const navigate = useNavigate();
  const { notify } = useApp();

  const [inputRef, setInputRef] = useState(refId || 'KL-CMO-2026-1001');
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchTracking(targetId) {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await portalApi.trackByReferenceId(targetId);
      setRecord(res.data);
    } catch (err) {
      setRecord(null);
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (refId) {
      setInputRef(refId);
      fetchTracking(refId);
    }
  }, [refId]);

  function handleSubmit(e) {
    e.preventDefault();
    const cleaned = inputRef.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/track/${encodeURIComponent(cleaned)}`);
    fetchTracking(cleaned);
  }

  return (
    <div>
      <section className="page-header">
        <div className="page-header-inner">
          <h1>Track Your Grievance</h1>
          <p>
            Search by unique Reference ID to inspect current status, assigned department, public
            remarks, and timestamped lifecycle history.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="card card-blue-accent">
          <form onSubmit={handleSubmit} className="row">
            <input
              value={inputRef}
              onChange={(e) => setInputRef(e.target.value)}
              placeholder="Enter Reference ID (e.g., KL-CMO-2026-1001)"
              style={{ flex: 1, minWidth: 240 }}
              required
            />
            <button type="submit" className="btn btn-green" disabled={loading}>
              <Search size={16} /> {loading ? 'Searching...' : 'Track Grievance'}
            </button>
          </form>
          <div className="row" style={{ marginTop: 12 }}>
            <span className="muted">Sample Reference IDs:</span>
            {[
              'KL-CMO-2026-1001',
              'KL-CMO-2026-1002',
              'KL-CMO-2026-1003',
              'KL-CMO-2026-1004',
              'KL-CMO-2026-1005',
              'KL-CMO-2026-1006',
            ].map((id) => (
              <button
                key={id}
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setInputRef(id);
                  navigate(`/track/${id}`);
                }}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {record && (
          <div className="card card-green-accent">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <span className="muted">Reference ID</span>
                <h2 className="mono" style={{ margin: 0, color: 'var(--blue-900)' }}>
                  {record.referenceId}
                </h2>
              </div>
              <div className="row">
                <StatusBadge status={record.status} />
                <PriorityBadge priority={record.priority} />
                {record.isOverdue && <span className="badge badge-high">Overdue SLA</span>}
                {record.isEscalated && <span className="badge badge-reopened">Escalated</span>}
              </div>
            </div>

            <WorkflowStepper status={record.status} />

            <h3 style={{ marginBottom: 6 }}>{record.subject}</h3>
            <div className="row muted" style={{ marginBottom: 14 }}>
              <span>District: <strong>{record.district}</strong></span>
              <span>•</span>
              <span>Category: <strong>{record.category}</strong></span>
              <span>•</span>
              <span>
                <Building2 size={14} style={{ verticalAlign: 'text-bottom' }} /> Dept:{' '}
                <strong>{record.assignedDepartment?.name || 'Pending CMO Assignment'}</strong>
              </span>
              <span>•</span>
              <span>
                <Calendar size={14} style={{ verticalAlign: 'text-bottom' }} /> Submitted:{' '}
                {new Date(record.createdAt).toLocaleDateString()}
              </span>
            </div>

            {record.cmoPublicRemark && (
              <div className="alert alert-info">
                <strong>CMO Remark:</strong> {record.cmoPublicRemark}
              </div>
            )}

            {record.officerRemarks && (
              <div className="alert alert-info">
                <strong>Department Officer Update:</strong> {record.officerRemarks}
              </div>
            )}

            {record.actionTakenReport?.summary && (
              <div className="alert alert-success">
                <strong>Action-Taken Report Summary:</strong> {record.actionTakenReport.summary}
              </div>
            )}

            <h3 style={{ marginTop: 18, color: 'var(--blue-900)' }}>Status History Timeline</h3>
            <div className="timeline">
              {(record.history || []).map((item, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="row" style={{ gap: 8 }}>
                    <strong>{item.action}</strong>
                    <StatusBadge status={item.toStatus} />
                  </div>
                  <div className="muted">
                    {new Date(item.createdAt).toLocaleString()} • {item.changedByName} ({item.changedByRole})
                  </div>
                  {item.remark && <div style={{ marginTop: 2 }}>{item.remark}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
