import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  Send,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  BarChart3,
} from 'lucide-react';
import { portalApi, getAttachmentUrl } from '../services/api';
import { useApp } from '../context/AppContext';
import { StatusBadge, PriorityBadge, WorkflowStepper } from '../components/StatusBadge';
import {
  StatusDistributionChart,
  DistrictBarChart,
  DepartmentBarChart,
  PriorityChart,
} from '../components/Charts';

export default function CmoDashboardPage() {
  const { user, overview, notify } = useApp();
  const districts = overview?.districts || [];
  const categories = overview?.categories || [];
  const departments = overview?.departments || [];

  const [tab, setTab] = useState('queue');
  const [stats, setStats] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  const [filters, setFilters] = useState({
    district: '',
    category: '',
    priority: '',
    status: '',
    overdue: '',
    escalated: '',
    search: '',
  });

  const [selected, setSelected] = useState(null);
  const [assignDeptId, setAssignDeptId] = useState('');
  const [assignOfficerId, setAssignOfficerId] = useState('');
  const [assignPriority, setAssignPriority] = useState('High');
  const [assignInstructions, setAssignInstructions] = useState('');

  const [publicRemark, setPublicRemark] = useState('');
  const [internalRemark, setInternalRemark] = useState('');
  const [statusChoice, setStatusChoice] = useState('Resolved');
  const [statusRemark, setStatusRemark] = useState('');
  const [escalationReason, setEscalationReason] = useState('');

  const EMPTY_FILTERS = {
    district: '',
    category: '',
    priority: '',
    status: '',
    overdue: '',
    escalated: '',
    search: '',
  };

  async function loadDashboard(overrideFilters) {
    if (!user || user.role !== 'cmo_admin') return;
    try {
      const activeFilters = overrideFilters || filters;
      const [statsRes, listRes, officersRes, contactRes] = await Promise.all([
        portalApi.getCmoStats(),
        portalApi.getCmoGrievances(activeFilters),
        portalApi.getCmoOfficers(),
        portalApi.getContactEnquiries(),
      ]);
      setStats(statsRes.data);
      setGrievances(listRes.data.grievances || []);
      setOfficers(officersRes.data || []);
      setEnquiries(contactRes.data || []);
    } catch (err) {
      notify('error', err.message);
    }
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    loadDashboard(EMPTY_FILTERS);
  }

  useEffect(() => {
    loadDashboard();
  }, [
    user,
    filters.district,
    filters.category,
    filters.priority,
    filters.status,
    filters.overdue,
    filters.escalated,
  ]);

  if (!user || user.role !== 'cmo_admin') {
    return (
      <div className="container">
        <div className="card card-blue-accent">
          <h2>CMO Administrator Login Required</h2>
          <p className="muted">
            Sign in with a CMO Administrator (<code className="mono">cmo_admin</code>) account to
            access the central dashboard.
          </p>
          <Link to="/login" className="btn btn-primary">Go to Portal Sign In</Link>
        </div>
      </div>
    );
  }

  async function openInspector(id) {
    try {
      const res = await portalApi.getGrievanceById(id);
      setSelected(res.data);
      const g = res.data.grievance;
      const aiDept = departments.find((d) => d.code === g.aiAnalysis?.suggestedDepartmentCode);
      setAssignDeptId(g.assignedDepartment?._id || aiDept?._id || departments[0]?._id || '');
      setAssignOfficerId(g.assignedOfficer?._id || '');
      setAssignPriority(g.priority || 'Medium');
      setPublicRemark(g.cmoPublicRemark || '');
      setInternalRemark('');
      setStatusChoice('Resolved');
    } catch (err) {
      notify('error', err.message);
    }
  }

  async function handleReviewSave(e) {
    e.preventDefault();
    if (!selected?.grievance?._id) return;
    try {
      const res = await portalApi.reviewCmoGrievance(selected.grievance._id, {
        cmoPublicRemark: publicRemark,
        internalRemark,
      });
      notify('success', res.message);
      setInternalRemark('');
      await openInspector(selected.grievance._id);
      await loadDashboard();
    } catch (err) {
      notify('error', err.message);
    }
  }

  async function handleForward(e) {
    e.preventDefault();
    if (!selected?.grievance?._id || !assignDeptId) return;
    try {
      const res = await portalApi.assignCmoGrievance(selected.grievance._id, {
        departmentId: assignDeptId,
        officerId: assignOfficerId || null,
        priority: assignPriority,
        instructions: assignInstructions,
      });
      notify('success', res.message);
      setAssignInstructions('');
      await openInspector(selected.grievance._id);
      await loadDashboard();
    } catch (err) {
      notify('error', err.message);
    }
  }

  async function handleEscalate() {
    if (!selected?.grievance?._id) return;
    if (escalationReason.trim().length < 5) {
      notify('error', 'Enter an escalation reason (at least 5 characters).');
      return;
    }
    try {
      const res = await portalApi.escalateCmoGrievance(selected.grievance._id, escalationReason);
      notify('success', res.message);
      setEscalationReason('');
      await openInspector(selected.grievance._id);
      await loadDashboard();
    } catch (err) {
      notify('error', err.message);
    }
  }

  async function handleStatusUpdate(e) {
    e.preventDefault();
    if (!selected?.grievance?._id) return;
    try {
      const res = await portalApi.updateCmoGrievanceStatus(selected.grievance._id, {
        status: statusChoice,
        remark: statusRemark,
      });
      notify('success', res.message);
      setStatusRemark('');
      await openInspector(selected.grievance._id);
      await loadDashboard();
    } catch (err) {
      notify('error', err.message);
    }
  }

  async function handleReanalyze() {
    if (!selected?.grievance?._id) return;
    try {
      const res = await portalApi.reanalyzeGrievance(selected.grievance._id);
      notify('success', res.message);
      await openInspector(selected.grievance._id);
    } catch (err) {
      notify('error', err.message);
    }
  }

  const s = stats?.summary || {};
  const matchingOfficers = officers.filter((o) => !assignDeptId || o.department?._id === assignDeptId);

  return (
    <div>
      <section className="page-header">
        <div className="page-header-inner">
          <h1>Chief Minister&apos;s Office (CMO) Administrative Dashboard</h1>
          <p>
            Central grievance monitoring, AI summary triage, department assignment, SLA escalation,
            action-taken verification, and district analytics.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Grievances</div>
            <div className="stat-value">{s.total || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{s.pending || 0}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">{s.resolved || 0}</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-label">Overdue SLA</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{s.overdue || 0}</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">Escalated</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{s.escalated || 0}</div>
          </div>
        </div>

        <div className="tab-bar">
          <button
            type="button"
            className={`tab-pill ${tab === 'queue' ? 'active' : ''}`}
            onClick={() => setTab('queue')}
          >
            Grievance Queue ({grievances.length})
          </button>
          <button
            type="button"
            className={`tab-pill ${tab === 'analytics' ? 'active' : ''}`}
            onClick={() => setTab('analytics')}
          >
            <BarChart3 size={14} style={{ verticalAlign: 'text-bottom' }} /> Charts &amp; Statistics
          </button>
          <button
            type="button"
            className={`tab-pill ${tab === 'enquiries' ? 'active' : ''}`}
            onClick={() => setTab('enquiries')}
          >
            Contact Enquiries ({enquiries.length})
          </button>
        </div>

        {tab === 'queue' && (
          <div className="card card-blue-accent">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>All Submitted Grievances</h2>
              <button type="button" className="btn btn-outline btn-sm" onClick={loadDashboard}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div className="grid-4" style={{ marginBottom: 14 }}>
              <select
                value={filters.district}
                onChange={(e) => setFilters({ ...filters, district: e.target.value })}
              >
                <option value="">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>

            <form
              className="row"
              style={{ marginBottom: 14 }}
              onSubmit={(e) => {
                e.preventDefault();
                loadDashboard();
              }}
            >
              <input
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by Reference ID, subject, or keyword..."
                style={{ flex: 1, minWidth: 220 }}
              />
              <button
                type="button"
                className={`btn btn-sm ${filters.overdue === 'true' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() =>
                  setFilters({ ...filters, overdue: filters.overdue === 'true' ? '' : 'true' })
                }
              >
                Overdue Only
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filters.escalated === 'true' ? 'btn-green' : 'btn-outline'}`}
                onClick={() =>
                  setFilters({ ...filters, escalated: filters.escalated === 'true' ? '' : 'true' })
                }
              >
                Escalated Only
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Apply Search
              </button>
              {Object.values(filters).some(Boolean) && (
                <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters}>
                  Reset Filters
                </button>
              )}
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Reference ID</th>
                    <th>Subject &amp; Citizen</th>
                    <th>District &amp; Dept</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action Report</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grievances.map((g) => (
                    <tr key={g._id}>
                      <td>
                        <strong className="mono">{g.referenceId}</strong>
                        <div className="row" style={{ gap: 4, marginTop: 4 }}>
                          {g.isEscalated && <span className="badge badge-reopened">Escalated</span>}
                          {g.isOverdue && <span className="badge badge-high">Overdue</span>}
                        </div>
                      </td>
                      <td>
                        <strong>{g.subject}</strong>
                        <div className="muted">
                          {g.citizen?.name} • {g.category}
                        </div>
                      </td>
                      <td>
                        {g.district}
                        <div className="muted">
                          {g.assignedDepartment
                            ? `${g.assignedDepartment.name} (${g.assignedDepartment.code})`
                            : 'Not Assigned'}
                        </div>
                      </td>
                      <td><PriorityBadge priority={g.priority} /></td>
                      <td><StatusBadge status={g.status} /></td>
                      <td>
                        {g.actionTakenReport?.summary ? (
                          <span className="badge badge-resolved">Submitted</span>
                        ) : (
                          <span className="muted">Pending</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => openInspector(g._id)}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                  {grievances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="muted">No grievances match the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'analytics' && stats && (
          <div>
            <div className="grid-2">
              <StatusDistributionChart byStatus={stats.byStatus} />
              <PriorityChart byPriority={stats.byPriority} />
            </div>
            <div className="grid-2">
              <DistrictBarChart districtStats={stats.districtStats} />
              <DepartmentBarChart departmentStats={stats.departmentStats} />
            </div>
          </div>
        )}

        {tab === 'enquiries' && (
          <div className="card card-green-accent">
            <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Public Contact Enquiries</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Subject &amp; Message</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <strong>{item.name}</strong>
                        <div className="muted">{item.email}</div>
                      </td>
                      <td>
                        <strong>{item.subject}</strong>
                        <div className="muted">{item.message}</div>
                      </td>
                      <td>{new Date(item.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {enquiries.length === 0 && (
                    <tr>
                      <td colSpan={3} className="muted">No contact enquiries submitted yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <span className="muted">CMO Case Inspector</span>
                <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>
                  {selected.grievance.referenceId}
                </h2>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>
                <X size={16} /> Close
              </button>
            </div>

            <div className="row" style={{ marginBottom: 8 }}>
              <StatusBadge status={selected.grievance.status} />
              <PriorityBadge priority={selected.grievance.priority} />
              {selected.grievance.isEscalated && (
                <span className="badge badge-reopened">Escalated</span>
              )}
            </div>

            <WorkflowStepper status={selected.grievance.status} />

            <h3>{selected.grievance.subject}</h3>
            <p className="muted">
              Citizen: <strong>{selected.grievance.citizen?.name}</strong> (
              {selected.grievance.citizen?.email}) • District:{' '}
              <strong>{selected.grievance.district}</strong> • Category:{' '}
              <strong>{selected.grievance.category}</strong>
            </p>
            <p>{selected.grievance.description}</p>

            {selected.grievance.originalDescription && (
              <div className="alert alert-info">
                <strong>Citizen Original Raw Text (before AI Optimization):</strong>
                <div>{selected.grievance.originalDescription}</div>
              </div>
            )}

            <div className="ai-assistant-box">
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <strong style={{ color: 'var(--green-800)' }}>
                  <Sparkles size={15} style={{ verticalAlign: 'text-bottom' }} /> AI Grievance
                  Summary &amp; Highlights (Advisory)
                </strong>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleReanalyze}>
                  <Sparkles size={14} /> Re-analyze
                </button>
              </div>
              <p style={{ margin: '4px 0' }}>
                {selected.grievance.aiAnalysis?.summary || 'No AI summary generated yet.'}
              </p>
              {(selected.grievance.aiAnalysis?.highlights || []).map((h, i) => (
                <div key={i} className="highlight-chip">{h}</div>
              ))}
              {selected.grievance.aiAnalysis?.suggestedDepartmentName && (
                <div className="muted" style={{ marginTop: 6 }}>
                  AI Suggested Dept:{' '}
                  <strong>
                    {selected.grievance.aiAnalysis.suggestedDepartmentName} (
                    {selected.grievance.aiAnalysis.suggestedDepartmentCode})
                  </strong>{' '}
                  • Suggested Priority:{' '}
                  <strong>{selected.grievance.aiAnalysis.suggestedPriority}</strong>
                </div>
              )}
            </div>

            {selected.grievance.attachments?.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <strong>Citizen Attachments:</strong>
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
                <strong>Department Action-Taken Report ({selected.grievance.actionTakenReport.submittedByName}):</strong>
                <div>{selected.grievance.actionTakenReport.summary}</div>
                {selected.grievance.actionTakenReport.details && (
                  <div className="muted">{selected.grievance.actionTakenReport.details}</div>
                )}
                {selected.grievance.actionTakenReport.attachments?.length > 0 && (
                  <div className="row" style={{ marginTop: 6 }}>
                    {selected.grievance.actionTakenReport.attachments.map((att) => (
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
                )}
              </div>
            )}

            <div className="card" style={{ marginTop: 16 }}>
              <h4 style={{ marginTop: 0, color: 'var(--blue-900)' }}>
                1. Forward / Assign to Department &amp; Officer
              </h4>
              <form onSubmit={handleForward}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Department</label>
                    <select value={assignDeptId} onChange={(e) => setAssignDeptId(e.target.value)} required>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Department Officer (Optional)</label>
                    <select
                      value={assignOfficerId}
                      onChange={(e) => setAssignOfficerId(e.target.value)}
                    >
                      <option value="">Any Department Officer</option>
                      {matchingOfficers.map((o) => (
                        <option key={o._id} value={o._id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={assignPriority} onChange={(e) => setAssignPriority(e.target.value)}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Forwarding Instructions</label>
                    <input
                      value={assignInstructions}
                      onChange={(e) => setAssignInstructions(e.target.value)}
                      placeholder="Directions to the department"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">
                  <Send size={14} /> Forward Grievance
                </button>
              </form>
            </div>

            <div className="card">
              <h4 style={{ marginTop: 0, color: 'var(--blue-900)' }}>
                2. CMO Public &amp; Internal Remarks
              </h4>
              <form onSubmit={handleReviewSave}>
                <div className="form-group">
                  <label>Public Remark (visible to citizen)</label>
                  <input
                    value={publicRemark}
                    onChange={(e) => setPublicRemark(e.target.value)}
                    placeholder="Official update shown to citizen"
                  />
                </div>
                <div className="form-group">
                  <label>Internal Administrative Note (CMO/Officer only)</label>
                  <input
                    value={internalRemark}
                    onChange={(e) => setInternalRemark(e.target.value)}
                    placeholder="Optional internal audit note"
                  />
                </div>
                <button type="submit" className="btn btn-outline btn-sm">
                  Save CMO Review Notes
                </button>
              </form>
            </div>

            <div className="card">
              <h4 style={{ marginTop: 0, color: 'var(--green-800)' }}>
                3. Final Status Decision &amp; Escalation
              </h4>
              <form onSubmit={handleStatusUpdate} style={{ marginBottom: 14 }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Official Status</label>
                    <select value={statusChoice} onChange={(e) => setStatusChoice(e.target.value)}>
                      <option value="Under Review">Under Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved (Approve Action Report)</option>
                      <option value="Reopened">Reopened</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Resolution / Status Remark</label>
                    <input
                      value={statusRemark}
                      onChange={(e) => setStatusRemark(e.target.value)}
                      placeholder="Reason or final resolution note"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-green btn-sm">
                  <CheckCircle2 size={14} /> Update Official Status
                </button>
              </form>

              <div className="row">
                <input
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="Reason to escalate delayed grievance"
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-danger btn-sm" onClick={handleEscalate}>
                  <AlertTriangle size={14} /> Escalate Case
                </button>
              </div>
            </div>

            <h4>Full Audit Timeline (including Internal Notes)</h4>
            <div className="timeline">
              {(selected.history || []).map((h) => (
                <div key={h._id} className="timeline-item">
                  <div className="row">
                    <strong>{h.action}</strong>
                    <StatusBadge status={h.toStatus} />
                    {h.isInternal && <span className="badge badge-medium">Internal</span>}
                  </div>
                  <div className="muted">
                    {new Date(h.createdAt).toLocaleString()} • {h.changedByName} ({h.changedByRole})
                  </div>
                  {h.remark && <div>{h.remark}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
