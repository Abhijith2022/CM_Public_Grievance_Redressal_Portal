import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Send,
  RefreshCw,
  FileText,
  CheckCircle2,
  Copy,
  X,
  RotateCcw,
} from 'lucide-react';
import { portalApi, getAttachmentUrl } from '../services/api';
import { useApp } from '../context/AppContext';
import { StatusBadge, PriorityBadge, WorkflowStepper } from '../components/StatusBadge';

export default function CitizenDashboardPage() {
  const { user, overview, notify, refreshOverview } = useApp();
  const location = useLocation();
  const districts = overview?.districts || [];
  const categories = overview?.categories || [];

  const [tab, setTab] = useState('submit');
  const [district, setDistrict] = useState(
    location.state?.district || user?.district || 'Ernakulam'
  );

  useEffect(() => {
    if (location.state?.district) {
      setDistrict(location.state.district);
      setTab('submit');
    }
  }, [location.state?.district]);
  const [category, setCategory] = useState('Roads & Public Infrastructure');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [files, setFiles] = useState([]);

  const [aiResult, setAiResult] = useState(null);
  const [aiApplied, setAiApplied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedConfirmation, setSubmittedConfirmation] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [myData, setMyData] = useState({ summary: {}, grievances: [] });
  const [loadingList, setLoadingList] = useState(false);
  const [detail, setDetail] = useState(null);

  const [fbRating, setFbRating] = useState(5);
  const [fbComment, setFbComment] = useState('');
  const [fbReopen, setFbReopen] = useState(false);

  async function loadMyGrievances() {
    if (!user || user.role !== 'citizen') return;
    setLoadingList(true);
    try {
      const res = await portalApi.getMyGrievances({ status: statusFilter });
      setMyData(res.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    if (districts.length > 0 && !districts.includes(district)) setDistrict(districts[0]);
    if (categories.length > 0 && !categories.includes(category)) setCategory(categories[0]);
  }, [overview]);

  useEffect(() => {
    loadMyGrievances();
  }, [user, statusFilter]);

  if (!user || user.role !== 'citizen') {
    return (
      <div className="container">
        <div className="card card-blue-accent">
          <h2>Citizen Portal Access Required</h2>
          <p className="muted">Please sign in with a Citizen account to submit and manage grievances.</p>
          <div className="row">
            <Link to="/login" className="btn btn-primary">Go to Login</Link>
            <Link to="/register" className="btn btn-green">Register Citizen Account</Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleAiOptimize() {
    if (description.trim().length < 10) {
      notify('error', 'Please enter at least 10 characters in your complaint description first.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await portalApi.optimizeComplaint({
        subject,
        description,
        district,
        category,
      });
      setAiResult(res.data);
      setAiApplied(false);
      notify('success', res.message);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setAiLoading(false);
    }
  }

  function applyOptimizedText() {
    if (!aiResult) return;
    if (!originalDescription) setOriginalDescription(description);
    if (aiResult.optimizedSubject) setSubject(aiResult.optimizedSubject);
    if (aiResult.optimizedDescription) setDescription(aiResult.optimizedDescription);
    setAiApplied(true);
    notify('success', 'AI-optimized complaint text applied. You can edit it anytime.');
  }

  function applySuggestedTags() {
    if (!aiResult) return;
    if (aiResult.suggestedCategory && categories.includes(aiResult.suggestedCategory)) {
      setCategory(aiResult.suggestedCategory);
    }
    if (aiResult.suggestedPriority) {
      setPriority(aiResult.suggestedPriority);
    }
    notify('success', 'AI-suggested category and priority applied.');
  }

  async function handleSubmitGrievance(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('district', district);
      formData.append('category', category);
      formData.append('subject', subject);
      formData.append('description', description);
      if (originalDescription) formData.append('originalDescription', originalDescription);
      formData.append('priority', priority);
      if (aiResult) {
        formData.append('aiAnalysis', JSON.stringify(aiResult));
        formData.append('reviewedByCitizen', String(aiApplied));
      }
      for (const file of files) {
        formData.append('files', file);
      }

      const res = await portalApi.submitGrievance(formData);
      setSubmittedConfirmation(res.data);
      setSubject('');
      setDescription('');
      setOriginalDescription('');
      setFiles([]);
      setAiResult(null);
      setAiApplied(false);
      notify('success', res.message);
      await loadMyGrievances();
      await refreshOverview();
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function openDetail(id) {
    try {
      const res = await portalApi.getGrievanceById(id);
      setDetail(res.data);
    } catch (err) {
      notify('error', err.message);
    }
  }

  async function handleFeedback(e) {
    e.preventDefault();
    if (!detail?.grievance?._id) return;
    try {
      const res = await portalApi.submitFeedback(detail.grievance._id, {
        rating: Number(fbRating),
        isSatisfied: !fbReopen,
        comment: fbComment,
        reopenRequested: fbReopen,
      });
      notify('success', res.message);
      setFbComment('');
      setFbReopen(false);
      await openDetail(detail.grievance._id);
      await loadMyGrievances();
    } catch (err) {
      notify('error', err.message);
    }
  }

  const s = myData.summary || {};

  return (
    <div>
      <section className="page-header">
        <div className="page-header-inner">
          <h1>Citizen Grievance Portal — {user.name}</h1>
          <p>
            Submit new complaints with AI Grievance Assistant optimization &amp; highlights, attach
            supporting files, track updates, and submit post-resolution feedback.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Submitted</div>
            <div className="stat-value">{s.total || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{s.pending || 0}</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{s.inProgress || 0}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">{s.resolved || 0}</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-label">Reopened</div>
            <div className="stat-value">{s.reopened || 0}</div>
          </div>
        </div>

        <div className="tab-bar">
          <button
            type="button"
            className={`tab-pill ${tab === 'submit' ? 'active' : ''}`}
            onClick={() => setTab('submit')}
          >
            Submit New Grievance (with AI Assistant)
          </button>
          <button
            type="button"
            className={`tab-pill ${tab === 'list' ? 'active' : ''}`}
            onClick={() => setTab('list')}
          >
            My Grievances ({s.total || 0})
          </button>
        </div>

        {tab === 'submit' && (
          <div>
            {submittedConfirmation && (
              <div className="alert alert-success">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <strong>
                      <CheckCircle2 size={16} style={{ verticalAlign: 'text-bottom' }} /> Grievance
                      Submitted Successfully!
                    </strong>
                    <div>
                      Unique Reference ID:{' '}
                      <strong className="mono">{submittedConfirmation.referenceId}</strong>
                    </div>
                  </div>
                  <div className="row">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        navigator.clipboard?.writeText(submittedConfirmation.referenceId);
                        notify('info', 'Reference ID copied.');
                      }}
                    >
                      <Copy size={14} /> Copy ID
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setTab('list');
                        loadMyGrievances();
                      }}
                    >
                      My Grievances
                    </button>
                    <Link
                      to={`/track/${submittedConfirmation.referenceId}`}
                      className="btn btn-green btn-sm"
                    >
                      Track Now
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="card card-blue-accent">
              <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>File a Public Grievance</h2>
              <form onSubmit={handleSubmitGrievance}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Kerala District</label>
                    <select value={district} onChange={(e) => setDistrict(e.target.value)} required>
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Grievance Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Complaint Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Concise summary of the grievance"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Detailed Complaint Description</label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe exact location, issue duration, and affected citizens. You can write freely and click AI Optimize below to polish and highlight key details."
                    required
                  />
                  <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
                    <span className="muted" style={{ fontSize: '0.78rem' }}>
                      Tip: Mention local body / panchayat / ward, landmarks, and days unresolved.
                    </span>
                    <span className="muted tabular" style={{ fontSize: '0.78rem' }}>
                      {description.length} characters
                    </span>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Priority Level</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Supporting Image / Document (optional, max 3 MB each)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.txt,.doc,.docx"
                      onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    />
                    {files.length > 0 && (
                      <div className="row" style={{ marginTop: 8, gap: 6 }}>
                        {files.map((file, idx) => (
                          <span key={`${file.name}-${idx}`} className="file-chip">
                            <FileText size={13} />
                            <span>
                              {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
                            </span>
                            <button
                              type="button"
                              aria-label={`Remove ${file.name}`}
                              onClick={() =>
                                setFiles((prev) => prev.filter((_, i) => i !== idx))
                              }
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="row">
                  <button
                    type="button"
                    className="btn btn-green"
                    onClick={handleAiOptimize}
                    disabled={aiLoading}
                  >
                    <Sparkles size={16} />
                    {aiLoading
                      ? 'Optimizing & Highlighting...'
                      : 'AI Optimize, Summarize & Highlight'}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <Send size={16} />
                    {submitting ? 'Submitting to CMO...' : 'Submit Official Grievance'}
                  </button>
                </div>
              </form>

              {aiResult && (
                <div className="ai-assistant-box">
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ color: 'var(--green-800)', fontSize: '1.02rem' }}>
                      <Sparkles size={16} style={{ verticalAlign: 'text-bottom' }} /> AI Grievance
                      Assistant Output
                    </strong>
                    <span className="badge badge-under-review">
                      {aiResult.isFallback
                        ? `Fallback Engine (${aiResult.modelUsed})`
                        : `Gemini AI (${aiResult.modelUsed})`}
                    </span>
                  </div>

                  <p className="muted" style={{ marginTop: 0 }}>
                    {aiResult.disclaimer}
                  </p>

                  <div className="grid-2" style={{ marginTop: 10 }}>
                    <div>
                      <strong style={{ color: 'var(--blue-900)' }}>Key Complaint Highlights:</strong>
                      <div style={{ marginTop: 6 }}>
                        {(aiResult.highlights || []).map((h, i) => (
                          <div key={i} className="highlight-chip">{h}</div>
                        ))}
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <strong style={{ color: 'var(--blue-900)' }}>Executive Summary for CMO:</strong>
                        <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>{aiResult.summary}</p>
                      </div>

                      <div className="row" style={{ marginTop: 8 }}>
                        <span className="badge badge-submitted">
                          Dept: {aiResult.suggestedDepartment?.name} ({aiResult.suggestedDepartment?.code})
                        </span>
                        <span className="badge badge-under-review">
                          Category: {aiResult.suggestedCategory}
                        </span>
                        <PriorityBadge priority={aiResult.suggestedPriority} />
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={applySuggestedTags}
                        >
                          Apply Suggested Category &amp; Priority
                        </button>
                      </div>
                    </div>

                    <div>
                      <strong style={{ color: 'var(--green-800)' }}>
                        AI-Optimized Subject &amp; Complaint Text:
                      </strong>
                      <div
                        style={{
                          background: '#fff',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 6,
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--blue-900)' }}>
                          {aiResult.optimizedSubject}
                        </div>
                        <pre
                          style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'inherit',
                            fontSize: '0.86rem',
                          }}
                        >
                          {aiResult.optimizedDescription}
                        </pre>
                      </div>
                      <button
                        type="button"
                        className="btn btn-green btn-sm"
                        style={{ marginTop: 8 }}
                        onClick={applyOptimizedText}
                      >
                        Apply AI Optimization to Form
                      </button>
                    </div>
                  </div>

                  {aiResult.potentialDuplicates?.length > 0 && (
                    <div className="alert alert-warning" style={{ marginTop: 12, marginBottom: 0 }}>
                      <strong>Potential Similar / Duplicate Complaints Flagged for Review:</strong>
                      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                        {aiResult.potentialDuplicates.map((d) => (
                          <li key={d.referenceId}>
                            <strong>{d.referenceId}</strong> — {d.subject} ({d.status},{' '}
                            {Math.round((d.similarityScore || 0) * 100)}% overlap)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'list' && (
          <div className="card card-green-accent">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>My Grievance History</h2>
              <div className="row">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: 170 }}
                >
                  <option value="">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Reopened">Reopened</option>
                </select>
                <button type="button" className="btn btn-outline btn-sm" onClick={loadMyGrievances}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            {loadingList ? (
              <p className="muted">Loading your grievances...</p>
            ) : myData.grievances?.length === 0 ? (
              <p className="muted">No grievances found for this filter.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Reference ID</th>
                      <th>Subject &amp; Category</th>
                      <th>Assigned Dept</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myData.grievances.map((g) => (
                      <tr key={g._id}>
                        <td><strong>{g.referenceId}</strong></td>
                        <td>
                          {g.subject}
                          <div className="muted">{g.district} • {g.category}</div>
                        </td>
                        <td>{g.assignedDepartment?.name || 'Pending CMO Review'}</td>
                        <td><PriorityBadge priority={g.priority} /></td>
                        <td><StatusBadge status={g.status} /></td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => openDetail(g._id)}
                          >
                            View Timeline &amp; Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <span className="muted">Reference ID</span>
                <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>
                  {detail.grievance.referenceId}
                </h2>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setDetail(null)}>
                <X size={16} /> Close
              </button>
            </div>

            <div className="row" style={{ marginBottom: 10 }}>
              <StatusBadge status={detail.grievance.status} />
              <PriorityBadge priority={detail.grievance.priority} />
            </div>

            <WorkflowStepper status={detail.grievance.status} />

            <h3>{detail.grievance.subject}</h3>
            <p>{detail.grievance.description}</p>

            {detail.grievance.cmoPublicRemark && (
              <div className="alert alert-info">
                <strong>CMO Remark:</strong> {detail.grievance.cmoPublicRemark}
              </div>
            )}

            {detail.grievance.officerRemarks && (
              <div className="alert alert-info">
                <strong>Officer Investigation Update:</strong> {detail.grievance.officerRemarks}
              </div>
            )}

            {detail.grievance.actionTakenReport?.summary && (
              <div className="alert alert-success">
                <strong>Action-Taken Report:</strong> {detail.grievance.actionTakenReport.summary}
                {detail.grievance.actionTakenReport.details && (
                  <div className="muted" style={{ marginTop: 4 }}>
                    {detail.grievance.actionTakenReport.details}
                  </div>
                )}
                {(detail.grievance.actionTakenReport.attachments || []).length > 0 && (
                  <div className="row" style={{ marginTop: 8 }}>
                    {detail.grievance.actionTakenReport.attachments.map((att) => (
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

            {detail.grievance.attachments?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <strong>Supporting Attachments:</strong>
                <div className="row" style={{ marginTop: 6 }}>
                  {detail.grievance.attachments.map((att) => (
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

            <h4>Status History</h4>
            <div className="timeline">
              {(detail.history || []).map((h) => (
                <div key={h._id} className="timeline-item">
                  <div className="row">
                    <strong>{h.action}</strong>
                    <StatusBadge status={h.toStatus} />
                  </div>
                  <div className="muted">
                    {new Date(h.createdAt).toLocaleString()} • {h.changedByName}
                  </div>
                  {h.remark && <div>{h.remark}</div>}
                </div>
              ))}
            </div>

            {detail.grievance.status === 'Resolved' && !detail.feedback && (
              <form onSubmit={handleFeedback} className="card card-green-accent" style={{ marginTop: 16 }}>
                <h4 style={{ marginTop: 0 }}>Post-Resolution Feedback</h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Satisfaction Rating</label>
                    <select value={fbRating} onChange={(e) => setFbRating(e.target.value)}>
                      <option value={5}>5 - Very Satisfied</option>
                      <option value={4}>4 - Satisfied</option>
                      <option value={3}>3 - Neutral</option>
                      <option value={2}>2 - Dissatisfied</option>
                      <option value={1}>1 - Very Dissatisfied</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Resolution Decision</label>
                    <select
                      value={String(fbReopen)}
                      onChange={(e) => setFbReopen(e.target.value === 'true')}
                    >
                      <option value="false">Accept Resolution</option>
                      <option value="true">Not Resolved — Reopen Grievance</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Comments</label>
                  <input
                    value={fbComment}
                    onChange={(e) => setFbComment(e.target.value)}
                    placeholder="Share feedback or reason for reopening"
                  />
                </div>
                <button type="submit" className="btn btn-green btn-sm">
                  {fbReopen ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
                  {fbReopen ? 'Submit & Reopen Case' : 'Submit Feedback'}
                </button>
              </form>
            )}

            {detail.feedback && (
              <div className="alert alert-success" style={{ marginTop: 14 }}>
                <strong>Submitted Feedback ({detail.feedback.rating}/5):</strong>{' '}
                {detail.feedback.comment || 'No extra comment.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
