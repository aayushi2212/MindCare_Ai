import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

const NAV = [
  { to: '/chat',      label: 'Chat',      icon: '💬' },
  { to: '/journal',   label: 'Journal',   icon: '📓' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/profile',   label: 'Profile',   icon: '👤' },
  { to: '/settings',  label: 'Settings',  icon: '⚙️'  },
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
    <div className="layout-root">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="layout-overlay layout-overlay--visible"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${mobileOpen ? ' sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <h1 className="sidebar-logo-text">🧠 MindCare AI</h1>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="sidebar-nav-link"
              style={({ isActive }) => ({
                fontWeight:  isActive ? 600 : 400,
                color:       isActive ? 'var(--color-primary)' : 'var(--color-text)',
                background:  isActive ? 'var(--color-primary-light)' : 'transparent',
              })}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-username">
              {user.fullName || user.email}
            </div>
          )}
          <button onClick={handleLogout} className="sidebar-logout-btn">
            🚪 Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="layout-content">
        {/* Mobile topbar */}
        <header className="mobile-header">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="mobile-header-toggle"
          >
            ☰
          </button>
          <span className="mobile-header-logo">🧠 MindCare AI</span>
        </header>

        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  );
}
