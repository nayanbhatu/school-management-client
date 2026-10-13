import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  ArrowRight, 
  FileCheck2, 
  GraduationCap, 
  Users2, 
  Receipt, 
  ShieldCheck, 
  Lock, 
  MailCheck 
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(40px, 6vw, 70px) clamp(16px, 4vw, 24px) clamp(48px, 6vw, 80px)',
        backgroundColor: '#fafbfc',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {/* Subtle geometric collegiate accents */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          backgroundColor: 'var(--crimson-50)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: '25%',
          width: 24,
          height: 24,
          transform: 'rotate(45deg)',
          backgroundColor: 'var(--crimson-600)',
          opacity: 0.15,
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="landing-hero-grid">
            
            {/* Left Column: Heading & CTAs */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--crimson-50)',
                color: 'var(--crimson-700)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 20,
                border: '1px solid var(--border-crimson)'
              }}>
                <ShieldCheck size={14} />
                <span>Oakridge Operations Infrastructure</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
                lineHeight: 1.1,
                color: 'var(--text-main)',
                marginBottom: 20,
                fontWeight: 800
              }}>
                Excellence in Education.{' '}
                <span style={{ color: 'var(--crimson-700)' }}>
                  Precision in Operations.
                </span>
              </h1>

              <p style={{
                fontSize: '1.125rem',
                lineHeight: 1.6,
                color: 'var(--text-muted)',
                marginBottom: 36,
                maxWidth: 540
              }}>
                A refined, purpose-built school management platform. Seamlessly unify student admissions, academic enrollment, faculty assignments, quarterly fee structures, and installment payment tracking in one place.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn btn-primary btn-lg"
                  style={{ borderRadius: 8 }}
                >
                  <span>Access School Portal</span>
                  <ArrowRight size={18} />
                </button>
                <a
                  href="#modules"
                  className="btn btn-secondary btn-lg"
                  style={{ borderRadius: 8 }}
                >
                  Explore Modules
                </a>
              </div>

              {/* Trust Badges */}
              <div style={{
                marginTop: 44,
                paddingTop: 24,
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: 24,
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <Lock size={15} color="var(--crimson-700)" />
                  <span>Dual Role Gateways</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <FileCheck2 size={15} color="var(--crimson-700)" />
                  <span>ACID Transaction Safety</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <MailCheck size={15} color="var(--crimson-700)" />
                  <span>Verified SMTP Dispatch</span>
                </div>
              </div>
            </div>

            {/* Right Column: Architectural Collegiate Showcase Card */}
            <div>
              <div style={{
                backgroundColor: 'var(--crimson-800)',
                color: '#ffffff',
                borderRadius: 16,
                padding: '36px 32px',
                boxShadow: '0 20px 40px rgba(127, 29, 29, 0.25)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative arch styling inspired by Reference 1 */}
                <div style={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 180,
                  height: 180,
                  border: '30px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '50%'
                }} />

                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 4,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 16
                }}>
                  Operational Integrity
                </div>

                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1.625rem',
                  fontWeight: 700,
                  marginBottom: 12,
                  fontFamily: 'Outfit, sans-serif'
                }}>
                  Unified Academic & Financial Roster
                </h3>

                <p style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: 28
                }}>
                  Designed specifically for school administrative leadership and teaching faculty. Eliminate disconnected spreadsheets with automated quarterly fee ledgers and real-time student statuses.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                  paddingTop: 20
                }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>4 Quarters</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.75)' }}>Installment Schedules</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>100% Locked</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.75)' }}>Concurrency Protected</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Modules Overview Section */}
      <section id="modules" style={{ padding: 'clamp(48px, 6vw, 80px) clamp(16px, 4vw, 24px)', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--crimson-700)',
              marginBottom: 8
            }}>
              Operational Pillars
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', color: 'var(--text-main)', marginBottom: 14 }}>
              Engineered for Institutional Governance
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
              Every feature aligns with the actual administrative workflows of school operations.
            </p>
          </div>

          <div className="landing-modules-grid">
            {/* Card 1 */}
            <div className="card" style={{ transition: 'transform 200ms ease, box-shadow 200ms ease' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: 'var(--crimson-50)',
                color: 'var(--crimson-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}>
                <FileCheck2 size={22} />
              </div>
              <h3 style={{ fontSize: '1.1875rem', marginBottom: 10 }}>Admissions Lifecycle</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Review incoming applications with concurrency locks, approve or reject decisions, and trigger automatic Gmail SMTP decision updates to parents.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card">
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: 'var(--crimson-50)',
                color: 'var(--crimson-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}>
                <GraduationCap size={22} />
              </div>
              <h3 style={{ fontSize: '1.1875rem', marginBottom: 10 }}>Student Enrollment</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Enroll approved applicants into designated class sections. Automatically computes and binds 4 quarterly installment schedules based on annual fee structures.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card">
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: 'var(--crimson-50)',
                color: 'var(--crimson-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}>
                <Users2 size={22} />
              </div>
              <h3 style={{ fontSize: '1.1875rem', marginBottom: 10 }}>Faculty Assignments</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Manage teaching faculty, active account statuses, and section-subject assignments. Faculty enjoy focused, read-only student and fee visibility.
              </p>
            </div>

            {/* Card 4 */}
            <div className="card">
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: 'var(--crimson-50)',
                color: 'var(--crimson-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}>
                <Receipt size={22} />
              </div>
              <h3 style={{ fontSize: '1.1875rem', marginBottom: 10 }}>Fee Ledgers & Receipts</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Record full installment payments with validation, audit trails, and automatic receipt generation across Cash, Cheque, Bank Transfer, UPI, and Card.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Banner */}
      <section id="about" style={{
        padding: '60px 24px',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.875rem', marginBottom: 14 }}>
            Ready to Manage School Operations?
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: 28, maxWidth: 600, margin: '0 auto 28px' }}>
            Access your authorized portal using administrative or faculty credentials.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn btn-primary btn-lg"
          >
            <span>Proceed to Portal Sign In</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
