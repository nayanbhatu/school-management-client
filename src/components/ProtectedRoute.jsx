import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: '#f8fafc'
      }}>
        <Loader2 size={32} className="animate-spin" color="var(--crimson-700)" />
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Validating session security...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to the user's appropriate portal based on their actual role
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'teacher') {
      return <Navigate to="/teacher" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
