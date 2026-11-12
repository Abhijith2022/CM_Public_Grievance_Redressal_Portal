import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Building2,
  ClipboardCheck,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

const LIFECYCLE_STEPS = [
  {
    step: '01',
    title: 'Citizen Submits Grievance',
    desc: 'Citizen selects district & category, writes the complaint, optionally uploads evidence files, and receives a unique Reference ID.',
    icon: FileText,
    accent: 'blue',
  },
  {
    step: '02',
    title: 'AI Grievance Assistant (Advisory)',
    desc: 'Gemini AI optimizes phrasing, generates a CMO executive summary, extracts key highlights, suggests department & priority, and flags duplicates.',
    icon: Sparkles,
    accent: 'green',
  },
  {
    step: '03',
    title: 'CMO Reviews & Forwards',
    desc: 'CMO Administrator reviews complaint & AI summary, adds remarks, sets priority/SLA, and forwards the case to the target department/officer.',
    icon: ShieldCheck,
    accent: 'blue',
  },
  {
    step: '04',
    title: 'Department Officer Investigates',
    desc: 'Officer reviews attachments, transitions status to In Progress, records investigation remarks, and performs field verification.',
    icon: Building2,
    accent: 'green',
  },
  {
    step: '05',
    title: 'Action-Taken Report Submitted',
    desc: 'Department submits Action-Taken Report summary, detailed findings, and optional proof documents back to the CMO for verification.',
    icon: ClipboardCheck,
    accent: 'blue',
  },
  {
    step: '06',
    title: 'CMO Resolves & Citizen Gives Feedback',
    desc: 'CMO marks the grievance Resolved. Citizen receives updates and can submit a 1–5 star rating or reopen the grievance if unresolved.',
    icon: CheckCircle2,
    accent: 'green',
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <section className="page-header">
        <div className="page-header-inner">
          <h1>How the Grievance Workflow Operates</h1>
          <p>
            End-to-end traceable lifecycle from citizen intake to CMO review, department action,
            and verified resolution.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="grid-3">
          {LIFECYCLE_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className={`card ${item.accent === 'green' ? 'card-green-accent' : 'card-blue-accent'}`}
              >
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="badge badge-submitted">Step {item.step}</span>
                  <Icon size={20} color={item.accent === 'green' ? '#0d7a5f' : '#0b4f8a'} />
                </div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--blue-900)' }}>{item.title}</h3>
                <p className="muted" style={{ margin: 0 }}>{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Mandatory Tracked Statuses</h2>
          <div className="grid-4">
            <div>
              <span className="badge badge-submitted">Submitted</span>
              <p className="muted">Logged by citizen with unique Reference ID.</p>
            </div>
            <div>
              <span className="badge badge-under-review">Under Review</span>
              <p className="muted">Evaluated by CMO and forwarded to department.</p>
            </div>
            <div>
              <span className="badge badge-in-progress">In Progress</span>
              <p className="muted">Department officer actively investigating &amp; reporting.</p>
            </div>
            <div>
              <span className="badge badge-resolved">Resolved</span>
              <p className="muted">Action-taken report approved by CMO.</p>
            </div>
          </div>
          <div className="alert alert-warning" style={{ marginTop: 12, marginBottom: 0 }}>
            <RotateCcw size={15} style={{ verticalAlign: 'text-bottom' }} /> <strong>Reopened:</strong>{' '}
            Citizens unsatisfied with a resolution can reopen the grievance with a reason, returning it
            to the CMO queue with full audit history preserved.
          </div>
        </div>

        <div className="row">
          <Link to="/login" className="btn btn-green">Try Citizen / CMO / Officer Portals</Link>
          <Link to="/track" className="btn btn-primary">Track a Sample Grievance</Link>
        </div>
      </div>
    </div>
  );
}
