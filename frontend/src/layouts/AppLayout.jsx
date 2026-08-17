import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/chat',      label: 'Chat',      icon: '💬' },
  { to: '/journal',   label: 'Journal',   icon: '📓' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/profile',   label: 'Profile',   icon: '👤' },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 40, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 50,
      }} className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
            🧠 MindCare AI
          </h1>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.9rem',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                background: isActive ? 'var(--color-primary-light)' : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
          {user && (
            <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', truncate: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user.fullName || user.email}
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', padding: '0.5rem', fontSize: '0.875rem',
            background: 'transparent', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)',
            cursor: 'pointer', textAlign: 'left',
          }}>
            🚪 Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile topbar */}
        <header className="mobile-header" style={{ display: 'none', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', lineHeight: 1, cursor: 'pointer' }}>☰</button>
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>🧠 MindCare AI</span>
        </header>

        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .sidebar-open {
            transform: translateX(0);
          }
          .mobile-overlay { display: block !important; }
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
