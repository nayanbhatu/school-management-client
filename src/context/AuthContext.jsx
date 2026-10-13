import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sms_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('sms_token'));
  const [loading, setLoading] = useState(true);

  // Validate existing token on initial load
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const savedToken = localStorage.getItem('sms_token');
      if (!savedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (isMounted && res.success && res.data) {
          setUser(res.data);
          localStorage.setItem('sms_user', JSON.stringify(res.data));
        }
      } catch (err) {
        // Token is invalid or expired
        if (isMounted) {
          localStorage.removeItem('sms_token');
          localStorage.removeItem('sms_user');
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuth();

    // Listen for 401 expiration events from api client
    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('sms:auth-expired', handleExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('sms:auth-expired', handleExpired);
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.success && res.token && res.user) {
      localStorage.setItem('sms_token', res.token);
      localStorage.setItem('sms_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Authentication failed');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
