import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Loading from '../components/common/Loading.jsx';

// Eager load auth pages
import Login    from '../pages/Login/Login';
import Register from '../pages/Register/Register';

// Lazy load authenticated pages
const Chat      = lazy(() => import('../pages/Chat/Chat.jsx'));
const Journal   = lazy(() => import('../pages/Journal/Journal.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard.jsx'));
const Profile   = lazy(() => import('../pages/Profile/Profile.jsx'));
const Settings  = lazy(() => import('../pages/Settings/Settings.jsx'));

const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Loading text="Loading…" />
  </div>
);

export default function AppRouter() {
  return (
    <Routes>
      {/* ── Public routes ─── */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ── Protected routes ─── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/chat"      element={<Suspense fallback={<PageLoader />}><Chat /></Suspense>} />
        <Route path="/journal"   element={<Suspense fallback={<PageLoader />}><Journal /></Suspense>} />
        <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="/profile"   element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
        <Route path="/settings"  element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
      </Route>

      {/* ── Redirects ─── */}
      <Route path="/"  element={<Navigate to="/chat" replace />} />
      <Route path="*"  element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
