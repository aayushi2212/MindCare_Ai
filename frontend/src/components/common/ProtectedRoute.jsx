/**
 * PURPOSE
 * -------
 * Route guard that redirects unauthenticated users to /login.
 * Shows a loading state while the session restore on mount is in progress,
 * preventing a flash-redirect before the token is verified.
 *
 * USAGE
 * -----
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/chat" element={<Chat />} />
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 *
 * DEPENDS ON
 * ----------
 * context/AuthContext, react-router-dom
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid var(--color-primary)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
