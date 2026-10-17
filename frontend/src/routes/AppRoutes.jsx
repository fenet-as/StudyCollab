import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthContext } from '../context/useAuthContext';

// Lazy-loaded production routes
const LandingPage = lazy(() => import('../features/landing/pages/LandingPage'));
const Login = lazy(() => import('../features/auth/pages/Login'));
const Register = lazy(() => import('../features/auth/pages/Register'));
const VerifyEmail = lazy(() => import('../features/auth/pages/VerifyEmail'));
const Dashboard = lazy(() => import('../features/dashboard/pages/Dashboard'));

// Internal test routes: only loaded in local development environments
let GroupAvatarTestPage = null;
let CloudflareTestPage = null;

if (import.meta.env.DEV) {
  GroupAvatarTestPage = lazy(() => import('../../tests/GroupAvatarTestPage'));
  CloudflareTestPage = lazy(() => import('./CloudflareTestPage'));
}

// Accessible, responsive route loading fallback
export const RouteLoadingFallback = () => (
  <div
    style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary, #ffffff)',
      color: 'var(--text-primary, #0f172a)',
    }}
    role="status"
    aria-label="Loading page"
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <Loader2
        size={36}
        className="animate-spin"
        style={{
          color: '#6366f1',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary, #64748b)',
        }}
      >
        Loading...
      </span>
    </div>
  </div>
);

// Simple check to safeguard secure UI containers
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <RouteLoadingFallback />;
  }

  const token = user?.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Internal test routes excluded from production bundles */}
        {import.meta.env.DEV && GroupAvatarTestPage && (
          <Route path="/test" element={<GroupAvatarTestPage />} />
        )}
        {import.meta.env.DEV && CloudflareTestPage && (
          <Route path="/test/cloudflare" element={<CloudflareTestPage />} />
        )}

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}