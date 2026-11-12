import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  LogIn,
  UserCheck,
  MapPin,
  PhoneCall,
  Globe2,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KeralaEmblem } from './KeralaBrand';

export default function Layout({ children }) {
  const { user, overview, toasts, dismissToast, logout, lang, setLang, tr } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fontScale, setFontScale] = useState('md');
  const [highContrast, setHighContrast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const px = fontScale === 'sm' ? '15px' : fontScale === 'lg' ? '18px' : '16px';
    document.documentElement.style.fontSize = px;
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    return () => document.documentElement.classList.remove('high-contrast');
  }, [highContrast]);

  function getPortalPath() {
    if (!user) return '/login';
    if (user.role === 'cmo_admin') return '/cmo';
    if (user.role === 'department_officer') return '/officer';
    return '/citizen';
  }

  function getPortalLabel() {
    if (!user) return tr.auth.portalLogin;
    if (user.role === 'cmo_admin') return tr.auth.cmoDashboard;
    if (user.role === 'department_officer') return tr.auth.officerDashboard;
    return tr.auth.citizenPortal;
  }

  const navItems = [
    { to: '/', label: tr.nav.home },
    { to: '/about', label: tr.nav.about },
    { to: '/how-it-works', label: tr.nav.howItWorks },
    { to: '/departments', label: tr.nav.departments },
    { to: '/track', label: tr.nav.track },
    { to: '/contact', label: tr.nav.contact },
    { to: '/faq', label: tr.nav.faq },
  ];

  return (
    <div>
      <div className="prototype-strip">
        {lang === 'ml' ? tr.prototypeNotice : overview?.disclaimer || tr.prototypeNotice}
      </div>

      <div className="civic-subbar">
        <div className="civic-subbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <a href="#main-content" className="skip-link">
              {tr.skipToContent}
            </a>
            <span style={{ opacity: 0.4 }} aria-hidden="true">|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <MapPin size={13} /> {tr.locationBar}
            </span>
            <span style={{ opacity: 0.4 }} aria-hidden="true">|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <PhoneCall size={13} /> {tr.sampleDesk}
            </span>
          </div>
          <div className="a11y-controls" role="group" aria-label="Accessibility and language controls">
            <button
              type="button"
              className={`a11y-btn ${fontScale === 'sm' ? 'active' : ''}`}
              onClick={() => setFontScale('sm')}
              title="Decrease text size"
            >
              A-
            </button>
            <button
              type="button"
              className={`a11y-btn ${fontScale === 'md' ? 'active' : ''}`}
              onClick={() => setFontScale('md')}
              title="Default text size"
            >
              A
            </button>
            <button
              type="button"
              className={`a11y-btn ${fontScale === 'lg' ? 'active' : ''}`}
              onClick={() => setFontScale('lg')}
              title="Increase text size"
            >
              A+
            </button>
            <button
              type="button"
              className={`a11y-btn ${highContrast ? 'active' : ''}`}
              onClick={() => setHighContrast((v) => !v)}
              title="Toggle high contrast mode"
            >
              <Eye size={12} /> Contrast
            </button>
            <div className="lang-switch-group" role="group" aria-label="Language switcher">
              <Globe2 size={12} style={{ marginLeft: 6, color: '#0b4f8a' }} />
              <button
                type="button"
                className={`lang-switch-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >
                English
              </button>
              <button
                type="button"
                className={`lang-switch-btn ml-text ${lang === 'ml' ? 'active' : ''}`}
                onClick={() => setLang('ml')}
              >
                മലയാളം
              </button>
            </div>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand-link" onClick={() => setMobileOpen(false)}>
            <div className="brand-emblem" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
              <KeralaEmblem size={42} />
            </div>
            <div className="brand-copy">
              <div className="brand-title">{tr.brandTitle}</div>
              <div className="brand-subtitle">{tr.brandSubtitle}</div>
            </div>
          </Link>

          <div className="header-actions">
            {user ? (
              <>
                <Link to={getPortalPath()} className="btn btn-green btn-sm">
                  <UserCheck size={15} /> {getPortalLabel()}
                </Link>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                >
                  <LogOut size={15} /> {tr.auth.logout}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-sm">
                  <LogIn size={15} /> {tr.auth.signIn}
                </Link>
                <Link to="/register" className="btn btn-green btn-sm">
                  {tr.auth.register}
                </Link>
              </>
            )}

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className="nav-bar">
          <nav className="desktop-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to={getPortalPath()}
            className="nav-link"
            onClick={() => setMobileOpen(false)}
          >
            {getPortalLabel()}
          </Link>
        </div>
      </header>

      <main id="main-content" className="page-wrap">{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <h4>{tr.footer.title}</h4>
            <p style={{ fontSize: '0.84rem', margin: '0 0 8px' }}>{tr.footer.desc}</p>
            <p style={{ fontSize: '0.78rem', color: '#86efac', margin: 0 }}>{tr.footer.notice}</p>
          </div>

          <div>
            <h4>{tr.footer.publicPortal}</h4>
            <div className="footer-links">
              <Link to="/">{tr.nav.home}</Link>
              <Link to="/about">{tr.nav.about}</Link>
              <Link to="/how-it-works">{tr.nav.howItWorks}</Link>
              <Link to="/departments">{tr.nav.departments}</Link>
              <Link to="/track">{tr.nav.track}</Link>
              <Link to="/faq">{tr.nav.faq}</Link>
            </div>
          </div>

          <div>
            <h4>{tr.footer.roleWorkspaces}</h4>
            <div className="footer-links">
              <Link to="/login">{tr.auth.signIn}</Link>
              <Link to="/register">{tr.auth.register}</Link>
              <Link to="/citizen">{tr.auth.citizenPortal}</Link>
              <Link to="/cmo">{tr.auth.cmoDashboard}</Link>
              <Link to="/officer">{tr.auth.officerDashboard}</Link>
              <Link to="/api-tester">{tr.home.roleCards.apiTitle}</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            <span className="ml-text" style={{ color: '#e9c86f', fontWeight: 600 }}>
              കേരളം ഡിജിറ്റൽ പരാതി പരിഹാര സംവിധാനം (മാതൃക)
            </span>{' '}
            • {tr.footer.bottomNote}
          </div>
          <div className="row" style={{ gap: 6 }}>
            <span className="stack-pill">React 18 + Vite</span>
            <span className="stack-pill">Express REST API</span>
            <span className="stack-pill">MongoDB + Mongoose</span>
            <span className="stack-pill">JWT + RBAC</span>
            <span className="stack-pill">Advisory AI</span>
          </div>
        </div>
      </footer>

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#64748b',
                fontWeight: 700,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
