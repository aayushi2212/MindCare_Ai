import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../layouts/AppLayout.jsx';

export default function Profile() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.5rem' }}>👤 Profile</h2>

        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>
              {user?.fullName?.[0]?.toUpperCase() || '👤'}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.fullName || 'User'}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{user?.email}</p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

          {/* Info rows */}
          {[
            { label: 'Full Name', value: user?.fullName },
            { label: 'Email', value: user?.email },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{label}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>{value || '—'}</p>
            </div>
          ))}

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ padding: '0.75rem', background: 'var(--color-error-light)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', color: 'var(--color-error)', fontWeight: 600, fontSize: '0.9rem', cursor: loggingOut ? 'not-allowed' : 'pointer' }}
          >
            {loggingOut ? 'Signing out…' : '🚪 Sign Out'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
