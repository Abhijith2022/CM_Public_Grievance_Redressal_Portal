import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ClipboardCheck, Upload, X, FileText } from 'lucide-react';
import { portalApi, getAttachmentUrl } from '../services/api';
import { useApp } from '../context/AppContext';
import { StatusBadge, PriorityBadge, WorkflowStepper } from '../components/StatusBadge';

export default function OfficerDashboardPage() {
  const { user, notify } = useApp();
  const [stats, setStats] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);

  const [selected, setSelected] = useState(null);
  const [progressStatus, setProgressStatus] = useState('In Progress');
  const [progressRemark, setProgressRemark] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportFiles, setReportFiles] = useState([]);

  async function loadOfficerQueue() {
    if (!user || user.role !== 'department_officer') return;
    try {
      const [statsRes, listRes] = await Promise.all([
        portalApi.getOfficerStats(),
        portalApi.getOfficerGrievances({
          status: statusFilter,
          assignedToMe: assignedToMe ? 'true' : '',
        }),
      ]);
      setStats(statsRes.data);
      setGrievances(listRes.data.grievances || []);
    } catch (err) {
      notify('error', err.message);
    }
  }

  useEffect(() => {
    loadOfficerQueue();
  }, [user, statusFilter, assignedToMe]);

  if (!user || user.role !== 'department_officer') {
    return (
      <div className="container">
        <div className="card card-blue-accent">
          <h2>Department Officer Login Required</h2>
          <p className="muted">
            Sign in with assigned Department Officer (<code className="mono">department_officer</code>)
            credentials to investigate forwarded grievances and submit Action-Taken Reports.
          </p>
          <Link to="/login" className="btn btn-primary">Go to Portal Sign In</Link>
        </div>
      </div>
    );
  }

  async function inspect(id) {
    try {
      const res = await portalApi.getGrievanceById(id);
      setSelected(res.data);
      const g = res.data.grievance;
      setProgressStatus(g.status === 'Under Review' ? 'Under Review' : 'In Progress');
      setProgressRemark(g.officerRemarks || '');
      setReportSummary(g.actionTakenReport?.summary || '');
      setReportDetails(g.actionTakenReport?.details || '');
    } catch (err) {
      notify('error', err.message);
    }
  }

  async function handleProgress(e) {
    e.preventDefault();
    if (!selected?.grievance?._id) return;
    try {
      const res = await portalApi.updateOfficerProgress(selected.grievance._id, {
        status: progressStatus,
        officerRemarks: progressRemark,
      });
      notify('success', res.message);
      await inspect(selected.grievance._id);
      await loadOfficerQueue();
    } catch (err) {
      notify('error', err.message);
    }
  }

  async function handleActionReport(e) {
    e.preventDefault();
    if (!selected?.grievance?._id) return;
    try {
      const formData = new FormData();
      formData.append('summary', reportSummary);
      formData.append('details', reportDetails);
      for (const f of reportFiles) {
        formData.append('files', f);
      }

      const res = await portalApi.submitOfficerActionReport(selected.grievance._id, formData);
      notify('success', res.message);
      setReportFiles([]);
      await inspect(selected.grievance._id);
      await loadOfficerQueue();
    } catch (err) {
      notify('error', err.message);
    }
  }

  const s = stats?.summary || {};

  return (
    <div>
      <section className="page-header">
        <div className="page-header-inner">
          <h1>
            Department Officer Dashboard — {stats?.department?.name || user.department?.name} (
            {stats?.department?.code || user.department?.code})
          </h1>
          <p>
            Review grievances forwarded by the CMO, inspect citizen attachments, record
            investigation findings, and submit Action-Taken Reports back to the CMO.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Forwarded to Dept</div>
            <div className="stat-value tabular">{s.totalAssigned || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Under Review</div>
            <div className="stat-value tabular">{s.underReview || 0}</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">In Progress</div>
            <div className="stat-value tabular">{s.inProgress || 0}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Reports Submitted</div>
            <div className="stat-value tabular">{s.actionSubmitted || 0}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Resolved</div>
            <div className="stat-value tabular">{s.resolved || 0}</div>
          </div>
        </div>

        <div className="card card-green-accent">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>Assigned Department Queue</h2>
            <div className="row">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 165 }}
              >
                <option value="">All Statuses</option>
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Reopened">Reopened</option>
              </select>
              <button
                type="button"
                className={`btn btn-sm ${assignedToMe ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setAssignedToMe((v) => !v)}
              >
                Assigned Directly to Me
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={loadOfficerQueue}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference ID</th>
                  <th>Subject &amp; Category</th>
                  <th>District</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g) => (
                  <tr key={g._id}>
                    <td>
                      <strong className="mono">{g.referenceId}</strong>
                      {g.isEscalated && <div className="badge badge-reopened">Escalated</div>}
                    </td>
                    <td>
                      <strong>{g.subject}</strong>
                      <div className="muted">{g.category}</div>
                    </td>
                    <td>{g.district}</td>
                    <td><PriorityBadge priority={g.priority} /></td>
                    <td><StatusBadge status={g.status} /></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-green btn-sm"
                        onClick={() => inspect(g._id)}
                      >
                        Investigate &amp; Report
                      </button>
                    </td>
                  </tr>
                ))}
                {grievances.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      No grievances forwarded to your department matching this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <span className="muted">Officer Investigation Desk</span>
                <h2 className="mono" style={{ margin: 0, color: 'var(--blue-900)' }}>
                  {selected.grievance.referenceId}
                </h2>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>
                <X size={16} /> Close
              </button>
            </div>

            <WorkflowStepper status={selected.grievance.status} />

            <h3>{selected.grievance.subject}</h3>
            <p>{selected.grievance.description}</p>

            {selected.grievance.cmoPublicRemark && (
              <div className="alert alert-info">
                <strong>CMO Forwarding Instructions:</strong> {selected.grievance.cmoPublicRemark}
              </div>
            )}

            {selected.grievance.aiAnalysis?.summary && (
              <div className="ai-assistant-box">
                <strong style={{ color: 'var(--green-800)' }}>AI Brief &amp; Highlights:</strong>
                <p style={{ margin: '4px 0' }}>{selected.grievance.aiAnalysis.summary}</p>
                {(selected.grievance.aiAnalysis.highlights || []).map((h, i) => (
                  <div key={i} className="highlight-chip">{h}</div>
                ))}
              </div>
            )}

            {selected.grievance.attachments?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>Supporting Citizen Attachments:</strong>
                <div className="row" style={{ marginTop: 6 }}>
                  {selected.grievance.attachments.map((att) => (
                    <a
                      key={att._id}
                      href={getAttachmentUrl(att._id)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <FileText size={14} /> {att.originalName}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selected.grievance.actionTakenReport?.summary && (
              <div className="alert alert-success" style={{ marginTop: 14 }}>
                <strong>
                  Submitted Action-Taken Report (
                  {selected.grievance.actionTakenReport.submittedByName || 'Department Officer'}):
                </strong>
                <div>{selected.grievance.actionTakenReport.summary}</div>
                {selected.grievance.actionTakenReport.details && (
                  <div className="muted" style={{ marginTop: 4 }}>
                    {selected.grievance.actionTakenReport.details}
                  </div>
                )}
              </div>
            )}

            {selected.grievance.status === 'Resolved' ? (
              <div className="alert alert-info" style={{ marginTop: 14 }}>
                <strong>Grievance Closed (Resolved):</strong> Investigation updates and Action-Taken
                Report submissions are locked unless the CMO or submitting citizen reopens this
                case.
              </div>
            ) : (
              <>
                <div className="card" style={{ marginTop: 14 }}>
                  <h4 style={{ marginTop: 0, color: 'var(--blue-900)' }}>
                    1. Update Investigation Progress
                  </h4>
                  <form onSubmit={handleProgress}>
                    <div className="grid-2">
                      <div className="form-group">
                        <label>Progress Status</label>
                        <select
                          value={progressStatus}
                          onChange={(e) => setProgressStatus(e.target.value)}
                        >
                          <option value="Under Review">Under Review</option>
                          <option value="In Progress">In Progress</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Investigation Remarks</label>
                        <input
                          value={progressRemark}
                          onChange={(e) => setProgressRemark(e.target.value)}
                          placeholder="Site inspection findings or field action update"
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">
                      <ClipboardCheck size={14} /> Save Investigation Update
                    </button>
                  </form>
                </div>

                <div className="card">
                  <h4 style={{ marginTop: 0, color: 'var(--green-800)' }}>
                    2. Upload / Submit Action-Taken Report to CMO
                  </h4>
                  <form onSubmit={handleActionReport}>
                    <div className="form-group">
                      <label>Action-Taken Report Summary (min 10 characters)</label>
                      <input
                        value={reportSummary}
                        onChange={(e) => setReportSummary(e.target.value)}
                        placeholder="Concise summary of remedial work completed"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Detailed Field Report Notes</label>
                      <textarea
                        rows={3}
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        placeholder="Verification details, measurements, resources deployed..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Attach Action Proof / Inspection Document (optional, max 3 MB)</label>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => setReportFiles(Array.from(e.target.files || []))}
                      />
                      {reportFiles.length > 0 && (
                        <div className="row" style={{ marginTop: 6, gap: 6 }}>
                          {reportFiles.map((f, idx) => (
                            <span key={`${f.name}-${idx}`} className="file-chip">
                              <FileText size={12} /> {f.name} ({Math.max(1, Math.round(f.size / 1024))} KB)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button type="submit" className="btn btn-green btn-sm">
                      <Upload size={14} /> Submit Action-Taken Report for CMO Review
                    </button>
                  </form>
                </div>
              </>
            )}

            {(selected.grievance.actionTakenReport?.attachments || []).length > 0 && (
              <div className="card">
                <strong style={{ fontSize: '0.88rem', color: 'var(--blue-900)' }}>
                  Uploaded Action Proof Files:
                </strong>
                <div className="row" style={{ marginTop: 8 }}>
                  {selected.grievance.actionTakenReport.attachments.map((att, idx) => (
                    <a
                      key={att._id || idx}
                      href={getAttachmentUrl(att._id || att)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <FileText size={14} /> {att.originalName}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {(selected.history || []).length > 0 && (
              <div className="card">
                <h4 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Case Status Timeline</h4>
                <div className="timeline">
                  {selected.history.map((item) => (
                    <div key={item._id} className="timeline-item">
                      <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                        <div className="row" style={{ gap: 8 }}>
                          <strong>{item.action}</strong>
                          <StatusBadge status={item.toStatus} />
                          {item.isInternal && <span className="badge badge-medium">Internal</span>}
                        </div>
                        <span className="muted" style={{ fontSize: '0.78rem' }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {item.fromStatus && item.fromStatus !== item.toStatus && (
                        <div className="muted" style={{ fontSize: '0.78rem', marginTop: 2 }}>
                          Transition: {item.fromStatus} → {item.toStatus}
                        </div>
                      )}
                      {item.remark && (
                        <div style={{ fontSize: '0.86rem', marginTop: 4 }}>{item.remark}</div>
                      )}
                      <div className="muted" style={{ fontSize: '0.76rem', marginTop: 2 }}>
                        Updated by {item.changedByName || 'System'} (
                        {item.changedByRole || 'system'})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
