import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, ShieldCheck, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login, demoAccounts, notify } = useApp();
  const navigate = useNavigate();

  const [roleTab, setRoleTab] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function routeByRole(role) {
    if (role === 'cmo_admin') navigate('/cmo');
    else if (role === 'department_officer') navigate('/officer');
    else navigate('/citizen');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login({
        email,
        password,
        ...(roleTab ? { expectedRole: roleTab } : {}),
      });
      routeByRole(user.role);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(acc) {
    setLoading(true);
    try {
      const user = await login({ email: acc.email, password: acc.password });
      routeByRole(user.role);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <section className="page-header">
        <div className="page-header-inner">
          <h1>Role-Based Portal Sign In</h1>
          <p>
            Dedicated authentication for Citizens, Chief Minister&apos;s Office (CMO) Administrators,
            and Government Department Officers.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="grid-2">
          <div className="card card-blue-accent">
            <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Sign In to Your Account</h2>

            <div className="tab-bar">
              {[
                { key: '', label: 'All Roles' },
                { key: 'citizen', label: 'Citizen' },
                { key: 'cmo_admin', label: 'CMO Admin' },
                { key: 'department_officer', label: 'Dept Officer' },
              ].map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  className={`tab-pill ${roleTab === tab.key ? 'active' : ''}`}
                  onClick={() => setRoleTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter registered email"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                <LogIn size={16} /> {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
              New citizen?{' '}
              <Link to="/register" style={{ color: 'var(--green-700)', fontWeight: 700 }}>
                Create a Citizen Account
              </Link>
            </p>
          </div>

          <div className="card card-gold-accent">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>
                One-Click Demo Logins
              </h2>
              <span className="kasavu-pill">Evaluator Quick Access</span>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>
              Fictional sample accounts configured for evaluating all 3 required workflows.
            </p>

            {demoAccounts.map((acc) => {
              const Icon =
                acc.role === 'cmo_admin'
                  ? ShieldCheck
                  : acc.role === 'department_officer'
                  ? Building2
                  : User;
              return (
                <div
                  key={acc.email}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10,
                    background: 'var(--surface-soft)',
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <strong className="row" style={{ color: 'var(--blue-900)' }}>
                      <Icon size={16} color="#0d7a5f" /> {acc.label}
                    </strong>
                    <button
                      type="button"
                      className="btn btn-green btn-sm"
                      disabled={loading}
                      onClick={() => quickLogin(acc)}
                    >
                      Quick Sign In
                    </button>
                  </div>
                  <div className="muted mono" style={{ marginTop: 4, fontSize: '0.82rem' }}>
                    <code>{acc.email}</code> • <code>{acc.password}</code>
                  </div>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>{acc.note}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
