import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  Search,
  Sparkles,
  Building2,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Terminal,
  Award,
  Bell,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Compass,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  KERALA_DISTRICTS_META,
  KERALA_HELPLINES,
  KeralaSecretariatBackdrop,
  getDepartmentIcon,
} from '../components/KeralaBrand';
import governanceIllustration from '../assets/kerala-governance-illustration.jpg';

export default function HomePage() {
  const { overview, user, lang, tr } = useApp();
  const h = tr.home;
  const bulletins = h.bulletins;
  const [quickRef, setQuickRef] = useState('KL-CMO-2026-1001');
  const [regionFilter, setRegionFilter] = useState('All');
  const [bulletinIdx, setBulletinIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setBulletinIdx((idx) => (idx + 1) % bulletins.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [bulletins.length]);

  const stats = overview?.stats || {
    totalGrievances: 6,
    resolvedCount: 1,
    inProgressCount: 2,
    departmentsCount: 8,
    districtsCovered: 14,
  };

  const featuredDepartments = overview?.featuredDepartments || [];
  const filteredDistricts = KERALA_DISTRICTS_META.filter(
    (d) => regionFilter === 'All' || d.region === regionFilter
  );
  const currentBulletin = bulletins[bulletinIdx % bulletins.length];

  function handleQuickTrack(e) {
    e.preventDefault();
    if (!quickRef.trim()) return;
    navigate(`/track/${encodeURIComponent(quickRef.trim())}`);
  }

  function handleDistrictClick(districtName) {
    const target = user?.role === 'citizen' ? '/citizen' : '/register';
    navigate(target, { state: { district: districtName } });
  }

  return (
    <div>
      <section className="hero">
        <KeralaSecretariatBackdrop />
        <div className="hero-inner">
          <div>
            <div className="hero-pill">
              <Sparkles size={14} /> {h.heroPill}
            </div>
            <div className="hero-ml-kicker ml-text">{h.heroKicker}</div>
            <h1>{h.heroTitle}</h1>
            <p className="hero-lead">{h.heroLead}</p>
            <div className="row">
              <Link
                to={user?.role === 'citizen' ? '/citizen' : '/login'}
                className="btn btn-green"
              >
                <FilePlus2 size={17} /> {h.submitGrievance}
              </Link>
              <Link to="/track" className="btn btn-white">
                <Search size={17} /> {h.trackGrievance}
              </Link>
              <Link
                to="/how-it-works"
                className="btn btn-outline"
                style={{
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.42)',
                  background: 'rgba(255,255,255,0.06)',
                }}
              >
                {h.howItWorks} <ArrowRight size={16} />
              </Link>
            </div>

            <div className="hero-trust-row">
              <span className="hero-trust-badge">
                <MapPin size={13} /> {h.trustDistricts}
              </span>
              <span className="hero-trust-badge">
                <Clock size={13} /> {h.trustSla}
              </span>
              <span className="hero-trust-badge">
                <ShieldCheck size={13} /> {h.trustAudit}
              </span>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-header">
              <h3 style={{ margin: 0, color: 'var(--blue-900)' }}>{h.quickTrackTitle}</h3>
              <span className="kasavu-pill">{h.quickTrackBadge}</span>
            </div>
            <p className="hero-card-desc">{h.quickTrackDesc}</p>
            <form onSubmit={handleQuickTrack}>
              <div className="form-group">
                <label htmlFor="quick-ref-input">{h.refLabel}</label>
                <input
                  id="quick-ref-input"
                  className="mono"
                  value={quickRef}
                  onChange={(e) => setQuickRef(e.target.value)}
                  placeholder={h.refPlaceholder}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Search size={16} /> {h.trackBtn}
              </button>
            </form>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <span className="muted" style={{ fontSize: '0.82rem' }}>{h.trySampleIds}</span>
              {['KL-CMO-2026-1001', 'KL-CMO-2026-1002', 'KL-CMO-2026-1005'].map((id) => (
                <button
                  key={id}
                  type="button"
                  className="btn btn-outline btn-sm mono"
                  onClick={() => navigate(`/track/${id}`)}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="notice-ticker-bar">
        <div className="notice-ticker-inner">
          <span className="notice-ticker-tag">
            <Bell size={12} /> {currentBulletin.tag}
          </span>
          <div className="notice-ticker-text">{currentBulletin.text}</div>
          <div className="row" style={{ gap: 6 }}>
            <button
              type="button"
              className="a11y-btn"
              aria-label="Previous bulletin"
              onClick={() =>
                setBulletinIdx((idx) => (idx - 1 + bulletins.length) % bulletins.length)
              }
            >
              <ChevronLeft size={14} />
            </button>
            <span className="muted tabular" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              {(bulletinIdx % bulletins.length) + 1} / {bulletins.length}
            </span>
            <button
              type="button"
              className="a11y-btn"
              aria-label="Next bulletin"
              onClick={() => setBulletinIdx((idx) => (idx + 1) % bulletins.length)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">{h.stats.total}</div>
            <div className="stat-value tabular">{stats.totalGrievances}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">{h.stats.resolved}</div>
            <div className="stat-value tabular">{stats.resolvedCount}</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">{h.stats.inProgress}</div>
            <div className="stat-value tabular">{stats.inProgressCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{h.stats.departments}</div>
            <div className="stat-value tabular">{stats.departmentsCount}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">{h.stats.districts}</div>
            <div className="stat-value tabular">{stats.districtsCovered}</div>
          </div>
        </div>

        <section style={{ marginBottom: 32 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>{h.citizenCornerTitle}</h2>
              <p className="muted" style={{ margin: '2px 0 0' }}>
                {lang === 'en' && <span className="ml-text">പൊതുജന സേവനങ്ങൾ • </span>}
                {h.citizenCornerSub}
              </p>
            </div>
            <Link to="/how-it-works" className="btn btn-outline btn-sm">
              {h.viewGuide} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="eservice-grid">
            {[
              { to: user?.role === 'citizen' ? '/citizen' : '/login', icon: FilePlus2 },
              { to: '/track', icon: Search },
              { to: '/departments', icon: Building2 },
              { to: '/how-it-works', icon: Layers },
              { to: '/api-tester', icon: Terminal },
              { to: '/contact', icon: Compass },
            ].map((item, idx) => {
              const TileIcon = item.icon;
              const copy = h.eservices[idx];
              return (
                <Link key={item.to + idx} to={item.to} className="eservice-tile">
                  <div className="eservice-icon">
                    <TileIcon size={18} />
                  </div>
                  <strong style={{ color: 'var(--blue-900)', fontSize: '0.96rem' }}>
                    {copy.title}
                  </strong>
                  <span className="muted" style={{ fontSize: '0.8rem' }}>
                    {copy.desc}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="card card-gold-accent" style={{ marginBottom: 32 }}>
          <div className="showcase-split">
            <div>
              <span className="kasavu-pill" style={{ marginBottom: 10 }}>
                {h.showcaseTag}
              </span>
              <h2 style={{ margin: '4px 0 8px', color: 'var(--blue-900)' }}>{h.showcaseTitle}</h2>
              <p className="muted" style={{ marginTop: 0 }}>{h.showcaseDesc}</p>
              <div className="grid-2" style={{ gap: 10, marginTop: 14 }}>
                <div style={{ padding: '10px 12px', background: 'var(--surface-soft)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--blue-900)', fontSize: '0.88rem' }}>
                    {h.showcaseCard1Title}
                  </strong>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>{h.showcaseCard1Desc}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--surface-soft)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--blue-900)', fontSize: '0.88rem' }}>
                    {h.showcaseCard2Title}
                  </strong>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>{h.showcaseCard2Desc}</div>
                </div>
              </div>
              <div className="row" style={{ marginTop: 14 }}>
                <Link to="/login" className="btn btn-primary btn-sm">
                  {h.tryLogins} <ArrowRight size={14} />
                </Link>
                <Link to="/about" className="btn btn-outline btn-sm">
                  {h.archLink}
                </Link>
              </div>
            </div>

            <div className="showcase-frame">
              <img
                src={governanceIllustration}
                alt="Illustration of Kerala digital public grievance redressal connecting citizens across road, health, and water utilities"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>{h.featuredDeptsTitle}</h2>
              <p className="muted" style={{ margin: '2px 0 0' }}>{h.featuredDeptsSub}</p>
            </div>
            <Link to="/departments" className="btn btn-outline btn-sm">
              {h.viewAllDepts} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid-4">
            {featuredDepartments.map((dept) => {
              const DeptIcon = getDepartmentIcon(dept.code);
              return (
                <div
                  key={dept._id}
                  className="card card-blue-accent card-interactive"
                  style={{ marginBottom: 0 }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <div className="dept-icon-box">
                        <DeptIcon size={18} />
                      </div>
                      <span className="badge badge-submitted">{dept.code}</span>
                    </div>
                    <span className="badge badge-resolved">{dept.slaDays}d SLA</span>
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.02rem', color: 'var(--blue-900)' }}>
                    {dept.name}
                  </h3>
                  <p className="muted" style={{ margin: 0 }}>{dept.shortDescription}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card card-gold-accent" style={{ marginBottom: 32 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>{h.districtsTitle}</h2>
              <p className="muted" style={{ margin: '2px 0 0' }}>
                {lang === 'en' && <span className="ml-text">14 ജില്ലകളിലും സേവനം ലഭ്യമാണ് • </span>}
                {h.districtsSub}
              </p>
            </div>
            <div className="row" style={{ gap: 6 }}>
              {[
                { key: 'All', label: h.regionAll },
                { key: 'South', label: h.regionSouth },
                { key: 'Central', label: h.regionCentral },
                { key: 'North', label: h.regionNorth },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={`btn btn-sm ${
                    regionFilter === r.key ? 'btn-primary' : 'btn-outline'
                  }`}
                  onClick={() => setRegionFilter(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="district-grid">
            {filteredDistricts.map((d) => (
              <button
                key={d.code}
                type="button"
                className="district-chip"
                onClick={() => handleDistrictClick(d.name)}
              >
                <div className="district-chip-top">
                  <strong style={{ color: 'var(--blue-900)', fontSize: '0.92rem' }}>
                    {lang === 'ml' ? d.ml : d.name}
                  </strong>
                  <span className="district-code">{d.code}</span>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <span className="ml-text muted" style={{ fontSize: '0.78rem' }}>
                    {lang === 'ml' ? d.name : d.ml}
                  </span>
                  <span className="muted" style={{ fontSize: '0.72rem' }}>
                    {d.region}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>{h.rolesTitle}</h2>
              <p className="muted" style={{ margin: '2px 0 0' }}>{h.rolesSub}</p>
            </div>
            <Link to="/login" className="btn btn-primary btn-sm">
              {h.openWorkspaces} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="portal-role-grid">
            <Link to="/citizen" className="portal-role-card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="dept-icon-box"><Users size={18} /></div>
                <span className="badge badge-submitted">{h.roleCards.citizenBadge}</span>
              </div>
              <h3 style={{ margin: '10px 0 4px', fontSize: '1rem', color: 'var(--blue-900)' }}>
                {h.roleCards.citizenTitle}
              </h3>
              <p className="muted" style={{ margin: 0 }}>{h.roleCards.citizenDesc}</p>
            </Link>

            <Link to="/cmo" className="portal-role-card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="dept-icon-box"><Award size={18} /></div>
                <span className="badge badge-in-progress">{h.roleCards.cmoBadge}</span>
              </div>
              <h3 style={{ margin: '10px 0 4px', fontSize: '1rem', color: 'var(--blue-900)' }}>
                {h.roleCards.cmoTitle}
              </h3>
              <p className="muted" style={{ margin: 0 }}>{h.roleCards.cmoDesc}</p>
            </Link>

            <Link to="/officer" className="portal-role-card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="dept-icon-box"><Briefcase size={18} /></div>
                <span className="badge badge-resolved">{h.roleCards.officerBadge}</span>
              </div>
              <h3 style={{ margin: '10px 0 4px', fontSize: '1rem', color: 'var(--blue-900)' }}>
                {h.roleCards.officerTitle}
              </h3>
              <p className="muted" style={{ margin: 0 }}>{h.roleCards.officerDesc}</p>
            </Link>

            <Link to="/api-tester" className="portal-role-card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="dept-icon-box"><Terminal size={18} /></div>
                <span className="kasavu-pill">REST API</span>
              </div>
              <h3 style={{ margin: '10px 0 4px', fontSize: '1rem', color: 'var(--blue-900)' }}>
                {h.roleCards.apiTitle}
              </h3>
              <p className="muted" style={{ margin: 0 }}>
                <code className="mono">/api/public/overview</code> •{' '}
                <code className="mono">/api/cmo/stats</code>
              </p>
            </Link>
          </div>
        </section>

        <section className="card card-green-accent" style={{ marginBottom: 32 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>
                <PhoneCall size={18} style={{ verticalAlign: 'text-bottom' }} /> {h.helplineTitle}
              </h2>
              <p className="muted" style={{ margin: '2px 0 0' }}>
                {lang === 'en' && <span className="ml-text">അടിയന്തര ഹെൽപ്പ്‌ലൈൻ നമ്പറുകൾ • </span>}
                {h.helplineSub}
              </p>
            </div>
            <Link to="/contact" className="btn btn-outline btn-sm">
              {h.contactSupport} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="helpline-grid">
            {KERALA_HELPLINES.map((hl) => (
              <div key={hl.number} className="helpline-card">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--blue-900)' }}>
                    {lang === 'ml' ? hl.ml : hl.label}
                  </div>
                  <div className="ml-text muted" style={{ fontSize: '0.75rem' }}>
                    {lang === 'ml' ? hl.label : hl.ml}
                  </div>
                </div>
                <span className="helpline-number">{hl.number}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid-2">
          <div className="card card-green-accent">
            <h3 style={{ marginTop: 0, color: 'var(--green-800)' }}>
              <Sparkles size={18} style={{ verticalAlign: 'text-bottom' }} /> {h.aiCardTitle}
            </h3>
            <p className="muted">{h.aiCardDesc}</p>
            <ul style={{ paddingLeft: 18, margin: '10px 0 0', fontSize: '0.9rem' }}>
              {h.aiBullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>

          <div className="card card-blue-accent">
            <h3 style={{ marginTop: 0, color: 'var(--blue-900)' }}>
              <ShieldCheck size={18} style={{ verticalAlign: 'text-bottom' }} /> {h.charterTitle}
            </h3>
            <p className="muted">
              {h.charterDescPrefix} <code className="mono">KL-CMO-YYYY-XXXXXX</code>{' '}
              {h.charterDescSuffix}
            </p>
            <div className="row" style={{ marginTop: 12 }}>
              <Link to="/login" className="btn btn-primary btn-sm">
                <Building2 size={14} /> {h.openDemoPortals}
              </Link>
              <Link to="/contact" className="btn btn-outline btn-sm">
                <CheckCircle2 size={14} /> {h.contactPortalSupport}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
