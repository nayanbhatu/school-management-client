import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogIn, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handlePortalRedirect = () => {
    if (isAuthenticated) {
      if (user?.role === 'admin') navigate('/admin');
      else if (user?.role === 'teacher') navigate('/teacher');
      else navigate('/login');
    } else {
      navigate('/login');
    }
  };

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 16px',
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}>
        {/* Brand Identity / Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 0 }}>
          <div style={{
            width: 38,
            height: 38,
            backgroundColor: 'var(--crimson-700)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0
          }}>
            <ShieldCheck size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: 'var(--crimson-800)',
              whiteSpace: 'nowrap'
            }}>
              OAKRIDGE ACADEMY
            </div>
            <div className="navbar-brand-subtitle" style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-subtle)',
              whiteSpace: 'nowrap'
            }}>
              School Operations System
            </div>
          </div>
        </Link>

        {/* Minimal Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="desktop-nav">
          <Link to="/" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Overview
          </Link>
          <a href="#modules" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Modules
          </a>
          <a href="#about" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Institutional Governance
          </a>
        </nav>

        {/* Access Portal CTA */}
        <div style={{ flexShrink: 0 }}>
          {isAuthenticated ? (
            <button 
              type="button" 
              onClick={handlePortalRedirect}
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 14px' }}
            >
              <LayoutDashboard size={15} />
              <span>
                <span className="navbar-cta-text">Go to </span>
                {user?.role === 'admin' ? 'Admin' : 'Teacher'} Portal
              </span>
            </button>
          ) : (
            <button 
              type="button" 
              onClick={() => navigate('/login')}
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 14px' }}
            >
              <LogIn size={15} />
              <span>
                <span className="navbar-cta-text">Access </span>
                Portal
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
