import React, { useState } from 'react';
import { Send, PhoneCall, Mail, MapPin } from 'lucide-react';
import { portalApi } from '../services/api';
import { useApp } from '../context/AppContext';

export default function ContactPage() {
  const { notify } = useApp();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await portalApi.submitContact(form);
      setSubmittedRecord(res.data);
      setForm({ name: '', email: '', subject: '', message: '' });
      notify('success', res.message);
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
          <h1>Contact Us &amp; Citizen Helpdesk</h1>
          <p>
            Submit general enquiries or feedback regarding portal accessibility. Enquiries are
            persisted directly in MongoDB Atlas.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="grid-2">
          <div className="card card-green-accent">
            <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Send an Enquiry</h2>
            {submittedRecord && (
              <div className="alert alert-success">
                Enquiry saved! Reference: <code>{submittedRecord._id}</code>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your name"
                  required
                />
              </div>
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
                <label>Subject</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Topic of your enquiry"
                  required
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write your question or feedback..."
                  required
                />
              </div>
              <button type="submit" className="btn btn-green" disabled={submitting}>
                <Send size={16} /> {submitting ? 'Sending...' : 'Submit Enquiry'}
              </button>
            </form>
          </div>

          <div>
            <div className="card card-blue-accent">
              <h3 style={{ marginTop: 0, color: 'var(--blue-900)' }}>
                Prototype Helpdesk Information (Fictional)
              </h3>
              <p className="muted">
                This portal is a technical recruitment prototype. For official Kerala Government
                matters, please use official state portals.
              </p>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                <div className="row">
                  <MapPin size={18} color="#0b4f8a" />
                  <span>Grievance Redressal Cell (Demo), Thiruvananthapuram, Kerala</span>
                </div>
                <div className="row">
                  <Mail size={18} color="#0d7a5f" />
                  <span>helpdesk@prototype-portal.demo</span>
                </div>
                <div className="row">
                  <PhoneCall size={18} color="#0b4f8a" />
                  <span>1800-000-2026 (Prototype Demo Helpline)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
