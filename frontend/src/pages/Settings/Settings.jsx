import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout.jsx';
import { useAuth } from '../../context/AuthContext';

const THEMES = [
  { label: 'System default', value: 'system' },
  { label: 'Light',          value: 'light'  },
  { label: 'Dark',           value: 'dark'   },
];

export default function Settings() {
  const { user } = useAuth();

  // Local-only preferences (no backend required for V1)
  const [theme, setTheme] = useState(
    () => localStorage.getItem('mc_theme') || 'system'
  );
  const [notifications, setNotifications] = useState(
    () => localStorage.getItem('mc_notifications') !== 'false'
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('mc_theme', theme);
    localStorage.setItem('mc_notifications', String(notifications));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const rowStyle = {
    display:       'flex',
    alignItems:    'center',
    justifyContent:'space-between',
    padding:       '0.85rem 0',
    borderBottom:  '1px solid var(--color-border)',
  };
  const labelStyle = { fontSize: '0.9rem', fontWeight: 500 };
  const subStyle   = { fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' };

  return (
    <AppLayout>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.75rem' }}>⚙️ Settings</h2>

        {/* ── Appearance ──────────────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Appearance
          </h3>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '0 1.25rem' }}>
            <div style={rowStyle}>
              <div>
                <div style={labelStyle}>Theme</div>
                <div style={subStyle}>Controls the colour scheme of the app.</div>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={{
                  padding:      '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border:       '1px solid var(--color-border)',
                  background:   'var(--color-bg)',
                  fontSize:     '0.875rem',
                  cursor:       'pointer',
                }}
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Notifications ────────────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Notifications
          </h3>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '0 1.25rem' }}>
            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <div>
                <div style={labelStyle}>Reminders</div>
                <div style={subStyle}>Show reminders to check in with your mood.</div>
              </div>
              <button
                role="switch"
                aria-checked={notifications}
                onClick={() => setNotifications((v) => !v)}
                style={{
                  width:        44,
                  height:       24,
                  borderRadius: 'var(--radius-full)',
                  border:       'none',
                  background:   notifications ? 'var(--color-primary)' : 'var(--color-border)',
                  position:     'relative',
                  cursor:       'pointer',
                  transition:   'background 0.2s',
                  flexShrink:   0,
                }}
              >
                <span style={{
                  position:     'absolute',
                  top:          3,
                  left:         notifications ? 22 : 3,
                  width:        18,
                  height:       18,
                  borderRadius: '50%',
                  background:   '#fff',
                  transition:   'left 0.2s',
                  boxShadow:    'var(--shadow-sm)',
                }} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Account information ──────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Account
          </h3>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '0 1.25rem' }}>
            {[
              { label: 'Full Name', value: user?.fullName },
              { label: 'Email',     value: user?.email    },
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={{ ...rowStyle, borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div style={labelStyle}>{label}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{value || '—'}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Save button ──────────────────────────────────────────── */}
        <button
          onClick={handleSave}
          style={{
            width:        '100%',
            padding:      '0.75rem',
            background:   saved ? 'var(--color-success)' : 'var(--color-primary)',
            color:        '#fff',
            border:       'none',
            borderRadius: 'var(--radius-md)',
            fontWeight:   600,
            fontSize:     '0.95rem',
            cursor:       'pointer',
            transition:   'background 0.2s',
          }}
        >
          {saved ? '✓ Saved' : 'Save preferences'}
        </button>
      </div>
    </AppLayout>
  );
}
