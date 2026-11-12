import React from 'react';
import { Target, Eye, ShieldCheck, Cpu } from 'lucide-react';

export default function AboutPage() {
  return (
    <div>
      <section className="page-header">
        <div className="page-header-inner">
          <h1>About the Public Grievance Redressal Initiative</h1>
          <p>
            Transparent, accountable, and AI-assisted grievance management connecting citizens with
            the Chief Minister&apos;s Office and state departments.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="alert alert-info">
          <strong>Recruitment Prototype Notice:</strong> All portals, departments, metrics, and user
          accounts showcased in this application use fictional sample data solely for technical
          evaluation.
        </div>

        <div className="grid-2">
          <div className="card card-blue-accent">
            <h3 style={{ color: 'var(--blue-900)' }}>
              <Eye size={18} style={{ verticalAlign: 'text-bottom' }} /> Our Vision
            </h3>
            <p>
              To ensure every citizen across Kerala&apos;s 14 districts has a clear, responsive, and
              traceable channel to voice civic infrastructure, healthcare, education, water, power,
              and welfare concerns directly to the Chief Minister&apos;s Office.
            </p>
          </div>

          <div className="card card-green-accent">
            <h3 style={{ color: 'var(--green-800)' }}>
              <Target size={18} style={{ verticalAlign: 'text-bottom' }} /> Our Mission
            </h3>
            <p>
              To streamline grievance intake with AI-assisted summarization and clarity optimization,
              forward complaints accurately to accountable department officers, track SLA deadlines,
              and verify ground action before final resolution.
            </p>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <h3 style={{ color: 'var(--blue-900)' }}>
              <ShieldCheck size={18} style={{ verticalAlign: 'text-bottom' }} /> Core Objectives
            </h3>
            <ul style={{ paddingLeft: 20 }}>
              <li>
                Provide unique Reference IDs (<code className="mono">KL-CMO-YYYY-XXXXXX</code>) for
                instant tracking.
              </li>
              <li>Maintain complete timestamped audit logs across every status change.</li>
              <li>Empower CMO administrators to escalate overdue cases and review action reports.</li>
              <li>Allow citizens to rate resolutions and reopen unresolved complaints transparently.</li>
            </ul>
          </div>

          <div className="card">
            <h3 style={{ color: 'var(--green-800)' }}>
              <Cpu size={18} style={{ verticalAlign: 'text-bottom' }} /> Responsible AI Safeguards
            </h3>
            <ul style={{ paddingLeft: 20 }}>
              <li>AI optimizes clarity, summarizes, highlights key facts, and suggests priority/dept.</li>
              <li>AI never independently approves, rejects, or assigns official status.</li>
              <li>Citizens choose whether to apply AI edits, preserving original complaint history.</li>
              <li>Clearly labelled deterministic fallback ensures reliability even offline.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
