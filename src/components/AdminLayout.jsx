import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileCheck2, 
  GraduationCap, 
  Users2, 
  BookOpen, 
  Building2, 
  CreditCard, 
  Receipt, 
  LogOut, 
  Menu, 
  X,
  ExternalLink
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navLinks = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/admissions', label: 'Admissions', icon: FileCheck2 },
    { to: '/admin/students', label: 'Students & Enrollment', icon: GraduationCap },
    { to: '/admin/teachers', label: 'Teachers', icon: Users2 },
    { to: '/admin/assignments', label: 'Academic Assignments', icon: BookOpen },
    { to: '/admin/classes', label: 'Classes & Sections', icon: Building2 },
    { to: '/admin/fees', label: 'Fee Structures', icon: CreditCard },
    { to: '/admin/payments', label: 'Fee Payments', icon: Receipt },
  ];

  return (
    <div className="portal-layout">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 90
          }} 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`portal-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div style={{
          padding: '20px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            width: 36,
            height: 36,
            backgroundColor: 'var(--crimson-700)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--crimson-800)', lineHeight: 1.1 }}>
              OAKRIDGE
            </div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--crimson-600)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Admin Operations
            </div>
          </div>
          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar menu"
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div style={{
            padding: '4px 10px 8px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-light)'
          }}>
            Operations Menu
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div style={{
          padding: '16px 18px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: '#fafbfc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: 'var(--crimson-100)',
              color: 'var(--crimson-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8125rem',
              flexShrink: 0
            }}>
              {(user?.username || 'A')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.username}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--crimson-700)', fontWeight: 600 }}>
                Administrator
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light)',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--crimson-700)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-light)')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="portal-main">
        {/* Top Header */}
        <header className="portal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: 'inline-flex',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-main)',
                padding: 4,
                flexShrink: 0
              }}
              className="lg-hidden"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="portal-header-title">School Operations Workspace</span>
              <span className="portal-header-badge" style={{ color: 'var(--crimson-700)', fontWeight: 700 }}>• AY 2026-2027</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Public Site"
            >
              <ExternalLink size={13} />
              <span className="header-btn-label">Public Site</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              title="Sign Out"
            >
              <LogOut size={13} />
              <span className="header-btn-label">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="portal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
