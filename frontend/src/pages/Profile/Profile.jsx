import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../layouts/AppLayout.jsx';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <AppLayout>
      <div className="profile-page">
        <h2 className="profile-title">👤 Profile</h2>

        <div className="profile-card">
          {/* Avatar */}
          <div className="profile-avatar-row">
            <div className="profile-avatar">
              {user?.fullName?.[0]?.toUpperCase() || '👤'}
            </div>
            <div>
              <p className="profile-name">{user?.fullName || 'User'}</p>
              <p className="profile-email">{user?.email}</p>
            </div>
          </div>

          <hr className="profile-divider" />

          {/* Info rows */}
          {[
            { label: 'Full Name',     value: user?.fullName },
            { label: 'Email',         value: user?.email },
            {
              label: 'Member Since',
              value: user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })
                : '—',
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="profile-info-label">{label}</p>
              <p className="profile-info-value">{value || '—'}</p>
            </div>
          ))}

          <hr className="profile-divider" />

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="profile-logout-btn"
            style={{ cursor: loggingOut ? 'not-allowed' : 'pointer' }}
          >
            {loggingOut ? 'Signing out…' : '🚪 Sign Out'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
