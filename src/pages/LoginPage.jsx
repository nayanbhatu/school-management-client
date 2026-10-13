import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ShieldCheck, 
  GraduationCap, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const toast = useToast();

  // Determine initial role from URL param or default to admin
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') === 'teacher' ? 'teacher' : 'admin';
  const [activeRole, setActiveRole] = useState(initialRole);

  // Form states
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminShowPassword, setAdminShowPassword] = useState(false);

  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherShowPassword, setTeacherShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already logged in, redirect to respective dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'teacher') navigate('/teacher', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleRoleSwitch = (newRole) => {
    setErrorMessage('');
    setActiveRole(newRole);
  };

  const handleSubmit = async (e, role) => {
    e.preventDefault();
    setErrorMessage('');

    const username = role === 'admin' ? adminUsername.trim() : teacherUsername.trim();
    const password = role === 'admin' ? adminPassword : teacherPassword;

    if (!username) {
      setErrorMessage(role === 'admin' ? 'Please enter your administrator username.' : 'Please enter your faculty username or email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const authenticatedUser = await login(username, password);
      
      toast.success(`Welcome back, ${authenticatedUser.first_name || authenticatedUser.username}!`);

      // Authoritative redirect based on actual user role from server JWT
      if (authenticatedUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (authenticatedUser.role === 'teacher') {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const isTeacherActive = activeRole === 'teacher';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Top Header bar with back to home link */}
      <header style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: '#ffffff'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 34,
            height: 34,
            backgroundColor: 'var(--crimson-700)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0
          }}>
            <ShieldCheck size={20} />
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--crimson-800)', whiteSpace: 'nowrap' }}>
            OAKRIDGE ACADEMY
          </div>
        </Link>

        <Link to="/" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <ArrowLeft size={14} />
          <span className="header-btn-label">Back to Landing</span>
        </Link>
      </header>

      {/* Main Sliding Login Container */}
      <div className="login-slider-wrapper">
        <div style={{ width: '100%', maxWidth: 900 }}>
          
          {/* Mobile Segmented Pill Selector (< 768px) */}
          <div className="mobile-role-selector">
            <div style={{
              display: 'inline-flex',
              padding: 4,
              backgroundColor: '#e2e8f0',
              borderRadius: 'var(--radius-full)',
              gap: 4
            }}>
              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: !isTeacherActive ? '#ffffff' : 'transparent',
                  color: !isTeacherActive ? 'var(--crimson-700)' : 'var(--text-muted)',
                  boxShadow: !isTeacherActive ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 200ms ease'
                }}
              >
                Administrator
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('teacher')}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: isTeacherActive ? '#ffffff' : 'transparent',
                  color: isTeacherActive ? 'var(--crimson-700)' : 'var(--text-muted)',
                  boxShadow: isTeacherActive ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 200ms ease'
                }}
              >
                Faculty / Teacher
              </button>
            </div>
          </div>

          {/* Two-Sided Sliding Login Card */}
          <div className={`login-slider-container ${isTeacherActive ? 'right-panel-active' : ''}`}>
            
            {/* 1. ADMIN FORM CONTAINER (Left side default) */}
            <div className="form-container admin-form-container">
              <form onSubmit={(e) => handleSubmit(e, 'admin')} style={{ width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: 'var(--crimson-50)',
                    color: 'var(--crimson-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <ShieldCheck size={26} />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', marginBottom: 6, color: 'var(--text-main)' }}>
                    Admin Sign In
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Enter administrative credentials to manage operations
                  </p>
                </div>

                {errorMessage && !isTeacherActive && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    backgroundColor: 'var(--status-rejected-bg)',
                    border: '1px solid var(--status-rejected-border)',
                    borderRadius: 8,
                    color: 'var(--status-rejected-text)',
                    fontSize: '0.8125rem',
                    marginBottom: 18
                  }}>
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="admin-username">Username</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="admin-username"
                      type="text"
                      className="form-input"
                      placeholder="e.g. admin"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      disabled={loading}
                      autoComplete="username"
                      style={{ paddingLeft: 38 }}
                    />
                    <User size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 13 }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="admin-password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="admin-password"
                      type={adminShowPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                      style={{ paddingLeft: 38, paddingRight: 40 }}
                    />
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 13 }} />
                    <button
                      type="button"
                      onClick={() => setAdminShowPassword(!adminShowPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: 10,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8'
                      }}
                      aria-label={adminShowPassword ? 'Hide password' : 'Show password'}
                    >
                      {adminShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 12, padding: '12px' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Sign In to Admin Portal</span>
                  )}
                </button>
              </form>
            </div>

            {/* 2. TEACHER FORM CONTAINER (Right side default, active when right-panel-active) */}
            <div className="form-container teacher-form-container">
              <form onSubmit={(e) => handleSubmit(e, 'teacher')} style={{ width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: 'var(--crimson-50)',
                    color: 'var(--crimson-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <GraduationCap size={26} />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', marginBottom: 6, color: 'var(--text-main)' }}>
                    Teacher Sign In
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Enter faculty credentials to access class rosters
                  </p>
                </div>

                {errorMessage && isTeacherActive && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    backgroundColor: 'var(--status-rejected-bg)',
                    border: '1px solid var(--status-rejected-border)',
                    borderRadius: 8,
                    color: 'var(--status-rejected-text)',
                    fontSize: '0.8125rem',
                    marginBottom: 18
                  }}>
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="teacher-username">Username or Email</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="teacher-username"
                      type="text"
                      className="form-input"
                      placeholder="e.g. sarah_science or email"
                      value={teacherUsername}
                      onChange={(e) => setTeacherUsername(e.target.value)}
                      disabled={loading}
                      autoComplete="username"
                      style={{ paddingLeft: 38 }}
                    />
                    <User size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 13 }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="teacher-password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="teacher-password"
                      type={teacherShowPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="••••••••"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                      style={{ paddingLeft: 38, paddingRight: 40 }}
                    />
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 13 }} />
                    <button
                      type="button"
                      onClick={() => setTeacherShowPassword(!teacherShowPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: 10,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8'
                      }}
                      aria-label={teacherShowPassword ? 'Hide password' : 'Show password'}
                    >
                      {teacherShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 12, padding: '12px' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Sign In to Teacher Portal</span>
                  )}
                </button>
              </form>
            </div>

            {/* 3. THE SLIDING OVERLAY CONTAINER (Inspired by Pinterest reference) */}
            <div className="overlay-container">
              <div className="overlay">
                
                {/* Left Panel of Overlay: Visible when right-panel-active (Teacher mode active) */}
                <div className="overlay-panel overlay-left">
                  <div style={{
                    width: 54,
                    height: 54,
                    borderRadius: 14,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20
                  }}>
                    <ShieldCheck size={30} />
                  </div>
                  <h2 style={{ fontSize: '2rem', marginBottom: 12, color: '#ffffff' }}>
                    School Admin?
                  </h2>
                  <p style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: 28
                  }}>
                    Switch to the administrative gateway to manage student admissions, enrollments, fee structures, and financial ledgers.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('admin')}
                    className="btn btn-outline-white"
                    style={{ padding: '10px 28px', borderRadius: 24, fontWeight: 700 }}
                  >
                    <span>ADMIN SIGN IN</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Right Panel of Overlay: Visible default (Admin mode active) */}
                <div className="overlay-panel overlay-right">
                  <div style={{
                    width: 54,
                    height: 54,
                    borderRadius: 14,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20
                  }}>
                    <GraduationCap size={30} />
                  </div>
                  <h2 style={{ fontSize: '2rem', marginBottom: 12, color: '#ffffff' }}>
                    Faculty Member?
                  </h2>
                  <p style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: 28
                  }}>
                    Switch to the teacher gateway to view your academic assignments, assigned student rosters, and fee clearance status.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('teacher')}
                    className="btn btn-outline-white"
                    style={{ padding: '10px 28px', borderRadius: 24, fontWeight: 700 }}
                  >
                    <span>TEACHER SIGN IN</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
