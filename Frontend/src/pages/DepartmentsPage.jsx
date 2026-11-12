import React, { useEffect, useState } from 'react';
import { Building2, Clock, Mail, Search } from 'lucide-react';
import { portalApi } from '../services/api';
import { getDepartmentIcon } from '../components/KeralaBrand';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await portalApi.getDepartments();
        setDepartments(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = departments.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.shortDescription.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <section className="page-header">
        <div className="page-header-inner">
          <h1>Government Departments Directory</h1>
          <p>
            Sample state departments integrated with the CMO grievance forwarding workflow and SLA
            tracking.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search departments by name, code (PWD, HLTH...), or responsibility..."
              />
            </div>
            <span className="muted">
              <Search size={14} style={{ verticalAlign: 'text-bottom' }} /> Showing {filtered.length} of{' '}
              {departments.length} departments
            </span>
          </div>
        </div>

        {loading ? (
          <div className="card">Loading departments from MongoDB Atlas...</div>
        ) : (
          <div className="grid-2">
            {filtered.map((dept) => {
              const DeptIcon = getDepartmentIcon(dept.code);
              return (
                <div key={dept._id} className="card card-blue-accent card-interactive">
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <div className="dept-icon-box">
                        <DeptIcon size={18} />
                      </div>
                      <span className="badge badge-submitted">
                        <Building2 size={13} /> {dept.code}
                      </span>
                    </div>
                    <span className="badge badge-resolved">
                      <Clock size={13} /> {dept.slaDays} Day SLA
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 6px', color: 'var(--blue-900)' }}>{dept.name}</h3>
                  <p className="muted" style={{ marginTop: 0 }}>{dept.shortDescription}</p>

                  <div className="row" style={{ marginBottom: 10 }}>
                    {(dept.categories || []).map((cat) => (
                      <span key={cat} className="badge badge-low">{cat}</span>
                    ))}
                  </div>

                  <div
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border)',
                      paddingTop: 10,
                      fontSize: '0.82rem',
                    }}
                  >
                    <span className="muted">
                      <Mail size={13} style={{ verticalAlign: 'text-bottom' }} /> {dept.contactEmail}
                    </span>
                    <strong className="tabular">
                      Assigned: {dept.stats?.totalAssigned || 0} | Resolved: {dept.stats?.resolved || 0}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
