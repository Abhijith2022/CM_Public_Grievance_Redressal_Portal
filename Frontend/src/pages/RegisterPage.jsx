import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function RegisterPage() {
  const { registerCitizen, overview, notify } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const districts = overview?.districts || [
    'Thiruvananthapuram',
    'Kollam',
    'Pathanamthitta',
    'Alappuzha',
    'Kottayam',
    'Idukki',
    'Ernakulam',
    'Thrissur',
    'Palakkad',
    'Malappuram',
    'Kozhikode',
    'Wayanad',
    'Kannur',
    'Kasaragod',
  ];

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    district: location.state?.district || 'Ernakulam',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerCitizen(form);
      navigate('/citizen');
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <section className="page-header">
        <div className="page-header-inner">
          <h1>Citizen Registration</h1>
          <p>Create your citizen account to submit grievances, use AI assistance, and track progress.</p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: 680 }}>
        <div className="card card-green-accent">
          <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Register New Citizen Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  value={form.mobileNumber}
                  onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>District</label>
                <select
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Password (min 6 characters)</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-green" disabled={submitting} style={{ width: '100%' }}>
              <UserPlus size={16} /> {submitting ? 'Creating Account...' : 'Register & Continue'}
            </button>
          </form>

          <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--blue-800)', fontWeight: 700 }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
