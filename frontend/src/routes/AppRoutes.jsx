import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import Dashboard from '../features/dashboard/pages/Dashboard';
import LandingPage from '../features/landing/pages/LandingPage';
import CloudflareTestPage from './CloudflareTestPage';
import GroupAvatarTestPage from '../../tests/GroupAvatarTestPage';
import VerifyEmail from '../features/auth/pages/VerifyEmail';
import { useAuthContext } from '../context/useAuthContext';

// Simple check to safeguard secure UI containers
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return null;
  }

  const token = user?.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      

    <Route path="/test" element={<GroupAvatarTestPage />} />

    <Route path="/verify-email" element={<VerifyEmail />} />


      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}