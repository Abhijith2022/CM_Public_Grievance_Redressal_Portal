import React from 'react';

export function StatusDistributionChart({ byStatus = {} }) {
  const entries = [
    { label: 'Submitted', value: byStatus.Submitted || 0, color: '#1677c8' },
    { label: 'Under Review', value: byStatus['Under Review'] || 0, color: '#0284c7' },
    { label: 'In Progress', value: byStatus['In Progress'] || 0, color: '#d97706' },
    { label: 'Resolved', value: byStatus.Resolved || 0, color: '#059669' },
    { label: 'Reopened', value: byStatus.Reopened || 0, color: '#dc2626' },
  ];

  const total = entries.reduce((sum, e) => sum + e.value, 0) || 1;
  let offset = 0;

  return (
    <div className="card card-blue-accent">
      <h3 style={{ marginTop: 0 }}>Grievance Status Distribution</h3>
      <div className="row" style={{ gap: 24, alignItems: 'center' }}>
        <svg width="150" height="150" viewBox="0 0 42 42" style={{ flexShrink: 0 }}>
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2eef4" strokeWidth="5.5" />
          {entries.map((entry) => {
            const pct = (entry.value / total) * 100;
            if (pct === 0) return null;
            const dash = `${pct} ${100 - pct}`;
            const dashOffset = 25 - offset;
            offset += pct;
            return (
              <circle
                key={entry.label}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={entry.color}
                strokeWidth="5.5"
                strokeDasharray={dash}
                strokeDashoffset={dashOffset}
              />
            );
          })}
          <text
            x="21"
            y="22.5"
            textAnchor="middle"
            fontSize="6.5"
            fontWeight="700"
            fill="#083d6e"
          >
            {entries.reduce((s, e) => s + e.value, 0)}
          </text>
        </svg>

        <div style={{ flex: 1, minWidth: 180 }}>
          {entries.map((e) => (
            <div
              key={e.label}
              className="row"
              style={{ justifyContent: 'space-between', marginBottom: 6, fontSize: '0.86rem' }}
            >
              <span className="row" style={{ gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: e.color,
                    display: 'inline-block',
                  }}
                />
                {e.label}
              </span>
              <strong>{e.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DistrictBarChart({ districtStats = [] }) {
  const maxTotal = Math.max(1, ...districtStats.map((d) => d.total || 0));

  return (
    <div className="card card-green-accent">
      <h3 style={{ marginTop: 0 }}>District-Wise Grievance Breakdown</h3>
      {districtStats.length === 0 ? (
        <p className="muted">No district statistics yet.</p>
      ) : (
        districtStats.map((d) => {
          const resolvedPct = Math.round((d.resolved / maxTotal) * 100);
          const pendingPct = Math.round((d.pending / maxTotal) * 100);
          return (
            <div key={d.district} className="bar-row">
              <div className="row" style={{ justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <strong>{d.district}</strong>
                <span className="muted">
                  Total: {d.total} (Resolved: {d.resolved}, Pending: {d.pending})
                </span>
              </div>
              <div className="bar-track">
                <div className="bar-fill-green" style={{ width: `${resolvedPct}%` }} />
                <div className="bar-fill-blue" style={{ width: `${pendingPct}%` }} />
              </div>
            </div>
          );
        })
      )}
      <div className="row" style={{ marginTop: 12, fontSize: '0.78rem' }}>
        <span className="row" style={{ gap: 5 }}>
          <span style={{ width: 10, height: 10, background: '#059669', borderRadius: 2 }} /> Resolved
        </span>
        <span className="row" style={{ gap: 5 }}>
          <span style={{ width: 10, height: 10, background: '#0e63ad', borderRadius: 2 }} /> Pending
        </span>
      </div>
    </div>
  );
}

export function DepartmentBarChart({ departmentStats = [] }) {
  const maxTotal = Math.max(1, ...departmentStats.map((d) => d.total || 0));

  return (
    <div className="card card-blue-accent">
      <h3 style={{ marginTop: 0 }}>Department-Wise Workload &amp; Resolution</h3>
      {departmentStats.length === 0 ? (
        <p className="muted">No grievances assigned to departments yet.</p>
      ) : (
        departmentStats.map((d) => {
          const resolvedPct = Math.round((d.resolved / maxTotal) * 100);
          const pendingPct = Math.round((d.pending / maxTotal) * 100);
          return (
            <div key={d.code} className="bar-row">
              <div className="row" style={{ justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <strong>{d.name} ({d.code})</strong>
                <span className="muted">
                  {d.total} assigned • {d.resolved} resolved
                </span>
              </div>
              <div className="bar-track">
                <div className="bar-fill-green" style={{ width: `${resolvedPct}%` }} />
                <div className="bar-fill-blue" style={{ width: `${pendingPct}%` }} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export function PriorityChart({ byPriority = {} }) {
  const rows = [
    { label: 'High Priority', count: byPriority.High || 0, color: '#dc2626' },
    { label: 'Medium Priority', count: byPriority.Medium || 0, color: '#d97706' },
    { label: 'Low Priority', count: byPriority.Low || 0, color: '#0e63ad' },
  ];
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="card card-green-accent">
      <h3 style={{ marginTop: 0 }}>Priority Severity Mix</h3>
      {rows.map((r) => (
        <div key={r.label} className="bar-row">
          <div className="row" style={{ justifyContent: 'space-between', fontSize: '0.86rem' }}>
            <span>{r.label}</span>
            <strong>{r.count}</strong>
          </div>
          <div className="bar-track">
            <div
              style={{
                width: `${Math.round((r.count / max) * 100)}%`,
                background: r.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
