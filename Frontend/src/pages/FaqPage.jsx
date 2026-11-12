import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function FaqPage() {
  const { overview } = useApp();
  const faqs = overview?.faqs || [];
  const [openId, setOpenId] = useState(faqs[0]?.id || 'faq-1');

  return (
    <div>
      <section className="page-header">
        <div className="page-header-inner">
          <h1>Frequently Asked Questions</h1>
          <p>Guidance on submitting complaints, using the AI assistant, uploading files, and tracking.</p>
        </div>
      </section>

      <div className="container">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="card card-blue-accent" style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? '' : faq.id)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--blue-900)',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                <span className="row">
                  <HelpCircle size={18} color="#0d7a5f" />
                  <span>{faq.question}</span>
                </span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {isOpen && (
                <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.94rem' }}>
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
