import React from 'react';
import { CheckCircle2, Clock, CircleDot } from 'lucide-react';

export function StatusBadge({ status }) {
  const slug = String(status || 'submitted').toLowerCase().replace(/\s+/g, '-');
  return <span className={`badge badge-${slug}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  const slug = String(priority || 'medium').toLowerCase();
  return <span className={`badge badge-${slug}`}>{priority} Priority</span>;
}

const STEPS = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

export function WorkflowStepper({ status }) {
  const isReopened = status === 'Reopened';
  const activeIdx = isReopened ? 1 : STEPS.indexOf(status);

  return (
    <div>
      {isReopened && (
        <div className="alert alert-warning" style={{ marginBottom: 10 }}>
          This grievance was <strong>Reopened</strong> and returned for fresh CMO review.
        </div>
      )}
      <div className="stepper">
        {STEPS.map((step, idx) => {
          const isDone = activeIdx > idx || (status === 'Resolved' && idx === 3);
          const isCurrent = activeIdx === idx && status !== 'Resolved';
          return (
            <div
              key={step}
              className={`step-item ${isDone ? 'done' : isCurrent ? 'current' : ''}`}
            >
              {isDone ? (
                <CheckCircle2 size={16} />
              ) : isCurrent ? (
                <CircleDot size={16} />
              ) : (
                <Clock size={16} />
              )}
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
