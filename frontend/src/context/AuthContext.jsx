import React, { useState, useEffect } from 'react';
import { AuthContext } from './authContextInstance';
import { logoutUser } from '../api/authApi';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Rehydrate authentication session from localStorage on initial render
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');
      const userId = localStorage.getItem('userId');
      const fullName = localStorage.getItem('fullName');
      const avatarUrl = localStorage.getItem('avatarUrl');

      if (token) {
        setUser({
          token,
          email: email || '',
          id: userId ? Number(userId) : null,
          fullName: fullName || '',
          avatarUrl: avatarUrl || '',
        });
      }
    }
    setLoading(false);
  }, []);

  // 2. Synchronize with background token refresh and session expiration events
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };

    const handleTokenRefreshed = (e) => {
      const detail = e.detail;
      if (detail?.token) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                token: detail.token,
                email: detail.email || prev.email,
                id: detail.id != null ? Number(detail.id) : prev.id,
              }
            : null
        );
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('studycollab:session_expired', handleSessionExpired);
      window.addEventListener('studycollab:token_refreshed', handleTokenRefreshed);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('studycollab:session_expired', handleSessionExpired);
        window.removeEventListener('studycollab:token_refreshed', handleTokenRefreshed);
      }
    };
  }, []);

  const login = (authData) => {
    if (!authData) return;
    if (typeof localStorage !== 'undefined') {
      if (authData.token) localStorage.setItem('token', authData.token);
      if (authData.email) localStorage.setItem('email', authData.email);
      if (authData.id != null) localStorage.setItem('userId', String(authData.id));
      if (authData.fullName) localStorage.setItem('fullName', authData.fullName);
      if (authData.avatarUrl) localStorage.setItem('avatarUrl', authData.avatarUrl);
    }
    setUser({
      token: authData.token,
      email: authData.email || '',
      id: authData.id != null ? Number(authData.id) : null,
      fullName: authData.fullName || '',
      avatarUrl: authData.avatarUrl || '',
    });
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Server logout failed or session was already revoked:', err);
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('userId');
        localStorage.removeItem('fullName');
        localStorage.removeItem('avatarUrl');
      }
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};