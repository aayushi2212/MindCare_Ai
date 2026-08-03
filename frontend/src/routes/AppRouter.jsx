/**
 * PURPOSE
 * -------
 * Central route configuration for the MindCare AI frontend.
 * Defines public routes (login, register) and protected routes (chat, dashboard, journal, profile).
 *
 * RESPONSIBILITIES
 * ----------------
 * - Declare all application routes in one place
 * - Wrap private routes inside <ProtectedRoute /> so unauthenticated
 *   users are redirected to /login
 *
 * NEVER
 * -----
 * - Contain UI or business logic
 * - Import from context directly (leave that to page components)
 *
 * DEPENDS ON
 * ----------
 * react-router-dom, components/common/ProtectedRoute, page components
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from '../components/common/ProtectedRoute';

// Pages
import Login    from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import Profile  from '../pages/Profile/Profile';

// Placeholder components for modules not yet implemented
const ComingSoon = ({ name }) => (
  <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
    <h2 style={{ color: 'var(--color-text-muted)' }}>{name} — coming soon</h2>
  </main>
);

export default function AppRouter() {
  return (
    <Routes>
      {/* ── Public routes ────────────────────────────────────── */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ── Protected routes ─────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/chat"      element={<ComingSoon name="Chat" />} />
        <Route path="/dashboard" element={<ComingSoon name="Dashboard" />} />
        <Route path="/journal"   element={<ComingSoon name="Journal" />} />
        <Route path="/profile"   element={<Profile />} />
        <Route path="/settings"  element={<ComingSoon name="Settings" />} />
      </Route>

      {/* ── Redirects ─────────────────────────────────────────── */}
      <Route path="/"  element={<Navigate to="/chat" replace />} />
      <Route path="*"  element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
